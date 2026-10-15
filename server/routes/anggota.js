import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../db.js';
import { verifyToken, requirePengurus } from '../middleware/auth.js';
import { kirimEmailSetPassword } from '../mailer.js';

const router = express.Router();

// GET /api/anggota
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'pengurus') {
      const { rows } = await pool.query(
        `SELECT a.*, u.username FROM anggota a
         LEFT JOIN users u ON u.anggota_id = a.id
         ORDER BY a.nomor_anggota ASC`
      );
      return res.json(rows);
    } else {
      const { rows } = await pool.query(
        `SELECT a.*, u.username FROM anggota a
         LEFT JOIN users u ON u.anggota_id = a.id
         WHERE a.id = $1`,
        [req.user.anggota_id]
      );
      return res.json(rows[0] || null);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data anggota.' });
  }
});

// GET /api/anggota/:id
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'pengurus' && req.user.anggota_id != id)
    return res.status(403).json({ message: 'Akses ditolak.' });

  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.username FROM anggota a
       LEFT JOIN users u ON u.anggota_id = a.id
       WHERE a.id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Anggota tidak ditemukan.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data anggota.' });
  }
});

// POST /api/anggota
router.post('/', verifyToken, requirePengurus, async (req, res) => {
  const {
    nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir,
    jenis_kelamin, alamat, no_telepon, email, unit_kerja, jabatan,
    tanggal_bergabung, username, password
  } = req.body;

  if (!nama_lengkap || !username || !password)
    return res.status(400).json({ message: 'Nama lengkap, username, dan password wajib diisi.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Auto-generate nomor anggota
    let nomorFinal = nomor_anggota;
    if (!nomorFinal) {
      const { rows: last } = await client.query(
        `SELECT nomor_anggota FROM anggota ORDER BY id DESC LIMIT 1`
      );
      const lastNum = last.length > 0 ? parseInt(last[0].nomor_anggota.replace(/\D/g, '')) : 0;
      nomorFinal = `ANG${String(lastNum + 1).padStart(4, '0')}`;
    }

    const { rows: existing } = await client.query(
      'SELECT id FROM anggota WHERE nomor_anggota = $1', [nomorFinal]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Nomor anggota sudah digunakan.' });
    }

    const { rows: usernameCheck } = await client.query(
      'SELECT id FROM users WHERE username = $1', [username]
    );
    if (usernameCheck.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Username sudah digunakan.' });
    }

    const { rows: anggotaResult } = await client.query(
      `INSERT INTO anggota (nomor_anggota, nama_lengkap, nik, tempat_lahir, tanggal_lahir,
       jenis_kelamin, alamat, no_telepon, email, unit_kerja, jabatan, tanggal_bergabung, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'aktif') RETURNING id`,
      [nomorFinal, nama_lengkap, nik || null, tempat_lahir || null,
       tanggal_lahir || null, jenis_kelamin || null, alamat || null,
       no_telepon || null, email || null, unit_kerja || null, jabatan || null,
       tanggal_bergabung || new Date().toISOString().split('T')[0]]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat token set password, berlaku 24 jam
    const resetToken = crypto.randomBytes(48).toString('hex');
    const resetTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO users (username, password, role, anggota_id, reset_token, reset_token_exp, is_active)
       VALUES ($1,$2,'anggota',$3,$4,$5,false)`,
      [username, hashedPassword, anggotaResult[0].id, resetToken, resetTokenExp]
    );

    await client.query('COMMIT');

    // Kirim email set password jika ada email
    if (email) {
      try {
        await kirimEmailSetPassword(email, nama_lengkap, resetToken);
      } catch (mailErr) {
        console.error('Gagal kirim email:', mailErr.message);
        // Tidak gagalkan proses, hanya log
      }
    }

    res.status(201).json({
      message: email
        ? 'Anggota berhasil ditambahkan. Email pengaturan password telah dikirim.'
        : 'Anggota berhasil ditambahkan. Tidak ada email, gunakan reset password manual.',
      id: anggotaResult[0].id,
      nomor_anggota: nomorFinal,
      email_terkirim: !!email,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Gagal menambahkan anggota.' });
  } finally {
    client.release();
  }
});

// PUT /api/anggota/:id
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'pengurus' && req.user.anggota_id != id)
    return res.status(403).json({ message: 'Akses ditolak.' });

  const { nama_lengkap, nik, tempat_lahir, tanggal_lahir,
    jenis_kelamin, alamat, no_telepon, email, unit_kerja, jabatan } = req.body;

  try {
    await pool.query(
      `UPDATE anggota SET nama_lengkap=$1, nik=$2, tempat_lahir=$3, tanggal_lahir=$4,
       jenis_kelamin=$5, alamat=$6, no_telepon=$7, email=$8, unit_kerja=$9, jabatan=$10
       WHERE id=$11`,
      [nama_lengkap, nik, tempat_lahir, tanggal_lahir,
       jenis_kelamin, alamat, no_telepon, email, unit_kerja, jabatan, id]
    );
    res.json({ message: 'Data anggota berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui data anggota.' });
  }
});

// PATCH /api/anggota/:id/status
router.patch('/:id/status', verifyToken, requirePengurus, async (req, res) => {
  const { status } = req.body;
  if (!['aktif', 'nonaktif'].includes(status))
    return res.status(400).json({ message: 'Status harus aktif atau nonaktif.' });

  try {
    await pool.query('UPDATE anggota SET status=$1 WHERE id=$2', [status, req.params.id]);
    res.json({ message: `Status anggota berhasil diubah menjadi ${status}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah status anggota.' });
  }
});

// PATCH /api/anggota/:id/kirim-email — kirim ulang email set password
router.patch('/:id/kirim-email', verifyToken, requirePengurus, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows: anggota } = await pool.query('SELECT * FROM anggota WHERE id=$1', [id]);
    if (anggota.length === 0) return res.status(404).json({ message: 'Anggota tidak ditemukan.' });
    if (!anggota[0].email) return res.status(400).json({ message: 'Anggota tidak memiliki email.' });

    const resetToken = crypto.randomBytes(48).toString('hex');
    const resetTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET reset_token=$1, reset_token_exp=$2, is_active=false WHERE anggota_id=$3',
      [resetToken, resetTokenExp, id]
    );

    await kirimEmailSetPassword(anggota[0].email, anggota[0].nama_lengkap, resetToken);
    res.json({ message: 'Email pengaturan password berhasil dikirim ulang.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengirim email.' });
  }
});

// PATCH /api/anggota/:id/password
router.patch('/:id/password', verifyToken, requirePengurus, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password baru wajib diisi.' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1 WHERE anggota_id=$2', [hashed, req.params.id]);
    res.json({ message: 'Password berhasil direset.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mereset password.' });
  }
});

export default router;

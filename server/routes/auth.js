import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db.js';
import { kirimEmailSetPassword, kirimEmailResetPassword } from '../mailer.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });

  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.password, u.role, u.is_active,
              a.id as anggota_id, a.nama_lengkap, a.nomor_anggota, a.status
       FROM users u
       LEFT JOIN anggota a ON u.anggota_id = a.id
       WHERE u.username = $1`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ message: 'Username atau password salah.' });

    const user = rows[0];

    if (!user.is_active)
      return res.status(403).json({ message: 'Akun belum diaktifkan. Cek email Anda untuk mengatur password.' });

    if (user.role === 'anggota' && user.status === 'nonaktif')
      return res.status(403).json({ message: 'Akun Anda telah dinonaktifkan. Hubungi pengurus.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Username atau password salah.' });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        anggota_id: user.anggota_id,
        nama: user.nama_lengkap,
        nomor_anggota: user.nomor_anggota,
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        anggota_id: user.anggota_id,
        nama: user.nama_lengkap,
        nomor_anggota: user.nomor_anggota,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Tidak terautentikasi.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    res.json({ user: decoded });
  } catch {
    res.status(403).json({ message: 'Token tidak valid.' });
  }
});

// POST /api/auth/lupa-password — anggota minta reset password via email
router.post('/lupa-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email wajib diisi.' });

  try {
    const { rows } = await pool.query(
      `SELECT u.*, a.nama_lengkap, a.email as anggota_email
       FROM users u
       LEFT JOIN anggota a ON u.anggota_id = a.id
       WHERE a.email = $1 AND u.is_active = true`,
      [email]
    );

    // Selalu response sukses meski email tidak ditemukan (security)
    if (rows.length === 0) {
      return res.json({ message: 'Jika email terdaftar, link reset password akan dikirim.' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(48).toString('hex');
    const exp = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    await pool.query(
      'UPDATE users SET reset_token=$1, reset_token_exp=$2 WHERE id=$3',
      [token, exp, user.id]
    );

    await kirimEmailResetPassword(email, user.nama_lengkap || user.username, token);

    res.json({ message: 'Jika email terdaftar, link reset password akan dikirim.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengirim email. Coba lagi.' });
  }
});

// GET /api/auth/verifikasi-token/:token — cek token valid
router.get('/verifikasi-token/:token', async (req, res) => {
  const { token } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.username, u.is_active, a.nama_lengkap
       FROM users u
       LEFT JOIN anggota a ON u.anggota_id = a.id
       WHERE u.reset_token = $1 AND u.reset_token_exp > NOW()`,
      [token]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Link tidak valid atau sudah kadaluarsa.' });

    res.json({ valid: true, nama: rows[0].nama_lengkap || rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/auth/set-password — set password via token (akun baru atau reset)
router.post('/set-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ message: 'Token dan password wajib diisi.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_exp > NOW()',
      [token]
    );

    if (rows.length === 0)
      return res.status(400).json({ message: 'Link tidak valid atau sudah kadaluarsa.' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password=$1, reset_token=NULL, reset_token_exp=NULL, is_active=true WHERE id=$2',
      [hashed, rows[0].id]
    );

    res.json({ message: 'Password berhasil diatur. Silakan login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengatur password.' });
  }
});

// POST /api/auth/ganti-password — user ganti password sendiri (sudah login)
router.post('/ganti-password', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Tidak terautentikasi.' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
  } catch {
    return res.status(403).json({ message: 'Token tidak valid.' });
  }

  const { password_lama, password_baru } = req.body;
  if (!password_lama || !password_baru)
    return res.status(400).json({ message: 'Password lama dan baru wajib diisi.' });
  if (password_baru.length < 6)
    return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const isMatch = await bcrypt.compare(password_lama, rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Password lama tidak sesuai.' });

    const hashed = await bcrypt.hash(password_baru, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, decoded.id]);
    res.json({ message: 'Password berhasil diubah.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah password.' });
  }
});

export default router;

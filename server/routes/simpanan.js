import express from 'express';
import pool from '../db.js';
import { verifyToken, requirePengurus } from '../middleware/auth.js';

const router = express.Router();

// GET /api/simpanan/jenis
router.get('/jenis', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM jenis_simpanan ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil jenis simpanan.' });
  }
});

// POST /api/simpanan/jenis
router.post('/jenis', verifyToken, requirePengurus, async (req, res) => {
  const { nama, keterangan, nominal_default } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama jenis simpanan wajib diisi.' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO jenis_simpanan (nama, keterangan, nominal_default) VALUES ($1,$2,$3) RETURNING id',
      [nama, keterangan, nominal_default || 0]
    );
    res.status(201).json({ message: 'Jenis simpanan berhasil ditambahkan.', id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menambahkan jenis simpanan.' });
  }
});

// PUT /api/simpanan/jenis/:id
router.put('/jenis/:id', verifyToken, requirePengurus, async (req, res) => {
  const { nama, keterangan, nominal_default } = req.body;
  try {
    await pool.query(
      'UPDATE jenis_simpanan SET nama=$1, keterangan=$2, nominal_default=$3 WHERE id=$4',
      [nama, keterangan, nominal_default || 0, req.params.id]
    );
    res.json({ message: 'Jenis simpanan berhasil diperbarui.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui jenis simpanan.' });
  }
});

// GET /api/simpanan/saldo/:anggota_id
router.get('/saldo/:anggota_id', verifyToken, async (req, res) => {
  const { anggota_id } = req.params;
  if (req.user.role !== 'pengurus' && req.user.anggota_id != anggota_id)
    return res.status(403).json({ message: 'Akses ditolak.' });

  try {
    const { rows } = await pool.query(
      `SELECT js.id, js.nama, js.keterangan,
       COALESCE(SUM(CASE WHEN ts.jenis_transaksi='setoran' THEN ts.nominal ELSE -ts.nominal END), 0) AS saldo
       FROM jenis_simpanan js
       LEFT JOIN transaksi_simpanan ts ON ts.jenis_simpanan_id = js.id AND ts.anggota_id = $1
       GROUP BY js.id, js.nama, js.keterangan
       ORDER BY js.id`,
      [anggota_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil saldo simpanan.' });
  }
});

// GET /api/simpanan/riwayat/:anggota_id
router.get('/riwayat/:anggota_id', verifyToken, async (req, res) => {
  const { anggota_id } = req.params;
  if (req.user.role !== 'pengurus' && req.user.anggota_id != anggota_id)
    return res.status(403).json({ message: 'Akses ditolak.' });

  try {
    const { rows } = await pool.query(
      `SELECT ts.*, js.nama as jenis_nama, a.nama_lengkap
       FROM transaksi_simpanan ts
       JOIN jenis_simpanan js ON ts.jenis_simpanan_id = js.id
       JOIN anggota a ON ts.anggota_id = a.id
       WHERE ts.anggota_id = $1
       ORDER BY ts.tanggal DESC`,
      [anggota_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil riwayat simpanan.' });
  }
});

// GET /api/simpanan — pengurus semua riwayat
router.get('/', verifyToken, requirePengurus, async (req, res) => {
  const { anggota_id, dari_tanggal, sampai_tanggal } = req.query;
  let query = `SELECT ts.*, js.nama as jenis_nama, a.nama_lengkap, a.nomor_anggota
               FROM transaksi_simpanan ts
               JOIN jenis_simpanan js ON ts.jenis_simpanan_id = js.id
               JOIN anggota a ON ts.anggota_id = a.id
               WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (anggota_id) { query += ` AND ts.anggota_id = $${idx++}`; params.push(anggota_id); }
  if (dari_tanggal) { query += ` AND ts.tanggal >= $${idx++}`; params.push(dari_tanggal); }
  if (sampai_tanggal) { query += ` AND ts.tanggal <= $${idx++}`; params.push(sampai_tanggal); }
  query += ' ORDER BY ts.tanggal DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data simpanan.' });
  }
});

// POST /api/simpanan
router.post('/', verifyToken, requirePengurus, async (req, res) => {
  const { anggota_id, jenis_simpanan_id, jenis_transaksi, nominal, tanggal, keterangan } = req.body;

  if (!anggota_id || !jenis_simpanan_id || !jenis_transaksi || !nominal)
    return res.status(400).json({ message: 'Data transaksi tidak lengkap.' });
  if (!['setoran', 'penarikan'].includes(jenis_transaksi))
    return res.status(400).json({ message: 'Jenis transaksi harus setoran atau penarikan.' });

  try {
    if (jenis_transaksi === 'penarikan') {
      const { rows: saldo } = await pool.query(
        `SELECT COALESCE(SUM(CASE WHEN jenis_transaksi='setoran' THEN nominal ELSE -nominal END), 0) AS saldo
         FROM transaksi_simpanan WHERE anggota_id=$1 AND jenis_simpanan_id=$2`,
        [anggota_id, jenis_simpanan_id]
      );
      if (parseFloat(saldo[0].saldo) < parseFloat(nominal))
        return res.status(400).json({ message: 'Saldo tidak mencukupi untuk penarikan.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO transaksi_simpanan
       (anggota_id, jenis_simpanan_id, jenis_transaksi, nominal, tanggal, keterangan, dicatat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [anggota_id, jenis_simpanan_id, jenis_transaksi, nominal,
       tanggal || new Date().toISOString().split('T')[0], keterangan, req.user.id]
    );
    res.status(201).json({ message: 'Transaksi simpanan berhasil dicatat.', id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mencatat transaksi simpanan.' });
  }
});

export default router;

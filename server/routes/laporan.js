import express from 'express';
import pool from '../db.js';
import { verifyToken, requirePengurus } from '../middleware/auth.js';

const router = express.Router();

// GET /api/laporan/dashboard-pengurus
router.get('/dashboard-pengurus', verifyToken, requirePengurus, async (req, res) => {
  try {
    const { rows: r1 } = await pool.query(`SELECT COUNT(*) as total FROM anggota WHERE status='aktif'`);
    const { rows: r2 } = await pool.query(`SELECT COUNT(*) as total FROM pinjaman WHERE status='menunggu'`);
    const { rows: r3 } = await pool.query(`SELECT COUNT(*) as total FROM pinjaman WHERE status='aktif'`);
    const { rows: r4 } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN jenis_transaksi='setoran' THEN nominal ELSE -nominal END),0) as total FROM transaksi_simpanan`
    );
    const { rows: pembayaranTerbaru } = await pool.query(
      `SELECT pb.*, a.nama_lengkap, p.nominal as nominal_pinjaman
       FROM pembayaran pb
       JOIN pinjaman p ON pb.pinjaman_id = p.id
       JOIN anggota a ON p.anggota_id = a.id
       ORDER BY pb.tanggal_bayar DESC LIMIT 5`
    );
    const { rows: pengajuanTerbaru } = await pool.query(
      `SELECT p.*, a.nama_lengkap, a.nomor_anggota
       FROM pinjaman p JOIN anggota a ON p.anggota_id = a.id
       WHERE p.status = 'menunggu'
       ORDER BY p.tanggal_pengajuan DESC LIMIT 5`
    );

    res.json({
      total_anggota: parseInt(r1[0].total),
      pengajuan_baru: parseInt(r2[0].total),
      pinjaman_aktif: parseInt(r3[0].total),
      total_simpanan: parseFloat(r4[0].total),
      pembayaran_terbaru: pembayaranTerbaru,
      pengajuan_terbaru: pengajuanTerbaru,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data dashboard.' });
  }
});

// GET /api/laporan/dashboard-anggota
router.get('/dashboard-anggota', verifyToken, async (req, res) => {
  const anggota_id = req.user.anggota_id;
  if (!anggota_id) return res.status(400).json({ message: 'Bukan anggota.' });

  try {
    const { rows: saldo } = await pool.query(
      `SELECT COALESCE(SUM(CASE WHEN jenis_transaksi='setoran' THEN nominal ELSE -nominal END),0) as total
       FROM transaksi_simpanan WHERE anggota_id=$1`,
      [anggota_id]
    );
    const { rows: pinjamanAktif } = await pool.query(
      `SELECT p.* FROM pinjaman p
       WHERE p.anggota_id=$1 AND p.status IN ('aktif','menunggu')
       ORDER BY p.tanggal_pengajuan DESC LIMIT 1`,
      [anggota_id]
    );
    const { rows: angsuranBerikut } = await pool.query(
      `SELECT ja.* FROM jadwal_angsuran ja
       JOIN pinjaman p ON ja.pinjaman_id = p.id
       WHERE p.anggota_id=$1 AND ja.status != 'lunas' AND p.status='aktif'
       ORDER BY ja.tanggal_jatuh_tempo ASC LIMIT 1`,
      [anggota_id]
    );
    const { rows: sisaPinjaman } = await pool.query(
      `SELECT COALESCE(SUM(ja.total_angsuran - COALESCE(ja.sudah_dibayar,0)),0) as sisa
       FROM jadwal_angsuran ja
       JOIN pinjaman p ON ja.pinjaman_id = p.id
       WHERE p.anggota_id=$1 AND p.status='aktif'`,
      [anggota_id]
    );

    res.json({
      saldo_simpanan: parseFloat(saldo[0].total),
      pinjaman_aktif: pinjamanAktif[0] || null,
      angsuran_berikutnya: angsuranBerikut[0] || null,
      sisa_pinjaman: parseFloat(sisaPinjaman[0].sisa),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data dashboard anggota.' });
  }
});

// GET /api/laporan/pinjaman
router.get('/pinjaman', verifyToken, requirePengurus, async (req, res) => {
  const { status, dari_tanggal, sampai_tanggal, anggota_id } = req.query;
  let query = `SELECT p.*, a.nama_lengkap, a.nomor_anggota, a.unit_kerja
               FROM pinjaman p JOIN anggota a ON p.anggota_id = a.id WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (status) { query += ` AND p.status=$${idx++}`; params.push(status); }
  if (anggota_id) { query += ` AND p.anggota_id=$${idx++}`; params.push(anggota_id); }
  if (dari_tanggal) { query += ` AND p.tanggal_pengajuan>=$${idx++}`; params.push(dari_tanggal); }
  if (sampai_tanggal) { query += ` AND p.tanggal_pengajuan<=$${idx++}`; params.push(sampai_tanggal); }
  query += ' ORDER BY p.tanggal_pengajuan DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan pinjaman.' });
  }
});

// GET /api/laporan/simpanan
router.get('/simpanan', verifyToken, requirePengurus, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.nomor_anggota, a.nama_lengkap, a.unit_kerja,
       js.nama as jenis_simpanan,
       COALESCE(SUM(CASE WHEN ts.jenis_transaksi='setoran' THEN ts.nominal ELSE -ts.nominal END),0) as saldo
       FROM anggota a
       CROSS JOIN jenis_simpanan js
       LEFT JOIN transaksi_simpanan ts ON ts.anggota_id=a.id AND ts.jenis_simpanan_id=js.id
       WHERE a.status='aktif'
       GROUP BY a.id, a.nomor_anggota, a.nama_lengkap, a.unit_kerja, js.id, js.nama
       ORDER BY a.nomor_anggota, js.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil rekap simpanan.' });
  }
});

// GET /api/laporan/pembayaran
router.get('/pembayaran', verifyToken, requirePengurus, async (req, res) => {
  const { dari_tanggal, sampai_tanggal, anggota_id } = req.query;
  let query = `SELECT pb.*, a.nama_lengkap, a.nomor_anggota,
               p.nominal as nominal_pinjaman, ja.angsuran_ke
               FROM pembayaran pb
               JOIN pinjaman p ON pb.pinjaman_id=p.id
               JOIN anggota a ON p.anggota_id=a.id
               LEFT JOIN jadwal_angsuran ja ON pb.jadwal_angsuran_id=ja.id
               WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (anggota_id) { query += ` AND p.anggota_id=$${idx++}`; params.push(anggota_id); }
  if (dari_tanggal) { query += ` AND pb.tanggal_bayar>=$${idx++}`; params.push(dari_tanggal); }
  if (sampai_tanggal) { query += ` AND pb.tanggal_bayar<=$${idx++}`; params.push(sampai_tanggal); }
  query += ' ORDER BY pb.tanggal_bayar DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil laporan pembayaran.' });
  }
});

export default router;

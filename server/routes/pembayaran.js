import express from 'express';
import pool from '../db.js';
import { verifyToken, requirePengurus } from '../middleware/auth.js';

const router = express.Router();

// GET /api/pembayaran
router.get('/', verifyToken, async (req, res) => {
  const { anggota_id, dari_tanggal, sampai_tanggal, pinjaman_id } = req.query;

  let query = `SELECT pb.*, a.nama_lengkap, a.nomor_anggota,
               p.nominal as nominal_pinjaman, ja.angsuran_ke, ja.tanggal_jatuh_tempo
               FROM pembayaran pb
               JOIN pinjaman p ON pb.pinjaman_id = p.id
               JOIN anggota a ON p.anggota_id = a.id
               LEFT JOIN jadwal_angsuran ja ON pb.jadwal_angsuran_id = ja.id
               WHERE 1=1`;
  const params = [];
  let idx = 1;

  if (req.user.role !== 'pengurus') {
    query += ` AND p.anggota_id = $${idx++}`;
    params.push(req.user.anggota_id);
  } else if (anggota_id) {
    query += ` AND p.anggota_id = $${idx++}`;
    params.push(anggota_id);
  }

  if (pinjaman_id) { query += ` AND pb.pinjaman_id = $${idx++}`; params.push(pinjaman_id); }
  if (dari_tanggal) { query += ` AND pb.tanggal_bayar >= $${idx++}`; params.push(dari_tanggal); }
  if (sampai_tanggal) { query += ` AND pb.tanggal_bayar <= $${idx++}`; params.push(sampai_tanggal); }
  query += ' ORDER BY pb.tanggal_bayar DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data pembayaran.' });
  }
});

// POST /api/pembayaran
router.post('/', verifyToken, requirePengurus, async (req, res) => {
  const { pinjaman_id, jadwal_angsuran_id, nominal_bayar, tanggal_bayar, keterangan } = req.body;

  if (!pinjaman_id || !nominal_bayar || !tanggal_bayar)
    return res.status(400).json({ message: 'Data pembayaran tidak lengkap.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: pinjaman } = await client.query('SELECT * FROM pinjaman WHERE id = $1', [pinjaman_id]);
    if (pinjaman.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Pinjaman tidak ditemukan.' }); }
    if (!['aktif', 'disetujui'].includes(pinjaman[0].status)) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Pinjaman tidak aktif.' }); }

    const { rows } = await client.query(
      `INSERT INTO pembayaran (pinjaman_id, jadwal_angsuran_id, nominal_bayar, tanggal_bayar, keterangan, dicatat_oleh)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [pinjaman_id, jadwal_angsuran_id || null, nominal_bayar, tanggal_bayar, keterangan, req.user.id]
    );

    if (jadwal_angsuran_id) {
      const { rows: jadwal } = await client.query('SELECT * FROM jadwal_angsuran WHERE id = $1', [jadwal_angsuran_id]);
      if (jadwal.length > 0) {
        const sudahBayar = parseFloat(jadwal[0].sudah_dibayar || 0) + parseFloat(nominal_bayar);
        const total = parseFloat(jadwal[0].total_angsuran);
        const statusBaru = sudahBayar >= total ? 'lunas' : 'sebagian';
        await client.query(
          'UPDATE jadwal_angsuran SET sudah_dibayar=$1, status=$2, tanggal_bayar=$3 WHERE id=$4',
          [sudahBayar, statusBaru, tanggal_bayar, jadwal_angsuran_id]
        );
      }
    }

    // Cek apakah semua angsuran lunas
    const { rows: sisa } = await client.query(
      `SELECT COUNT(*) as jumlah FROM jadwal_angsuran
       WHERE pinjaman_id = $1 AND status != 'lunas'`,
      [pinjaman_id]
    );
    if (parseInt(sisa[0].jumlah) === 0) {
      await client.query(
        `UPDATE pinjaman SET status='lunas', tanggal_lunas=$1 WHERE id=$2`,
        [tanggal_bayar, pinjaman_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Pembayaran berhasil dicatat.', id: rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Gagal mencatat pembayaran.' });
  } finally {
    client.release();
  }
});

export default router;

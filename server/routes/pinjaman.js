import express from 'express';
import pool from '../db.js';
import { verifyToken, requirePengurus } from '../middleware/auth.js';

const router = express.Router();

function hitungJadwalAngsuran(pinjaman_id, pokok, bunga_persen, tenor, tanggal_mulai) {
  const angsuran_pokok = pokok / tenor;
  const bunga_bulanan = pokok * (bunga_persen / 100);
  const angsuran_total = angsuran_pokok + bunga_bulanan;
  const jadwal = [];

  let tgl = new Date(tanggal_mulai);
  for (let i = 1; i <= tenor; i++) {
    tgl = new Date(tgl);
    tgl.setMonth(tgl.getMonth() + 1);
    jadwal.push({
      pinjaman_id,
      angsuran_ke: i,
      tanggal_jatuh_tempo: tgl.toISOString().split('T')[0],
      pokok: parseFloat(angsuran_pokok.toFixed(2)),
      bunga: parseFloat(bunga_bulanan.toFixed(2)),
      total_angsuran: parseFloat(angsuran_total.toFixed(2)),
    });
  }
  return jadwal;
}

// GET /api/pinjaman
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `SELECT p.*, a.nama_lengkap, a.nomor_anggota
                 FROM pinjaman p JOIN anggota a ON p.anggota_id = a.id`;
    const params = [];

    if (req.user.role !== 'pengurus') {
      query += ' WHERE p.anggota_id = $1';
      params.push(req.user.anggota_id);
    }
    query += ' ORDER BY p.tanggal_pengajuan DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data pinjaman.' });
  }
});

// GET /api/pinjaman/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, a.nama_lengkap, a.nomor_anggota, a.unit_kerja, a.jabatan
       FROM pinjaman p JOIN anggota a ON p.anggota_id = a.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Pinjaman tidak ditemukan.' });
    if (req.user.role !== 'pengurus' && rows[0].anggota_id != req.user.anggota_id)
      return res.status(403).json({ message: 'Akses ditolak.' });

    const { rows: jadwal } = await pool.query(
      'SELECT * FROM jadwal_angsuran WHERE pinjaman_id = $1 ORDER BY angsuran_ke',
      [req.params.id]
    );
    res.json({ ...rows[0], jadwal_angsuran: jadwal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil detail pinjaman.' });
  }
});

// POST /api/pinjaman — anggota ajukan
router.post('/', verifyToken, async (req, res) => {
  const anggota_id = req.user.role === 'anggota' ? req.user.anggota_id : req.body.anggota_id;
  const { nominal, tenor, tujuan } = req.body;

  if (!anggota_id || !nominal || !tenor || !tujuan)
    return res.status(400).json({ message: 'Nominal, tenor, dan tujuan wajib diisi.' });
  if (parseFloat(nominal) <= 0)
    return res.status(400).json({ message: 'Nominal pinjaman harus lebih dari 0.' });
  if (![3, 6, 9, 12, 18, 24, 36].includes(parseInt(tenor)))
    return res.status(400).json({ message: 'Tenor tidak valid. Pilih: 3, 6, 9, 12, 18, 24, atau 36 bulan.' });

  try {
    const { rows: aktif } = await pool.query(
      `SELECT id FROM pinjaman WHERE anggota_id = $1 AND status IN ('disetujui','aktif')`,
      [anggota_id]
    );
    if (aktif.length > 0)
      return res.status(400).json({ message: 'Anda masih memiliki pinjaman aktif. Lunasi pinjaman sebelumnya terlebih dahulu.' });

    const { rows: pending } = await pool.query(
      `SELECT id FROM pinjaman WHERE anggota_id = $1 AND status = 'menunggu'`,
      [anggota_id]
    );
    if (pending.length > 0)
      return res.status(400).json({ message: 'Anda sudah memiliki pengajuan yang sedang menunggu persetujuan.' });

    const { rows } = await pool.query(
      `INSERT INTO pinjaman (anggota_id, nominal, tenor, tujuan, status, tanggal_pengajuan)
       VALUES ($1,$2,$3,$4,'menunggu',CURRENT_DATE) RETURNING id`,
      [anggota_id, nominal, tenor, tujuan]
    );
    res.status(201).json({ message: 'Pengajuan pinjaman berhasil dikirim.', id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengajukan pinjaman.' });
  }
});

// PATCH /api/pinjaman/:id/setujui
router.patch('/:id/setujui', verifyToken, requirePengurus, async (req, res) => {
  const { bunga_per_bulan, tanggal_cair } = req.body;
  const bunga = parseFloat(bunga_per_bulan) || 1.5;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM pinjaman WHERE id = $1', [req.params.id]);
    if (rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ message: 'Pinjaman tidak ditemukan.' }); }
    if (rows[0].status !== 'menunggu') { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Pinjaman sudah diproses.' }); }

    const p = rows[0];
    const tglCair = tanggal_cair || new Date().toISOString().split('T')[0];

    await client.query(
      `UPDATE pinjaman SET status='aktif', bunga_per_bulan=$1, tanggal_cair=$2,
       disetujui_oleh=$3, tanggal_disetujui=CURRENT_DATE WHERE id=$4`,
      [bunga, tglCair, req.user.id, req.params.id]
    );

    const jadwal = hitungJadwalAngsuran(req.params.id, parseFloat(p.nominal), bunga, p.tenor, tglCair);
    for (const j of jadwal) {
      await client.query(
        `INSERT INTO jadwal_angsuran (pinjaman_id, angsuran_ke, tanggal_jatuh_tempo, pokok, bunga, total_angsuran, status)
         VALUES ($1,$2,$3,$4,$5,$6,'belum_bayar')`,
        [j.pinjaman_id, j.angsuran_ke, j.tanggal_jatuh_tempo, j.pokok, j.bunga, j.total_angsuran]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Pinjaman berhasil disetujui dan jadwal angsuran dibuat.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Gagal menyetujui pinjaman.' });
  } finally {
    client.release();
  }
});

// PATCH /api/pinjaman/:id/tolak
router.patch('/:id/tolak', verifyToken, requirePengurus, async (req, res) => {
  const { alasan_penolakan } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM pinjaman WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Pinjaman tidak ditemukan.' });
    if (rows[0].status !== 'menunggu') return res.status(400).json({ message: 'Hanya pengajuan menunggu yang dapat ditolak.' });

    await pool.query(
      `UPDATE pinjaman SET status='ditolak', alasan_penolakan=$1, ditolak_oleh=$2, tanggal_ditolak=CURRENT_DATE
       WHERE id=$3`,
      [alasan_penolakan, req.user.id, req.params.id]
    );
    res.json({ message: 'Pinjaman berhasil ditolak.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menolak pinjaman.' });
  }
});

// GET /api/pinjaman/:id/jadwal
router.get('/:id/jadwal', verifyToken, async (req, res) => {
  try {
    const { rows: p } = await pool.query('SELECT * FROM pinjaman WHERE id = $1', [req.params.id]);
    if (p.length === 0) return res.status(404).json({ message: 'Pinjaman tidak ditemukan.' });
    if (req.user.role !== 'pengurus' && p[0].anggota_id != req.user.anggota_id)
      return res.status(403).json({ message: 'Akses ditolak.' });

    const { rows: jadwal } = await pool.query(
      'SELECT * FROM jadwal_angsuran WHERE pinjaman_id = $1 ORDER BY angsuran_ke',
      [req.params.id]
    );
    res.json(jadwal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil jadwal angsuran.' });
  }
});

export default router;

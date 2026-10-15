-- ============================================================
-- SCHEMA KOPERASI SIMPAN PINJAM KARYAWAN
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- USERS (akun login)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'anggota' CHECK (role IN ('anggota', 'pengurus')),
  anggota_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ANGGOTA
CREATE TABLE IF NOT EXISTS anggota (
  id SERIAL PRIMARY KEY,
  nomor_anggota VARCHAR(20) UNIQUE NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  nik VARCHAR(20),
  tempat_lahir VARCHAR(50),
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('L', 'P')),
  alamat TEXT,
  no_telepon VARCHAR(20),
  email VARCHAR(100),
  unit_kerja VARCHAR(100),
  jabatan VARCHAR(100),
  tanggal_bergabung DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_users_anggota
  FOREIGN KEY (anggota_id) REFERENCES anggota(id) ON DELETE SET NULL;

-- JENIS SIMPANAN
CREATE TABLE IF NOT EXISTS jenis_simpanan (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(50) NOT NULL,
  keterangan TEXT,
  nominal_default NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TRANSAKSI SIMPANAN
CREATE TABLE IF NOT EXISTS transaksi_simpanan (
  id SERIAL PRIMARY KEY,
  anggota_id INTEGER NOT NULL REFERENCES anggota(id),
  jenis_simpanan_id INTEGER NOT NULL REFERENCES jenis_simpanan(id),
  jenis_transaksi VARCHAR(20) NOT NULL CHECK (jenis_transaksi IN ('setoran', 'penarikan')),
  nominal NUMERIC(15,2) NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT,
  dicatat_oleh INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PINJAMAN
CREATE TABLE IF NOT EXISTS pinjaman (
  id SERIAL PRIMARY KEY,
  anggota_id INTEGER NOT NULL REFERENCES anggota(id),
  nominal NUMERIC(15,2) NOT NULL,
  tenor INTEGER NOT NULL,
  tujuan TEXT,
  bunga_per_bulan NUMERIC(5,2) DEFAULT 1.5,
  status VARCHAR(20) DEFAULT 'menunggu' CHECK (status IN ('menunggu','aktif','ditolak','lunas')),
  tanggal_pengajuan DATE DEFAULT CURRENT_DATE,
  tanggal_cair DATE,
  tanggal_lunas DATE,
  tanggal_disetujui DATE,
  tanggal_ditolak DATE,
  alasan_penolakan TEXT,
  disetujui_oleh INTEGER REFERENCES users(id),
  ditolak_oleh INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- JADWAL ANGSURAN
CREATE TABLE IF NOT EXISTS jadwal_angsuran (
  id SERIAL PRIMARY KEY,
  pinjaman_id INTEGER NOT NULL REFERENCES pinjaman(id),
  angsuran_ke INTEGER NOT NULL,
  tanggal_jatuh_tempo DATE NOT NULL,
  pokok NUMERIC(15,2) NOT NULL,
  bunga NUMERIC(15,2) NOT NULL,
  total_angsuran NUMERIC(15,2) NOT NULL,
  sudah_dibayar NUMERIC(15,2) DEFAULT 0,
  tanggal_bayar DATE,
  status VARCHAR(20) DEFAULT 'belum_bayar' CHECK (status IN ('belum_bayar','sebagian','lunas')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- PEMBAYARAN
CREATE TABLE IF NOT EXISTS pembayaran (
  id SERIAL PRIMARY KEY,
  pinjaman_id INTEGER NOT NULL REFERENCES pinjaman(id),
  jadwal_angsuran_id INTEGER REFERENCES jadwal_angsuran(id),
  nominal_bayar NUMERIC(15,2) NOT NULL,
  tanggal_bayar DATE NOT NULL,
  keterangan TEXT,
  dicatat_oleh INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DATA AWAL
-- ============================================================

-- Jenis simpanan default
INSERT INTO jenis_simpanan (nama, keterangan, nominal_default) VALUES
  ('Simpanan Pokok', 'Dibayar sekali saat pertama kali menjadi anggota', 100000),
  ('Simpanan Wajib', 'Dibayar setiap bulan oleh seluruh anggota', 50000),
  ('Simpanan Sukarela', 'Simpanan bebas sesuai kemampuan anggota', 0)
ON CONFLICT DO NOTHING;

-- Akun pengurus default (password: pengurus123)
-- bcrypt hash dari "pengurus123"
INSERT INTO users (username, password, role) VALUES
  ('admin', '$2b$10$rGmhBfzxPqJ6KQvH9VGjGO1lKwHCkJxLZE0G6YtWQKjL7F3WpFMlG', 'pengurus')
ON CONFLICT (username) DO NOTHING;

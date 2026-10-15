-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pendaftaran (
  id SERIAL PRIMARY KEY,
  -- Data pribadi
  nama_lengkap VARCHAR(100) NOT NULL,
  nik VARCHAR(20),
  tempat_lahir VARCHAR(50),
  tanggal_lahir DATE,
  jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('L', 'P')),
  alamat TEXT,
  no_telepon VARCHAR(20),
  email VARCHAR(100) NOT NULL,
  -- Data karyawan
  unit_kerja VARCHAR(100),
  jabatan VARCHAR(100),
  -- Akun
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  -- Status alur
  status VARCHAR(30) DEFAULT 'menunggu_verifikasi'
    CHECK (status IN ('menunggu_verifikasi', 'menunggu_persetujuan', 'disetujui', 'ditolak')),
  -- Verifikasi email
  token_verifikasi VARCHAR(255),
  token_expires_at TIMESTAMP,
  email_verified_at TIMESTAMP,
  -- Persetujuan pengurus
  diproses_oleh INTEGER REFERENCES users(id),
  tanggal_diproses TIMESTAMP,
  alasan_penolakan TEXT,
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

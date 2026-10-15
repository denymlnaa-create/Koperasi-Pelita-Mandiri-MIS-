-- Jalankan di Supabase SQL Editor
-- Tambah kolom token untuk set/reset password

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128),
  ADD COLUMN IF NOT EXISTS reset_token_exp TIMESTAMP,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Anggota yang sudah ada (admin) langsung aktif
UPDATE users SET is_active = true WHERE role = 'pengurus';

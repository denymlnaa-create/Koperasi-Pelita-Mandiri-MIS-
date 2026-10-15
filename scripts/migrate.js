import pool from '../server/db.js';

console.log('Menjalankan migration...');

await pool.query(`
  ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS reset_token VARCHAR(128),
    ADD COLUMN IF NOT EXISTS reset_token_exp TIMESTAMP,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false
`);

await pool.query(`UPDATE users SET is_active = true WHERE role = 'pengurus'`);

console.log('✅ Migration berhasil');
process.exit(0);

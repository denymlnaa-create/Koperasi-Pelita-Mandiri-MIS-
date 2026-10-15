import pool from '../server/db.js';
try {
  const { rows } = await pool.query('SELECT COUNT(*) as total FROM users');
  console.log('✅ Koneksi OK - Users:', rows[0].total);
  process.exit(0);
} catch(e) {
  console.log('❌ Gagal:', e.message);
  process.exit(1);
}

import bcrypt from 'bcryptjs';
import pool from '../server/db.js';

const hash = await bcrypt.hash('pengurus123', 10);
await pool.query('UPDATE users SET password=$1 WHERE username=$2', [hash, 'admin']);
console.log('✅ Password admin berhasil direset ke: pengurus123');
process.exit(0);

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import anggotaRoutes from './routes/anggota.js';
import simpananRoutes from './routes/simpanan.js';
import pinjamanRoutes from './routes/pinjaman.js';
import pembayaranRoutes from './routes/pembayaran.js';
import laporanRoutes from './routes/laporan.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/anggota', anggotaRoutes);
app.use('/api/simpanan', simpananRoutes);
app.use('/api/pinjaman', pinjamanRoutes);
app.use('/api/pembayaran', pembayaranRoutes);
app.use('/api/laporan', laporanRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Koperasi API berjalan.' });
});

app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});

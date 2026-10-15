import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const TENOR_OPTIONS = [3, 6, 9, 12, 18, 24, 36];

export default function AjukanPinjaman() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nominal: '', tenor: '', tujuan: '' });
  const [loading, setLoading] = useState(false);

  const estimasiAngsuran = form.nominal && form.tenor
    ? (parseFloat(form.nominal) / parseInt(form.tenor)) + (parseFloat(form.nominal) * 0.015)
    : null;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/pinjaman', form);
      toast.success('Pengajuan pinjaman berhasil dikirim! Menunggu persetujuan pengurus.');
      navigate('/pinjaman');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan pinjaman.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h2 className="page-title">Ajukan Pinjaman</h2>
      </div>

      <div className="form-card-layout">
        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-section">
            <div className="form-group">
              <label>Nominal Pinjaman *</label>
              <input
                type="number"
                placeholder="Contoh: 5000000"
                value={form.nominal}
                onChange={e => setForm({ ...form, nominal: e.target.value })}
                required min={100000}
              />
              {form.nominal && <small className="form-hint">{formatRupiah(form.nominal)}</small>}
            </div>

            <div className="form-group">
              <label>Tenor (bulan) *</label>
              <select value={form.tenor} onChange={e => setForm({ ...form, tenor: e.target.value })} required>
                <option value="">— Pilih Tenor —</option>
                {TENOR_OPTIONS.map(t => <option key={t} value={t}>{t} bulan</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Tujuan Pinjaman *</label>
              <textarea
                placeholder="Jelaskan tujuan penggunaan pinjaman..."
                value={form.tujuan}
                onChange={e => setForm({ ...form, tujuan: e.target.value })}
                required rows={3}
              />
            </div>
          </div>

          {estimasiAngsuran && (
            <div className="estimasi-box">
              <div className="estimasi-title">Estimasi Angsuran per Bulan</div>
              <div className="estimasi-value">{formatRupiah(estimasiAngsuran)}</div>
              <div className="estimasi-note">
                * Estimasi berdasarkan bunga flat 1,5%/bulan. Nilai final ditentukan pengurus.
              </div>
            </div>
          )}

          <div className="info-box">
            <ul>
              <li>Pinjaman hanya dapat diajukan jika tidak ada pinjaman aktif.</li>
              <li>Pengajuan akan diproses oleh pengurus koperasi.</li>
              <li>Pembayaran dilakukan langsung ke pengurus/kasir.</li>
            </ul>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

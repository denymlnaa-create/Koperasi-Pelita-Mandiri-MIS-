import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal, statusPinjaman, statusAngsuran } from '../../utils/format';

export default function DetailPinjaman() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pinjaman, setPinjaman] = useState(null);
  const [showSetujui, setShowSetujui] = useState(false);
  const [showTolak, setShowTolak] = useState(false);
  const [bunga, setBunga] = useState('1.5');
  const [tanggalCair, setTanggalCair] = useState(new Date().toISOString().split('T')[0]);
  const [alasan, setAlasan] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    axios.get(`/api/pinjaman/${id}`)
      .then(res => setPinjaman(res.data))
      .catch(() => toast.error('Gagal memuat data.'));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleSetujui = async () => {
    setLoading(true);
    try {
      await axios.patch(`/api/pinjaman/${id}/setujui`, {
        bunga_per_bulan: parseFloat(bunga),
        tanggal_cair: tanggalCair,
      });
      toast.success('Pinjaman berhasil disetujui.');
      setShowSetujui(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui.');
    } finally {
      setLoading(false);
    }
  };

  const handleTolak = async () => {
    setLoading(true);
    try {
      await axios.patch(`/api/pinjaman/${id}/tolak`, { alasan_penolakan: alasan });
      toast.success('Pinjaman berhasil ditolak.');
      setShowTolak(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak.');
    } finally {
      setLoading(false);
    }
  };

  if (!pinjaman) return <div className="loading"><div className="spinner" /></div>;

  const s = statusPinjaman(pinjaman.status);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        {user?.role === 'pengurus' && pinjaman.status === 'menunggu' && (
          <div className="header-actions">
            <button className="btn btn-success" onClick={() => setShowSetujui(true)}>
              <CheckCircle size={15} /> Setujui
            </button>
            <button className="btn btn-danger" onClick={() => setShowTolak(true)}>
              <XCircle size={15} /> Tolak
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Detail Pinjaman</h3>
          <span className={`badge ${s.color}`}>{s.label}</span>
        </div>
        <div className="detail-grid">
          {user?.role === 'pengurus' && <>
            <div className="detail-row"><span className="detail-label">Nama Anggota</span><span className="detail-value">{pinjaman.nama_lengkap}</span></div>
            <div className="detail-row"><span className="detail-label">No. Anggota</span><span className="detail-value">{pinjaman.nomor_anggota}</span></div>
            <div className="detail-row"><span className="detail-label">Unit Kerja</span><span className="detail-value">{pinjaman.unit_kerja || '—'}</span></div>
          </>}
          <div className="detail-row"><span className="detail-label">Nominal</span><span className="detail-value">{formatRupiah(pinjaman.nominal)}</span></div>
          <div className="detail-row"><span className="detail-label">Tenor</span><span className="detail-value">{pinjaman.tenor} bulan</span></div>
          <div className="detail-row"><span className="detail-label">Tujuan</span><span className="detail-value">{pinjaman.tujuan}</span></div>
          <div className="detail-row"><span className="detail-label">Tanggal Pengajuan</span><span className="detail-value">{formatTanggal(pinjaman.tanggal_pengajuan)}</span></div>
          {pinjaman.tanggal_cair && <div className="detail-row"><span className="detail-label">Tanggal Cair</span><span className="detail-value">{formatTanggal(pinjaman.tanggal_cair)}</span></div>}
          {pinjaman.bunga_per_bulan && <div className="detail-row"><span className="detail-label">Bunga/Bulan</span><span className="detail-value">{pinjaman.bunga_per_bulan}% (flat)</span></div>}
          {pinjaman.alasan_penolakan && <div className="detail-row"><span className="detail-label">Alasan Penolakan</span><span className="detail-value text-red">{pinjaman.alasan_penolakan}</span></div>}
        </div>
      </div>

      {pinjaman.jadwal_angsuran?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header"><h3>Jadwal Angsuran</h3></div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ke-</th>
                  <th>Jatuh Tempo</th>
                  <th>Pokok</th>
                  <th>Bunga</th>
                  <th>Total</th>
                  <th>Sudah Bayar</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pinjaman.jadwal_angsuran.map(j => {
                  const sa = statusAngsuran(j.status);
                  return (
                    <tr key={j.id}>
                      <td>{j.angsuran_ke}</td>
                      <td>{formatTanggal(j.tanggal_jatuh_tempo)}</td>
                      <td>{formatRupiah(j.pokok)}</td>
                      <td>{formatRupiah(j.bunga)}</td>
                      <td className="font-bold">{formatRupiah(j.total_angsuran)}</td>
                      <td>{formatRupiah(j.sudah_dibayar)}</td>
                      <td><span className={`badge ${sa.color}`}>{sa.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Setujui */}
      {showSetujui && (
        <div className="modal-overlay" onClick={() => setShowSetujui(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Setujui Pinjaman</h3>
            <div className="form-group">
              <label>Bunga per Bulan (%) — metode flat</label>
              <input type="number" step="0.1" value={bunga} onChange={e => setBunga(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tanggal Cair</label>
              <input type="date" value={tanggalCair} onChange={e => setTanggalCair(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowSetujui(false)}>Batal</button>
              <button className="btn btn-success" onClick={handleSetujui} disabled={loading}>
                {loading ? 'Memproses...' : 'Setujui'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {showTolak && (
        <div className="modal-overlay" onClick={() => setShowTolak(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Tolak Pinjaman</h3>
            <div className="form-group">
              <label>Alasan Penolakan</label>
              <textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={3} placeholder="Tulis alasan penolakan..." />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowTolak(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleTolak} disabled={loading}>
                {loading ? 'Memproses...' : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

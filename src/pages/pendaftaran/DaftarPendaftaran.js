import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { formatTanggal } from '../../utils/format';

const statusConfig = {
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'badge-warning' },
  menunggu_persetujuan: { label: 'Menunggu Persetujuan', color: 'badge-info' },
  disetujui: { label: 'Disetujui', color: 'badge-success' },
  ditolak: { label: 'Ditolak', color: 'badge-danger' },
};

export default function DaftarPendaftaran() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('menunggu_persetujuan');
  const [selected, setSelected] = useState(null);
  const [showTolak, setShowTolak] = useState(null);
  const [alasan, setAlasan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    const params = filter !== 'semua' ? `?status=${filter}` : '';
    axios.get(`/api/daftar${params}`)
      .then(res => setList(res.data))
      .catch(() => toast.error('Gagal memuat data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleSetujui = async (id) => {
    if (!confirm('Setujui pendaftaran ini dan buat akun anggota?')) return;
    setSubmitting(true);
    try {
      const res = await axios.patch(`/api/daftar/${id}/setujui`);
      toast.success(res.data.message);
      fetchData();
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTolak = async () => {
    setSubmitting(true);
    try {
      await axios.patch(`/api/daftar/${showTolak}/tolak`, { alasan_penolakan: alasan });
      toast.success('Pendaftaran ditolak.');
      setShowTolak(null);
      setAlasan('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = list;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Pendaftaran Anggota</h2>
      </div>

      <div className="filter-tabs">
        {['menunggu_persetujuan', 'menunggu_verifikasi', 'disetujui', 'ditolak', 'semua'].map(s => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'semua' ? 'Semua' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="card">
        {loading
          ? <div className="loading"><div className="spinner" /></div>
          : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Unit Kerja</th>
                    <th>Tanggal Daftar</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={7} className="empty-cell">Tidak ada pendaftaran.</td></tr>
                    : filtered.map(p => {
                      const s = statusConfig[p.status] || { label: p.status, color: 'badge-default' };
                      return (
                        <tr key={p.id}>
                          <td><div className="cell-name">{p.nama_lengkap}</div></td>
                          <td>{p.email}</td>
                          <td className="mono">{p.username}</td>
                          <td>{p.unit_kerja || '—'}</td>
                          <td>{formatTanggal(p.created_at)}</td>
                          <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                          <td>
                            <div className="action-btns">
                              <button className="btn-icon" title="Detail" onClick={() => setSelected(p)}>
                                <Eye size={15} />
                              </button>
                              {p.status === 'menunggu_persetujuan' && (
                                <>
                                  <button
                                    className="btn-icon"
                                    title="Setujui"
                                    style={{ color: '#16a34a' }}
                                    onClick={() => handleSetujui(p.id)}
                                    disabled={submitting}
                                  >
                                    <CheckCircle size={15} />
                                  </button>
                                  <button
                                    className="btn-icon"
                                    title="Tolak"
                                    style={{ color: '#dc2626' }}
                                    onClick={() => { setShowTolak(p.id); setAlasan(''); }}
                                  >
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Modal Detail */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 16 }}>Detail Pendaftaran</h3>
            <div className="detail-grid" style={{ margin: '0 -24px' }}>
              {[
                ['Nama Lengkap', selected.nama_lengkap],
                ['Email', selected.email],
                ['Username', selected.username],
                ['Unit Kerja', selected.unit_kerja || '—'],
                ['Jabatan', selected.jabatan || '—'],
                ['Tanggal Daftar', formatTanggal(selected.created_at)],
                ['Status', <span className={`badge ${statusConfig[selected.status]?.color}`}>{statusConfig[selected.status]?.label}</span>],
                ['Email Diverifikasi', selected.email_verified_at ? formatTanggal(selected.email_verified_at) : 'Belum'],
              ].map(([label, val]) => (
                <div key={label} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{val}</span>
                </div>
              ))}
            </div>
            <div className="form-actions" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Tutup</button>
              {selected.status === 'menunggu_persetujuan' && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={() => { setShowTolak(selected.id); setSelected(null); }}
                  >
                    Tolak
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => { handleSetujui(selected.id); }}
                    disabled={submitting}
                  >
                    Setujui
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {showTolak && (
        <div className="modal-overlay" onClick={() => setShowTolak(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Tolak Pendaftaran</h3>
            <div className="form-group" style={{ margin: '16px 0' }}>
              <label>Alasan Penolakan (opsional)</label>
              <textarea
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                rows={3}
                placeholder="Tulis alasan penolakan..."
              />
            </div>
            <div className="form-actions" style={{ padding: 0 }}>
              <button className="btn btn-ghost" onClick={() => setShowTolak(null)}>Batal</button>
              <button className="btn btn-danger" onClick={handleTolak} disabled={submitting}>
                {submitting ? 'Memproses...' : 'Tolak Pendaftaran'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

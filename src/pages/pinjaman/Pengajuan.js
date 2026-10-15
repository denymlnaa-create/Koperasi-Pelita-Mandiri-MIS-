import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { formatRupiah, formatTanggal, statusPinjaman } from '../../utils/format';
import { Eye } from 'lucide-react';

export default function Pengajuan() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('menunggu');

  useEffect(() => {
    axios.get('/api/pinjaman')
      .then(res => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'semua' ? list : list.filter(p => p.status === filter);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Pengajuan Pinjaman</h2>
      </div>

      <div className="filter-tabs">
        {['menunggu', 'aktif', 'ditolak', 'lunas', 'semua'].map(s => (
          <button
            key={s}
            className={`filter-tab ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'menunggu' ? 'Menunggu' : s === 'aktif' ? 'Aktif' : s === 'ditolak' ? 'Ditolak' : s === 'lunas' ? 'Lunas' : 'Semua'}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Anggota</th>
                  <th>Nominal</th>
                  <th>Tenor</th>
                  <th>Tujuan</th>
                  <th>Tanggal Ajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} className="empty-cell">Tidak ada pengajuan.</td></tr>
                  : filtered.map(p => {
                    const s = statusPinjaman(p.status);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="cell-name">{p.nama_lengkap}</div>
                          <div className="cell-sub">{p.nomor_anggota}</div>
                        </td>
                        <td>{formatRupiah(p.nominal)}</td>
                        <td>{p.tenor} bln</td>
                        <td className="cell-truncate">{p.tujuan}</td>
                        <td>{formatTanggal(p.tanggal_pengajuan)}</td>
                        <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                        <td>
                          <Link to={`/pinjaman/${p.id}`} className="btn-icon">
                            <Eye size={15} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

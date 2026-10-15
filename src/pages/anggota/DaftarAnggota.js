import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Eye, Edit, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatTanggal } from '../../utils/format';

export default function DaftarAnggota() {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAnggota = () => {
    axios.get('/api/anggota')
      .then(res => setAnggota(res.data))
      .catch(() => toast.error('Gagal memuat data anggota.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnggota(); }, []);

  const toggleStatus = async (id, statusSaat) => {
    const statusBaru = statusSaat === 'aktif' ? 'nonaktif' : 'aktif';
    const konfirmasi = confirm(`${statusBaru === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan kembali'} anggota ini?`);
    if (!konfirmasi) return;
    try {
      await axios.patch(`/api/anggota/${id}/status`, { status: statusBaru });
      toast.success(`Anggota berhasil di${statusBaru === 'nonaktif' ? 'nonaktifkan' : 'aktifkan'}.`);
      fetchAnggota();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status.');
    }
  };

  const filtered = anggota.filter(a =>
    a.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
    a.nomor_anggota.toLowerCase().includes(search.toLowerCase()) ||
    (a.unit_kerja || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Data Anggota</h2>
        <Link to="/anggota/tambah" className="btn btn-primary">
          <Plus size={16} /> Tambah Anggota
        </Link>
      </div>

      <div className="card">
        <div className="card-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Cari nama, nomor, atau unit kerja..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="text-muted">{filtered.length} anggota</span>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>No. Anggota</th>
                  <th>Nama</th>
                  <th>Unit Kerja</th>
                  <th>Bergabung</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="empty-cell">Tidak ada data anggota.</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id}>
                    <td className="mono">{a.nomor_anggota}</td>
                    <td>
                      <div className="cell-name">{a.nama_lengkap}</div>
                      <div className="cell-sub">{a.username}</div>
                    </td>
                    <td>{a.unit_kerja || '—'}</td>
                    <td>{formatTanggal(a.tanggal_bergabung)}</td>
                    <td>
                      <span className={`badge ${a.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/anggota/${a.id}`} className="btn-icon" title="Detail">
                          <Eye size={15} />
                        </Link>
                        <Link to={`/anggota/${a.id}/edit`} className="btn-icon" title="Edit">
                          <Edit size={15} />
                        </Link>
                        <button
                          className="btn-icon"
                          title={a.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                          onClick={() => toggleStatus(a.id, a.status)}
                        >
                          {a.status === 'aktif' ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

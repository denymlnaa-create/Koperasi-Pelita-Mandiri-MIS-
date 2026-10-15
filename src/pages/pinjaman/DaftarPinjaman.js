import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal, statusPinjaman } from '../../utils/format';
import { Eye, Plus } from 'lucide-react';

export default function DaftarPinjaman() {
  const { user } = useAuth();
  const [pinjaman, setPinjaman] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/pinjaman')
      .then(res => setPinjaman(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">
          {user?.role === 'pengurus' ? 'Semua Pinjaman' : 'Pinjaman Saya'}
        </h2>
        {user?.role === 'anggota' && (
          <Link to="/pinjaman/ajukan" className="btn btn-primary">
            <Plus size={16} /> Ajukan Pinjaman
          </Link>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {user?.role === 'pengurus' && <th>Anggota</th>}
                  <th>Nominal</th>
                  <th>Tenor</th>
                  <th>Tujuan</th>
                  <th>Tanggal Ajuan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pinjaman.length === 0 ? (
                  <tr><td colSpan={7} className="empty-cell">Tidak ada data pinjaman.</td></tr>
                ) : pinjaman.map(p => {
                  const s = statusPinjaman(p.status);
                  return (
                    <tr key={p.id}>
                      {user?.role === 'pengurus' && (
                        <td>
                          <div className="cell-name">{p.nama_lengkap}</div>
                          <div className="cell-sub">{p.nomor_anggota}</div>
                        </td>
                      )}
                      <td>{formatRupiah(p.nominal)}</td>
                      <td>{p.tenor} bln</td>
                      <td className="cell-truncate">{p.tujuan}</td>
                      <td>{formatTanggal(p.tanggal_pengajuan)}</td>
                      <td><span className={`badge ${s.color}`}>{s.label}</span></td>
                      <td>
                        <Link to={`/pinjaman/${p.id}`} className="btn-icon" title="Detail">
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

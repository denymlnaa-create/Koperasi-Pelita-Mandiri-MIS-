import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatRupiah, formatTanggal } from '../../utils/format';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pembayaran() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    axios.get('/api/pembayaran')
      .then(res => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Riwayat Pembayaran</h2>
        <Link to="/pembayaran/catat" className="btn btn-primary">
          <Plus size={16} /> Catat Pembayaran
        </Link>
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
                  <th>Angsuran Ke-</th>
                  <th>Nominal Bayar</th>
                  <th>Tanggal Bayar</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0
                  ? <tr><td colSpan={5} className="empty-cell">Belum ada pembayaran tercatat.</td></tr>
                  : list.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-name">{p.nama_lengkap}</div>
                        <div className="cell-sub">{p.nomor_anggota}</div>
                      </td>
                      <td>{p.angsuran_ke ? `Angsuran ke-${p.angsuran_ke}` : '—'}</td>
                      <td className="text-green font-bold">{formatRupiah(p.nominal_bayar)}</td>
                      <td>{formatTanggal(p.tanggal_bayar)}</td>
                      <td>{p.keterangan || '—'}</td>
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

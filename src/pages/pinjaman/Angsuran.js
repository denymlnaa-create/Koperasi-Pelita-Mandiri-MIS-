import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal, statusAngsuran } from '../../utils/format';

export default function Angsuran() {
  const { user } = useAuth();
  const [pinjaman, setPinjaman] = useState([]);
  const [selectedPinjaman, setSelectedPinjaman] = useState(null);
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/pinjaman')
      .then(res => {
        const aktif = res.data.filter(p => p.status === 'aktif');
        setPinjaman(aktif);
        if (aktif.length > 0) {
          setSelectedPinjaman(aktif[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPinjaman) return;
    axios.get(`/api/pinjaman/${selectedPinjaman}/jadwal`)
      .then(res => setJadwal(res.data))
      .catch(() => {});
  }, [selectedPinjaman]);

  const totalTagihan = jadwal.reduce((s, j) => s + parseFloat(j.total_angsuran || 0), 0);
  const totalBayar = jadwal.reduce((s, j) => s + parseFloat(j.sudah_dibayar || 0), 0);
  const sisaHutang = totalTagihan - totalBayar;
  const sudahLunas = jadwal.filter(j => j.status === 'lunas').length;

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h2 className="page-title">Jadwal Angsuran</h2>

      {pinjaman.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <p className="empty-text">Tidak ada pinjaman aktif saat ini.</p>
          </div>
        </div>
      ) : (
        <>
          {pinjaman.length > 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0, maxWidth: 320 }}>
                <label>Pilih Pinjaman</label>
                <select value={selectedPinjaman} onChange={e => setSelectedPinjaman(e.target.value)}>
                  {pinjaman.map(p => (
                    <option key={p.id} value={p.id}>
                      {formatRupiah(p.nominal)} — {p.tenor} bulan
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', marginBottom: 16 }}>
            <div className="stat-card blue">
              <div className="stat-info">
                <div className="stat-label">Total Pinjaman</div>
                <div className="stat-value-sm">{formatRupiah(totalTagihan)}</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-info">
                <div className="stat-label">Sudah Dibayar</div>
                <div className="stat-value-sm">{formatRupiah(totalBayar)}</div>
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-info">
                <div className="stat-label">Sisa Hutang</div>
                <div className="stat-value-sm">{formatRupiah(sisaHutang)}</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-info">
                <div className="stat-label">Progress</div>
                <div className="stat-value-sm">{sudahLunas} / {jadwal.length} angsuran</div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="progress-label">
              <span>Pelunasan</span>
              <span>{jadwal.length > 0 ? Math.round((sudahLunas / jadwal.length) * 100) : 0}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${jadwal.length > 0 ? (sudahLunas / jadwal.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Detail Jadwal</h3></div>
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
                    <th>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwal.map(j => {
                    const sa = statusAngsuran(j.status);
                    const sisa = parseFloat(j.total_angsuran) - parseFloat(j.sudah_dibayar || 0);
                    const isLewat = new Date(j.tanggal_jatuh_tempo) < new Date() && j.status !== 'lunas';
                    return (
                      <tr key={j.id} className={isLewat ? 'row-danger' : ''}>
                        <td>{j.angsuran_ke}</td>
                        <td className={isLewat ? 'text-red' : ''}>{formatTanggal(j.tanggal_jatuh_tempo)}</td>
                        <td>{formatRupiah(j.pokok)}</td>
                        <td>{formatRupiah(j.bunga)}</td>
                        <td className="font-bold">{formatRupiah(j.total_angsuran)}</td>
                        <td className="text-green">{formatRupiah(j.sudah_dibayar)}</td>
                        <td className={sisa > 0 ? 'text-red' : 'text-green'}>{formatRupiah(sisa)}</td>
                        <td><span className={`badge ${sa.color}`}>{sa.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

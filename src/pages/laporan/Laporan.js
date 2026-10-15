import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatRupiah, formatTanggal, statusPinjaman } from '../../utils/format';
import { FileDown } from 'lucide-react';

const tabs = ['anggota', 'simpanan', 'pinjaman', 'pembayaran'];
const tabLabel = { anggota: 'Anggota', simpanan: 'Simpanan', pinjaman: 'Pinjaman', pembayaran: 'Pembayaran' };

export default function Laporan() {
  const [tab, setTab] = useState('anggota');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anggotaList, setAnggotaList] = useState([]);

  // Filter state
  const [filter, setFilter] = useState({
    status: '',
    anggota_id: '',
    dari_tanggal: '',
    sampai_tanggal: '',
  });

  useEffect(() => {
    axios.get('/api/anggota').then(res => setAnggotaList(res.data));
  }, []);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    if (filter.anggota_id) params.append('anggota_id', filter.anggota_id);
    if (filter.dari_tanggal) params.append('dari_tanggal', filter.dari_tanggal);
    if (filter.sampai_tanggal) params.append('sampai_tanggal', filter.sampai_tanggal);

    const url = tab === 'anggota'
      ? '/api/anggota'
      : `/api/laporan/${tab}?${params.toString()}`;

    axios.get(url)
      .then(res => setData(res.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setData([]);
    setFilter({ status: '', anggota_id: '', dari_tanggal: '', sampai_tanggal: '' });
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${tab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Laporan</h2>
        <button className="btn btn-secondary" onClick={exportCSV} disabled={data.length === 0}>
          <FileDown size={16} /> Export CSV
        </button>
      </div>

      <div className="filter-tabs">
        {tabs.map(t => (
          <button
            key={t}
            className={`filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {tabLabel[t]}
          </button>
        ))}
      </div>

      {/* Filter bar — hanya untuk tab tertentu */}
      {tab !== 'anggota' && (
        <div className="card filter-bar">
          <div className="filter-bar-grid">
            {(tab === 'pinjaman') && (
              <div className="form-group">
                <label>Status</label>
                <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
                  <option value="">Semua</option>
                  <option value="menunggu">Menunggu</option>
                  <option value="aktif">Aktif</option>
                  <option value="lunas">Lunas</option>
                  <option value="ditolak">Ditolak</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Anggota</label>
              <select value={filter.anggota_id} onChange={e => setFilter({ ...filter, anggota_id: e.target.value })}>
                <option value="">Semua</option>
                {anggotaList.map(a => (
                  <option key={a.id} value={a.id}>{a.nama_lengkap} ({a.nomor_anggota})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Dari Tanggal</label>
              <input type="date" value={filter.dari_tanggal} onChange={e => setFilter({ ...filter, dari_tanggal: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Sampai Tanggal</label>
              <input type="date" value={filter.sampai_tanggal} onChange={e => setFilter({ ...filter, sampai_tanggal: e.target.value })} />
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary" onClick={fetchData}>Tampilkan</button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            {tab === 'anggota' && <TabelAnggota data={data} />}
            {tab === 'simpanan' && <TabelSimpanan data={data} />}
            {tab === 'pinjaman' && <TabelPinjaman data={data} />}
            {tab === 'pembayaran' && <TabelPembayaran data={data} />}
          </div>
        )}
        <div className="table-footer">
          Total: <strong>{data.length}</strong> baris
        </div>
      </div>
    </div>
  );
}

function TabelAnggota({ data }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>No. Anggota</th><th>Nama</th><th>Unit Kerja</th>
          <th>Jabatan</th><th>Bergabung</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0
          ? <tr><td colSpan={6} className="empty-cell">Tidak ada data.</td></tr>
          : data.map(a => (
            <tr key={a.id}>
              <td className="mono">{a.nomor_anggota}</td>
              <td>{a.nama_lengkap}</td>
              <td>{a.unit_kerja || '—'}</td>
              <td>{a.jabatan || '—'}</td>
              <td>{formatTanggal(a.tanggal_bergabung)}</td>
              <td><span className={`badge ${a.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span></td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function TabelSimpanan({ data }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>No. Anggota</th><th>Nama</th><th>Unit Kerja</th>
          <th>Jenis Simpanan</th><th>Saldo</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0
          ? <tr><td colSpan={5} className="empty-cell">Tidak ada data.</td></tr>
          : data.map((r, i) => (
            <tr key={i}>
              <td className="mono">{r.nomor_anggota}</td>
              <td>{r.nama_lengkap}</td>
              <td>{r.unit_kerja || '—'}</td>
              <td>{r.jenis_simpanan}</td>
              <td className={parseFloat(r.saldo) >= 0 ? 'text-green' : 'text-red'}>{formatRupiah(r.saldo)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

function TabelPinjaman({ data }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>No. Anggota</th><th>Nama</th><th>Unit Kerja</th>
          <th>Nominal</th><th>Tenor</th><th>Tgl Pengajuan</th>
          <th>Tgl Cair</th><th>Bunga</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0
          ? <tr><td colSpan={9} className="empty-cell">Tidak ada data.</td></tr>
          : data.map(p => {
            const s = statusPinjaman(p.status);
            return (
              <tr key={p.id}>
                <td className="mono">{p.nomor_anggota}</td>
                <td>{p.nama_lengkap}</td>
                <td>{p.unit_kerja || '—'}</td>
                <td>{formatRupiah(p.nominal)}</td>
                <td>{p.tenor} bln</td>
                <td>{formatTanggal(p.tanggal_pengajuan)}</td>
                <td>{formatTanggal(p.tanggal_cair)}</td>
                <td>{p.bunga_per_bulan ? `${p.bunga_per_bulan}%` : '—'}</td>
                <td><span className={`badge ${s.color}`}>{s.label}</span></td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}

function TabelPembayaran({ data }) {
  const total = data.reduce((s, r) => s + parseFloat(r.nominal_bayar || 0), 0);
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>No. Anggota</th><th>Nama</th><th>Angsuran Ke-</th>
            <th>Nominal Bayar</th><th>Tanggal Bayar</th><th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={6} className="empty-cell">Tidak ada data.</td></tr>
            : data.map(p => (
              <tr key={p.id}>
                <td className="mono">{p.nomor_anggota}</td>
                <td>{p.nama_lengkap}</td>
                <td>{p.angsuran_ke ? `Ke-${p.angsuran_ke}` : '—'}</td>
                <td className="text-green font-bold">{formatRupiah(p.nominal_bayar)}</td>
                <td>{formatTanggal(p.tanggal_bayar)}</td>
                <td>{p.keterangan || '—'}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {data.length > 0 && (
        <div className="table-summary">
          Total Pembayaran: <strong>{formatRupiah(total)}</strong>
        </div>
      )}
    </>
  );
}

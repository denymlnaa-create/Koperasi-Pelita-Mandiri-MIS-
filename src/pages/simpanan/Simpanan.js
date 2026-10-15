import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah, formatTanggal } from '../../utils/format';
import { Plus } from 'lucide-react';

export default function Simpanan() {
  const { user } = useAuth();
  const isPengurus = user?.role === 'pengurus';
  const [saldo, setSaldo] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [selectedAnggota, setSelectedAnggota] = useState(isPengurus ? '' : user?.anggota_id);
  const [showForm, setShowForm] = useState(false);
  const [jenisList, setJenisList] = useState([]);
  const [form, setForm] = useState({
    anggota_id: isPengurus ? '' : user?.anggota_id,
    jenis_simpanan_id: '', jenis_transaksi: 'setoran',
    nominal: '', tanggal: new Date().toISOString().split('T')[0], keterangan: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/simpanan/jenis').then(res => setJenisList(res.data));
    if (isPengurus) {
      axios.get('/api/anggota').then(res => setAnggotaList(res.data));
    }
  }, []);

  useEffect(() => {
    const id = selectedAnggota || user?.anggota_id;
    if (!id) return;
    axios.get(`/api/simpanan/saldo/${id}`).then(res => setSaldo(res.data));
    axios.get(`/api/simpanan/riwayat/${id}`).then(res => setRiwayat(res.data));
  }, [selectedAnggota]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/simpanan', form);
      toast.success('Transaksi simpanan berhasil dicatat.');
      setShowForm(false);
      const id = form.anggota_id || user?.anggota_id;
      axios.get(`/api/simpanan/saldo/${id}`).then(res => setSaldo(res.data));
      axios.get(`/api/simpanan/riwayat/${id}`).then(res => setRiwayat(res.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const totalSaldo = saldo.reduce((sum, s) => sum + parseFloat(s.saldo || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Simpanan</h2>
        {isPengurus && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Catat Transaksi
          </button>
        )}
      </div>

      {isPengurus && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0, maxWidth: 320 }}>
            <label>Pilih Anggota</label>
            <select value={selectedAnggota} onChange={e => setSelectedAnggota(e.target.value)}>
              <option value="">— Pilih Anggota —</option>
              {anggotaList.map(a => (
                <option key={a.id} value={a.id}>{a.nama_lengkap} ({a.nomor_anggota})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showForm && isPengurus && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>Catat Transaksi Simpanan</h3></div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Anggota *</label>
                <select value={form.anggota_id} onChange={e => setForm({ ...form, anggota_id: e.target.value })} required>
                  <option value="">— Pilih —</option>
                  {anggotaList.map(a => (
                    <option key={a.id} value={a.id}>{a.nama_lengkap} ({a.nomor_anggota})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Jenis Simpanan *</label>
                <select value={form.jenis_simpanan_id} onChange={e => setForm({ ...form, jenis_simpanan_id: e.target.value })} required>
                  <option value="">— Pilih —</option>
                  {jenisList.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Jenis Transaksi *</label>
                <select value={form.jenis_transaksi} onChange={e => setForm({ ...form, jenis_transaksi: e.target.value })}>
                  <option value="setoran">Setoran</option>
                  <option value="penarikan">Penarikan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nominal *</label>
                <input type="number" value={form.nominal} onChange={e => setForm({ ...form, nominal: e.target.value })} required min={1} />
              </div>
              <div className="form-group">
                <label>Tanggal *</label>
                <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Keterangan</label>
                <input value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Saldo */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
        {saldo.map(s => (
          <div key={s.id} className="stat-card blue">
            <div className="stat-info">
              <div className="stat-label">{s.nama}</div>
              <div className="stat-value-sm">{formatRupiah(s.saldo)}</div>
            </div>
          </div>
        ))}
        <div className="stat-card green">
          <div className="stat-info">
            <div className="stat-label">Total Simpanan</div>
            <div className="stat-value-sm">{formatRupiah(totalSaldo)}</div>
          </div>
        </div>
      </div>

      {/* Riwayat */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><h3>Riwayat Transaksi</h3></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis Simpanan</th>
                <th>Transaksi</th>
                <th>Nominal</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0
                ? <tr><td colSpan={5} className="empty-cell">Belum ada transaksi.</td></tr>
                : riwayat.map(r => (
                  <tr key={r.id}>
                    <td>{formatTanggal(r.tanggal)}</td>
                    <td>{r.jenis_nama}</td>
                    <td>
                      <span className={`badge ${r.jenis_transaksi === 'setoran' ? 'badge-success' : 'badge-danger'}`}>
                        {r.jenis_transaksi}
                      </span>
                    </td>
                    <td className={r.jenis_transaksi === 'setoran' ? 'text-green' : 'text-red'}>
                      {r.jenis_transaksi === 'setoran' ? '+' : '-'}{formatRupiah(r.nominal)}
                    </td>
                    <td>{r.keterangan || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

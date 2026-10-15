import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { formatRupiah, formatTanggal } from '../../utils/format';

export default function CatatPembayaran() {
  const navigate = useNavigate();
  const [anggotaList, setAnggotaList] = useState([]);
  const [pinjamanList, setPinjamanList] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [form, setForm] = useState({
    anggota_id: '',
    pinjaman_id: '',
    jadwal_angsuran_id: '',
    nominal_bayar: '',
    tanggal_bayar: new Date().toISOString().split('T')[0],
    keterangan: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/anggota').then(res => setAnggotaList(res.data));
  }, []);

  // Load pinjaman aktif saat anggota dipilih
  useEffect(() => {
    if (!form.anggota_id) {
      setPinjamanList([]);
      setForm(f => ({ ...f, pinjaman_id: '', jadwal_angsuran_id: '' }));
      return;
    }
    axios.get('/api/pinjaman')
      .then(res => {
        const filtered = res.data.filter(
          p => p.anggota_id == form.anggota_id && p.status === 'aktif'
        );
        setPinjamanList(filtered);
        setForm(f => ({ ...f, pinjaman_id: filtered.length === 1 ? filtered[0].id : '', jadwal_angsuran_id: '' }));
      });
  }, [form.anggota_id]);

  // Load jadwal angsuran saat pinjaman dipilih
  useEffect(() => {
    if (!form.pinjaman_id) {
      setJadwalList([]);
      return;
    }
    axios.get(`/api/pinjaman/${form.pinjaman_id}/jadwal`)
      .then(res => {
        const belumLunas = res.data.filter(j => j.status !== 'lunas');
        setJadwalList(belumLunas);
        // Auto pilih angsuran pertama yang belum lunas
        if (belumLunas.length > 0) {
          const first = belumLunas[0];
          setForm(f => ({
            ...f,
            jadwal_angsuran_id: first.id,
            nominal_bayar: parseFloat(first.total_angsuran) - parseFloat(first.sudah_dibayar || 0),
          }));
        }
      });
  }, [form.pinjaman_id]);

  // Update nominal saat jadwal dipilih
  const handleJadwalChange = (e) => {
    const jid = e.target.value;
    const jadwal = jadwalList.find(j => j.id == jid);
    setForm(f => ({
      ...f,
      jadwal_angsuran_id: jid,
      nominal_bayar: jadwal ? parseFloat(jadwal.total_angsuran) - parseFloat(jadwal.sudah_dibayar || 0) : '',
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.pinjaman_id) { toast.error('Pilih pinjaman terlebih dahulu.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/pembayaran', form);
      toast.success('Pembayaran berhasil dicatat.');
      navigate('/pembayaran');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const pinjamanDipilih = pinjamanList.find(p => p.id == form.pinjaman_id);

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h2 className="page-title">Catat Pembayaran</h2>
      </div>

      <div className="form-card-layout">
        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-section">
            <div className="form-group">
              <label>Anggota *</label>
              <select
                value={form.anggota_id}
                onChange={e => setForm({ ...form, anggota_id: e.target.value })}
                required
              >
                <option value="">— Pilih Anggota —</option>
                {anggotaList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nama_lengkap} ({a.nomor_anggota})
                  </option>
                ))}
              </select>
            </div>

            {form.anggota_id && (
              <div className="form-group">
                <label>Pinjaman Aktif *</label>
                {pinjamanList.length === 0 ? (
                  <p className="text-muted form-hint">Tidak ada pinjaman aktif untuk anggota ini.</p>
                ) : (
                  <select
                    value={form.pinjaman_id}
                    onChange={e => setForm({ ...form, pinjaman_id: e.target.value })}
                    required
                  >
                    <option value="">— Pilih Pinjaman —</option>
                    {pinjamanList.map(p => (
                      <option key={p.id} value={p.id}>
                        {formatRupiah(p.nominal)} — {p.tenor} bulan (cair: {formatTanggal(p.tanggal_cair)})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {pinjamanDipilih && (
              <div className="info-box" style={{ marginBottom: 12 }}>
                <div>Nominal Pinjaman: <strong>{formatRupiah(pinjamanDipilih.nominal)}</strong></div>
                <div>Tenor: <strong>{pinjamanDipilih.tenor} bulan</strong></div>
                <div>Bunga: <strong>{pinjamanDipilih.bunga_per_bulan}%/bln (flat)</strong></div>
              </div>
            )}

            {jadwalList.length > 0 && (
              <div className="form-group">
                <label>Angsuran yang Dibayar *</label>
                <select value={form.jadwal_angsuran_id} onChange={handleJadwalChange} required>
                  <option value="">— Pilih Angsuran —</option>
                  {jadwalList.map(j => (
                    <option key={j.id} value={j.id}>
                      Ke-{j.angsuran_ke} | Jatuh Tempo: {formatTanggal(j.tanggal_jatuh_tempo)} | Sisa: {formatRupiah(parseFloat(j.total_angsuran) - parseFloat(j.sudah_dibayar || 0))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Nominal Bayar *</label>
              <input
                type="number"
                value={form.nominal_bayar}
                onChange={e => setForm({ ...form, nominal_bayar: e.target.value })}
                required min={1}
              />
              {form.nominal_bayar && (
                <small className="form-hint">{formatRupiah(form.nominal_bayar)}</small>
              )}
            </div>

            <div className="form-group">
              <label>Tanggal Bayar *</label>
              <input
                type="date"
                value={form.tanggal_bayar}
                onChange={e => setForm({ ...form, tanggal_bayar: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Keterangan</label>
              <input
                type="text"
                placeholder="Opsional"
                value={form.keterangan}
                onChange={e => setForm({ ...form, keterangan: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.pinjaman_id}>
              {loading ? 'Menyimpan...' : 'Catat Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

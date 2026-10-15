import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatTanggal } from '../utils/format';
import { User, Key } from 'lucide-react';

export default function Profil() {
  const { user } = useAuth();
  const [profil, setProfil] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [passForm, setPassForm] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.anggota_id) {
      axios.get(`/api/anggota/${user.anggota_id}`)
        .then(res => setProfil(res.data))
        .catch(() => toast.error('Gagal memuat profil.'));
    }
  }, [user]);

  const handleGantiPassword = async e => {
    e.preventDefault();
    if (passForm.baru !== passForm.konfirmasi) {
      toast.error('Password baru dan konfirmasi tidak cocok.');
      return;
    }
    if (passForm.baru.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/ganti-password', {
        password_lama: passForm.lama,
        password_baru: passForm.baru,
      });
      toast.success('Password berhasil diubah.');
      setPassForm({ lama: '', baru: '', konfirmasi: '' });
      setShowPass(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  if (!profil && user?.anggota_id) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  const dataProfil = profil ? [
    ['Nomor Anggota', profil.nomor_anggota],
    ['Nama Lengkap', profil.nama_lengkap],
    ['NIK', profil.nik || '—'],
    ['Tempat, Tgl Lahir', `${profil.tempat_lahir || '—'}, ${formatTanggal(profil.tanggal_lahir)}`],
    ['Jenis Kelamin', profil.jenis_kelamin === 'L' ? 'Laki-laki' : profil.jenis_kelamin === 'P' ? 'Perempuan' : '—'],
    ['No. Telepon', profil.no_telepon || '—'],
    ['Email', profil.email || '—'],
    ['Alamat', profil.alamat || '—'],
    ['Unit Kerja', profil.unit_kerja || '—'],
    ['Jabatan', profil.jabatan || '—'],
    ['Bergabung Sejak', formatTanggal(profil.tanggal_bergabung)],
    ['Status', <span className={`badge ${profil.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{profil.status}</span>],
  ] : [];

  return (
    <div className="page">
      <h2 className="page-title">Profil Saya</h2>

      <div className="card">
        <div className="card-header">
          <div className="profil-avatar">
            <User size={32} />
          </div>
          <div>
            <h3>{user?.nama || user?.username}</h3>
            <p className="text-muted">{user?.nomor_anggota} · {user?.role}</p>
          </div>
        </div>

        {profil && (
          <div className="detail-grid">
            {dataProfil.map(([label, val]) => (
              <div key={label} className="detail-row">
                <span className="detail-label">{label}</span>
                <span className="detail-value">{val}</span>
              </div>
            ))}
          </div>
        )}

        {user?.role === 'pengurus' && !profil && (
          <div className="card-body">
            <p className="text-muted">Akun pengurus tidak terhubung ke data anggota.</p>
          </div>
        )}
      </div>

      {/* Ganti Password */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setShowPass(!showPass)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={18} />
            <h3>Ganti Password</h3>
          </div>
          <span className="text-muted">{showPass ? '▲' : '▼'}</span>
        </div>

        {showPass && (
          <form onSubmit={handleGantiPassword} className="card-body">
            <div className="form-grid" style={{ maxWidth: 400 }}>
              <div className="form-group form-full">
                <label>Password Lama</label>
                <input
                  type="password"
                  value={passForm.lama}
                  onChange={e => setPassForm({ ...passForm, lama: e.target.value })}
                  required
                />
              </div>
              <div className="form-group form-full">
                <label>Password Baru</label>
                <input
                  type="password"
                  value={passForm.baru}
                  onChange={e => setPassForm({ ...passForm, baru: e.target.value })}
                  required minLength={6}
                />
              </div>
              <div className="form-group form-full">
                <label>Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={passForm.konfirmasi}
                  onChange={e => setPassForm({ ...passForm, konfirmasi: e.target.value })}
                  required minLength={6}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

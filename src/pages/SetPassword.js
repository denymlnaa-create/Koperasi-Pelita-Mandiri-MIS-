import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const isReset = searchParams.get('reset') === '1';

  const [status, setStatus] = useState('loading'); // loading | valid | invalid | done
  const [nama, setNama] = useState('');
  const [form, setForm] = useState({ password: '', konfirmasi: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }

    axios.get(`/api/auth/verifikasi-token/${token}`)
      .then(res => {
        setNama(res.data.nama);
        setStatus('valid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.konfirmasi) {
      toast.error('Password dan konfirmasi tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/set-password', { token, password: form.password });
      setStatus('done');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengatur password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={40} />
          </div>
          <h1>Koperasi Karyawan</h1>
          <p>{isReset ? 'Reset Password' : 'Aktivasi Akun'}</p>
        </div>

        {status === 'loading' && (
          <div className="loading"><div className="spinner" /></div>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#dc2626', marginBottom: 16 }}>
              Link tidak valid atau sudah kadaluarsa.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Kembali ke Login
            </button>
          </div>
        )}

        {status === 'valid' && (
          <form onSubmit={handleSubmit} className="login-form">
            <p style={{ color: '#6b7280', marginBottom: 8 }}>
              Halo <strong>{nama}</strong>! Buat password untuk {isReset ? 'mengakses' : 'mengaktifkan'} akun Anda.
            </p>

            <div className="form-group">
              <label>Password Baru</label>
              <div className="input-with-icon">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required minLength={6}
                />
                <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password"
                value={form.konfirmasi}
                onChange={e => setForm({ ...form, konfirmasi: e.target.value })}
                required minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Menyimpan...' : isReset ? 'Reset Password' : 'Aktifkan Akun'}
            </button>
          </form>
        )}

        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, marginBottom: 8 }}>
              {isReset ? 'Password berhasil direset!' : 'Akun berhasil diaktifkan!'}
            </p>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
              Silakan login menggunakan password baru Anda.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/login')}>
              Login Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

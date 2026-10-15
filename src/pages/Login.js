import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal. Periksa username dan password.');
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
          <p>Sistem Informasi Simpan Pinjam</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Masukkan username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <Link to="/lupa-password" style={{ textAlign: 'center', fontSize: 13, color: '#2563eb', display: 'block', marginTop: 4 }}>
            Lupa password?
          </Link>
        </form>

        <p className="login-footer">
          Hubungi pengurus jika mengalami masalah login.
        </p>
        <p className="login-footer" style={{ marginTop: 8 }}>
          Belum punya akun?{' '}
          <a href="/daftar" style={{ color: '#2563eb', fontWeight: 500 }}>Daftar di sini</a>
        </p>
      </div>
    </div>
  );
}

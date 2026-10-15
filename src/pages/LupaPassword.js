import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function LupaPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/lupa-password', { email });
      setTerkirim(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email.');
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
          <p>Lupa Password</p>
        </div>

        {!terkirim ? (
          <form onSubmit={handleSubmit} className="login-form">
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Masukkan email yang terdaftar. Kami akan kirimkan link untuk reset password.
            </p>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </button>

            <Link to="/login" className="btn btn-ghost btn-full" style={{ justifyContent: 'center', marginTop: 4 }}>
              <ArrowLeft size={16} /> Kembali ke Login
            </Link>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Email Terkirim!</p>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
              Jika email <strong>{email}</strong> terdaftar, link reset password akan masuk dalam beberapa menit.
              Cek folder spam jika tidak ada di inbox.
            </p>
            <Link to="/login" className="btn btn-primary btn-full" style={{ justifyContent: 'center' }}>
              Kembali ke Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

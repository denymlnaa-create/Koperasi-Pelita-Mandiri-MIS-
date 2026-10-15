import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Building2, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

const initialForm = {
  nama_lengkap: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
  jenis_kelamin: '', alamat: '', no_telepon: '', email: '',
  unit_kerja: '', jabatan: '', username: '', password: '', konfirmasi_password: '',
};

export default function Daftar() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [step, setStep] = useState(1); // 1: data pribadi, 2: akun

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.konfirmasi_password) {
      toast.error('Password dan konfirmasi tidak cocok.');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/daftar', form);
      setSukses(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (sukses) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#f0fdf4', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <CheckCircle size={40} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Pendaftaran Dikirim!
          </h2>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Kami telah mengirim link verifikasi ke<br />
            <strong style={{ color: '#374151' }}>{form.email}</strong>
          </p>
          <div style={{
            background: '#fffbeb', border: '1px solid #fde68a',
            borderRadius: 8, padding: '14px 16px', marginBottom: 24,
            fontSize: 13, color: '#92400e', textAlign: 'left'
          }}>
            <strong>Langkah selanjutnya:</strong>
            <ol style={{ marginTop: 8, paddingLeft: 18, lineHeight: 2 }}>
              <li>Cek inbox email kamu</li>
              <li>Klik link verifikasi yang kami kirim</li>
              <li>Tunggu persetujuan dari pengurus</li>
              <li>Kamu akan mendapat email saat akun diaktifkan</li>
            </ol>
          </div>
          <Link to="/login" className="btn btn-primary btn-full">
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="daftar-page">
      <div className="daftar-card">
        <div className="login-header">
          <div className="login-logo">
            <Building2 size={36} />
          </div>
          <h1>Daftar Anggota</h1>
          <p>Koperasi Simpan Pinjam Karyawan</p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-num">1</div>
            <span>Data Diri</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-num">2</div>
            <span>Akun Login</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-section" style={{ border: 'none', padding: '0 0 16px' }}>
              <div className="form-grid daftar-grid">
                <div className="form-group form-full">
                  <label>Nama Lengkap *</label>
                  <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} required placeholder="Sesuai KTP" />
                </div>
                <div className="form-group">
                  <label>NIK</label>
                  <input name="nik" value={form.nik} onChange={handleChange} maxLength={16} placeholder="16 digit" />
                </div>
                <div className="form-group">
                  <label>No. Telepon</label>
                  <input name="no_telepon" value={form.no_telepon} onChange={handleChange} placeholder="08xx" />
                </div>
                <div className="form-group form-full">
                  <label>Email *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@kamu.com" />
                </div>
                <div className="form-group">
                  <label>Tempat Lahir</label>
                  <input name="tempat_lahir" value={form.tempat_lahir} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Tanggal Lahir</label>
                  <input type="date" name="tanggal_lahir" value={form.tanggal_lahir} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Jenis Kelamin</label>
                  <select name="jenis_kelamin" value={form.jenis_kelamin} onChange={handleChange}>
                    <option value="">— Pilih —</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit Kerja</label>
                  <input name="unit_kerja" value={form.unit_kerja} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Jabatan</label>
                  <input name="jabatan" value={form.jabatan} onChange={handleChange} />
                </div>
                <div className="form-group form-full">
                  <label>Alamat</label>
                  <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={2} />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full"
                style={{ marginTop: 8 }}
                onClick={() => {
                  if (!form.nama_lengkap || !form.email) {
                    toast.error('Nama lengkap dan email wajib diisi.');
                    return;
                  }
                  setStep(2);
                }}
              >
                Lanjut →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section" style={{ border: 'none', padding: '0 0 16px' }}>
              <div className="form-grid daftar-grid">
                <div className="form-group form-full">
                  <label>Username *</label>
                  <input name="username" value={form.username} onChange={handleChange} required placeholder="Huruf kecil tanpa spasi" />
                </div>
                <div className="form-group form-full">
                  <label>Password *</label>
                  <div className="input-with-icon">
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required minLength={6}
                      placeholder="Minimal 6 karakter"
                    />
                    <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group form-full">
                  <label>Konfirmasi Password *</label>
                  <input
                    type="password"
                    name="konfirmasi_password"
                    value={form.konfirmasi_password}
                    onChange={handleChange}
                    required minLength={6}
                    placeholder="Ulangi password"
                  />
                </div>
              </div>

              <div className="info-box" style={{ margin: '12px 0' }}>
                <ul>
                  <li>Setelah daftar, verifikasi email kamu terlebih dahulu.</li>
                  <li>Akun aktif setelah disetujui pengurus.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={15} /> Kembali
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 16 }}>
          Sudah punya akun?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 500 }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
}

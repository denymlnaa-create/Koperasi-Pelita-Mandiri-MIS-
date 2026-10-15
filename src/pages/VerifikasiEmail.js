import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifikasiEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading'); // loading | sukses | gagal
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('gagal');
      setPesan('Token verifikasi tidak ditemukan.');
      return;
    }

    axios.get(`/api/daftar/verifikasi/${token}`)
      .then(res => {
        setStatus('sukses');
        setPesan(res.data.message);
      })
      .catch(err => {
        setStatus('gagal');
        setPesan(err.response?.data?.message || 'Verifikasi gagal. Link tidak valid.');
      });
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <Loader size={48} color="#2563eb" className="spin-anim" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Memverifikasi email...</h2>
          </>
        )}

        {status === 'sukses' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#f0fdf4', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle size={40} color="#16a34a" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#16a34a', marginBottom: 12 }}>
              Email Terverifikasi!
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {pesan}
            </p>
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '14px 16px', marginBottom: 24,
              fontSize: 13, color: '#1d4ed8',
            }}>
              Pengurus akan meninjau pendaftaran kamu dan mengirimkan konfirmasi melalui email.
            </div>
            <Link to="/login" className="btn btn-primary btn-full">
              Ke Halaman Login
            </Link>
          </>
        )}

        {status === 'gagal' && (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <XCircle size={40} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
              Verifikasi Gagal
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {pesan}
            </p>
            <Link to="/daftar" className="btn btn-primary btn-full">
              Daftar Ulang
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

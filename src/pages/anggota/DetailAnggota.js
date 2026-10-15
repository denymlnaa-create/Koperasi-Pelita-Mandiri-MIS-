import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Key } from 'lucide-react';
import { formatTanggal } from '../../utils/format';

export default function DetailAnggota() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anggota, setAnggota] = useState(null);
  const [showResetPass, setShowResetPass] = useState(false);
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    axios.get(`/api/anggota/${id}`)
      .then(res => setAnggota(res.data))
      .catch(() => toast.error('Gagal memuat data.'));
  }, [id]);

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { toast.error('Password minimal 6 karakter.'); return; }
    try {
      await axios.patch(`/api/anggota/${id}/password`, { password: newPass });
      toast.success('Password berhasil direset.');
      setShowResetPass(false);
      setNewPass('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mereset password.');
    }
  };

  if (!anggota) return <div className="loading"><div className="spinner" /></div>;

  const rows = [
    ['Nomor Anggota', anggota.nomor_anggota],
    ['NIK', anggota.nik || '—'],
    ['Tempat, Tgl Lahir', `${anggota.tempat_lahir || '—'}, ${formatTanggal(anggota.tanggal_lahir)}`],
    ['Jenis Kelamin', anggota.jenis_kelamin === 'L' ? 'Laki-laki' : anggota.jenis_kelamin === 'P' ? 'Perempuan' : '—'],
    ['Alamat', anggota.alamat || '—'],
    ['No. Telepon', anggota.no_telepon || '—'],
    ['Email', anggota.email || '—'],
    ['Unit Kerja', anggota.unit_kerja || '—'],
    ['Jabatan', anggota.jabatan || '—'],
    ['Bergabung', formatTanggal(anggota.tanggal_bergabung)],
    ['Username', anggota.username],
    ['Status', <span className={`badge ${anggota.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>{anggota.status}</span>],
  ];

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="header-actions">
          <Link to={`/anggota/${id}/edit`} className="btn btn-secondary">
            <Edit size={15} /> Edit
          </Link>
          <button className="btn btn-secondary" onClick={() => setShowResetPass(!showResetPass)}>
            <Key size={15} /> Reset Password
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{anggota.nama_lengkap}</h3>
        </div>
        <div className="detail-grid">
          {rows.map(([label, val]) => (
            <div key={label} className="detail-row">
              <span className="detail-label">{label}</span>
              <span className="detail-value">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {showResetPass && (
        <div className="card">
          <div className="card-header"><h3>Reset Password</h3></div>
          <div className="card-body">
            <div className="form-group" style={{ maxWidth: 320 }}>
              <label>Password Baru (min. 6 karakter)</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} minLength={6} />
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowResetPass(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleResetPassword}>Simpan Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';

const initialForm = {
  nama_lengkap: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
  jenis_kelamin: '', alamat: '', no_telepon: '', email: '',
  unit_kerja: '', jabatan: '', tanggal_bergabung: '',
  username: '',
};

export default function FormAnggota() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [kirimEmail, setKirimEmail] = useState(false);

  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/anggota/${id}`).then(res => {
        const d = res.data;
        setForm({
          nama_lengkap: d.nama_lengkap || '', nik: d.nik || '',
          tempat_lahir: d.tempat_lahir || '',
          tanggal_lahir: d.tanggal_lahir ? d.tanggal_lahir.split('T')[0] : '',
          jenis_kelamin: d.jenis_kelamin || '', alamat: d.alamat || '',
          no_telepon: d.no_telepon || '', email: d.email || '',
          unit_kerja: d.unit_kerja || '', jabatan: d.jabatan || '',
          tanggal_bergabung: d.tanggal_bergabung ? d.tanggal_bergabung.split('T')[0] : '',
          username: d.username || '',
        });
      }).catch(() => toast.error('Gagal memuat data anggota.'));
    }
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isEdit && !form.username) {
      toast.error('Username wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/anggota/${id}`, form);
        toast.success('Data anggota berhasil diperbarui.');
      } else {
        // Password dikosongkan — akun aktif setelah anggota set password via email
        const res = await axios.post('/api/anggota', { ...form, password: 'TEMP_WILL_BE_SET' });
        if (res.data.email_terkirim) {
          toast.success('Anggota ditambahkan. Email pengaturan password telah dikirim!');
        } else {
          toast.success('Anggota ditambahkan. Tidak ada email — gunakan "Kirim Ulang Email" di detail anggota.');
        }
      }
      navigate('/anggota');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleKirimUlangEmail = async () => {
    setKirimEmail(true);
    try {
      await axios.patch(`/api/anggota/${id}/kirim-email`);
      toast.success('Email pengaturan password berhasil dikirim ulang.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim email.');
    } finally {
      setKirimEmail(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <h2 className="page-title" style={{ margin: 0 }}>
            {isEdit ? 'Edit Anggota' : 'Tambah Anggota Baru'}
          </h2>
          {isEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleKirimUlangEmail}
              disabled={kirimEmail}
            >
              <Mail size={15} />
              {kirimEmail ? 'Mengirim...' : 'Kirim Ulang Email Set Password'}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h3>Data Pribadi</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input name="nama_lengkap" value={form.nama_lengkap} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>NIK</label>
              <input name="nik" value={form.nik} onChange={handleChange} maxLength={16} />
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
              <label>No. Telepon</label>
              <input name="no_telepon" value={form.no_telepon} onChange={handleChange} />
            </div>
            <div className="form-group form-full">
              <label>Alamat</label>
              <textarea name="alamat" value={form.alamat} onChange={handleChange} rows={2} />
            </div>
            <div className="form-group">
              <label>Email (Gmail) {!isEdit && <span style={{ color: '#2563eb' }}>— untuk aktivasi akun</span>}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="contoh@gmail.com" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Data Karyawan</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Unit Kerja</label>
              <input name="unit_kerja" value={form.unit_kerja} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Jabatan</label>
              <input name="jabatan" value={form.jabatan} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Tanggal Bergabung</label>
              <input type="date" name="tanggal_bergabung" value={form.tanggal_bergabung} onChange={handleChange} />
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="form-section">
            <h3>Akun Login</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Username *</label>
                <input name="username" value={form.username} onChange={handleChange} required />
              </div>
            </div>
            <div className="info-box" style={{ margin: '12px 0 0' }}>
              Password tidak diisi di sini. Sistem akan kirim email ke anggota untuk mengatur password mereka sendiri.
              {!form.email && <div style={{ marginTop: 6, color: '#d97706' }}>⚠️ Isi email agar link aktivasi bisa dikirim otomatis.</div>}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
          </button>
        </div>
      </form>
    </div>
  );
}

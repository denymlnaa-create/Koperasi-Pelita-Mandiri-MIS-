import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, FileText, CreditCard, DollarSign, ChevronRight } from 'lucide-react';
import { formatRupiah, formatTanggal, statusPinjaman } from '../utils/format';

export default function DashboardPengurus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/laporan/dashboard-pengurus')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <h2 className="page-title">Dashboard Pengurus</h2>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Anggota Aktif</div>
            <div className="stat-value">{data?.total_anggota ?? '—'}</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Pengajuan Baru</div>
            <div className="stat-value">{data?.pengajuan_baru ?? '—'}</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"><CreditCard size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Pinjaman Aktif</div>
            <div className="stat-value">{data?.pinjaman_aktif ?? '—'}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Total Simpanan</div>
            <div className="stat-value-sm">{formatRupiah(data?.total_simpanan)}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Pengajuan Terbaru */}
        <div className="card">
          <div className="card-header">
            <h3>Pengajuan Menunggu</h3>
            <Link to="/pengajuan" className="card-link">Lihat semua <ChevronRight size={14} /></Link>
          </div>
          <div className="card-body">
            {data?.pengajuan_terbaru?.length === 0
              ? <p className="empty-text">Tidak ada pengajuan baru.</p>
              : data?.pengajuan_terbaru?.map(p => (
                <div key={p.id} className="list-item">
                  <div>
                    <div className="list-item-title">{p.nama_lengkap}</div>
                    <div className="list-item-sub">{p.nomor_anggota} · {formatTanggal(p.tanggal_pengajuan)}</div>
                  </div>
                  <div className="list-item-right">
                    <div className="list-item-amount">{formatRupiah(p.nominal)}</div>
                    <span className="badge badge-warning">Menunggu</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Pembayaran Terbaru */}
        <div className="card">
          <div className="card-header">
            <h3>Pembayaran Terbaru</h3>
            <Link to="/pembayaran" className="card-link">Lihat semua <ChevronRight size={14} /></Link>
          </div>
          <div className="card-body">
            {data?.pembayaran_terbaru?.length === 0
              ? <p className="empty-text">Belum ada pembayaran.</p>
              : data?.pembayaran_terbaru?.map(p => (
                <div key={p.id} className="list-item">
                  <div>
                    <div className="list-item-title">{p.nama_lengkap}</div>
                    <div className="list-item-sub">{formatTanggal(p.tanggal_bayar)}</div>
                  </div>
                  <div className="list-item-right">
                    <div className="list-item-amount">{formatRupiah(p.nominal_bayar)}</div>
                    <span className="badge badge-success">Tercatat</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Akses Cepat</h3>
        <div className="action-grid">
          <Link to="/anggota/tambah" className="action-card">
            <Users size={28} />
            <span>Tambah Anggota</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/pengajuan" className="action-card">
            <FileText size={28} />
            <span>Proses Pengajuan</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/pembayaran/catat" className="action-card">
            <CreditCard size={28} />
            <span>Catat Pembayaran</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/laporan" className="action-card">
            <DollarSign size={28} />
            <span>Lihat Laporan</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

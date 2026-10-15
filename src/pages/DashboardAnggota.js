import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PiggyBank, CreditCard, Calendar, TrendingDown, ChevronRight } from 'lucide-react';
import { formatRupiah, formatTanggal, statusPinjaman } from '../utils/format';

export default function DashboardAnggota() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/laporan/dashboard-anggota')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const statusInfo = data?.pinjaman_aktif ? statusPinjaman(data.pinjaman_aktif.status) : null;

  return (
    <div className="page">
      <h2 className="page-title">Dashboard Anggota</h2>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon"><PiggyBank size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Saldo Simpanan</div>
            <div className="stat-value">{formatRupiah(data?.saldo_simpanan)}</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon"><TrendingDown size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Sisa Pinjaman</div>
            <div className="stat-value">{formatRupiah(data?.sisa_pinjaman)}</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon"><CreditCard size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Status Pinjaman</div>
            <div className="stat-value-sm">
              {data?.pinjaman_aktif
                ? <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                : <span className="text-muted">Tidak ada</span>}
            </div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-info">
            <div className="stat-label">Angsuran Berikutnya</div>
            <div className="stat-value-sm">
              {data?.angsuran_berikutnya
                ? <>
                    <div>{formatRupiah(data.angsuran_berikutnya.total_angsuran)}</div>
                    <div className="stat-sub">{formatTanggal(data.angsuran_berikutnya.tanggal_jatuh_tempo)}</div>
                  </>
                : <span className="text-muted">—</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Akses Cepat</h3>
        <div className="action-grid">
          <Link to="/pinjaman/ajukan" className="action-card">
            <CreditCard size={28} />
            <span>Ajukan Pinjaman</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/simpanan" className="action-card">
            <PiggyBank size={28} />
            <span>Lihat Simpanan</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/angsuran" className="action-card">
            <Calendar size={28} />
            <span>Jadwal Angsuran</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
          <Link to="/pinjaman" className="action-card">
            <TrendingDown size={28} />
            <span>Riwayat Pinjaman</span>
            <ChevronRight size={16} className="action-arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}

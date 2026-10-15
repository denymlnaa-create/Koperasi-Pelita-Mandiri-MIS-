import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, PiggyBank, FileText,
  CreditCard, BarChart3, LogOut, Menu, X, Building2
} from 'lucide-react';

const menuAnggota = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/profil', icon: Users, label: 'Profil Saya' },
  { to: '/simpanan', icon: PiggyBank, label: 'Simpanan' },
  { to: '/pinjaman', icon: CreditCard, label: 'Pinjaman' },
  { to: '/angsuran', icon: FileText, label: 'Angsuran' },
];

const menuPengurus = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/anggota', icon: Users, label: 'Anggota' },
  { to: '/simpanan', icon: PiggyBank, label: 'Simpanan' },
  { to: '/pengajuan', icon: FileText, label: 'Pengajuan' },
  { to: '/pinjaman', icon: CreditCard, label: 'Pinjaman' },
  { to: '/pembayaran', icon: CreditCard, label: 'Pembayaran' },
  { to: '/laporan', icon: BarChart3, label: 'Laporan' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = user?.role === 'pengurus' ? menuPengurus : menuAnggota;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Building2 size={24} className="sidebar-logo" />
          <span className="sidebar-title">Koperasi</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.nama?.[0] || user?.username?.[0] || 'U'}</div>
          <div>
            <div className="sidebar-user-name">{user?.nama || user?.username}</div>
            <div className="sidebar-user-role">{user?.role === 'pengurus' ? 'Pengurus' : 'Anggota'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menu.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${location.pathname === item.to ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="topbar-title">
            {menu.find(m => m.to === location.pathname)?.label || 'Koperasi'}
          </div>
          <div className="topbar-user">
            <span>{user?.nama || user?.username}</span>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

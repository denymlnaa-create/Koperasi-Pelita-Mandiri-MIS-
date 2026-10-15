import { useAuth } from '../context/AuthContext';
import DashboardAnggota from './DashboardAnggota';
import DashboardPengurus from './DashboardPengurus';

export default function Dashboard() {
  const { user } = useAuth();
  return user?.role === 'pengurus' ? <DashboardPengurus /> : <DashboardAnggota />;
}

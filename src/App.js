import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import SetPassword from './pages/SetPassword';
import LupaPassword from './pages/LupaPassword';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';

import DaftarAnggota from './pages/anggota/DaftarAnggota';
import FormAnggota from './pages/anggota/FormAnggota';
import DetailAnggota from './pages/anggota/DetailAnggota';

import Simpanan from './pages/simpanan/Simpanan';

import DaftarPinjaman from './pages/pinjaman/DaftarPinjaman';
import AjukanPinjaman from './pages/pinjaman/AjukanPinjaman';
import DetailPinjaman from './pages/pinjaman/DetailPinjaman';
import Pengajuan from './pages/pinjaman/Pengajuan';
import Angsuran from './pages/pinjaman/Angsuran';

import Pembayaran from './pages/pembayaran/Pembayaran';
import CatatPembayaran from './pages/pembayaran/CatatPembayaran';

import Laporan from './pages/laporan/Laporan';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/lupa-password" element={<LupaPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected routes dengan Layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
      } />
      <Route path="/profil" element={
        <ProtectedRoute><Layout><Profil /></Layout></ProtectedRoute>
      } />

      {/* Anggota — pengurus only */}
      <Route path="/anggota" element={
        <ProtectedRoute role="pengurus"><Layout><DaftarAnggota /></Layout></ProtectedRoute>
      } />
      <Route path="/anggota/tambah" element={
        <ProtectedRoute role="pengurus"><Layout><FormAnggota /></Layout></ProtectedRoute>
      } />
      <Route path="/anggota/:id" element={
        <ProtectedRoute role="pengurus"><Layout><DetailAnggota /></Layout></ProtectedRoute>
      } />
      <Route path="/anggota/:id/edit" element={
        <ProtectedRoute role="pengurus"><Layout><FormAnggota /></Layout></ProtectedRoute>
      } />

      {/* Simpanan */}
      <Route path="/simpanan" element={
        <ProtectedRoute><Layout><Simpanan /></Layout></ProtectedRoute>
      } />

      {/* Pinjaman */}
      <Route path="/pinjaman" element={
        <ProtectedRoute><Layout><DaftarPinjaman /></Layout></ProtectedRoute>
      } />
      <Route path="/pinjaman/ajukan" element={
        <ProtectedRoute role="anggota"><Layout><AjukanPinjaman /></Layout></ProtectedRoute>
      } />
      <Route path="/pinjaman/:id" element={
        <ProtectedRoute><Layout><DetailPinjaman /></Layout></ProtectedRoute>
      } />
      <Route path="/pengajuan" element={
        <ProtectedRoute role="pengurus"><Layout><Pengajuan /></Layout></ProtectedRoute>
      } />
      <Route path="/angsuran" element={
        <ProtectedRoute><Layout><Angsuran /></Layout></ProtectedRoute>
      } />

      {/* Pembayaran */}
      <Route path="/pembayaran" element={
        <ProtectedRoute role="pengurus"><Layout><Pembayaran /></Layout></ProtectedRoute>
      } />
      <Route path="/pembayaran/catat" element={
        <ProtectedRoute role="pengurus"><Layout><CatatPembayaran /></Layout></ProtectedRoute>
      } />

      {/* Laporan */}
      <Route path="/laporan" element={
        <ProtectedRoute role="pengurus"><Layout><Laporan /></Layout></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

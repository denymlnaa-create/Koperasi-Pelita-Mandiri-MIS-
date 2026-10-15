export const formatRupiah = (angka) => {
  if (angka === null || angka === undefined) return 'Rp—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

export const formatTanggal = (tanggal) => {
  if (!tanggal) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date(tanggal));
};

export const formatTanggalPendek = (tanggal) => {
  if (!tanggal) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(tanggal));
};

export const statusPinjaman = (status) => {
  const map = {
    menunggu: { label: 'Menunggu', color: 'badge-warning' },
    aktif: { label: 'Aktif', color: 'badge-success' },
    ditolak: { label: 'Ditolak', color: 'badge-danger' },
    lunas: { label: 'Lunas', color: 'badge-info' },
  };
  return map[status] || { label: status, color: 'badge-default' };
};

export const statusAngsuran = (status) => {
  const map = {
    belum_bayar: { label: 'Belum Bayar', color: 'badge-warning' },
    sebagian: { label: 'Sebagian', color: 'badge-orange' },
    lunas: { label: 'Lunas', color: 'badge-success' },
  };
  return map[status] || { label: status, color: 'badge-default' };
};

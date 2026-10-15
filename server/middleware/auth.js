import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

export const requirePengurus = (req, res, next) => {
  if (req.user.role !== 'pengurus') {
    return res.status(403).json({ message: 'Akses ditolak. Hanya pengurus yang diizinkan.' });
  }
  next();
};

export const requireAnggota = (req, res, next) => {
  if (req.user.role !== 'anggota' && req.user.role !== 'pengurus') {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }
  next();
};

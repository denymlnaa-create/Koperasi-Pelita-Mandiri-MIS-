import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_NAME = 'Koperasi Karyawan';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Kirim email set password (akun baru dibuat admin)
export async function kirimEmailSetPassword(email, nama, token) {
  const link = `${APP_URL}/set-password?token=${token}`;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Akun Koperasi Anda Telah Dibuat`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 28px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🏦 ${APP_NAME}</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151;">Halo, <strong>${nama}</strong>!</p>
          <p style="color: #6b7280;">Akun Anda di sistem Koperasi Karyawan telah dibuat oleh pengurus. Klik tombol di bawah untuk mengatur password dan mengaktifkan akun Anda.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Atur Password Saya
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px;">Link ini berlaku selama <strong>24 jam</strong>. Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Jika tombol tidak berfungsi, copy link ini ke browser:<br/>
            <a href="${link}" style="color: #2563eb; font-size: 12px; word-break: break-all;">${link}</a>
          </p>
        </div>
      </div>
    `,
  });
}

// Kirim email reset password
export async function kirimEmailResetPassword(email, nama, token) {
  const link = `${APP_URL}/set-password?token=${token}&reset=1`;

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Reset Password Akun Koperasi`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #2563eb; padding: 28px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">🏦 ${APP_NAME}</h1>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151;">Halo, <strong>${nama}</strong>!</p>
          <p style="color: #6b7280;">Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk membuat password baru.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="background: #dc2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Reset Password Saya
            </a>
          </div>
          
          <p style="color: #9ca3af; font-size: 13px;">Link ini berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Jika tombol tidak berfungsi, copy link ini ke browser:<br/>
            <a href="${link}" style="color: #2563eb; font-size: 12px; word-break: break-all;">${link}</a>
          </p>
        </div>
      </div>
    `,
  });
}

export default transporter;

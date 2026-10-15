
# Diagram Sistem Informasi Koperasi Simpan Pinjam Karyawan

---

## 1. Arsitektur Sistem

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client (Browser)"]
        FE["Frontend\nReact + Vite\nlocalhost:5173"]
    end

    subgraph SERVER["⚙️ Server (Node.js)"]
        BE["Backend\nExpress.js\nlocalhost:5000"]
        AUTH["Middleware\nJWT Auth"]
        MAIL["Nodemailer\nGmail SMTP"]
    end

    subgraph CLOUD["☁️ Cloud"]
        DB[("Supabase\nPostgreSQL")]
        GMAIL["Gmail\nSMTP"]
    end

    FE -->|"HTTP REST API"| BE
    BE --> AUTH
    AUTH --> BE
    BE -->|"SQL Query"| DB
    BE --> MAIL
    MAIL -->|"SMTP port 587"| GMAIL
    GMAIL -->|"Email Link"| USER["📧 Email Anggota"]
```

---

## 2. Use Case Diagram

```mermaid
graph LR
    ANGGOTA(("👤\nAnggota"))
    PENGURUS(("👨‍💼\nPengurus"))

    subgraph SISTEM["Sistem Koperasi"]
        UC1["Login"]
        UC2["Lihat Dashboard"]
        UC3["Lihat Profil"]
        UC4["Ganti Password"]
        UC5["Ajukan Pinjaman"]
        UC6["Lihat Jadwal Angsuran"]
        UC7["Lihat Riwayat Simpanan"]
        UC8["Lihat Riwayat Pembayaran"]

        UC9["Kelola Anggota"]
        UC10["Tambah Anggota + Kirim Email"]
        UC11["Catat Simpanan"]
        UC12["Proses Pengajuan Pinjaman"]
        UC13["Setujui / Tolak Pinjaman"]
        UC14["Catat Pembayaran"]
        UC15["Lihat Laporan"]
        UC16["Reset Password Anggota"]
    end

    ANGGOTA --- UC1
    ANGGOTA --- UC2
    ANGGOTA --- UC3
    ANGGOTA --- UC4
    ANGGOTA --- UC5
    ANGGOTA --- UC6
    ANGGOTA --- UC7
    ANGGOTA --- UC8

    PENGURUS --- UC1
    PENGURUS --- UC2
    PENGURUS --- UC9
    PENGURUS --- UC10
    PENGURUS --- UC11
    PENGURUS --- UC12
    PENGURUS --- UC13
    PENGURUS --- UC14
    PENGURUS --- UC15
    PENGURUS --- UC16
```

---

## 3. Flowchart — Alur Login & Aktivasi Akun

```mermaid
flowchart TD
    A([Mulai]) --> B{Sudah punya akun?}
    B -->|Belum| C["Pengurus tambah\ndata anggota"]
    C --> D["Sistem generate\ntoken aktivasi"]
    D --> E["Kirim email ke\nGmail anggota"]
    E --> F["Anggota klik link\ndi email"]
    F --> G["Buka halaman\nSet Password"]
    G --> H["Anggota isi\npassword baru"]
    H --> I["Akun aktif\nis_active = true"]
    I --> J["Anggota bisa login"]

    B -->|Sudah| K["Buka halaman login"]
    J --> K
    K --> L["Masukkan username\n& password"]
    L --> M{Validasi}
    M -->|Gagal| N["Tampil pesan error"]
    N --> L
    M -->|Berhasil| O{Role?}
    O -->|Anggota| P["Dashboard Anggota"]
    O -->|Pengurus| Q["Dashboard Pengurus"]

    R["Lupa Password?"] --> S["Masukkan email"]
    S --> T["Sistem kirim\nlink reset"]
    T --> F
```

---

## 4. Flowchart — Alur Pengajuan & Persetujuan Pinjaman

```mermaid
flowchart TD
    A([Anggota Login]) --> B{Ada pinjaman\naktif?}
    B -->|Ya| C["❌ Sistem tolak\notomatis"]
    B -->|Tidak| D["Isi form pengajuan\nNominal, Tenor, Tujuan"]
    D --> E["Submit pengajuan"]
    E --> F["Status: MENUNGGU"]
    F --> G["Pengurus terima\nnotifikasi"]
    G --> H["Pengurus review\ndetail pengajuan"]
    H --> I{Keputusan}
    I -->|Tolak| J["Isi alasan penolakan"]
    J --> K["Status: DITOLAK"]
    K --> L["Anggota lihat\nstatus ditolak"]
    I -->|Setujui| M["Isi bunga & tanggal cair"]
    M --> N["Status: AKTIF"]
    N --> O["Sistem generate\njadwal angsuran"]
    O --> P["Anggota lihat\njadwal angsuran"]
    P --> Q["Anggota bayar\ndi luar sistem"]
    Q --> R["Pengurus catat\npembayaran"]
    R --> S{Semua angsuran\nlunas?}
    S -->|Belum| Q
    S -->|Ya| T["Status: LUNAS"]
    T --> U([Selesai])
```

---

## 5. Flowchart — Alur Pencatatan Simpanan

```mermaid
flowchart TD
    A([Pengurus Login]) --> B["Buka menu Simpanan"]
    B --> C["Pilih anggota"]
    C --> D["Pilih jenis simpanan\nPokok / Wajib / Sukarela"]
    D --> E{Jenis transaksi}
    E -->|Setoran| F["Isi nominal & tanggal"]
    E -->|Penarikan| G["Isi nominal & tanggal"]
    G --> H{Saldo cukup?}
    H -->|Tidak| I["❌ Sistem tolak"]
    H -->|Ya| F
    F --> J["Simpan transaksi"]
    J --> K["Saldo otomatis\ndiperbarui"]
    K --> L["Anggota bisa lihat\nriwayat & saldo"]
```

---

## 6. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS {
        serial id PK
        varchar username UK
        varchar password
        varchar role
        integer anggota_id FK
        varchar reset_token
        timestamp reset_token_exp
        boolean is_active
        timestamp created_at
    }

    ANGGOTA {
        serial id PK
        varchar nomor_anggota UK
        varchar nama_lengkap
        varchar nik
        varchar tempat_lahir
        date tanggal_lahir
        varchar jenis_kelamin
        text alamat
        varchar no_telepon
        varchar email
        varchar unit_kerja
        varchar jabatan
        date tanggal_bergabung
        varchar status
        timestamp created_at
    }

    JENIS_SIMPANAN {
        serial id PK
        varchar nama
        text keterangan
        numeric nominal_default
        timestamp created_at
    }

    TRANSAKSI_SIMPANAN {
        serial id PK
        integer anggota_id FK
        integer jenis_simpanan_id FK
        varchar jenis_transaksi
        numeric nominal
        date tanggal
        text keterangan
        integer dicatat_oleh FK
        timestamp created_at
    }

    PINJAMAN {
        serial id PK
        integer anggota_id FK
        numeric nominal
        integer tenor
        text tujuan
        numeric bunga_per_bulan
        varchar status
        date tanggal_pengajuan
        date tanggal_cair
        date tanggal_lunas
        date tanggal_disetujui
        date tanggal_ditolak
        text alasan_penolakan
        integer disetujui_oleh FK
        integer ditolak_oleh FK
        timestamp created_at
    }

    JADWAL_ANGSURAN {
        serial id PK
        integer pinjaman_id FK
        integer angsuran_ke
        date tanggal_jatuh_tempo
        numeric pokok
        numeric bunga
        numeric total_angsuran
        numeric sudah_dibayar
        date tanggal_bayar
        varchar status
        timestamp created_at
    }

    PEMBAYARAN {
        serial id PK
        integer pinjaman_id FK
        integer jadwal_angsuran_id FK
        numeric nominal_bayar
        date tanggal_bayar
        text keterangan
        integer dicatat_oleh FK
        timestamp created_at
    }

    USERS ||--o| ANGGOTA : "milik"
    ANGGOTA ||--o{ TRANSAKSI_SIMPANAN : "punya"
    ANGGOTA ||--o{ PINJAMAN : "mengajukan"
    JENIS_SIMPANAN ||--o{ TRANSAKSI_SIMPANAN : "jenis"
    PINJAMAN ||--o{ JADWAL_ANGSURAN : "punya"
    PINJAMAN ||--o{ PEMBAYARAN : "dibayar via"
    JADWAL_ANGSURAN ||--o{ PEMBAYARAN : "dilunasi via"
    USERS ||--o{ TRANSAKSI_SIMPANAN : "dicatat oleh"
    USERS ||--o{ PEMBAYARAN : "dicatat oleh"
    USERS ||--o{ PINJAMAN : "disetujui oleh"
```

---

## 7. Sequence Diagram — Proses Login

```mermaid
sequenceDiagram
    actor A as Anggota
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant DB as Database (Supabase)

    A->>FE: Isi username & password
    FE->>BE: POST /api/auth/login
    BE->>DB: SELECT user WHERE username=?
    DB-->>BE: Data user
    BE->>BE: Verifikasi password (bcrypt)
    alt Password salah
        BE-->>FE: 401 Username/password salah
        FE-->>A: Tampil pesan error
    else Password benar
        BE->>BE: Generate JWT token
        BE-->>FE: 200 {token, user}
        FE->>FE: Simpan token di localStorage
        FE-->>A: Redirect ke Dashboard
    end
```

---

## 8. Sequence Diagram — Aktivasi Akun via Email

```mermaid
sequenceDiagram
    actor P as Pengurus
    actor A as Anggota
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant GM as Gmail

    P->>FE: Isi form tambah anggota + email
    FE->>BE: POST /api/anggota
    BE->>DB: INSERT anggota + user (is_active=false)
    BE->>BE: Generate reset_token (48 bytes random)
    BE->>DB: UPDATE users SET reset_token, exp
    BE->>GM: Kirim email link aktivasi
    GM-->>A: Email masuk di inbox
    BE-->>FE: 201 Anggota ditambahkan
    FE-->>P: Notifikasi sukses

    A->>GM: Buka email, klik link
    A->>FE: GET /set-password?token=xxx
    FE->>BE: GET /api/auth/verifikasi-token/xxx
    BE->>DB: SELECT user WHERE reset_token=? AND exp>NOW()
    DB-->>BE: Data valid
    BE-->>FE: {valid: true, nama: ...}
    FE-->>A: Tampil form set password

    A->>FE: Isi password baru
    FE->>BE: POST /api/auth/set-password
    BE->>BE: Hash password (bcrypt)
    BE->>DB: UPDATE password, is_active=true, clear token
    BE-->>FE: 200 Akun aktif
    FE-->>A: Redirect ke login
```

---

## 9. Struktur Menu & Halaman

```mermaid
graph TD
    LOGIN["/login\nHalaman Login"]
    LUPA["/lupa-password\nLupa Password"]
    SET["/set-password\nAktivasi & Reset Password"]

    LOGIN --> LUPA
    LOGIN --> SET

    subgraph ANGGOTA["Portal Anggota"]
        DA["/dashboard\nDashboard"]
        PR["/profil\nProfil Saya"]
        SI["/simpanan\nSimpanan & Riwayat"]
        PI["/pinjaman\nDaftar Pinjaman"]
        AJ["/pinjaman/ajukan\nAjukan Pinjaman"]
        DP["/pinjaman/:id\nDetail Pinjaman"]
        AN["/angsuran\nJadwal Angsuran"]
    end

    subgraph PENGURUS["Portal Pengurus"]
        DP2["/dashboard\nDashboard"]
        ANG["/anggota\nDaftar Anggota"]
        TANG["/anggota/tambah\nTambah Anggota"]
        EANG["/anggota/:id/edit\nEdit Anggota"]
        SIM["/simpanan\nKelola Simpanan"]
        PEng["/pengajuan\nDaftar Pengajuan"]
        PIN["/pinjaman\nSemua Pinjaman"]
        PEM["/pembayaran\nRiwayat Pembayaran"]
        CAT["/pembayaran/catat\nCatat Pembayaran"]
        LAP["/laporan\nLaporan & Export"]
    end

    LOGIN --> ANGGOTA
    LOGIN --> PENGURUS
```

---

## 10. Ringkasan Tabel Database

| Tabel | Fungsi | Relasi Utama |
|---|---|---|
| `users` | Akun login semua pengguna | → anggota |
| `anggota` | Data profil anggota koperasi | ← users |
| `jenis_simpanan` | Master jenis: pokok, wajib, sukarela | → transaksi_simpanan |
| `transaksi_simpanan` | Riwayat setoran & penarikan | → anggota, jenis_simpanan |
| `pinjaman` | Data pengajuan & pinjaman aktif | → anggota |
| `jadwal_angsuran` | Jadwal cicilan per bulan | → pinjaman |
| `pembayaran` | Riwayat pembayaran yang dicatat pengurus | → pinjaman, jadwal_angsuran |

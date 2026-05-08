# WargaRT

WargaRT adalah aplikasi web administrasi RT untuk membantu sekretaris RT mengelola data warga, kegiatan, daftar hadir, dokumentasi foto, export laporan kegiatan, dan rekap kehadiran warga.

Stack MVP:

- Frontend: Next.js App Router
- Hosting frontend: Vercel
- Backend/API: Google Apps Script Web App
- Database: Google Spreadsheet
- File storage: Google Drive
- Export dokumen: Google Docs Template

## Struktur Project

```text
E:\WargaRT
├─ app
├─ components
├─ gas
├─ lib
├─ .env.example
├─ package.json
└─ README.md
```

## Fitur MVP yang Sudah Disiapkan

- Login role `superadmin` dan `viewer`
- Dashboard ringkas
- CRUD Data Warga
- CRUD Daftar Kegiatan
- Detail kegiatan
- Checklist daftar hadir per kegiatan
- Notulen atau laporan kegiatan
- Upload foto dokumentasi ke Google Drive
- Export laporan kegiatan ke Google Docs lalu PDF atau DOCX
- Rekap Kehadiran warga dengan filter dan export CSV

## Setup Frontend

1. Install dependency:

```bash
npm install
```

2. Buat file environment:

```powershell
Copy-Item .env.example .env.local
```

3. Isi `NEXT_PUBLIC_GAS_API_URL` dengan URL Web App Google Apps Script yang sudah di-deploy.

4. Jalankan lokal:

```bash
npm run dev
```

5. Deploy ke Vercel:

- Push project ke GitHub
- Import repository ke Vercel
- Tambahkan environment variable `NEXT_PUBLIC_GAS_API_URL`
- Deploy

## Setup Google Spreadsheet

Buat satu spreadsheet dengan sheet berikut:

1. `users`

Kolom:

- `user_id`
- `nama`
- `username`
- `password_hash`
- `role`
- `status`
- `created_at`

2. `warga`

Kolom:

- `warga_id`
- `old_supabase_id`
- `nama`
- `status_tinggal`
- `nomor_rumah`
- `jumlah_anggota_kk`
- `dawis`
- `status`
- `catatan`
- `created_at`
- `updated_at`

3. `kegiatan`

Kolom:

- `kegiatan_id`
- `old_supabase_id`
- `nama_kegiatan`
- `jenis_kegiatan`
- `tanggal`
- `hari`
- `tempat`
- `waktu_mulai`
- `waktu_selesai`
- `laporan`
- `status_kegiatan`
- `dibuat_oleh`
- `created_at`
- `updated_at`

4. `kehadiran`

Kolom:

- `hadir_id`
- `old_supabase_id`
- `kegiatan_id`
- `warga_id`
- `status_hadir`
- `catatan`
- `created_at`

5. `foto_kegiatan`

Kolom:

- `foto_id`
- `old_supabase_id`
- `kegiatan_id`
- `file_name`
- `file_id`
- `file_url`
- `caption`
- `uploaded_at`

6. `settings`

Kolom:

- `key`
- `value`

Contoh isi:

- `nama_rt_rw = RT 03 / RW 03`
- `kelurahan = Purwokerto Lor`
- `kecamatan = Purwokerto Timur`
- `kabupaten = Banyumas`
- `nama_ketua_rt = Nama Ketua RT`
- `nama_sekretaris = Nama Sekretaris`

7. `logs`

Kolom:

- `log_id`
- `user_id`
- `aksi`
- `target`
- `timestamp`

## Setup Google Apps Script

1. Buka [script.google.com](https://script.google.com).
2. Buat project Apps Script baru.
3. Salin semua file `.gs` di folder [E:/WargaRT/gas](</E:/WargaRT/gas>) ke project Apps Script Anda.
4. Salin isi [gas/appsscript.json](/E:/WargaRT/gas/appsscript.json) ke manifest project.
5. Di menu `Project Settings`, aktifkan tampilan manifest jika belum muncul.
6. Tambahkan Script Properties:

- `SPREADSHEET_ID`
- `DRIVE_FOLDER_ID`
- `DOC_TEMPLATE_ID`
- `EXPORT_FOLDER_ID`
- `SESSION_SECRET`

7. Deploy sebagai `Web App`:

- Execute as: `Me`
- Who has access: sesuaikan kebutuhan, biasanya `Anyone`

8. Salin URL deploy Web App ke `NEXT_PUBLIC_GAS_API_URL`.

### Opsi `clasp push`

Jika Anda ingin file lokal langsung dipush ke Apps Script dengan `clasp`, project ini sudah disiapkan untuk itu.

File terkait:

- [E:/WargaRT/.clasp.example.json](</E:/WargaRT/.clasp.example.json:1>)
- [E:/WargaRT/.claspignore](</E:/WargaRT/.claspignore:1>)

Format `.clasp.json` yang dipakai:

```json
{
  "scriptId": "GANTI_DENGAN_SCRIPT_ID_APPS_SCRIPT",
  "rootDir": "gas"
}
```

Artinya:

- `scriptId` adalah ID project Apps Script, bukan ID spreadsheet
- `rootDir: "gas"` berarti `clasp push` hanya mengirim file dalam folder `gas`

Langkah penggunaan:

1. Buat Apps Script project kosong di `script.google.com`
2. Ambil `Script ID` dari `Project Settings`
3. Salin [E:/WargaRT/.clasp.example.json](</E:/WargaRT/.clasp.example.json:1>) menjadi `.clasp.json`
4. Ganti `scriptId` dengan milik project Apps Script Anda
5. Login `clasp` jika belum:

```powershell
clasp login
```

6. Push file lokal:

```powershell
clasp push
```

7. Setelah file berhasil masuk ke Apps Script, jalankan fungsi:

```javascript
setupWargaRTProject()
```

8. Untuk validasi struktur spreadsheet sesudah setup:

```javascript
validateSpreadsheetStructure()
```

Catatan:

- `scriptId` berbeda dengan `SPREADSHEET_ID`
- `setupWargaRTProject()` akan membantu membuat sheet yang belum ada dan menambahkan header yang kurang, tetapi tidak dirancang untuk menghapus data warga lama

### Setup Otomatis dengan Fungsi Apps Script

Jika ingin setup awal lebih cepat, backend sudah menyediakan file [07_Setup.gs](/E:/WargaRT/gas/07_Setup.gs).

Yang perlu Anda lakukan:

1. Buka [01_Config.gs](/E:/WargaRT/gas/01_Config.gs).
2. Ubah nilai `SETUP_INPUT` sesuai kebutuhan.
3. Isi minimal:

```javascript
const SETUP_INPUT = {
  spreadsheetId: "ID_SPREADSHEET",
  documentationFolderId: "ID_FOLDER_DOKUMENTASI",
  exportFolderId: "ID_FOLDER_EXPORT",
  frontendAppUrl: "https://domain-frontend-anda.vercel.app",
  docTemplateId: "",
  sessionSecret: "isi-dengan-secret-aman",
  autoCreateTemplate: true,
  overwriteTemplateProperty: false
};
```

4. Jalankan fungsi `setupWargaRTProject()`.

Fungsi ini akan:

- Menyimpan Script Properties
- Membuat sheet yang belum ada
- Menambahkan header yang masih kurang
- Mengisi `settings` default jika belum ada
- Membuat template Google Docs otomatis jika `autoCreateTemplate = true`
- Membuat akun login awal jika `autoSeedUsers = true`
- Mengarahkan URL Web App GAS ke frontend publik jika `frontendAppUrl` diisi

Fungsi tambahan:

- `validateSpreadsheetStructure()` untuk cek apakah semua sheet dan header sudah sesuai
- `refreshDocsTemplate()` untuk membuat ulang template dokumen dan memperbarui `DOC_TEMPLATE_ID`
- `seedInitialUsers()` untuk membuat akun awal tanpa menjalankan setup penuh
- `resetInitialUsers()` untuk mengosongkan sheet `users` lalu membuat akun awal lagi

### Akses URL GAS

Untuk arsitektur project ini:

- Frontend aplikasi tetap berjalan di Next.js
- Google Apps Script tetap menjadi backend API

Jika `FRONTEND_APP_URL` atau `frontendAppUrl` diisi, maka membuka URL Web App GAS tanpa parameter `action` akan mengarahkan pengguna ke frontend publik. Contohnya:

- `https://script.google.com/macros/s/.../exec` akan redirect ke frontend
- `https://script.google.com/macros/s/.../exec?action=getWarga&token=...` tetap berfungsi sebagai API

### Akun Login Otomatis

Daftar akun awal diatur dari [E:/WargaRT/gas/01_Config.gs](</E:/WargaRT/gas/01_Config.gs:1>) pada bagian `initialUsers`.

Default saat ini:

- `sekretaris` / `admin123` dengan role `superadmin`
- `ketua` / `ketua123` dengan role `viewer`

Password akan di-hash otomatis sebelum disimpan ke sheet `users`.

Saran:

- Ganti password default di `initialUsers` sebelum `clasp push` ke project produksi
- Setelah login pertama berhasil, ubah password default agar lebih aman

## Setup Google Drive Folder

1. Buat folder Google Drive untuk dokumentasi dan hasil export.
2. Ambil folder ID dari URL.
3. Masukkan ke `DRIVE_FOLDER_ID`.
4. Jika ingin memisahkan hasil export, buat folder kedua lalu isi `EXPORT_FOLDER_ID`.

## Setup Google Docs Template

Buat satu Google Docs template dengan placeholder berikut:

```text
LAPORAN KEGIATAN WARGA
RT 03 / RW 03 KELURAHAN PURWOKERTO LOR

Nama Kegiatan : {{NAMA_KEGIATAN}}
Jenis Kegiatan : {{JENIS_KEGIATAN}}
Hari/Tanggal : {{HARI_TANGGAL}}
Waktu : {{WAKTU}}
Tempat : {{TEMPAT}}

DAFTAR HADIR
{{DAFTAR_HADIR}}

NOTULEN / LAPORAN KEGIATAN
{{LAPORAN}}

DOKUMENTASI
{{DOKUMENTASI}}

Purwokerto Lor, {{TANGGAL_CETAK}}

Mengetahui,                         Dibuat oleh,
Ketua RT 03                         Sekretaris RT 03

{{NAMA_KETUA_RT}}                   {{NAMA_SEKRETARIS}}
```

Lalu ambil document ID dari URL dan simpan ke `DOC_TEMPLATE_ID`.

## Password Awal

Password tidak disimpan plaintext. Backend contoh memakai hash SHA-256 sederhana melalui fungsi `hashPassword(password)`.

Contoh membuat hash di console Apps Script:

```javascript
Logger.log(hashPassword("admin123"));
```

Masukkan hasil hash ke kolom `password_hash` di sheet `users`.

## Alur Rekap Kehadiran

- Rekap dihitung dinamis dari sheet `warga`, `kegiatan`, dan `kehadiran`
- Hanya warga dengan status `Aktif` yang dihitung
- Hanya kegiatan dengan `status_kegiatan = Final` yang dihitung
- Jika warga tidak punya record hadir pada kegiatan Final, maka dihitung `Tidak Hadir`
- Rekap bisa difilter berdasarkan nama, Dawis, status tinggal, kategori, jenis kegiatan, dan rentang tanggal
- Export rekap untuk MVP menggunakan CSV dari frontend

## Import Data Warga dari File Lokal

Project ini menyediakan importer lokal untuk membaca file Excel sumber lalu mengirim batch ke Google Apps Script.

File sumber default saat ini:

- [E:/WargaRT/Database_fix.xlsx](</E:/WargaRT/Database_fix.xlsx>)

Script importer:

- [E:/WargaRT/scripts/import-warga.mjs](</E:/WargaRT/scripts/import-warga.mjs:1>)

Install dependency jika belum:

```powershell
npm.cmd install
```

Dry run untuk melihat jumlah data yang akan diimpor:

```powershell
npm.cmd run import:warga -- --dry-run
```

Impor sungguhan memakai akun superadmin default:

```powershell
npm.cmd run import:warga -- --username sekretaris --password admin123
```

Jika file sumber berbeda:

```powershell
npm.cmd run import:warga -- --file "NamaFile.xlsx" --username sekretaris --password admin123
```

Aturan mapping importer saat ini:

- Hanya baris dengan `Jenis subjek = Warga` yang diimpor
- Baris `Toko` dilewati agar tetap sesuai scope aplikasi warga
- `Kontrak/Sementara` dipetakan menjadi `Kontrak`
- `Usaha/Toko` tidak diimpor ke sheet `warga`
- `Jumlah anggota KK` kosong akan menjadi `0`
- Jika `warga_id` sudah ada di spreadsheet, data akan di-`update`
- Jika `warga_id` belum ada, data akan di-`create`

## Catatan Implementasi MVP

- Frontend menyimpan token sederhana di `localStorage`
- Untuk request GET ke Apps Script, token dikirim sebagai query parameter karena Apps Script Web App tidak praktis membaca header custom
- Upload foto untuk MVP menggunakan base64, jadi sebaiknya ukuran file dibatasi agar request tidak terlalu besar
- Request POST frontend dikirim sebagai `text/plain` berisi JSON string agar lebih aman saat dipanggil dari browser ke Google Apps Script Web App
- Export dokumen saat ini membuat copy template Google Docs lalu mengonversinya ke PDF atau DOCX
- Jika kebutuhan keamanan meningkat, sesi dan autentikasi perlu ditingkatkan lagi

## Struktur Backend Modular

Backend Apps Script sekarang dipecah agar mudah maintenance:

- [00_App.gs](/E:/WargaRT/gas/00_App.gs) untuk entrypoint `doGet`, `doPost`, dan router action
- [01_Config.gs](/E:/WargaRT/gas/01_Config.gs) untuk konstanta nama sheet dan script properties
- [02_Responses.gs](/E:/WargaRT/gas/02_Responses.gs) untuk response JSON dan parser body
- [03_Sheets.gs](/E:/WargaRT/gas/03_Sheets.gs) untuk helper Spreadsheet
- [04_Utils.gs](/E:/WargaRT/gas/04_Utils.gs) untuk helper umum
- [05_Auth.gs](/E:/WargaRT/gas/05_Auth.gs) untuk login, hash password, dan sesi
- [06_Logs.gs](/E:/WargaRT/gas/06_Logs.gs) untuk pencatatan log
- [10_WargaService.gs](/E:/WargaRT/gas/10_WargaService.gs) untuk service data warga
- [11_KegiatanService.gs](/E:/WargaRT/gas/11_KegiatanService.gs) untuk service kegiatan
- [12_AttendanceService.gs](/E:/WargaRT/gas/12_AttendanceService.gs) untuk daftar hadir
- [13_PhotoService.gs](/E:/WargaRT/gas/13_PhotoService.gs) untuk upload dan hapus foto
- [14_ExportService.gs](/E:/WargaRT/gas/14_ExportService.gs) untuk export Word/PDF
- [15_RekapService.gs](/E:/WargaRT/gas/15_RekapService.gs) untuk rekap kehadiran

## Endpoint Berbasis Action

Contoh GET:

```text
GET ?action=getWarga&token=...
GET ?action=getKegiatan&token=...
GET ?action=getRekapKehadiran&token=...
```

Contoh POST:

```json
{
  "action": "createWarga",
  "token": "session-token",
  "payload": {
    "nama": "Budi Santoso"
  }
}
```

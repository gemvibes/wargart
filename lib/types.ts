export type Role = "superadmin" | "viewer";
export type StatusTinggal = "Tetap" | "Kontrak";
export type StatusWarga = "Aktif" | "Pindah" | "Nonaktif";
export type JenisKegiatan =
  | "Pertemuan Rutin"
  | "Kerja Bakti"
  | "Musyawarah"
  | "Lainnya";
export type StatusKegiatan = "Draft" | "Final";
export type StatusHadir = "Hadir" | "Tidak Hadir";
export type KategoriKehadiran =
  | "Rutin Hadir"
  | "Cukup Aktif"
  | "Jarang Hadir"
  | "Tidak Pernah Hadir";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SessionPayload {
  token: string;
  user: User;
}

export interface User {
  user_id: string;
  nama: string;
  username: string;
  role: Role;
  status: string;
}

export interface Warga {
  warga_id: string;
  nama: string;
  status_tinggal: StatusTinggal;
  nomor_rumah: string;
  jumlah_anggota_kk: number;
  dawis: string;
  status: StatusWarga;
  catatan: string;
  created_at: string;
  updated_at: string;
}

export interface WargaPayload {
  nama: string;
  status_tinggal: StatusTinggal;
  nomor_rumah: string;
  jumlah_anggota_kk: number;
  dawis: string;
  status: StatusWarga;
  catatan: string;
}

export interface Kegiatan {
  kegiatan_id: string;
  nama_kegiatan: string;
  jenis_kegiatan: JenisKegiatan;
  tanggal: string;
  hari: string;
  tempat: string;
  waktu_mulai: string;
  waktu_selesai: string;
  laporan: string;
  status_kegiatan: StatusKegiatan;
  dibuat_oleh: string;
  created_at: string;
  updated_at: string;
}

export interface KegiatanPayload {
  nama_kegiatan: string;
  jenis_kegiatan: JenisKegiatan;
  tanggal: string;
  hari: string;
  tempat: string;
  waktu_mulai: string;
  waktu_selesai: string;
  laporan: string;
  status_kegiatan: StatusKegiatan;
}

export interface KegiatanPhotoDraft {
  file_name: string;
  mime_type: string;
  base64_data: string;
  caption: string;
}

export interface FotoKegiatan {
  foto_id: string;
  kegiatan_id: string;
  file_name: string;
  file_id: string;
  file_url: string;
  caption: string;
  uploaded_at: string;
}

export interface AttendanceItem {
  warga_id: string;
  nama: string;
  nomor_rumah: string;
  dawis: string;
  status_hadir: StatusHadir;
  catatan: string;
}

export interface AttendanceSavePayload {
  kegiatan_id: string;
  attendance: AttendanceItem[];
}

export interface KegiatanDetailResponse {
  kegiatan: Kegiatan;
  photos: FotoKegiatan[];
}

export interface ExportFilePayload {
  fileName?: string;
  mimeType?: string;
  base64Data?: string;
  fileUrl?: string;
}

export interface RekapKehadiranItem {
  warga_id: string;
  nama: string;
  nomor_rumah: string;
  dawis: string;
  status_tinggal: StatusTinggal;
  total_kegiatan: number;
  total_hadir: number;
  total_tidak_hadir: number;
  persentase_kehadiran: number;
  kategori_kehadiran: KategoriKehadiran;
}

export interface RekapFilters {
  search: string;
  dawis: string;
  status_tinggal: string;
  kategori: string;
  jenis_kegiatan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

"use client";

import {
  DAWIS_OPTIONS,
  JENIS_KEGIATAN_OPTIONS,
  KATEGORI_KEHADIRAN_OPTIONS,
  STATUS_TINGGAL_OPTIONS
} from "@/lib/constants";
import { RekapFilters } from "@/lib/types";

export function AttendanceSummaryFilters({
  filters,
  onChange,
  onReset
}: {
  filters: RekapFilters;
  onChange: (patch: Partial<RekapFilters>) => void;
  onReset: () => void;
}) {
  return (
    <div className="card">
      <div className="modal-header">
        <div>
          <h3>Filter Rekap Kehadiran</h3>
          <p className="muted">Gunakan filter untuk melihat tingkat kehadiran warga per jenis kegiatan atau periode tertentu.</p>
        </div>
        <button className="button ghost" onClick={onReset} type="button">
          Reset Filter
        </button>
      </div>

      <div className="filter-grid">
        <div className="field">
          <label>Cari Nama</label>
          <input
            className="input"
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Cari nama warga"
            value={filters.search}
          />
        </div>

        <div className="field">
          <label>Dawis</label>
          <select className="select" onChange={(event) => onChange({ dawis: event.target.value })} value={filters.dawis}>
            <option value="">Semua Dawis</option>
            {DAWIS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                Dawis {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Status Tinggal</label>
          <select
            className="select"
            onChange={(event) => onChange({ status_tinggal: event.target.value })}
            value={filters.status_tinggal}
          >
            <option value="">Semua</option>
            {STATUS_TINGGAL_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Kategori</label>
          <select
            className="select"
            onChange={(event) => onChange({ kategori: event.target.value })}
            value={filters.kategori}
          >
            {KATEGORI_KEHADIRAN_OPTIONS.map((item) => (
              <option key={item} value={item === "Semua" ? "" : item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Jenis Kegiatan</label>
          <select
            className="select"
            onChange={(event) => onChange({ jenis_kegiatan: event.target.value })}
            value={filters.jenis_kegiatan}
          >
            <option value="">Semua</option>
            {JENIS_KEGIATAN_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Dari Tanggal</label>
          <input
            className="input"
            onChange={(event) => onChange({ tanggal_mulai: event.target.value })}
            type="date"
            value={filters.tanggal_mulai}
          />
        </div>

        <div className="field">
          <label>Sampai Tanggal</label>
          <input
            className="input"
            onChange={(event) => onChange({ tanggal_selesai: event.target.value })}
            type="date"
            value={filters.tanggal_selesai}
          />
        </div>

        <div className="field">
          <label>Urutkan Berdasarkan</label>
          <select
            className="select"
            onChange={(event) => onChange({ sort_by: event.target.value })}
            value={filters.sort_by}
          >
            <option value="persentase_kehadiran">Persentase Kehadiran</option>
            <option value="nama">Nama A-Z</option>
            <option value="dawis">Dawis</option>
            <option value="nomor_rumah">Nomor Rumah</option>
          </select>
        </div>

        <div className="field">
          <label>Arah Urutan</label>
          <select
            className="select"
            onChange={(event) => onChange({ sort_order: event.target.value as "asc" | "desc" })}
            value={filters.sort_order}
          >
            <option value="desc">Tertinggi ke Terendah</option>
            <option value="asc">Terendah ke Tertinggi</option>
          </select>
        </div>
      </div>
    </div>
  );
}


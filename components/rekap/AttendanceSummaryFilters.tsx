"use client";

import {
  JENIS_KEGIATAN_OPTIONS,
  KATEGORI_KEHADIRAN_OPTIONS
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
    <div className="card rekap-filters-card">
      <div className="modal-header">
        <div>
          <h3>Filter Rekap Kehadiran</h3>
          <p className="muted">
            Gunakan filter untuk melihat tingkat kehadiran warga per jenis kegiatan atau periode tertentu.
          </p>
        </div>
        <button className="button ghost" onClick={onReset} type="button">
          Reset Filter
        </button>
      </div>

      <div className="rekap-filter-sections">
        <div className="filter-section-card">
          <div className="filter-section-head">
            <strong>Filter Aktif</strong>
            <p className="helper-text">Pilih kombinasi filter yang dibutuhkan tanpa membuat tampilan terlalu padat.</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AttendanceSummaryFilters } from "@/components/rekap/AttendanceSummaryFilters";
import { AttendanceSummaryTable } from "@/components/rekap/AttendanceSummaryTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildRekapCsv } from "@/lib/csv";
import { apiClient } from "@/lib/api/client";
import { RekapFilters, RekapKehadiranItem } from "@/lib/types";
import { downloadTextFile, formatPercent } from "@/lib/utils";

const initialFilters: RekapFilters = {
  search: "",
  dawis: "",
  status_tinggal: "",
  kategori: "",
  jenis_kegiatan: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  sort_by: "persentase_kehadiran",
  sort_order: "desc"
};

export default function RekapKehadiranPage() {
  const [filters, setFilters] = useState<RekapFilters>(initialFilters);
  const [rows, setRows] = useState<RekapKehadiranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRekap() {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.getRekapKehadiran(filters);
      setRows(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat rekap kehadiran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRekap();
  }, [filters]);

  const summary = useMemo(() => {
    const totalWargaAktif = rows.length;
    const rataRataKehadiran =
      rows.length === 0
        ? 0
        : rows.reduce((accumulator, item) => accumulator + item.persentase_kehadiran, 0) / rows.length;

    return {
      totalWargaAktif,
      rataRataKehadiran,
      rutinHadir: rows.filter((item) => item.kategori_kehadiran === "Rutin Hadir").length,
      tidakPernahHadir: rows.filter((item) => item.kategori_kehadiran === "Tidak Pernah Hadir").length
    };
  }, [rows]);

  function handleExportCsv() {
    const csv = buildRekapCsv(rows);
    downloadTextFile("rekap-kehadiran-wargart.csv", csv, "text/csv;charset=utf-8;");
  }

  return (
    <div className="section-stack">
      <PageHeader
        title="Rekap Kehadiran"
        description="Lihat tingkat kehadiran warga berdasarkan kegiatan dengan status Final."
        actions={
          <button className="button primary" onClick={handleExportCsv} type="button">
            Export Rekap
          </button>
        }
      />

      <section className="summary-grid">
        <div className="card">
          <p className="muted">Total Warga Aktif</p>
          <h3>{summary.totalWargaAktif}</h3>
        </div>
        <div className="card">
          <p className="muted">Rata-rata Kehadiran</p>
          <h3>{formatPercent(summary.rataRataKehadiran)}</h3>
        </div>
        <div className="card">
          <p className="muted">Warga Rutin Hadir</p>
          <h3>{summary.rutinHadir}</h3>
        </div>
        <div className="card">
          <p className="muted">Tidak Pernah Hadir</p>
          <h3>{summary.tidakPernahHadir}</h3>
        </div>
      </section>

      <AttendanceSummaryFilters
        filters={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={() => setFilters(initialFilters)}
      />

      {loading ? <LoadingState message="Menghitung rekap kehadiran..." /> : null}
      {error && !loading ? <ErrorMessage message={error} onRetry={loadRekap} /> : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          description="Belum ada data kehadiran final yang sesuai filter. Pastikan kegiatan sudah berstatus Final."
          title="Rekap belum tersedia"
        />
      ) : null}
      {!loading && !error && rows.length > 0 ? <AttendanceSummaryTable rows={rows} /> : null}
    </div>
  );
}

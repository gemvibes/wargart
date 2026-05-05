"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { apiClient } from "@/lib/api/client";
import { Kegiatan, Warga } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [warga, setWarga] = useState<Warga[]>([]);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const [wargaData, kegiatanData] = await Promise.all([
        apiClient.getWarga(),
        apiClient.getKegiatan()
      ]);
      setWarga(wargaData);
      setKegiatan(kegiatanData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kegiatanTerbaru = useMemo(
    () =>
      [...kegiatan]
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, 5),
    [kegiatan]
  );

  if (loading) {
    return <LoadingState message="Memuat ringkasan dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />;
  }

  return (
    <div>
      <PageHeader
        title={`Halo, ${user?.nama ?? "Pengguna"}`}
        description="Pantau data warga, kegiatan, dan progres administrasi RT dari satu tempat."
        actions={
          <RoleGuard allow="superadmin">
            <Link className="button primary" href="/warga">
              Tambah Warga
            </Link>
            <Link className="button secondary" href="/kegiatan">
              Tambah Kegiatan
            </Link>
          </RoleGuard>
        }
      />

      <section className="stat-grid">
        <StatCard
          hint="Hanya menghitung warga dengan status Aktif."
          label="Jumlah Warga Aktif"
          value={warga.filter((item) => item.status === "Aktif").length}
        />
        <StatCard
          hint="Total kegiatan yang sudah tercatat."
          label="Jumlah Kegiatan"
          value={kegiatan.length}
        />
        <StatCard
          hint="Kegiatan dengan status Final akan masuk rekap kehadiran."
          label="Kegiatan Final"
          value={kegiatan.filter((item) => item.status_kegiatan === "Final").length}
        />
      </section>

      <section className="detail-grid">
        <div className="card">
          <h3>Kegiatan Terbaru</h3>
          {kegiatanTerbaru.length === 0 ? (
            <EmptyState
              description="Belum ada kegiatan yang tersimpan. Tambahkan kegiatan baru untuk mulai mencatat aktivitas warga."
              title="Belum ada kegiatan"
            />
          ) : (
            <div className="quick-list">
              {kegiatanTerbaru.map((item) => (
                <Link className="quick-list-item" href={`/kegiatan/${item.kegiatan_id}`} key={item.kegiatan_id}>
                  <div className="inline-between">
                    <strong>{item.nama_kegiatan}</strong>
                    <span className={`badge ${item.status_kegiatan === "Final" ? "green" : "yellow"}`}>
                      {item.status_kegiatan}
                    </span>
                  </div>
                  <p className="helper-text">
                    {item.jenis_kegiatan} • {formatDate(item.tanggal)} • {item.tempat}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Akses Cepat</h3>
          <div className="quick-list">
            <Link className="quick-list-item" href="/warga">
              <strong>Data Warga</strong>
              <p className="helper-text">Lihat, cari, dan kelola data warga RT.</p>
            </Link>
            <Link className="quick-list-item" href="/kegiatan">
              <strong>Daftar Kegiatan</strong>
              <p className="helper-text">Kelola jadwal, daftar hadir, dan laporan kegiatan.</p>
            </Link>
            <Link className="quick-list-item" href="/rekap-kehadiran">
              <strong>Rekap Kehadiran</strong>
              <p className="helper-text">Lihat tingkat kehadiran warga berdasarkan kegiatan Final.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

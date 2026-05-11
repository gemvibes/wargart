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
import { DashboardSummary, Kegiatan, Warga } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function buildDashboardSummary(warga: Warga[], kegiatan: Kegiatan[]): DashboardSummary {
    const kegiatanTerbaru = [...kegiatan]
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
      .slice(0, 5);

    return {
      warga_aktif: warga.filter((item) => item.status === "Aktif").length,
      total_kegiatan: kegiatan.length,
      kegiatan_final: kegiatan.filter((item) => item.status_kegiatan === "Final").length,
      kegiatan_terbaru: kegiatanTerbaru
    };
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      try {
        const summaryData = await apiClient.getDashboardSummary();
        setSummary(summaryData);
      } catch (summaryError) {
        if (
          summaryError instanceof Error &&
          summaryError.message.includes("Action GET tidak dikenali: getDashboardSummary")
        ) {
          const [wargaData, kegiatanData] = await Promise.all([
            apiClient.getWarga(),
            apiClient.getKegiatan()
          ]);
          setSummary(buildDashboardSummary(wargaData, kegiatanData));
        } else {
          throw summaryError;
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const kegiatanTerbaru = useMemo(() => summary?.kegiatan_terbaru ?? [], [summary]);
  const featuredKegiatan = kegiatanTerbaru[0] ?? null;
  const recentKegiatan = featuredKegiatan ? kegiatanTerbaru.slice(1, 4) : [];

  if (loading) {
    return <LoadingState message="Memuat ringkasan dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />;
  }

  if (!summary) {
    return <ErrorMessage message="Ringkasan dashboard belum tersedia." onRetry={loadDashboard} />;
  }

  return (
    <div className="dashboard-stack dashboard-page">
      <PageHeader
        title={`Halo, ${user?.nama ?? "Pengguna"}`}
        description="Pantau ringkasan administrasi RT dari satu tampilan."
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

      <section className="stat-grid dashboard-stat-grid">
        <StatCard label="Jumlah Warga Aktif" value={summary.warga_aktif} />
        <StatCard label="Jumlah Kegiatan" value={summary.total_kegiatan} />
        <StatCard label="Kegiatan Final" value={summary.kegiatan_final} />
      </section>

      <section className="dashboard-layout">
        <div className="card dashboard-feature-card">
          <div className="dashboard-section-header">
            <div>
              <span className="dashboard-section-eyebrow">Ringkasan Aktivitas</span>
              <h3>Kegiatan Terbaru</h3>
            </div>
            {featuredKegiatan ? (
              <Link className="dashboard-inline-link" href={`/kegiatan/${featuredKegiatan.kegiatan_id}`}>
                Buka detail
              </Link>
            ) : null}
          </div>

          {featuredKegiatan ? (
            <div className="dashboard-feature-body">
              <Link className="dashboard-highlight-card" href={`/kegiatan/${featuredKegiatan.kegiatan_id}`}>
                <div className="dashboard-highlight-top">
                  <span className="dashboard-kicker">{featuredKegiatan.jenis_kegiatan}</span>
                  <span className={`badge ${featuredKegiatan.status_kegiatan === "Final" ? "green" : "yellow"}`}>
                    {featuredKegiatan.status_kegiatan}
                  </span>
                </div>
                <strong>{featuredKegiatan.nama_kegiatan}</strong>
                <p>
                  {formatDate(featuredKegiatan.tanggal)} | {featuredKegiatan.tempat}
                </p>
              </Link>

              {recentKegiatan.length > 0 ? (
                <div className="dashboard-compact-list">
                  {recentKegiatan.map((item) => (
                    <Link className="dashboard-compact-item" href={`/kegiatan/${item.kegiatan_id}`} key={item.kegiatan_id}>
                      <div>
                        <strong>{item.nama_kegiatan}</strong>
                        <p>
                          {item.jenis_kegiatan} | {formatDate(item.tanggal)}
                        </p>
                      </div>
                      <span className={`badge ${item.status_kegiatan === "Final" ? "green" : "yellow"}`}>
                        {item.status_kegiatan}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              description="Belum ada kegiatan yang tersimpan. Tambahkan kegiatan baru untuk mulai mencatat aktivitas warga."
              title="Belum ada kegiatan"
            />
          )}
        </div>

      </section>
    </div>
  );
}

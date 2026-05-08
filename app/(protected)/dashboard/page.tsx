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
  const wargaAktif = useMemo(() => warga.filter((item) => item.status === "Aktif").length, [warga]);
  const kegiatanFinal = useMemo(
    () => kegiatan.filter((item) => item.status_kegiatan === "Final").length,
    [kegiatan]
  );
  const featuredKegiatan = kegiatanTerbaru[0] ?? null;
  const recentKegiatan = featuredKegiatan ? kegiatanTerbaru.slice(1, 4) : [];

  if (loading) {
    return <LoadingState message="Memuat ringkasan dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadDashboard} />;
  }

  return (
    <div className="dashboard-stack">
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
        <StatCard label="Jumlah Warga Aktif" value={wargaAktif} />
        <StatCard label="Jumlah Kegiatan" value={kegiatan.length} />
        <StatCard label="Kegiatan Final" value={kegiatanFinal} />
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

        <div className="dashboard-side-column">
          <div className="card dashboard-summary-card">
            <div className="dashboard-section-header">
              <div>
                <span className="dashboard-section-eyebrow">Status Hari Ini</span>
                <h3>Ringkasan Administrasi</h3>
              </div>
            </div>

            <div className="dashboard-mini-grid">
              <div className="dashboard-mini-item">
                <span>Kegiatan Final</span>
                <strong>{kegiatanFinal}</strong>
              </div>
              <div className="dashboard-mini-item">
                <span>Total Kegiatan</span>
                <strong>{kegiatan.length}</strong>
              </div>
              <div className="dashboard-mini-item">
                <span>Data Warga</span>
                <strong>{warga.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

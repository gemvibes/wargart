"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { KegiatanFormModal } from "@/components/kegiatan/KegiatanFormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { JENIS_KEGIATAN_OPTIONS } from "@/lib/constants";
import { apiClient } from "@/lib/api/client";
import { Kegiatan, KegiatanPayload, KegiatanPhotoDraft } from "@/lib/types";
import { formatDate, formatTimeRange } from "@/lib/utils";

export default function KegiatanPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [jenis, setJenis] = useState("");
  const [bulan, setBulan] = useState("");
  const [tahun, setTahun] = useState("");
  const [visibleCount, setVisibleCount] = useState<10 | 20>(10);
  const [selected, setSelected] = useState<Kegiatan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadKegiatan() {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.getKegiatan({
        search,
        jenis_kegiatan: jenis,
        bulan,
        tahun
      });
      setKegiatan(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat kegiatan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKegiatan();
  }, [search, jenis, bulan, tahun]);

  async function handleSave(payload: KegiatanPayload, photos: KegiatanPhotoDraft[]) {
    setSaving(true);
    try {
      if (selected) {
        await apiClient.updateKegiatan(selected.kegiatan_id, payload);
      } else {
        const created = await apiClient.createKegiatan(payload);
        try {
          await Promise.all(
            photos.map((photo) =>
              apiClient.uploadFoto({
                kegiatan_id: created.kegiatan_id,
                ...photo
              })
            )
          );
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? `Kegiatan berhasil dibuat, tetapi upload foto belum tuntas: ${uploadError.message}`
              : "Kegiatan berhasil dibuat, tetapi ada foto yang gagal diunggah."
          );
        }
      }
      setModalOpen(false);
      setSelected(null);
      await loadKegiatan();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan kegiatan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Hapus kegiatan ini?");
    if (!confirmed) return;
    try {
      await apiClient.deleteKegiatan(id);
      await loadKegiatan();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus kegiatan.");
    }
  }

  const listHeight = visibleCount === 10 ? 680 : 1160;
  const listStyle = { maxHeight: listHeight } as CSSProperties;

  return (
    <div className="section-stack">
      <PageHeader
        title="Daftar Kegiatan"
        description="Kelola kegiatan warga, status Draft/Final, dan akses detail untuk daftar hadir serta dokumentasi."
        actions={
          <RoleGuard allow="superadmin">
            <button
              className="button primary"
              onClick={() => {
                setSelected(null);
                setModalOpen(true);
              }}
              type="button"
            >
              Tambah Kegiatan
            </button>
          </RoleGuard>
        }
      />

      <section className="card">
        <div className="toolbar">
          <div className="field">
            <label>Cari Kegiatan</label>
            <input
              className="input"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama kegiatan"
              value={search}
            />
          </div>
          <div className="field">
            <label>Jenis Kegiatan</label>
            <select className="select" onChange={(event) => setJenis(event.target.value)} value={jenis}>
              <option value="">Semua</option>
              {JENIS_KEGIATAN_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Bulan</label>
            <input
              className="input"
              max="12"
              min="1"
              onChange={(event) => setBulan(event.target.value)}
              placeholder="Contoh 5"
              type="number"
              value={bulan}
            />
          </div>
          <div className="field">
            <label>Tahun</label>
            <input
              className="input"
              onChange={(event) => setTahun(event.target.value)}
              placeholder="Contoh 2026"
              type="number"
              value={tahun}
            />
          </div>
        </div>

        {loading ? <LoadingState message="Memuat daftar kegiatan..." /> : null}
        {error && !loading ? <ErrorMessage message={error} onRetry={loadKegiatan} /> : null}
        {!loading && !error && kegiatan.length === 0 ? (
          <EmptyState description="Belum ada kegiatan yang sesuai dengan filter." title="Data kegiatan kosong" />
        ) : null}

        {!loading && !error && kegiatan.length > 0 ? (
          <>
            <div className="list-toolbar">
              <p className="helper-text">
                Total {kegiatan.length} kegiatan. Gunakan gulir untuk melihat daftar lainnya.
              </p>
              <div className="list-size-control">
                <label htmlFor="kegiatan-visible-count">Tampilkan</label>
                <select
                  className="select"
                  id="kegiatan-visible-count"
                  onChange={(event) => setVisibleCount(Number(event.target.value) as 10 | 20)}
                  value={visibleCount}
                >
                  <option value="10">10 data</option>
                  <option value="20">20 data</option>
                </select>
              </div>
            </div>

            <div className="kegiatan-desktop-list scroll-surface table-wrap" style={listStyle}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Kegiatan</th>
                    <th>Jenis</th>
                    <th>Tanggal</th>
                    <th>Tempat</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kegiatan.map((item) => (
                    <tr key={item.kegiatan_id}>
                      <td>
                        <strong>{item.nama_kegiatan}</strong>
                        <div className="helper-text">
                          {item.hari} | {formatTimeRange(item.waktu_mulai, item.waktu_selesai)}
                        </div>
                      </td>
                      <td>{item.jenis_kegiatan}</td>
                      <td>{formatDate(item.tanggal)}</td>
                      <td>{item.tempat}</td>
                      <td>
                        <span className={`badge ${item.status_kegiatan === "Final" ? "green" : "yellow"}`}>
                          {item.status_kegiatan}
                        </span>
                      </td>
                      <td>
                        <div className="actions-row">
                          <Link className="button ghost" href={`/kegiatan/${item.kegiatan_id}`}>
                            Detail
                          </Link>
                          <RoleGuard allow="superadmin">
                            <button
                              className="button secondary"
                              onClick={() => {
                                setSelected(item);
                                setModalOpen(true);
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="button danger"
                              onClick={() => handleDelete(item.kegiatan_id)}
                              type="button"
                            >
                              Hapus
                            </button>
                          </RoleGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="kegiatan-mobile-list mobile-card-list scroll-surface" style={listStyle}>
              {kegiatan.map((item) => (
                <article className="mobile-data-card" key={item.kegiatan_id}>
                  <div className="mobile-data-header">
                    <div>
                      <strong>{item.nama_kegiatan}</strong>
                      <p className="helper-text">{item.jenis_kegiatan}</p>
                    </div>
                    <span className={`badge ${item.status_kegiatan === "Final" ? "green" : "yellow"}`}>
                      {item.status_kegiatan}
                    </span>
                  </div>

                  <div className="mobile-data-body">
                    <div className="mobile-data-row">
                      <span className="mobile-data-label">Tanggal</span>
                      <span>{formatDate(item.tanggal)}</span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-label">Waktu</span>
                      <span>{formatTimeRange(item.waktu_mulai, item.waktu_selesai)}</span>
                    </div>
                    <div className="mobile-data-row">
                      <span className="mobile-data-label">Tempat</span>
                      <span>{item.tempat}</span>
                    </div>
                  </div>

                  <div className="mobile-data-actions">
                    <Link className="button ghost" href={`/kegiatan/${item.kegiatan_id}`}>
                      Detail
                    </Link>
                    <RoleGuard allow="superadmin">
                      <button
                        className="button secondary"
                        onClick={() => {
                          setSelected(item);
                          setModalOpen(true);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button className="button danger" onClick={() => handleDelete(item.kegiatan_id)} type="button">
                        Hapus
                      </button>
                    </RoleGuard>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {modalOpen ? (
        <KegiatanFormModal
          initialValue={selected}
          onClose={() => {
            setModalOpen(false);
            setSelected(null);
          }}
          onSubmit={handleSave}
          saving={saving}
        />
      ) : null}
    </div>
  );
}

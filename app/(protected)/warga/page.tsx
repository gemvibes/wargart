"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { WargaFormModal } from "@/components/warga/WargaFormModal";
import { DAWIS_OPTIONS, STATUS_TINGGAL_OPTIONS } from "@/lib/constants";
import { apiClient } from "@/lib/api/client";
import { Warga, WargaPayload } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export default function WargaPage() {
  const [warga, setWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dawis, setDawis] = useState("");
  const [statusTinggal, setStatusTinggal] = useState("");
  const [selected, setSelected] = useState<Warga | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadWarga() {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.getWarga({
        search,
        dawis,
        status_tinggal: statusTinggal
      });
      setWarga(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat data warga.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWarga();
  }, [search, dawis, statusTinggal]);

  async function handleSave(payload: WargaPayload) {
    setSaving(true);
    try {
      if (selected) {
        await apiClient.updateWarga(selected.warga_id, payload);
      } else {
        await apiClient.createWarga(payload);
      }
      setModalOpen(false);
      setSelected(null);
      await loadWarga();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan data warga.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Hapus data warga ini?");
    if (!confirmed) return;

    try {
      await apiClient.deleteWarga(id);
      await loadWarga();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus data warga.");
    }
  }

  const activeCount = useMemo(() => warga.filter((item) => item.status === "Aktif").length, [warga]);

  return (
    <div className="section-stack">
      <PageHeader
        title="Data Warga"
        description="Kelola dan telusuri data warga RT berdasarkan nama, Dawis, dan status tinggal."
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
              Tambah Warga
            </button>
          </RoleGuard>
        }
      />

      <section className="summary-grid">
        <div className="card">
          <p className="muted">Total Warga Ditampilkan</p>
          <h3>{warga.length}</h3>
        </div>
        <div className="card">
          <p className="muted">Warga Aktif</p>
          <h3>{activeCount}</h3>
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <div className="field">
            <label>Cari Nama Warga</label>
            <input
              className="input"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama warga"
              value={search}
            />
          </div>

          <div className="field">
            <label>Filter Dawis</label>
            <select className="select" onChange={(event) => setDawis(event.target.value)} value={dawis}>
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
              onChange={(event) => setStatusTinggal(event.target.value)}
              value={statusTinggal}
            >
              <option value="">Semua</option>
              {STATUS_TINGGAL_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? <LoadingState message="Memuat data warga..." /> : null}
        {error && !loading ? <ErrorMessage message={error} onRetry={loadWarga} /> : null}
        {!loading && !error && warga.length === 0 ? (
          <EmptyState
            description="Belum ada data warga yang sesuai filter saat ini."
            title="Data warga kosong"
          />
        ) : null}

        {!loading && !error && warga.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Nomor Rumah</th>
                  <th>Dawis</th>
                  <th>Status Tinggal</th>
                  <th>Status</th>
                  <th>Jumlah KK</th>
                  <th>Diperbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {warga.map((item) => (
                  <tr key={item.warga_id}>
                    <td>
                      <strong>{item.nama}</strong>
                      {item.catatan ? <div className="helper-text">{item.catatan}</div> : null}
                    </td>
                    <td>{item.nomor_rumah}</td>
                    <td>Dawis {item.dawis}</td>
                    <td>{item.status_tinggal}</td>
                    <td>
                      <span className={`badge ${item.status === "Aktif" ? "green" : "yellow"}`}>{item.status}</span>
                    </td>
                    <td>{item.jumlah_anggota_kk}</td>
                    <td>{formatDateTime(item.updated_at || item.created_at)}</td>
                    <td>
                      <RoleGuard allow="superadmin" fallback={<span className="helper-text">Lihat saja</span>}>
                        <div className="actions-row">
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
                            onClick={() => handleDelete(item.warga_id)}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>
                      </RoleGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {modalOpen ? (
        <WargaFormModal
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


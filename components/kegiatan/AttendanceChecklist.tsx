"use client";

import { useEffect, useMemo, useState } from "react";
import { DAWIS_OPTIONS } from "@/lib/constants";
import { AttendanceItem } from "@/lib/types";

export function AttendanceChecklist({
  initialItems,
  canEdit,
  onSave,
  saving
}: {
  initialItems: AttendanceItem[];
  canEdit: boolean;
  onSave: (items: AttendanceItem[]) => Promise<void>;
  saving: boolean;
}) {
  const [items, setItems] = useState<AttendanceItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [dawisFilter, setDawisFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState<10 | 20>(10);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const normalizedName = String(item.nama || "").toLowerCase();
        const normalizedDawis = String(item.dawis || "").trim();
        const matchSearch = !search || normalizedName.includes(search.toLowerCase());
        const matchDawis = !dawisFilter || normalizedDawis === dawisFilter;
        return matchSearch && matchDawis;
      }),
    [dawisFilter, items, search]
  );
  const visibleItems = useMemo(
    () =>
      canEdit
        ? filteredItems
        : filteredItems.filter((item) => String(item.status_hadir) === "Hadir"),
    [canEdit, filteredItems]
  );
  const listHeight = visibleCount === 10 ? 640 : 1120;

  function updateItem(wargaId: string, patch: Partial<AttendanceItem>) {
    setItems((prev) =>
      prev.map((item) => (item.warga_id === wargaId ? { ...item, ...patch } : item))
    );
  }

  return (
    <div className="card attendance-section-card">
      <div className="modal-header">
        <div>
          <h3>Daftar Hadir</h3>
          <p className="muted">
            {canEdit
              ? "Tandai warga yang hadir dan tambahkan catatan bila diperlukan."
              : "Daftar ini hanya menampilkan warga yang tercatat hadir pada kegiatan ini."}
          </p>
        </div>
        {canEdit ? (
          <button className="button primary" disabled={saving} onClick={() => onSave(items)} type="button">
            {saving ? "Menyimpan..." : "Simpan Daftar Hadir"}
          </button>
        ) : null}
      </div>

      <div className="toolbar" style={{ marginBottom: 18 }}>
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
          <select
            className="select"
            onChange={(event) => setDawisFilter(event.target.value)}
            value={dawisFilter}
          >
            <option value="">Semua Dawis</option>
            {DAWIS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                Dawis {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="helper-text">Belum ada warga aktif yang bisa ditampilkan.</p>
      ) : filteredItems.length === 0 ? (
        <p className="helper-text">Tidak ada warga yang cocok dengan pencarian atau filter Dawis.</p>
      ) : !canEdit && visibleItems.length === 0 ? (
        <p className="helper-text">Belum ada warga yang ditandai hadir untuk kegiatan ini.</p>
      ) : (
        <>
          <div className="list-toolbar">
            <p className="helper-text">
              Total {visibleItems.length} {canEdit ? "warga ditampilkan." : "warga hadir ditampilkan."}
            </p>
            <div className="list-size-control">
              <label htmlFor="attendance-visible-count">Tampilkan</label>
              <select
                className="select"
                id="attendance-visible-count"
                onChange={(event) => setVisibleCount(Number(event.target.value) as 10 | 20)}
                value={visibleCount}
              >
                <option value="10">10 data</option>
                <option value="20">20 data</option>
              </select>
            </div>
          </div>

          <div className="attendance-list scroll-surface attendance-list-surface" style={{ maxHeight: listHeight }}>
            {canEdit
              ? visibleItems.map((item) => (
                  <div className="attendance-row" key={item.warga_id}>
                    <div>
                      <strong>{item.nama}</strong>
                      <div className="helper-text">Rumah {item.nomor_rumah || "-"} | Dawis {item.dawis || "-"}</div>
                    </div>

                    <label className="list-row" style={{ justifyContent: "flex-start" }}>
                      <input
                        checked={item.status_hadir === "Hadir"}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateItem(item.warga_id, {
                            status_hadir: event.target.checked ? "Hadir" : "Tidak Hadir"
                          })
                        }
                        type="checkbox"
                      />
                      Hadir
                    </label>

                    <span className={`badge ${item.status_hadir === "Hadir" ? "green" : "red"}`}>
                      {item.status_hadir}
                    </span>

                    <input
                      className="input"
                      disabled={!canEdit}
                      onChange={(event) => updateItem(item.warga_id, { catatan: event.target.value })}
                      placeholder="Catatan"
                      value={item.catatan}
                    />
                  </div>
                ))
              : visibleItems.map((item, index) => (
                  <div className="attendance-viewer-row" key={item.warga_id}>
                    <div className="attendance-viewer-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="attendance-viewer-body">
                      <strong>{item.nama}</strong>
                      <div className="helper-text">Rumah {item.nomor_rumah || "-"} | Dawis {item.dawis || "-"}</div>
                    </div>
                  </div>
                ))}
          </div>
        </>
      )}
    </div>
  );
}

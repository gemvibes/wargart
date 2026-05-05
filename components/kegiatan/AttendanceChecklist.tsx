"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function updateItem(index: number, patch: Partial<AttendanceItem>) {
    setItems((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="card">
      <div className="modal-header">
        <div>
          <h3>Daftar Hadir</h3>
          <p className="muted">Checklist kehadiran disimpan per `kegiatan_id` dan `warga_id`.</p>
        </div>
        {canEdit ? (
          <button className="button primary" disabled={saving} onClick={() => onSave(items)} type="button">
            {saving ? "Menyimpan..." : "Simpan Daftar Hadir"}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="helper-text">Belum ada warga aktif yang bisa ditampilkan.</p>
      ) : (
        <div className="attendance-list">
          {items.map((item, index) => (
            <div className="attendance-row" key={item.warga_id}>
              <div>
                <strong>{item.nama}</strong>
                <div className="helper-text">
                  Rumah {item.nomor_rumah} • Dawis {item.dawis}
                </div>
              </div>

              <label className="list-row" style={{ justifyContent: "flex-start" }}>
                <input
                  checked={item.status_hadir === "Hadir"}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateItem(index, { status_hadir: event.target.checked ? "Hadir" : "Tidak Hadir" })
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
                onChange={(event) => updateItem(index, { catatan: event.target.value })}
                placeholder="Catatan"
                value={item.catatan}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


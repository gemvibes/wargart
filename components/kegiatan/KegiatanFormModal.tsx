"use client";

import { FormEvent, useEffect, useState } from "react";
import { JENIS_KEGIATAN_OPTIONS, STATUS_KEGIATAN_OPTIONS } from "@/lib/constants";
import { Kegiatan, KegiatanPayload } from "@/lib/types";
import { buildHariFromDate } from "@/lib/utils";

const initialForm: KegiatanPayload = {
  nama_kegiatan: "",
  jenis_kegiatan: "Pertemuan Rutin",
  tanggal: "",
  hari: "",
  tempat: "",
  waktu_mulai: "",
  waktu_selesai: "",
  laporan: "",
  status_kegiatan: "Draft"
};

export function KegiatanFormModal({
  initialValue,
  onClose,
  onSubmit,
  saving
}: {
  initialValue?: Kegiatan | null;
  onClose: () => void;
  onSubmit: (payload: KegiatanPayload) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<KegiatanPayload>(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setForm({
        nama_kegiatan: initialValue.nama_kegiatan,
        jenis_kegiatan: initialValue.jenis_kegiatan,
        tanggal: initialValue.tanggal,
        hari: initialValue.hari,
        tempat: initialValue.tempat,
        waktu_mulai: initialValue.waktu_mulai,
        waktu_selesai: initialValue.waktu_selesai,
        laporan: initialValue.laporan,
        status_kegiatan: initialValue.status_kegiatan
      });
    } else {
      setForm(initialForm);
    }
  }, [initialValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.nama_kegiatan.trim() || !form.tanggal || !form.tempat.trim()) {
      setError("Nama kegiatan, tanggal, dan tempat wajib diisi.");
      return;
    }

    await onSubmit({
      ...form,
      hari: buildHariFromDate(form.tanggal)
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{initialValue ? "Edit Kegiatan" : "Tambah Kegiatan"}</h3>
            <p className="muted">Status kegiatan menentukan apakah data masuk rekap kehadiran.</p>
          </div>
          <button className="button ghost" onClick={onClose} type="button">
            Tutup
          </button>
        </div>

        <form className="section-stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Nama Kegiatan</label>
              <input
                className="input"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nama_kegiatan: event.target.value }))
                }
                value={form.nama_kegiatan}
              />
            </div>

            <div className="field">
              <label>Jenis Kegiatan</label>
              <select
                className="select"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    jenis_kegiatan: event.target.value as KegiatanPayload["jenis_kegiatan"]
                  }))
                }
                value={form.jenis_kegiatan}
              >
                {JENIS_KEGIATAN_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status Kegiatan</label>
              <select
                className="select"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status_kegiatan: event.target.value as KegiatanPayload["status_kegiatan"]
                  }))
                }
                value={form.status_kegiatan}
              >
                {STATUS_KEGIATAN_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Tanggal</label>
              <input
                className="input"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    tanggal: event.target.value,
                    hari: buildHariFromDate(event.target.value)
                  }))
                }
                type="date"
                value={form.tanggal}
              />
            </div>

            <div className="field">
              <label>Hari</label>
              <input className="input" readOnly value={form.hari} />
            </div>

            <div className="field">
              <label>Waktu Mulai</label>
              <input
                className="input"
                onChange={(event) => setForm((prev) => ({ ...prev, waktu_mulai: event.target.value }))}
                type="time"
                value={form.waktu_mulai}
              />
            </div>

            <div className="field">
              <label>Waktu Selesai</label>
              <input
                className="input"
                onChange={(event) => setForm((prev) => ({ ...prev, waktu_selesai: event.target.value }))}
                type="time"
                value={form.waktu_selesai}
              />
            </div>

            <div className="field full">
              <label>Tempat</label>
              <input
                className="input"
                onChange={(event) => setForm((prev) => ({ ...prev, tempat: event.target.value }))}
                value={form.tempat}
              />
            </div>

            <div className="field full">
              <label>Notulen / Laporan Kegiatan</label>
              <textarea
                className="textarea"
                onChange={(event) => setForm((prev) => ({ ...prev, laporan: event.target.value }))}
                placeholder="Isi notulen atau laporan kegiatan"
                value={form.laporan}
              />
            </div>
          </div>

          {error ? <div className="error-state">{error}</div> : null}

          <div className="inline-between">
            <span className="helper-text">Kegiatan baru otomatis menggunakan status Draft.</span>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


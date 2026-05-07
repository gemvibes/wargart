"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { JENIS_KEGIATAN_OPTIONS, STATUS_KEGIATAN_OPTIONS } from "@/lib/constants";
import { Kegiatan, KegiatanPayload, KegiatanPhotoDraft } from "@/lib/types";
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

const MAX_FOTO_KEGIATAN = 4;

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") {
        reject(new Error("Gagal membaca file foto."));
        return;
      }
      resolve(value.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file foto."));
    reader.readAsDataURL(file);
  });
}

export function KegiatanFormModal({
  initialValue,
  onClose,
  onSubmit,
  saving
}: {
  initialValue?: Kegiatan | null;
  onClose: () => void;
  onSubmit: (payload: KegiatanPayload, photos: KegiatanPhotoDraft[]) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<KegiatanPayload>(initialForm);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
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
      setSelectedPhotos([]);
    } else {
      setForm(initialForm);
      setSelectedPhotos([]);
    }
  }, [initialValue]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) return;

    const invalidFile = files.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      setError("Semua file dokumentasi harus berupa gambar.");
      return;
    }

    setSelectedPhotos((prev) => {
      const next = [...prev, ...files].slice(0, MAX_FOTO_KEGIATAN);
      if (prev.length + files.length > MAX_FOTO_KEGIATAN) {
        setError(`Maksimal ${MAX_FOTO_KEGIATAN} foto dapat diunggah.`);
      } else {
        setError("");
      }
      return next;
    });
  }

  function removePhoto(indexToRemove: number) {
    setSelectedPhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.nama_kegiatan.trim() || !form.tanggal || !form.tempat.trim()) {
      setError("Nama kegiatan, tanggal, dan tempat wajib diisi.");
      return;
    }

    if (!initialValue && selectedPhotos.length < 1) {
      setError("Minimal 1 foto kegiatan wajib diunggah saat menambah kegiatan.");
      return;
    }

    if (!initialValue && selectedPhotos.length > MAX_FOTO_KEGIATAN) {
      setError(`Maksimal ${MAX_FOTO_KEGIATAN} foto dapat diunggah.`);
      return;
    }

    const photos =
      initialValue || selectedPhotos.length === 0
        ? []
        : await Promise.all(
            selectedPhotos.map(async (file) => ({
              file_name: file.name,
              mime_type: file.type,
              base64_data: await toBase64(file),
              caption: ""
            }))
          );

    await onSubmit({
      ...form,
      hari: buildHariFromDate(form.tanggal)
    }, photos);
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

            {!initialValue ? (
              <div className="field full">
                <label>Foto Kegiatan</label>
                <input
                  accept="image/*"
                  className="input"
                  multiple
                  onChange={handlePhotoChange}
                  type="file"
                />
                <span className="helper-text">
                  Unggah minimal 1 dan maksimal {MAX_FOTO_KEGIATAN} foto saat membuat kegiatan.
                </span>
                {selectedPhotos.length > 0 ? (
                  <div className="quick-list" style={{ marginTop: 10 }}>
                    {selectedPhotos.map((file, index) => (
                      <div className="quick-list-item inline-between" key={`${file.name}-${index}`}>
                        <div>
                          <strong>{file.name}</strong>
                          <div className="helper-text">
                            Foto {index + 1} dari {MAX_FOTO_KEGIATAN}
                          </div>
                        </div>
                        <button
                          className="button ghost"
                          onClick={() => removePhoto(index)}
                          type="button"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <div className="error-state">{error}</div> : null}

          <div className="inline-between">
            <span className="helper-text">Pastikan jadwal, tempat, dan dokumentasi sudah sesuai.</span>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  DAWIS_OPTIONS,
  STATUS_TINGGAL_OPTIONS,
  STATUS_WARGA_OPTIONS
} from "@/lib/constants";
import { Warga, WargaPayload } from "@/lib/types";

const initialForm: WargaPayload = {
  nama: "",
  status_tinggal: "Tetap",
  nomor_rumah: "",
  jumlah_anggota_kk: 1,
  dawis: "1",
  status: "Aktif",
  catatan: ""
};

export function WargaFormModal({
  initialValue,
  onClose,
  onSubmit,
  saving
}: {
  initialValue?: Warga | null;
  onClose: () => void;
  onSubmit: (payload: WargaPayload) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<WargaPayload>(initialForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialValue) {
      setForm({
        nama: initialValue.nama,
        status_tinggal: initialValue.status_tinggal,
        nomor_rumah: initialValue.nomor_rumah,
        jumlah_anggota_kk: initialValue.jumlah_anggota_kk,
        dawis: initialValue.dawis,
        status: initialValue.status,
        catatan: initialValue.catatan
      });
    } else {
      setForm(initialForm);
    }
  }, [initialValue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.nama.trim()) {
      setError("Nama warga wajib diisi.");
      return;
    }

    if (!form.nomor_rumah.trim()) {
      setError("Nomor rumah wajib diisi.");
      return;
    }

    await onSubmit(form);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{initialValue ? "Edit Warga" : "Tambah Warga"}</h3>
            <p className="muted">Isi data warga sesuai kondisi terbaru.</p>
          </div>
          <button className="button ghost" onClick={onClose} type="button">
            Tutup
          </button>
        </div>

        <form className="section-stack" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field full">
              <label>Nama</label>
              <input
                className="input"
                onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))}
                value={form.nama}
              />
            </div>

            <div className="field">
              <label>Status Tinggal</label>
              <select
                className="select"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status_tinggal: event.target.value as WargaPayload["status_tinggal"] }))
                }
                value={form.status_tinggal}
              >
                {STATUS_TINGGAL_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Nomor Rumah</label>
              <input
                className="input"
                onChange={(event) => setForm((prev) => ({ ...prev, nomor_rumah: event.target.value }))}
                value={form.nomor_rumah}
              />
            </div>

            <div className="field">
              <label>Jumlah Anggota KK</label>
              <input
                className="input"
                min={1}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, jumlah_anggota_kk: Number(event.target.value) || 0 }))
                }
                type="number"
                value={form.jumlah_anggota_kk}
              />
            </div>

            <div className="field">
              <label>Dawis</label>
              <select
                className="select"
                onChange={(event) => setForm((prev) => ({ ...prev, dawis: event.target.value }))}
                value={form.dawis}
              >
                {DAWIS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    Dawis {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select
                className="select"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as WargaPayload["status"] }))
                }
                value={form.status}
              >
                {STATUS_WARGA_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>Catatan</label>
              <textarea
                className="textarea"
                onChange={(event) => setForm((prev) => ({ ...prev, catatan: event.target.value }))}
                placeholder="Catatan tambahan jika ada"
                value={form.catatan}
              />
            </div>
          </div>

          {error ? <div className="error-state">{error}</div> : null}

          <div className="inline-between">
            <span className="helper-text">Data ini akan disimpan ke sheet `warga`.</span>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


"use client";

import { ChangeEvent, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { FotoKegiatan } from "@/lib/types";

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") {
        reject(new Error("Gagal membaca file."));
        return;
      }
      resolve(value.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
}

function getPublicPhotoProxyUrl(fileId: string) {
  return `/api/public-photos/${encodeURIComponent(fileId)}`;
}

export function PhotoUploader({
  kegiatanId,
  photos,
  canEdit,
  onUpload,
  onDelete
}: {
  kegiatanId: string;
  photos: FotoKegiatan[];
  canEdit: boolean;
  onUpload: (payload: {
    kegiatan_id: string;
    file_name: string;
    mime_type: string;
    base64_data: string;
    caption: string;
  }) => Promise<void>;
  onDelete: (foto_id: string) => Promise<void>;
}) {
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang dapat diunggah.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const base64 = await toBase64(file);
      await onUpload({
        kegiatan_id: kegiatanId,
        file_name: file.name,
        mime_type: file.type,
        base64_data: base64,
        caption
      });
      setCaption("");
      event.target.value = "";
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload foto gagal.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card photo-uploader-card">
      <div className="modal-header">
        <div>
          <h3>Dokumentasi Foto</h3>
          <p className="muted">Simpan dokumentasi kegiatan agar laporan lebih lengkap dan mudah ditinjau.</p>
        </div>
      </div>

      <RoleGuard allow="superadmin">
        {canEdit ? (
          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="field full">
              <label>Caption Foto</label>
              <input
                className="input"
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Contoh: Dokumentasi sesi diskusi warga"
                value={caption}
              />
            </div>
            <div className="field full">
              <label>Upload Foto</label>
              <input className="input" disabled={uploading} onChange={handleChange} type="file" />
              <span className="helper-text">Pilih foto yang paling mewakili jalannya kegiatan.</span>
            </div>
          </div>
        ) : null}
      </RoleGuard>

      {error ? <div className="error-state">{error}</div> : null}

      {photos.length === 0 ? (
        <p className="helper-text">Belum ada dokumentasi foto untuk kegiatan ini.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div className="photo-card" key={photo.foto_id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={photo.caption || photo.file_name} src={getPublicPhotoProxyUrl(photo.file_id)} />
              <div className="photo-body">
                <strong>{photo.file_name}</strong>
                <p className="helper-text">{photo.caption || "Tanpa caption"}</p>
                <a
                  className="button ghost"
                  href={getPublicPhotoProxyUrl(photo.file_id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Buka Foto
                </a>
                {canEdit ? (
                  <button className="button danger" onClick={() => onDelete(photo.foto_id)} type="button">
                    Hapus
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

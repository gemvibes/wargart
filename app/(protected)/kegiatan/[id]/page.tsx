"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ExportButtons } from "@/components/kegiatan/ExportButtons";
import { AttendanceChecklist } from "@/components/kegiatan/AttendanceChecklist";
import { KegiatanFormModal } from "@/components/kegiatan/KegiatanFormModal";
import { PhotoUploader } from "@/components/kegiatan/PhotoUploader";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiClient } from "@/lib/api/client";
import { AttendanceItem, Kegiatan, KegiatanPayload, KegiatanDetailResponse } from "@/lib/types";
import { downloadBase64File, formatDate } from "@/lib/utils";

export default function KegiatanDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [detail, setDetail] = useState<KegiatanDetailResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  const kegiatanId = String(params.id);
  const canEdit = user?.role === "superadmin";

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const [detailData, attendanceData] = await Promise.all([
        apiClient.getKegiatanDetail(kegiatanId),
        apiClient.getKegiatanKehadiran(kegiatanId)
      ]);
      setDetail(detailData);
      setAttendance(attendanceData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat detail kegiatan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [kegiatanId]);

  async function handleSaveAttendance(items: AttendanceItem[]) {
    setSavingAttendance(true);
    try {
      await apiClient.saveKehadiran(kegiatanId, items);
      await loadDetail();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan daftar hadir.");
    } finally {
      setSavingAttendance(false);
    }
  }

  async function handleSaveKegiatan(payload: KegiatanPayload) {
    setSavingInfo(true);
    try {
      await apiClient.updateKegiatan(kegiatanId, payload);
      setEditing(false);
      await loadDetail();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan detail kegiatan.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleUploadFoto(payload: {
    kegiatan_id: string;
    file_name: string;
    mime_type: string;
    base64_data: string;
    caption: string;
  }) {
    await apiClient.uploadFoto(payload);
    await loadDetail();
  }

  async function handleDeleteFoto(foto_id: string) {
    const confirmed = window.confirm("Hapus foto dokumentasi ini?");
    if (!confirmed) return;
    await apiClient.deleteFoto(foto_id);
    await loadDetail();
  }

  async function handleExport(format: "pdf" | "docx") {
    try {
      const result = await apiClient.exportKegiatan(kegiatanId, format);
      if (result.base64Data && result.fileName && result.mimeType) {
        downloadBase64File(result.fileName, result.base64Data, result.mimeType);
        return;
      }

      if (result.fileUrl) {
        window.open(result.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }

      throw new Error(
        "Format respons export belum lengkap. Pastikan deploy frontend terbaru aktif dan GAS sudah sinkron."
      );
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export gagal diproses.");
    }
  }

  if (loading) {
    return <LoadingState message="Memuat detail kegiatan..." />;
  }

  if (error && !detail) {
    return <ErrorMessage message={error} onRetry={loadDetail} />;
  }

  if (!detail) {
    return <ErrorMessage message="Data kegiatan tidak ditemukan." />;
  }

  const { kegiatan, photos } = detail;

  return (
    <div className="section-stack">
      <PageHeader
        title={kegiatan.nama_kegiatan}
        description="Kelola daftar hadir, notulen, dokumentasi, dan export laporan kegiatan."
        actions={<ExportButtons onExport={handleExport} />}
      />

      {error ? <ErrorMessage message={error} onRetry={loadDetail} /> : null}

      <section className="detail-grid">
        <div className="card">
          <div className="modal-header">
            <div>
              <h3>Informasi Kegiatan</h3>
              <p className="muted">
                {kegiatan.jenis_kegiatan} • {kegiatan.hari}, {formatDate(kegiatan.tanggal)}
              </p>
            </div>
            {canEdit ? (
              <button className="button secondary" onClick={() => setEditing(true)} type="button">
                Edit Kegiatan
              </button>
            ) : null}
          </div>

          <div className="quick-list">
            <div className="quick-list-item">
              <strong>Status Kegiatan</strong>
              <p className="helper-text">{kegiatan.status_kegiatan}</p>
            </div>
            <div className="quick-list-item">
              <strong>Waktu</strong>
              <p className="helper-text">
                {kegiatan.waktu_mulai} - {kegiatan.waktu_selesai}
              </p>
            </div>
            <div className="quick-list-item">
              <strong>Tempat</strong>
              <p className="helper-text">{kegiatan.tempat}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Notulen / Laporan</h3>
          <p className="helper-text" style={{ whiteSpace: "pre-wrap" }}>
            {kegiatan.laporan || "Belum ada laporan kegiatan."}
          </p>
        </div>
      </section>

      <AttendanceChecklist
        canEdit={canEdit}
        initialItems={attendance}
        onSave={handleSaveAttendance}
        saving={savingAttendance}
      />

      <PhotoUploader
        canEdit={canEdit}
        kegiatanId={kegiatanId}
        onDelete={handleDeleteFoto}
        onUpload={handleUploadFoto}
        photos={photos}
      />

      {editing ? (
        <KegiatanFormModal
          initialValue={kegiatan as Kegiatan}
          onClose={() => setEditing(false)}
          onSubmit={(payload) => handleSaveKegiatan(payload)}
          saving={savingInfo}
        />
      ) : null}
    </div>
  );
}

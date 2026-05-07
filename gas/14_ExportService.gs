function exportKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");
  const format = sanitizeText_(payload.format).toLowerCase();
  if (["pdf", "docx"].indexOf(format) === -1) {
    throw new Error("Format export hanya mendukung pdf atau docx.");
  }

  const templateId = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID);
  if (!templateId) {
    throw new Error("Property DOC_TEMPLATE_ID belum diatur.");
  }

  const settings = getSettingsObject_();
  const kegiatan = findById_(CONFIG.SHEETS.KEGIATAN, "kegiatan_id", kegiatanId);
  const attendance = getKegiatanKehadiran_({
    parameter: {
      token: body.token,
      kegiatan_id: kegiatanId
    }
  });
  const photos = readSheetAsObjects(CONFIG.SHEETS.FOTO).filter(function (item) {
    return String(item.kegiatan_id) === kegiatanId;
  });

  const copyName = "Laporan " + kegiatan.nama_kegiatan + " " + new Date().getTime();
  const copiedFile = DriveApp.getFileById(templateId).makeCopy(copyName);
  const copiedFileId = copiedFile.getId();

  try {
    const doc = DocumentApp.openById(copiedFileId);
    const bodyDoc = doc.getBody();

    const daftarHadirText = attendance
      .map(function (item, index) {
        return (
          index +
          1 +
          ". " +
          item.nama +
          " - Rumah " +
          item.nomor_rumah +
          " - Dawis " +
          item.dawis +
          " - " +
          item.status_hadir
        );
      })
      .join("\n");

    const dokumentasiText = photos.length
      ? photos
          .map(function (photo, index) {
            return index + 1 + ". " + (photo.caption || photo.file_name);
          })
          .join("\n")
      : "Belum ada dokumentasi.";

    const replacements = {
      "{{NAMA_KEGIATAN}}": kegiatan.nama_kegiatan,
      "{{JENIS_KEGIATAN}}": kegiatan.jenis_kegiatan,
      "{{HARI_TANGGAL}}": kegiatan.hari + ", " + formatDateIndo_(kegiatan.tanggal),
      "{{WAKTU}}": kegiatan.waktu_mulai + " - " + kegiatan.waktu_selesai,
      "{{TEMPAT}}": kegiatan.tempat,
      "{{DAFTAR_HADIR}}": daftarHadirText || "Belum ada data kehadiran.",
      "{{LAPORAN}}": kegiatan.laporan || "Belum ada laporan kegiatan.",
      "{{DOKUMENTASI}}": dokumentasiText,
      "{{TANGGAL_CETAK}}": formatDateIndo_(nowIso_()),
      "{{NAMA_KETUA_RT}}": settings.nama_ketua_rt || "(Nama Ketua RT)",
      "{{NAMA_SEKRETARIS}}": settings.nama_sekretaris || user.nama
    };

    Object.keys(replacements).forEach(function (key) {
      bodyDoc.replaceText(key, replacements[key]);
    });

    if (photos.length) {
      bodyDoc.appendParagraph("");
      bodyDoc.appendParagraph("Lampiran Dokumentasi").setHeading(DocumentApp.ParagraphHeading.HEADING2);
      photos.forEach(function (photo) {
        const imageBlob = DriveApp.getFileById(photo.file_id).getBlob();
        bodyDoc.appendImage(imageBlob).setWidth(320);
        bodyDoc.appendParagraph(photo.caption || photo.file_name);
      });
    }

    doc.saveAndClose();

    const exportFile = DriveApp.getFileById(copiedFileId);
    const mimeType = format === "pdf" ? MimeType.PDF : MimeType.MICROSOFT_WORD;
    const extension = format === "pdf" ? ".pdf" : ".docx";
    const fileName = copyName + extension;
    const blob = exportFile.getAs(mimeType).setName(fileName);

    logAction(user.user_id, "export_kegiatan_" + format, kegiatanId);
    return {
      fileName: fileName,
      mimeType: blob.getContentType(),
      base64Data: Utilities.base64Encode(blob.getBytes())
    };
  } finally {
    safelyDeleteDriveFile_(copiedFileId);
  };
}

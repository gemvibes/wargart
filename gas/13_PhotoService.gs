function uploadFotoKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");
  const fileName = getRequiredValue_(payload.file_name, "Nama file wajib diisi.");
  const mimeType = getRequiredValue_(payload.mime_type, "Mime type wajib diisi.");
  const base64Data = getRequiredValue_(payload.base64_data, "Data gambar wajib diisi.");
  const folderId = PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.DRIVE_FOLDER_ID);
  if (!folderId) {
    throw new Error("Property DRIVE_FOLDER_ID belum diatur.");
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const file = DriveApp.getFolderById(folderId).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const record = {
    foto_id: generateId("F", CONFIG.SHEETS.FOTO, "foto_id"),
    old_supabase_id: "",
    kegiatan_id: kegiatanId,
    file_name: fileName,
    file_id: file.getId(),
    file_url: "https://drive.google.com/uc?export=view&id=" + file.getId(),
    caption: sanitizeText_(payload.caption),
    uploaded_at: nowIso_()
  };

  appendRow(CONFIG.SHEETS.FOTO, record);
  bumpDataVersion_(["FOTO"]);
  logAction(user.user_id, "upload_foto_kegiatan", kegiatanId);
  return record;
}

function deleteFotoKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);
  const fotoId = getRequiredValue_(payload.foto_id, "foto_id wajib diisi.");
  const photo = findById_(CONFIG.SHEETS.FOTO, "foto_id", fotoId);
  safelyDeleteDriveFile_(photo.file_id);
  deleteRowById(CONFIG.SHEETS.FOTO, "foto_id", fotoId);
  bumpDataVersion_(["FOTO"]);
  logAction(user.user_id, "delete_foto_kegiatan", fotoId);
  return true;
}

const SHEET_SCHEMAS = {
  users: ["user_id", "nama", "username", "password_hash", "role", "status", "created_at"],
  warga: [
    "warga_id",
    "old_supabase_id",
    "nama",
    "status_tinggal",
    "nomor_rumah",
    "jumlah_anggota_kk",
    "dawis",
    "status",
    "catatan",
    "created_at",
    "updated_at"
  ],
  kegiatan: [
    "kegiatan_id",
    "old_supabase_id",
    "nama_kegiatan",
    "jenis_kegiatan",
    "tanggal",
    "hari",
    "tempat",
    "waktu_mulai",
    "waktu_selesai",
    "laporan",
    "status_kegiatan",
    "dibuat_oleh",
    "created_at",
    "updated_at"
  ],
  kehadiran: [
    "hadir_id",
    "old_supabase_id",
    "kegiatan_id",
    "warga_id",
    "status_hadir",
    "catatan",
    "created_at"
  ],
  foto_kegiatan: [
    "foto_id",
    "old_supabase_id",
    "kegiatan_id",
    "file_name",
    "file_id",
    "file_url",
    "caption",
    "uploaded_at"
  ],
  settings: ["key", "value"],
  logs: ["log_id", "user_id", "aksi", "target", "timestamp"]
};

const DEFAULT_SETTINGS = {
  nama_rt_rw: "RT 03 / RW 03",
  kelurahan: "Purwokerto Lor",
  kecamatan: "Purwokerto Timur",
  kabupaten: "Banyumas",
  nama_ketua_rt: "",
  nama_sekretaris: ""
};

function setupTiteniProject() {
  validateSetupInput_();
  saveSetupProperties_();
  ensureAllSheets_();
  seedSettingsSheet_();

  let templateId = sanitizeText_(SETUP_INPUT.docTemplateId);
  if (SETUP_INPUT.autoCreateTemplate && (!templateId || SETUP_INPUT.overwriteTemplateProperty)) {
    templateId = createDefaultDocsTemplate_();
    PropertiesService.getScriptProperties().setProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID, templateId);
  }

  const seededUsers = SETUP_INPUT.autoSeedUsers ? seedInitialUsers_() : null;

  return {
    success: true,
    spreadsheetId: SETUP_INPUT.spreadsheetId,
    documentationFolderId: SETUP_INPUT.documentationFolderId,
    exportFolderId: SETUP_INPUT.exportFolderId,
    docTemplateId:
      PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID) || "",
    seededUsers: seededUsers,
    validation: validateSpreadsheetStructure_()
  };
}

function validateSpreadsheetStructure() {
  return validateSpreadsheetStructure_();
}

function refreshDocsTemplate() {
  validateSetupInput_();
  const templateId = createDefaultDocsTemplate_();
  PropertiesService.getScriptProperties().setProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID, templateId);
  return {
    success: true,
    docTemplateId: templateId
  };
}

function validateSetupInput_() {
  getRequiredValue_(SETUP_INPUT.spreadsheetId, "SETUP_INPUT.spreadsheetId wajib diisi.");
  getRequiredValue_(
    SETUP_INPUT.documentationFolderId,
    "SETUP_INPUT.documentationFolderId wajib diisi."
  );
  getRequiredValue_(SETUP_INPUT.exportFolderId, "SETUP_INPUT.exportFolderId wajib diisi.");
  getRequiredValue_(SETUP_INPUT.sessionSecret, "SETUP_INPUT.sessionSecret wajib diisi.");
}

function saveSetupProperties_() {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(CONFIG.PROPERTIES.SPREADSHEET_ID, SETUP_INPUT.spreadsheetId);
  properties.setProperty(CONFIG.PROPERTIES.DRIVE_FOLDER_ID, SETUP_INPUT.documentationFolderId);
  properties.setProperty(CONFIG.PROPERTIES.EXPORT_FOLDER_ID, SETUP_INPUT.exportFolderId);
  properties.setProperty(CONFIG.PROPERTIES.SESSION_SECRET, SETUP_INPUT.sessionSecret);

  const frontendAppUrl = sanitizeText_(SETUP_INPUT.frontendAppUrl);
  if (frontendAppUrl) {
    properties.setProperty(CONFIG.PROPERTIES.FRONTEND_APP_URL, frontendAppUrl);
  }

  const docTemplateId = sanitizeText_(SETUP_INPUT.docTemplateId);
  if (
    docTemplateId &&
    (SETUP_INPUT.overwriteTemplateProperty ||
      !properties.getProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID))
  ) {
    properties.setProperty(CONFIG.PROPERTIES.DOC_TEMPLATE_ID, docTemplateId);
  }
}

function ensureAllSheets_() {
  Object.keys(SHEET_SCHEMAS).forEach(function (sheetName) {
    ensureSheetSchema_(sheetName, SHEET_SCHEMAS[sheetName]);
  });
}

function ensureSheetSchema_(sheetName, requiredHeaders) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const lastColumn = sheet.getLastColumn();
  const headerRow = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  const normalizedHeaders = headerRow.map(function (item) {
    return sanitizeText_(item);
  });

  if (normalizedHeaders.length === 0 || normalizedHeaders.every(function (item) { return !item; })) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return;
  }

  const missingHeaders = requiredHeaders.filter(function (header) {
    return normalizedHeaders.indexOf(header) === -1;
  });

  if (!missingHeaders.length) {
    sheet.setFrozenRows(1);
    return;
  }

  const startColumn = normalizedHeaders.length + 1;
  sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
  sheet.setFrozenRows(1);
}

function seedSettingsSheet_() {
  const existing = readSheetAsObjects(CONFIG.SHEETS.SETTINGS);
  const existingMap = existing.reduce(function (map, item) {
    map[String(item.key)] = item.value;
    return map;
  }, {});

  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    if (existingMap[key] === undefined) {
      appendRow(CONFIG.SHEETS.SETTINGS, {
        key: key,
        value: DEFAULT_SETTINGS[key]
      });
    }
  });
}

function validateSpreadsheetStructure_() {
  const spreadsheet = getSpreadsheet_();

  return Object.keys(SHEET_SCHEMAS).map(function (sheetName) {
    const requiredHeaders = SHEET_SCHEMAS[sheetName];
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return {
        sheet: sheetName,
        exists: false,
        missingHeaders: requiredHeaders,
        extraHeaders: []
      };
    }

    const lastColumn = sheet.getLastColumn();
    const headerRow = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
    const normalizedHeaders = headerRow
      .map(function (item) {
        return sanitizeText_(item);
      })
      .filter(function (item) {
        return item;
      });

    const missingHeaders = requiredHeaders.filter(function (header) {
      return normalizedHeaders.indexOf(header) === -1;
    });
    const extraHeaders = normalizedHeaders.filter(function (header) {
      return requiredHeaders.indexOf(header) === -1;
    });

    return {
      sheet: sheetName,
      exists: true,
      missingHeaders: missingHeaders,
      extraHeaders: extraHeaders
    };
  });
}

function createDefaultDocsTemplate_() {
  const exportFolder = DriveApp.getFolderById(SETUP_INPUT.exportFolderId);
  const doc = DocumentApp.create("Template Laporan Kegiatan Titeni");
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(exportFolder);

  const body = doc.getBody();
  body.clear();
  body
    .appendParagraph("LAPORAN KEGIATAN WARGA")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("RT 03 / RW 03 KELURAHAN PURWOKERTO LOR");
  body.appendParagraph("");
  body.appendParagraph("Nama Kegiatan : {{NAMA_KEGIATAN}}");
  body.appendParagraph("Jenis Kegiatan : {{JENIS_KEGIATAN}}");
  body.appendParagraph("Hari/Tanggal : {{HARI_TANGGAL}}");
  body.appendParagraph("Waktu : {{WAKTU}}");
  body.appendParagraph("Tempat : {{TEMPAT}}");
  body.appendParagraph("");
  body.appendParagraph("DAFTAR HADIR").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{DAFTAR_HADIR}}");
  body.appendParagraph("");
  body
    .appendParagraph("NOTULEN / LAPORAN KEGIATAN")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{LAPORAN}}");
  body.appendParagraph("");
  body.appendParagraph("DOKUMENTASI").setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{DOKUMENTASI}}");
  body.appendParagraph("");
  body.appendParagraph("Purwokerto Lor, {{TANGGAL_CETAK}}");
  body.appendParagraph("");
  body.appendParagraph("Mengetahui,                         Dibuat oleh,");
  body.appendParagraph("Ketua RT 03                         Sekretaris RT 03");
  body.appendParagraph("");
  body.appendParagraph("{{NAMA_KETUA_RT}}                   {{NAMA_SEKRETARIS}}");
  doc.saveAndClose();

  return doc.getId();
}

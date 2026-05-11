function validateKegiatanPayload_(payload) {
  return {
    nama_kegiatan: getRequiredValue_(payload.nama_kegiatan, "Nama kegiatan wajib diisi."),
    jenis_kegiatan: getRequiredValue_(payload.jenis_kegiatan, "Jenis kegiatan wajib diisi."),
    tanggal: getRequiredValue_(payload.tanggal, "Tanggal kegiatan wajib diisi."),
    hari: getRequiredValue_(payload.hari, "Hari kegiatan wajib diisi."),
    tempat: getRequiredValue_(payload.tempat, "Tempat kegiatan wajib diisi."),
    waktu_mulai: sanitizeText_(payload.waktu_mulai),
    waktu_selesai: sanitizeText_(payload.waktu_selesai),
    laporan: sanitizeText_(payload.laporan),
    status_kegiatan: sanitizeText_(payload.status_kegiatan) || "Draft"
  };
}

function getKegiatan_(e) {
  requireAuth_(e.parameter.token);
  const search = sanitizeText_(e.parameter.search).toLowerCase();
  const jenis = sanitizeText_(e.parameter.jenis_kegiatan);
  const bulan = sanitizeText_(e.parameter.bulan);
  const tahun = sanitizeText_(e.parameter.tahun);

  return readThroughDataCache_(
    JSON.stringify({
      action: "getKegiatan",
      search: search,
      jenis: jenis,
      bulan: bulan,
      tahun: tahun
    }),
    ["KEGIATAN"],
    function () {
      return readSheetAsObjects(CONFIG.SHEETS.KEGIATAN)
        .filter(function (item) {
          if (search && String(item.nama_kegiatan || "").toLowerCase().indexOf(search) === -1) return false;
          if (jenis && String(item.jenis_kegiatan) !== jenis) return false;

          const date = normalizeDateString_(item.tanggal);
          if (bulan && date && String(new Date(date).getMonth() + 1) !== bulan) return false;
          if (tahun && date && String(new Date(date).getFullYear()) !== tahun) return false;
          return true;
        })
        .sort(function (a, b) {
          return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
        });
    }
  );
}

function createKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const validated = validateKegiatanPayload_(payload);
  const record = Object.assign({}, validated, {
    kegiatan_id: generateId("K", CONFIG.SHEETS.KEGIATAN, "kegiatan_id"),
    old_supabase_id: "",
    dibuat_oleh: user.nama,
    created_at: nowIso_(),
    updated_at: nowIso_()
  });

  appendRow(CONFIG.SHEETS.KEGIATAN, record);
  bumpDataVersion_(["KEGIATAN"]);
  logAction(user.user_id, "create_kegiatan", record.kegiatan_id);
  return record;
}

function updateKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);
  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");
  const existing = findById_(CONFIG.SHEETS.KEGIATAN, "kegiatan_id", kegiatanId);
  const validated = validateKegiatanPayload_(payload);
  const record = Object.assign({}, existing, validated, {
    updated_at: nowIso_()
  });

  updateRowById(CONFIG.SHEETS.KEGIATAN, "kegiatan_id", kegiatanId, record);
  bumpDataVersion_(["KEGIATAN"]);
  logAction(user.user_id, "update_kegiatan", kegiatanId);
  return record;
}

function deleteKegiatan_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);
  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");

  deleteRowsByColumnValue_(CONFIG.SHEETS.KEHADIRAN, "kegiatan_id", kegiatanId);
  const photos = readSheetAsObjects(CONFIG.SHEETS.FOTO).filter(function (item) {
    return String(item.kegiatan_id) === kegiatanId;
  });
  photos.forEach(function (photo) {
    safelyDeleteDriveFile_(photo.file_id);
    deleteRowById(CONFIG.SHEETS.FOTO, "foto_id", photo.foto_id);
  });
  deleteRowById(CONFIG.SHEETS.KEGIATAN, "kegiatan_id", kegiatanId);
  bumpDataVersion_(["KEGIATAN", "KEHADIRAN", "FOTO"]);
  logAction(user.user_id, "delete_kegiatan", kegiatanId);
  return true;
}

function getKegiatanDetail_(e) {
  requireAuth_(e.parameter.token);
  const kegiatanId = getRequiredValue_(e.parameter.kegiatan_id, "kegiatan_id wajib diisi.");
  return readThroughDataCache_(
    JSON.stringify({
      action: "getKegiatanDetail",
      kegiatan_id: kegiatanId
    }),
    ["KEGIATAN", "FOTO"],
    function () {
      const kegiatan = findById_(CONFIG.SHEETS.KEGIATAN, "kegiatan_id", kegiatanId);
      const photos = readSheetAsObjects(CONFIG.SHEETS.FOTO).filter(function (item) {
        return String(item.kegiatan_id) === kegiatanId;
      });

      return {
        kegiatan: kegiatan,
        photos: photos
      };
    }
  );
}

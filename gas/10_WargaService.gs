function validateWargaPayload_(payload) {
  return {
    nama: getRequiredValue_(payload.nama, "Nama warga wajib diisi."),
    status_tinggal: getRequiredValue_(payload.status_tinggal, "Status tinggal wajib diisi."),
    nomor_rumah: getRequiredValue_(payload.nomor_rumah, "Nomor rumah wajib diisi."),
    jumlah_anggota_kk: parseNumber_(payload.jumlah_anggota_kk, 0),
    dawis: getRequiredValue_(payload.dawis, "Dawis wajib diisi."),
    status: getRequiredValue_(payload.status, "Status warga wajib diisi."),
    catatan: sanitizeText_(payload.catatan)
  };
}

function getWarga_(e) {
  requireAuth_(e.parameter.token);
  const search = sanitizeText_(e.parameter.search).toLowerCase();
  const dawis = sanitizeText_(e.parameter.dawis);
  const statusTinggal = sanitizeText_(e.parameter.status_tinggal);

  return readSheetAsObjects(CONFIG.SHEETS.WARGA)
    .filter(function (item) {
      if (search && String(item.nama || "").toLowerCase().indexOf(search) === -1) return false;
      if (dawis && String(item.dawis) !== dawis) return false;
      if (statusTinggal && String(item.status_tinggal) !== statusTinggal) return false;
      return true;
    })
    .sort(function (a, b) {
      return String(a.nama).localeCompare(String(b.nama), "id");
    });
}

function createWarga_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const validated = validateWargaPayload_(payload);
  const record = Object.assign({}, validated, {
    warga_id: generateId("W", CONFIG.SHEETS.WARGA, "warga_id"),
    old_supabase_id: "",
    created_at: nowIso_(),
    updated_at: nowIso_()
  });

  appendRow(CONFIG.SHEETS.WARGA, record);
  logAction(user.user_id, "create_warga", record.warga_id);
  return record;
}

function updateWarga_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const wargaId = getRequiredValue_(payload.warga_id, "warga_id wajib diisi.");
  const existing = findById_(CONFIG.SHEETS.WARGA, "warga_id", wargaId);
  const validated = validateWargaPayload_(payload);
  const record = Object.assign({}, existing, validated, {
    updated_at: nowIso_()
  });

  updateRowById(CONFIG.SHEETS.WARGA, "warga_id", wargaId, record);
  logAction(user.user_id, "update_warga", wargaId);
  return record;
}

function deleteWarga_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);
  const wargaId = getRequiredValue_(payload.warga_id, "warga_id wajib diisi.");
  deleteRowById(CONFIG.SHEETS.WARGA, "warga_id", wargaId);
  logAction(user.user_id, "delete_warga", wargaId);
  return true;
}


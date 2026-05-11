function validateWargaPayload_(payload, options) {
  const allowEmpty = Boolean(options && options.allowEmpty);
  return {
    nama: allowEmpty ? sanitizeText_(payload.nama) : getRequiredValue_(payload.nama, "Nama warga wajib diisi."),
    status_tinggal: allowEmpty
      ? sanitizeText_(payload.status_tinggal)
      : getRequiredValue_(payload.status_tinggal, "Status tinggal wajib diisi."),
    nomor_rumah: allowEmpty
      ? sanitizeText_(payload.nomor_rumah)
      : getRequiredValue_(payload.nomor_rumah, "Nomor rumah wajib diisi."),
    jumlah_anggota_kk: parseNumber_(payload.jumlah_anggota_kk, 0),
    dawis: allowEmpty ? sanitizeText_(payload.dawis) : getRequiredValue_(payload.dawis, "Dawis wajib diisi."),
    status: allowEmpty ? sanitizeText_(payload.status) : getRequiredValue_(payload.status, "Status warga wajib diisi."),
    catatan: sanitizeText_(payload.catatan)
  };
}

function getWarga_(e) {
  requireAuth_(e.parameter.token);
  const search = sanitizeText_(e.parameter.search).toLowerCase();
  const dawis = sanitizeText_(e.parameter.dawis);
  const statusTinggal = sanitizeText_(e.parameter.status_tinggal);

  return readThroughDataCache_(
    JSON.stringify({
      action: "getWarga",
      search: search,
      dawis: dawis,
      status_tinggal: statusTinggal
    }),
    ["WARGA"],
    function () {
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
  );
}

function createWarga_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const validated = validateWargaPayload_(payload, { allowEmpty: true });
  const record = Object.assign({}, validated, {
    warga_id: generateId("W", CONFIG.SHEETS.WARGA, "warga_id"),
    old_supabase_id: "",
    created_at: nowIso_(),
    updated_at: nowIso_()
  });

  appendRow(CONFIG.SHEETS.WARGA, record);
  bumpDataVersion_(["WARGA"]);
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
  bumpDataVersion_(["WARGA"]);
  logAction(user.user_id, "update_warga", wargaId);
  return record;
}

function deleteWarga_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);
  const wargaId = getRequiredValue_(payload.warga_id, "warga_id wajib diisi.");
  deleteRowById(CONFIG.SHEETS.WARGA, "warga_id", wargaId);
  bumpDataVersion_(["WARGA"]);
  logAction(user.user_id, "delete_warga", wargaId);
  return true;
}

function importWargaBatch_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const rows = payload.rows || [];
  if (!rows.length) {
    throw new Error("Payload import warga kosong.");
  }

  const existingRows = readSheetAsObjects(CONFIG.SHEETS.WARGA);
  const existingMap = existingRows.reduce(function (map, item) {
    map[String(item.warga_id)] = item;
    return map;
  }, {});

  const result = {
    imported: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    items: []
  };

  rows.forEach(function (row, index) {
    const wargaId = sanitizeText_(row.warga_id);
    const nama = sanitizeText_(row.nama);
    if (!wargaId || !nama) {
      result.skipped += 1;
      result.items.push({
        rowNumber: index + 1,
        status: "skipped",
        reason: "warga_id atau nama kosong"
      });
      return;
    }

    const normalized = normalizeImportedWargaRow_(row);
    const existing = existingMap[wargaId];

    if (existing) {
      const updatedRecord = Object.assign({}, existing, normalized, {
        updated_at: nowIso_()
      });
      updateRowById(CONFIG.SHEETS.WARGA, "warga_id", wargaId, updatedRecord);
      result.updated += 1;
      result.imported += 1;
      result.items.push({
        warga_id: wargaId,
        nama: normalized.nama,
        status: "updated"
      });
      return;
    }

    const createdRecord = Object.assign({}, normalized, {
      created_at: nowIso_(),
      updated_at: nowIso_()
    });
    appendRow(CONFIG.SHEETS.WARGA, createdRecord);
    result.created += 1;
    result.imported += 1;
    result.items.push({
      warga_id: wargaId,
      nama: normalized.nama,
      status: "created"
    });
  });

  logAction(user.user_id, "import_warga_batch", "rows:" + rows.length);
  bumpDataVersion_(["WARGA"]);
  return result;
}

function normalizeImportedWargaRow_(row) {
  return {
    warga_id: getRequiredValue_(row.warga_id, "warga_id import wajib diisi."),
    old_supabase_id: sanitizeText_(row.old_supabase_id),
    nama: getRequiredValue_(row.nama, "nama import wajib diisi."),
    status_tinggal: getRequiredValue_(row.status_tinggal, "status_tinggal import wajib diisi."),
    nomor_rumah: sanitizeText_(row.nomor_rumah),
    jumlah_anggota_kk: parseNumber_(row.jumlah_anggota_kk, 0),
    dawis: sanitizeText_(row.dawis),
    status: getRequiredValue_(row.status, "status import wajib diisi."),
    catatan: sanitizeText_(row.catatan)
  };
}

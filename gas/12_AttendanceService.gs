function getKegiatanKehadiran_(e) {
  requireAuth_(e.parameter.token);
  const kegiatanId = getRequiredValue_(e.parameter.kegiatan_id, "kegiatan_id wajib diisi.");
  const wargaAktif = readSheetAsObjects(CONFIG.SHEETS.WARGA)
    .filter(function (item) {
      return String(item.status) === "Aktif";
    })
    .sort(function (a, b) {
      return String(a.nama).localeCompare(String(b.nama), "id");
    });

  const existing = readSheetAsObjects(CONFIG.SHEETS.KEHADIRAN)
    .filter(function (item) {
      return String(item.kegiatan_id) === kegiatanId;
    })
    .reduce(function (map, item) {
      map[String(item.warga_id)] = item;
      return map;
    }, {});

  return wargaAktif.map(function (warga) {
    const attendance = existing[String(warga.warga_id)] || {};
    return {
      warga_id: warga.warga_id,
      nama: warga.nama,
      nomor_rumah: warga.nomor_rumah,
      dawis: warga.dawis,
      status_hadir: attendance.status_hadir || "Tidak Hadir",
      catatan: attendance.catatan || ""
    };
  });
}

function saveKehadiran_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");
  const attendance = (payload.attendance || []).filter(function (item) {
    return sanitizeText_(item.status_hadir) === "Hadir";
  });

  const existingRows = readSheetAsObjects(CONFIG.SHEETS.KEHADIRAN);
  const preservedRows = existingRows.filter(function (item) {
    return String(item.kegiatan_id) !== kegiatanId;
  });

  var nextNumber = existingRows.reduce(function (maxValue, item) {
    const currentId = String(item.hadir_id || "");
    const matched = currentId.match(/(\d+)$/);
    const numeric = matched ? Number(matched[1]) : 0;
    return numeric > maxValue ? numeric : maxValue;
  }, 0);

  const nextRows = attendance.map(function (item) {
    nextNumber += 1;
    return {
      hadir_id: "H-" + ("0000" + nextNumber).slice(-4),
      old_supabase_id: "",
      kegiatan_id: kegiatanId,
      warga_id: getRequiredValue_(item.warga_id, "warga_id pada daftar hadir wajib diisi."),
      status_hadir: "Hadir",
      catatan: sanitizeText_(item.catatan),
      created_at: nowIso_()
    };
  });

  replaceSheetRows_(CONFIG.SHEETS.KEHADIRAN, preservedRows.concat(nextRows));

  logAction(user.user_id, "save_kehadiran", kegiatanId);
  return true;
}

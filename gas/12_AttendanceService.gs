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
  const attendance = payload.attendance || [];
  if (!attendance.length) {
    throw new Error("Data daftar hadir tidak boleh kosong.");
  }

  deleteRowsByColumnValue_(CONFIG.SHEETS.KEHADIRAN, "kegiatan_id", kegiatanId);

  attendance.forEach(function (item) {
    appendRow(CONFIG.SHEETS.KEHADIRAN, {
      hadir_id: generateId("H", CONFIG.SHEETS.KEHADIRAN, "hadir_id"),
      old_supabase_id: "",
      kegiatan_id: kegiatanId,
      warga_id: getRequiredValue_(item.warga_id, "warga_id pada daftar hadir wajib diisi."),
      status_hadir: sanitizeText_(item.status_hadir) || "Tidak Hadir",
      catatan: sanitizeText_(item.catatan),
      created_at: nowIso_()
    });
  });

  logAction(user.user_id, "save_kehadiran", kegiatanId);
  return true;
}


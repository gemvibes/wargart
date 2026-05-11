function getKegiatanKehadiran_(e) {
  requireAuth_(e.parameter.token);
  const kegiatanId = getRequiredValue_(e.parameter.kegiatan_id, "kegiatan_id wajib diisi.");
  return readThroughDataCache_(
    JSON.stringify({
      action: "getKegiatanKehadiran",
      kegiatan_id: kegiatanId
    }),
    ["WARGA", "KEHADIRAN"],
    function () {
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
  );
}

function saveKehadiran_(body, payload) {
  const user = requireAuth_(body.token);
  requireSuperAdmin(user);

  const kegiatanId = getRequiredValue_(payload.kegiatan_id, "kegiatan_id wajib diisi.");
  const attendance = (payload.attendance || []).filter(function (item) {
    return sanitizeText_(item.status_hadir) === "Hadir";
  });
  const desiredByWargaId = attendance.reduce(function (map, item) {
    const wargaId = getRequiredValue_(item.warga_id, "warga_id pada daftar hadir wajib diisi.");
    map[wargaId] = {
      warga_id: wargaId,
      status_hadir: "Hadir",
      catatan: sanitizeText_(item.catatan)
    };
    return map;
  }, {});

  const sheet = getSheet(CONFIG.SHEETS.KEHADIRAN);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0] || [];

  if (!headers.length) {
    throw new Error("Header sheet kehadiran belum tersedia.");
  }

  const hadirIdIndex = headers.indexOf("hadir_id");
  const kegiatanIdIndex = headers.indexOf("kegiatan_id");
  const wargaIdIndex = headers.indexOf("warga_id");
  const statusHadirIndex = headers.indexOf("status_hadir");
  const catatanIndex = headers.indexOf("catatan");

  if (
    hadirIdIndex === -1 ||
    kegiatanIdIndex === -1 ||
    wargaIdIndex === -1 ||
    statusHadirIndex === -1 ||
    catatanIndex === -1
  ) {
    throw new Error("Struktur sheet kehadiran tidak lengkap.");
  }

  var nextNumber = 0;
  const existingForKegiatan = [];

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    const row = values[rowIndex];
    const currentId = String(row[hadirIdIndex] || "");
    const matched = currentId.match(/(\d+)$/);
    const numeric = matched ? Number(matched[1]) : 0;
    if (numeric > nextNumber) {
      nextNumber = numeric;
    }

    if (String(row[kegiatanIdIndex]) === kegiatanId) {
      existingForKegiatan.push({
        rowNumber: rowIndex + 1,
        hadir_id: currentId,
        warga_id: String(row[wargaIdIndex] || ""),
        catatan: sanitizeText_(row[catatanIndex])
      });
    }
  }

  const existingByWargaId = existingForKegiatan.reduce(function (map, item) {
    map[item.warga_id] = item;
    return map;
  }, {});

  const rowsToDelete = [];
  existingForKegiatan.forEach(function (item) {
    if (!desiredByWargaId[item.warga_id]) {
      rowsToDelete.push(item.rowNumber);
      return;
    }

    const desired = desiredByWargaId[item.warga_id];
    if (item.catatan !== desired.catatan) {
      sheet.getRange(item.rowNumber, catatanIndex + 1).setValue(desired.catatan);
    }
  });

  const rowsToAppend = [];
  Object.keys(desiredByWargaId).forEach(function (wargaId) {
    if (existingByWargaId[wargaId]) {
      return;
    }

    nextNumber += 1;
    const objectData = {
      hadir_id: "H-" + ("0000" + nextNumber).slice(-4),
      old_supabase_id: "",
      kegiatan_id: kegiatanId,
      warga_id: wargaId,
      status_hadir: "Hadir",
      catatan: desiredByWargaId[wargaId].catatan,
      created_at: nowIso_()
    };

    rowsToAppend.push(
      headers.map(function (header) {
        return objectData[String(header)] !== undefined ? objectData[String(header)] : "";
      })
    );
  });

  rowsToDelete
    .sort(function (a, b) {
      return b - a;
    })
    .forEach(function (rowNumber) {
      sheet.deleteRow(rowNumber);
    });

  if (rowsToAppend.length) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }

  invalidateSheetCache_(CONFIG.SHEETS.KEHADIRAN);
  bumpDataVersion_(["KEHADIRAN"]);

  logAction(user.user_id, "save_kehadiran", kegiatanId);
  return true;
}

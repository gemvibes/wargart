function getKategoriKehadiran_(persentase) {
  if (persentase >= 80) return "Rutin Hadir";
  if (persentase >= 50) return "Cukup Aktif";
  if (persentase >= 1) return "Jarang Hadir";
  return "Tidak Pernah Hadir";
}

function sortRekap_(rows, sortBy, sortOrder) {
  const factor = sortOrder === "asc" ? 1 : -1;
  return rows.sort(function (a, b) {
    if (sortBy === "nama") {
      return factor * String(a.nama).localeCompare(String(b.nama), "id");
    }
    if (sortBy === "dawis") {
      return factor * (Number(a.dawis) - Number(b.dawis));
    }
    if (sortBy === "nomor_rumah") {
      return factor * String(a.nomor_rumah).localeCompare(String(b.nomor_rumah), "id", { numeric: true });
    }
    return factor * (Number(a.persentase_kehadiran) - Number(b.persentase_kehadiran));
  });
}

function getRekapKehadiran_(e) {
  requireAuth_(e.parameter.token);

  const search = sanitizeText_(e.parameter.search).toLowerCase();
  const dawis = sanitizeText_(e.parameter.dawis);
  const statusTinggal = sanitizeText_(e.parameter.status_tinggal);
  const kategori = sanitizeText_(e.parameter.kategori);
  const jenisKegiatan = sanitizeText_(e.parameter.jenis_kegiatan);
  const tanggalMulai = sanitizeText_(e.parameter.tanggal_mulai);
  const tanggalSelesai = sanitizeText_(e.parameter.tanggal_selesai);
  const sortBy = sanitizeText_(e.parameter.sort_by) || "persentase_kehadiran";
  const sortOrder = sanitizeText_(e.parameter.sort_order) || "desc";

  const wargaAktif = readSheetAsObjects(CONFIG.SHEETS.WARGA).filter(function (item) {
    return (
      String(item.status) === "Aktif" &&
      (!search || String(item.nama || "").toLowerCase().indexOf(search) !== -1) &&
      (!dawis || String(item.dawis) === dawis) &&
      (!statusTinggal || String(item.status_tinggal) === statusTinggal)
    );
  });

  const kegiatanFinal = readSheetAsObjects(CONFIG.SHEETS.KEGIATAN).filter(function (item) {
    if (String(item.status_kegiatan) !== "Final") return false;
    if (jenisKegiatan && String(item.jenis_kegiatan) !== jenisKegiatan) return false;
    if (!isDateInRange_(item.tanggal, tanggalMulai, tanggalSelesai)) return false;
    return true;
  });

  const kegiatanIdSet = kegiatanFinal.reduce(function (map, item) {
    map[String(item.kegiatan_id)] = true;
    return map;
  }, {});

  const attendanceMap = readSheetAsObjects(CONFIG.SHEETS.KEHADIRAN)
    .filter(function (item) {
      return kegiatanIdSet[String(item.kegiatan_id)];
    })
    .reduce(function (map, item) {
      const key = String(item.warga_id);
      if (!map[key]) {
        map[key] = {};
      }
      map[key][String(item.kegiatan_id)] = item.status_hadir;
      return map;
    }, {});

  const result = wargaAktif
    .map(function (warga) {
      const totalKegiatan = kegiatanFinal.length;
      const attendanceByKegiatan = attendanceMap[String(warga.warga_id)] || {};
      const totalHadir = kegiatanFinal.reduce(function (count, kegiatan) {
        return attendanceByKegiatan[String(kegiatan.kegiatan_id)] === "Hadir" ? count + 1 : count;
      }, 0);
      const totalTidakHadir = totalKegiatan - totalHadir;
      const persentase = totalKegiatan > 0 ? Math.round((totalHadir / totalKegiatan) * 100) : 0;
      const kategoriKehadiran = getKategoriKehadiran_(persentase);
      return {
        warga_id: warga.warga_id,
        nama: warga.nama,
        nomor_rumah: warga.nomor_rumah,
        dawis: warga.dawis,
        status_tinggal: warga.status_tinggal,
        total_kegiatan: totalKegiatan,
        total_hadir: totalHadir,
        total_tidak_hadir: totalTidakHadir,
        persentase_kehadiran: persentase,
        kategori_kehadiran: kategoriKehadiran
      };
    })
    .filter(function (item) {
      if (kategori && item.kategori_kehadiran !== kategori) return false;
      return true;
    });

  return sortRekap_(result, sortBy, sortOrder);
}


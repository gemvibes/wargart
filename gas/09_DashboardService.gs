function getDashboardSummary_(e) {
  requireAuth_(e.parameter.token);

  const warga = readSheetAsObjects(CONFIG.SHEETS.WARGA);
  const kegiatan = readSheetAsObjects(CONFIG.SHEETS.KEGIATAN);

  const kegiatanTerbaru = kegiatan
    .slice()
    .sort(function (a, b) {
      return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
    })
    .slice(0, 5);

  return {
    warga_aktif: warga.filter(function (item) {
      return String(item.status) === "Aktif";
    }).length,
    total_kegiatan: kegiatan.length,
    kegiatan_final: kegiatan.filter(function (item) {
      return String(item.status_kegiatan) === "Final";
    }).length,
    kegiatan_terbaru: kegiatanTerbaru
  };
}

import { RekapKehadiranItem } from "@/lib/types";
import { escapeCsvValue } from "@/lib/utils";

export function buildRekapCsv(rows: RekapKehadiranItem[]) {
  const header = [
    "Nama Warga",
    "Nomor Rumah",
    "Dawis",
    "Status Tinggal",
    "Total Kegiatan",
    "Total Hadir",
    "Total Tidak Hadir",
    "Persentase Kehadiran",
    "Kategori Kehadiran"
  ];

  const body = rows.map((row) =>
    [
      row.nama,
      row.nomor_rumah,
      row.dawis,
      row.status_tinggal,
      row.total_kegiatan,
      row.total_hadir,
      row.total_tidak_hadir,
      `${row.persentase_kehadiran}%`,
      row.kategori_kehadiran
    ]
      .map(escapeCsvValue)
      .join(",")
  );

  return [header.join(","), ...body].join("\n");
}


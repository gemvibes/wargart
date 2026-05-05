import { KategoriKehadiran } from "@/lib/types";

function getVariant(category: KategoriKehadiran) {
  if (category === "Rutin Hadir") return "green";
  if (category === "Cukup Aktif") return "blue";
  if (category === "Jarang Hadir") return "yellow";
  return "red";
}

export function AttendanceCategoryBadge({ category }: { category: KategoriKehadiran }) {
  return <span className={`badge ${getVariant(category)}`}>{category}</span>;
}


import { KategoriKehadiran } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(dateString: string) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(dateString));
}

export function formatDateTime(dateString: string) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function buildHariFromDate(dateString: string) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long"
  }).format(new Date(dateString));
}

export function getAttendanceCategory(value: number): KategoriKehadiran {
  if (value >= 80) return "Rutin Hadir";
  if (value >= 50) return "Cukup Aktif";
  if (value >= 1) return "Jarang Hadir";
  return "Tidak Pernah Hadir";
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBase64File(filename: string, base64Data: string, type: string) {
  const binary = window.atob(base64Data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function escapeCsvValue(value: string | number) {
  const output = String(value ?? "");
  if (output.includes(",") || output.includes("\"") || output.includes("\n")) {
    return `"${output.replaceAll("\"", "\"\"")}"`;
  }
  return output;
}

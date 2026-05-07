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

export function formatTimeValue(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutSuffix = raw.replace(/\s*wib$/i, "").trim();
  const shortMatch = withoutSuffix.match(/^(\d{1,2})[:.](\d{2})$/);
  if (shortMatch) {
    return `${shortMatch[1].padStart(2, "0")}.${shortMatch[2]}`;
  }

  const date = new Date(withoutSuffix);
  if (!Number.isNaN(date.getTime()) && /T\d{2}:\d{2}/.test(withoutSuffix)) {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta"
    })
      .format(date)
      .replace(":", ".");
  }

  const genericTime = withoutSuffix.match(/(\d{2})[:.](\d{2})(?::\d{2})?/);
  if (genericTime) {
    return `${genericTime[1]}.${genericTime[2]}`;
  }

  return withoutSuffix.replace(/:/g, ".");
}

export function formatTimeRange(start: string, end: string) {
  const startValue = formatTimeValue(start);
  const endValue = formatTimeValue(end);

  if (!startValue && !endValue) return "-";
  if (startValue && endValue) return `${startValue} - ${endValue} WIB`;
  return `${startValue || endValue} WIB`;
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

export function normalizeBase64(base64Data: string) {
  return base64Data.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
}

export function base64ToUint8Array(base64Data: string) {
  const normalized = normalizeBase64(base64Data);
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function downloadBase64File(filename: string, base64Data: string, type: string) {
  const bytes = base64ToUint8Array(base64Data);
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

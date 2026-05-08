import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import xlsx from "xlsx";

const cwd = process.cwd();
const envPath = path.join(cwd, ".env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;

if (!API_URL) {
  console.error("NEXT_PUBLIC_GAS_API_URL belum ditemukan di .env.local.");
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));
const username = args.username || process.env.WARGART_IMPORT_USERNAME || "sekretaris";
const password = args.password || process.env.WARGART_IMPORT_PASSWORD || "admin123";
const filePath = path.resolve(cwd, args.file || "Database_fix.xlsx");
const dryRun = Boolean(args["dry-run"]);

if (!fs.existsSync(filePath)) {
  console.error(`File sumber tidak ditemukan: ${filePath}`);
  process.exit(1);
}

const workbook = xlsx.readFile(filePath);
const firstSheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[firstSheetName];
const rows = xlsx.utils.sheet_to_json(sheet, {
  defval: "",
  raw: false
});

const mapped = [];
const skipped = [];

for (const [index, sourceRow] of rows.entries()) {
  const mappedRow = mapSourceRow(sourceRow, index + 2);
  if (mappedRow.skip) {
    skipped.push(mappedRow);
    continue;
  }
  mapped.push(mappedRow);
}

console.log(`Sumber sheet: ${firstSheetName}`);
console.log(`Total baris dibaca: ${rows.length}`);
console.log(`Siap diimpor: ${mapped.length}`);
console.log(`Dilewati: ${skipped.length}`);

if (skipped.length) {
  console.log("Contoh baris dilewati:");
  for (const item of skipped.slice(0, 5)) {
    console.log(`- baris ${item.sourceRow}: ${item.reason}`);
  }
}

if (dryRun) {
  console.log("Dry run aktif. Tidak ada data yang dikirim ke GAS.");
  process.exit(0);
}

const session = await postJson(API_URL, {
  action: "login",
  payload: {
    username,
    password
  }
});

if (!session?.token) {
  console.error("Login ke GAS gagal. Pastikan username/password superadmin benar.");
  process.exit(1);
}

const importResult = await postJson(API_URL, {
  action: "importWargaBatch",
  token: session.token,
  payload: {
    rows: mapped
  }
});

console.log("Hasil impor:");
console.log(JSON.stringify(importResult, null, 2));

function parseArgs(entries) {
  const output = {};
  for (let index = 0; index < entries.length; index += 1) {
    const current = entries[index];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = entries[index + 1];
    if (!next || next.startsWith("--")) {
      output[key] = true;
      continue;
    }
    output[key] = next;
    index += 1;
  }
  return output;
}

function mapSourceRow(source, sourceRow) {
  const subjectType = normalizeText(source["Jenis subjek: Warga atau Toko"]);
  if (subjectType && subjectType !== "Warga") {
    return {
      skip: true,
      sourceRow,
      reason: `Jenis subjek ${subjectType} tidak diimpor ke sheet warga`
    };
  }

  const rawStatusTinggal = normalizeText(source["Status tinggal: Tetap / Kontrak / Usaha"]);
  const mappedStatusTinggal = mapStatusTinggal(rawStatusTinggal);
  const notes = [];

  if (rawStatusTinggal && rawStatusTinggal !== mappedStatusTinggal) {
    notes.push(`Status tinggal asal: ${rawStatusTinggal}`);
  }

  const sourceNote = normalizeText(source["Catatan tambahan"]);
  if (sourceNote) {
    notes.push(sourceNote);
  }

  return {
    warga_id: normalizeText(source["ID unik warga"]),
    old_supabase_id: "",
    nama: normalizeText(source["Nama kepala keluarga / penghuni"]),
    status_tinggal: mappedStatusTinggal,
    nomor_rumah: normalizeText(source["Nomor rumah (opsional)"]),
    jumlah_anggota_kk: parseInteger(source["Jumlah anggota KK"]),
    dawis: normalizeText(source["Nomor dawis (1-6 atau TOKO)"]),
    status: mapStatusWarga(normalizeText(source["Status aktif/nonaktif/pindah"])),
    catatan: notes.join(" | ")
  };
}

function mapStatusTinggal(value) {
  const safeValue = normalizeText(value);
  if (safeValue.toLowerCase().includes("kontrak")) {
    return "Kontrak";
  }
  return "Tetap";
}

function mapStatusWarga(value) {
  const safeValue = normalizeText(value).toLowerCase();
  if (safeValue === "pindah") {
    return "Pindah";
  }
  if (safeValue === "nonaktif") {
    return "Nonaktif";
  }
  return "Aktif";
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function parseInteger(value) {
  const normalized = normalizeText(value);
  if (!normalized) return 0;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Request ke GAS gagal.");
  }
  return json.data;
}

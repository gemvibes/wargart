"use client";

import {
  ApiResponse,
  AttendanceItem,
  DashboardSummary,
  ExportFilePayload,
  FotoKegiatan,
  Kegiatan,
  KegiatanDetailResponse,
  KegiatanPdfExportPayload,
  KegiatanPayload,
  RekapFilters,
  RekapKehadiranItem,
  SessionPayload,
  User,
  Warga,
  WargaPayload
} from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
const TOKEN_STORAGE_KEY = "wargart_token";
const GET_CACHE_TTL_MS = 20_000;
const getRequestCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

function ensureApiUrl() {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_GAS_API_URL belum diatur.");
  }
  return API_URL;
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

export function storeToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  invalidateGetCache();
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  invalidateGetCache();
}

export function readStoredToken() {
  return getStoredToken();
}

function buildGetCacheKey(action: string, params?: Record<string, string | undefined>) {
  return JSON.stringify({
    action,
    token: getStoredToken(),
    params: params ?? {}
  });
}

function invalidateGetCache() {
  getRequestCache.clear();
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.message || "Permintaan gagal diproses.");
  }
  return json.data;
}

async function getRequest<T>(action: string, params?: Record<string, string | undefined>) {
  const cacheKey = buildGetCacheKey(action, params);
  const cached = getRequestCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as Promise<T>;
  }

  const url = new URL(ensureApiUrl());
  url.searchParams.set("action", action);

  const token = getStoredToken();
  if (token) {
    url.searchParams.set("token", token);
  }

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const request = fetch(url.toString(), {
    method: "GET",
    cache: "no-store"
  }).then((response) => handleResponse<T>(response));

  getRequestCache.set(cacheKey, {
    expiresAt: Date.now() + GET_CACHE_TTL_MS,
    value: request
  });

  try {
    return await request;
  } catch (error) {
    getRequestCache.delete(cacheKey);
    throw error;
  }
}

async function postRequest<T>(action: string, payload?: object) {
  const body = {
    action,
    token: getStoredToken(),
    payload: payload ?? {}
  };

  const response = await fetch(ensureApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  const result = await handleResponse<T>(response);
  invalidateGetCache();
  return result;
}

export const apiClient = {
  tokenKey: TOKEN_STORAGE_KEY,
  login: (username: string, password: string) =>
    postRequest<SessionPayload>("login", { username, password }),
  me: () => getRequest<User>("me"),
  getDashboardSummary: () => getRequest<DashboardSummary>("getDashboardSummary"),
  getWarga: (params?: Record<string, string | undefined>) => getRequest<Warga[]>("getWarga", params),
  createWarga: (payload: WargaPayload) => postRequest<Warga>("createWarga", payload),
  updateWarga: (warga_id: string, payload: WargaPayload) =>
    postRequest<Warga>("updateWarga", { warga_id, ...payload }),
  deleteWarga: (warga_id: string) => postRequest<boolean>("deleteWarga", { warga_id }),
  importWargaBatch: (rows: Array<Record<string, unknown>>) =>
    postRequest<{
      imported: number;
      created: number;
      updated: number;
      skipped: number;
      items: Array<Record<string, unknown>>;
    }>("importWargaBatch", { rows }),
  getKegiatan: (params?: Record<string, string | undefined>) =>
    getRequest<Kegiatan[]>("getKegiatan", params),
  getKegiatanDetail: (kegiatan_id: string) =>
    getRequest<KegiatanDetailResponse>("getKegiatanDetail", { kegiatan_id }),
  createKegiatan: (payload: KegiatanPayload) =>
    postRequest<Kegiatan>("createKegiatan", payload),
  updateKegiatan: (kegiatan_id: string, payload: KegiatanPayload) =>
    postRequest<Kegiatan>("updateKegiatan", { kegiatan_id, ...payload }),
  deleteKegiatan: (kegiatan_id: string) => postRequest<boolean>("deleteKegiatan", { kegiatan_id }),
  getKegiatanKehadiran: (kegiatan_id: string) =>
    getRequest<AttendanceItem[]>("getKegiatanKehadiran", { kegiatan_id }),
  saveKehadiran: (kegiatan_id: string, attendance: AttendanceItem[]) =>
    postRequest<boolean>("saveKehadiran", { kegiatan_id, attendance }),
  uploadFoto: (payload: {
    kegiatan_id: string;
    file_name: string;
    mime_type: string;
    base64_data: string;
    caption: string;
  }) => postRequest<FotoKegiatan>("uploadFotoKegiatan", payload),
  deleteFoto: (foto_id: string) => postRequest<boolean>("deleteFotoKegiatan", { foto_id }),
  getKegiatanPdfData: (kegiatan_id: string) =>
    postRequest<KegiatanPdfExportPayload>("getKegiatanPdfData", { kegiatan_id }),
  exportKegiatan: (kegiatan_id: string, format: "pdf" | "docx") =>
    postRequest<ExportFilePayload>("exportKegiatan", { kegiatan_id, format }),
  getRekapKehadiran: (filters: RekapFilters) =>
    getRequest<RekapKehadiranItem[]>("getRekapKehadiran", {
      search: filters.search,
      dawis: filters.dawis,
      status_tinggal: filters.status_tinggal,
      kategori: filters.kategori,
      jenis_kegiatan: filters.jenis_kegiatan,
      tanggal_mulai: filters.tanggal_mulai,
      tanggal_selesai: filters.tanggal_selesai,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order
    })
};

const CONFIG = {
  SHEETS: {
    USERS: "users",
    WARGA: "warga",
    KEGIATAN: "kegiatan",
    KEHADIRAN: "kehadiran",
    FOTO: "foto_kegiatan",
    SETTINGS: "settings",
    LOGS: "logs"
  },
  PROPERTIES: {
    SPREADSHEET_ID: "SPREADSHEET_ID",
    DRIVE_FOLDER_ID: "DRIVE_FOLDER_ID",
    DOC_TEMPLATE_ID: "DOC_TEMPLATE_ID",
    EXPORT_FOLDER_ID: "EXPORT_FOLDER_ID",
    SESSION_SECRET: "SESSION_SECRET",
    FRONTEND_APP_URL: "FRONTEND_APP_URL"
  },
  SESSION_CACHE_PREFIX: "session:",
  SESSION_TTL_SECONDS: 21600
};

const SETUP_INPUT = {
  spreadsheetId: "1KJ0nmRXuWw6-bhhIkGiaDSUoHFTR7_zNml3kQqOKC1k",
  documentationFolderId: "1LrKF3l1FzafaouYZmeAi9PFKlmx4sEMZ",
  exportFolderId: "10lFIBh8CgPQGuMqIq2dlUb8HbwvRAsof",
  frontendAppUrl: "https://titeni.vercel.app",
  docTemplateId: "",
  sessionSecret: "ganti-dengan-session-secret-aman",
  autoCreateTemplate: true,
  overwriteTemplateProperty: false,
  autoSeedUsers: true,
  initialUsers: [
    {
      nama: "Sekretaris RT",
      username: "sekretaris",
      password: "admin123",
      role: "superadmin",
      status: "Aktif"
    },
    {
      nama: "Ketua RT",
      username: "ketua",
      password: "ketua123",
      role: "viewer",
      status: "Aktif"
    },
    {
      nama: "Warga RT",
      username: "warga",
      password: "warga123",
      role: "viewer",
      status: "Aktif"
    }
  ]
};

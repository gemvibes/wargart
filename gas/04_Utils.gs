function getRequiredValue_(value, message) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(message);
  }
  return String(value).trim();
}

function nowIso_() {
  return new Date().toISOString();
}

function sanitizeText_(value) {
  return String(value || "").trim();
}

function parseNumber_(value, fallback) {
  const numberValue = Number(value);
  return isNaN(numberValue) ? fallback : numberValue;
}

function normalizeDateString_(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function isDateInRange_(value, startDate, endDate) {
  const normalized = normalizeDateString_(value);
  if (!normalized) return false;
  if (startDate && normalized < startDate) return false;
  if (endDate && normalized > endDate) return false;
  return true;
}

function formatDateIndo_(value) {
  const date = new Date(value);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd MMMM yyyy");
}

function safelyDeleteDriveFile_(fileId) {
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (error) {}
}


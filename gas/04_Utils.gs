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

function digestKey_(value) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(value));
  return digest
    .map(function (byte) {
      const normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    })
    .join("");
}

function getDataVersion_(scope) {
  return (
    PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.DATA_VERSION_PREFIX + scope) ||
    "1"
  );
}

function buildDataCacheKey_(key, scopes) {
  const version = (scopes || []).map(getDataVersion_).join("|");
  return CONFIG.DATA_CACHE_PREFIX + digestKey_(key + "::" + version);
}

function readThroughDataCache_(key, scopes, producer, ttlSeconds) {
  const cacheKey = buildDataCacheKey_(key, scopes);
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = producer();
  const serialized = JSON.stringify(result);

  if (serialized.length <= 90000) {
    try {
      cache.put(cacheKey, serialized, ttlSeconds || CONFIG.DATA_CACHE_TTL_SECONDS);
    } catch (error) {}
  }

  return result;
}

function bumpDataVersion_(scopes) {
  const properties = PropertiesService.getScriptProperties();
  const value = String(new Date().getTime());
  (scopes || []).forEach(function (scope) {
    properties.setProperty(CONFIG.PROPERTIES.DATA_VERSION_PREFIX + scope, value);
  });
}

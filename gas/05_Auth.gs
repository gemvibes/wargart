function hashPassword(password) {
  const input = sanitizeText_(password);
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input);
  return digest
    .map(function (byte) {
      const normalized = byte < 0 ? byte + 256 : byte;
      return ("0" + normalized.toString(16)).slice(-2);
    })
    .join("");
}

function createSessionToken_(user) {
  const secret =
    PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.SESSION_SECRET) ||
    "wargart-secret";
  const rawToken = [user.user_id, user.username, new Date().getTime(), Utilities.getUuid(), secret].join("|");
  return hashPassword(rawToken);
}

function persistSession_(token, user) {
  const cache = CacheService.getScriptCache();
  cache.put(
    CONFIG.SESSION_CACHE_PREFIX + token,
    JSON.stringify({
      user_id: user.user_id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      status: user.status
    }),
    CONFIG.SESSION_TTL_SECONDS
  );
}

function verifySession(token) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(CONFIG.SESSION_CACHE_PREFIX + token);
  if (!cached) {
    throw new Error("Sesi login tidak valid atau sudah berakhir.");
  }
  return JSON.parse(cached);
}

function requireAuth_(token) {
  const safeToken = sanitizeText_(token);
  if (!safeToken) {
    throw new Error("Token login wajib dikirim.");
  }
  return verifySession(safeToken);
}

function requireSuperAdmin(user) {
  if (!user || user.role !== "superadmin") {
    throw new Error("Aksi ini hanya boleh dilakukan oleh superadmin.");
  }
}

function getMe_(e) {
  return requireAuth_(e.parameter.token);
}

function login_(username, password) {
  const safeUsername = getRequiredValue_(username, "Username wajib diisi.");
  const safePassword = getRequiredValue_(password, "Password wajib diisi.");
  const users = readSheetAsObjects(CONFIG.SHEETS.USERS);
  const passwordHash = hashPassword(safePassword);
  const user = users.find(function (item) {
    return (
      sanitizeText_(item.username) === safeUsername &&
      sanitizeText_(item.password_hash) === passwordHash &&
      sanitizeText_(item.status || "Aktif") === "Aktif"
    );
  });

  if (!user) {
    throw new Error("Username atau password tidak sesuai.");
  }

  const safeUser = {
    user_id: user.user_id,
    nama: user.nama,
    username: user.username,
    role: user.role,
    status: user.status
  };

  const token = createSessionToken_(safeUser);
  persistSession_(token, safeUser);

  return {
    token: token,
    user: safeUser
  };
}


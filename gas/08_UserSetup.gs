function seedInitialUsers() {
  const seededUsers = seedInitialUsers_();
  return {
    success: true,
    created: seededUsers.created,
    skipped: seededUsers.skipped,
    users: seededUsers.users
  };
}

function resetInitialUsers() {
  const usersSheet = getSheet(CONFIG.SHEETS.USERS);
  const lastRow = usersSheet.getLastRow();
  if (lastRow > 1) {
    usersSheet.deleteRows(2, lastRow - 1);
  }
  return seedInitialUsers();
}

function seedInitialUsers_() {
  const existingUsers = readSheetAsObjects(CONFIG.SHEETS.USERS);
  const existingByUsername = existingUsers.reduce(function (map, item) {
    map[String(item.username)] = item;
    return map;
  }, {});

  const result = {
    created: 0,
    skipped: 0,
    users: []
  };

  (SETUP_INPUT.initialUsers || []).forEach(function (item) {
    const username = getRequiredValue_(item.username, "Username user awal wajib diisi.");
    if (existingByUsername[username]) {
      result.skipped += 1;
      result.users.push({
        username: username,
        status: "skipped"
      });
      return;
    }

    const record = {
      user_id: generateId("U", CONFIG.SHEETS.USERS, "user_id"),
      nama: getRequiredValue_(item.nama, "Nama user awal wajib diisi."),
      username: username,
      password_hash: hashPassword(getRequiredValue_(item.password, "Password user awal wajib diisi.")),
      role: getRequiredValue_(item.role, "Role user awal wajib diisi."),
      status: sanitizeText_(item.status) || "Aktif",
      created_at: nowIso_()
    };

    appendRow(CONFIG.SHEETS.USERS, record);
    result.created += 1;
    result.users.push({
      user_id: record.user_id,
      nama: record.nama,
      username: record.username,
      role: record.role,
      status: "created"
    });
  });

  return result;
}


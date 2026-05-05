function logAction(userId, action, target) {
  const log = {
    log_id: generateId("LOG", CONFIG.SHEETS.LOGS, "log_id"),
    user_id: userId,
    aksi: action,
    target: target,
    timestamp: nowIso_()
  };
  appendRow(CONFIG.SHEETS.LOGS, log);
}


function logAction(userId, action, target) {
  const log = {
    log_id: "LOG-" + new Date().getTime() + "-" + Utilities.getUuid().slice(0, 8),
    user_id: userId,
    aksi: action,
    target: target,
    timestamp: nowIso_()
  };
  appendRow(CONFIG.SHEETS.LOGS, log);
}

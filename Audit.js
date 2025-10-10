/**
 * @file Higher level helpers for audit reporting. The low-level `logAction`
 * implementation lives in Logger.js to avoid duplicate global definitions.
 */

var AUDIT_SHEET_NAME =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_AUDIT_LOG ? SHEETS.SYS_AUDIT_LOG : 'SYS_Audit_Log';

function logUserActivity(actorId, sheetName, action, targetId, details) {
  return logAction(actorId, sheetName, action, targetId, details);
}

function getUserAuditTrail(userId, limit) {
  var records = getLogs({ userId: userId });
  if (typeof limit === 'number' && limit > 0) {
    return records.slice(0, limit);
  }
  return records;
}

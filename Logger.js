/**
 * @file Central audit logging helpers. These functions append rows to the
 * `SYS_Audit_Log` sheet and expose simple readers for reporting.
 */

var AUDIT_LOG_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_AUDIT_LOG ? SHEETS.SYS_AUDIT_LOG : 'SYS_Audit_Log';
var AUDIT_REPORT_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_AUDIT_REPORT
    ? SHEETS.SYS_AUDIT_REPORT
    : 'SYS_Audit_Report';

function logAction(actorId, sheetName, action, targetId, details) {
  var sheet = ensureHeaders(AUDIT_LOG_SHEET, getHeaders(AUDIT_LOG_SHEET));
  if (!sheet) {
    throw new Error('logAction: sheet ' + AUDIT_LOG_SHEET + ' not available.');
  }
  Logger.log(
    'logAction: writing audit entry ' + action + ' for ' + targetId + ' on sheet ' + sheet.getName()
  );
  var auditId = createPrefixedId('AUD', AUDIT_LOG_SHEET);
  var timestamp = ensureISODate(new Date());
  var payload = [
    auditId,
    actorId || 'SYSTEM',
    sheetName || '',
    action || '',
    targetId || '',
    safeJsonStringify(details),
    timestamp,
  ];
  sheet.appendRow(payload);
  return auditId;
}

function logAuditReport(actorId, entity, action, targetId, summary, details, scope) {
  var headers = getHeaders(AUDIT_REPORT_SHEET);
  var sheet = ensureHeaders(AUDIT_REPORT_SHEET, headers);
  if (!sheet) {
    throw new Error('logAuditReport: sheet ' + AUDIT_REPORT_SHEET + ' not available.');
  }

  var auditId = createPrefixedId('AUDR', AUDIT_REPORT_SHEET);
  var timestamp = ensureISODate(new Date());
  var payload = [
    auditId,
    entity || '',
    targetId || '',
    action || '',
    actorId || 'SYSTEM',
    summary || '',
    safeJsonStringify(details),
    scope || 'GLOBAL',
    timestamp,
  ];
  sheet.appendRow(payload);
  return auditId;
}

function getLogs(filter) {
  var rows = readSheetAsObjects(AUDIT_LOG_SHEET);
  if (!filter) return rows;

  var fromISO = filter.fromDate
    ? typeof filter.fromDate === 'string'
      ? filter.fromDate
      : formatISODate(filter.fromDate)
    : null;
  var toISO = filter.toDate
    ? typeof filter.toDate === 'string'
      ? filter.toDate
      : formatISODate(filter.toDate)
    : null;

  return rows.filter(function (row) {
    if (filter.userId && row.User_Id !== filter.userId) return false;
    if (filter.action && row.Action !== filter.action) return false;
    if (filter.targetId && row.Target_Id !== filter.targetId) return false;
    if (fromISO && String(row.Created_At) < fromISO) return false;
    if (toISO && String(row.Created_At) > toISO) return false;
    return true;
  });
}

function exportLogs(range) {
  var sheet = ensureHeaders(AUDIT_LOG_SHEET, getHeaders(AUDIT_LOG_SHEET));
  var dataRange = range || sheet.getDataRange();
  return dataRange.getValues();
}

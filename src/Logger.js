// Logger.js — minimal audit log

var AUDIT_LOG_SHEET = 'SYS_Audit_Log';
var AUDIT_HEADERS = [
  'Audit_Id',
  'Actor_Id',
  'Sheet_Name',
  'Action',
  'Target_Id',
  'Details_JSON',
  'Created_At',
];

function logAction(actorId, sheetName, action, targetId, details) {
  var sh = ensureHeaders(AUDIT_LOG_SHEET, AUDIT_HEADERS);
  var id = 'AUD_' + zeroPad(sh.getLastRow(), 5);
  var row = [
    id,
    actorId || 'SYSTEM',
    sheetName || '',
    action || '',
    targetId || '',
    safeJsonStringify(details),
    ensureISODate(new Date()),
  ];
  sh.appendRow(row);
  return id;
}

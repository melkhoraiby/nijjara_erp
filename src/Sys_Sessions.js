// Sys_Sessions.js — sessions sheet helpers

var SESSIONS_SHEET = 'SYS_Sessions';
var SESSION_HEADERS = [
  'Session_Id',
  'User_Id',
  'Device',
  'Ip_Address',
  'Auth_Token',
  'Created_At',
  'Last_Seen',
  'Revoked_At',
  'Revoked_By',
];

function createSession(userId, device, ipAddress, authToken, actorId) {
  var sh = ensureHeaders(SESSIONS_SHEET, SESSION_HEADERS);
  var id = 'SES_' + zeroPad(sh.getLastRow(), 5);
  var now = ensureISODate(new Date());
  var row = [id, userId, device || '', ipAddress || '', authToken || '', now, now, '', ''];
  sh.appendRow(row);
  logAction(actorId || userId || 'SYSTEM', SESSIONS_SHEET, 'CREATE_SESSION', id, {
    userId: userId,
  });
  return { Session_Id: id, User_Id: userId, Created_At: now };
}

function listSessionsForUser(userId) {
  var rows = readSheetAsObjects(SESSIONS_SHEET);
  return rows.filter(function (r) {
    return r.User_Id === userId;
  });
}

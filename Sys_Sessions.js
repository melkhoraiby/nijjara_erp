/**
 * @file Session management helpers for SYS_Sessions sheet.
 */

var SESSIONS_SHEET_NAME =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_SESSIONS ? SHEETS.SYS_SESSIONS : 'SYS_Sessions';

var SESSION_HEADERS_FALLBACK = [
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

function getSessionHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(SESSIONS_SHEET_NAME);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return SESSION_HEADERS_FALLBACK.slice();
}

function listSessionsForUser(userId) {
  var headers = getSessionHeaders_();
  var sheet = ensureHeaders(SESSIONS_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return values
    .map(function (row) {
      var session = {};
      for (var i = 0; i < headers.length; i++) {
        session[headers[i]] = row[i];
      }
      return session;
    })
    .filter(function (session) {
      return session.User_Id === userId;
    });
}

function createSession(userId, device, ipAddress, authToken, actorId) {
  actorId = actorId || userId || 'SYSTEM';
  var headers = getSessionHeaders_();
  var sheet = ensureHeaders(SESSIONS_SHEET_NAME, headers);
  if (!sheet) {
    throw new Error('createSession: sheet ' + SESSIONS_SHEET_NAME + ' not available.');
  }
  Logger.log(
    'createSession: using sheet ' +
      sheet.getName() +
      ' (id=' +
      sheet.getSheetId() +
      ') for user ' +
      userId
  );
  var sessionId = createPrefixedId('SES', SESSIONS_SHEET_NAME);
  var now = ensureISODate(new Date());

  var record = {
    Session_Id: sessionId,
    User_Id: userId,
    Device: device || '',
    Ip_Address: ipAddress || '',
    Auth_Token: authToken || '',
    Created_At: now,
    Last_Seen: now,
    Revoked_At: '',
    Revoked_By: '',
  };

  var row = headers.map(function (header) {
    return record.hasOwnProperty(header) ? record[header] : '';
  });

  sheet.appendRow(row);
  logAction(actorId, SESSIONS_SHEET_NAME, 'CREATE_SESSION', sessionId, { userId: userId });
  return record;
}

function updateSessionLastSeen(sessionId) {
  var headers = getSessionHeaders_();
  var sheet = ensureHeaders(SESSIONS_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === sessionId) {
      values[i][6] = ensureISODate(new Date());
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      break;
    }
  }
}

function revokeSessionById(sessionId, actorId) {
  actorId = actorId || 'SYSTEM';
  var headers = getSessionHeaders_();
  var sheet = ensureHeaders(SESSIONS_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return null;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === sessionId) {
      values[i][7] = ensureISODate(new Date());
      values[i][8] = actorId;
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      logAction(actorId, SESSIONS_SHEET_NAME, 'REVOKE_SESSION', sessionId, {});
      return rowToSession_(values[i], headers);
    }
  }
  return null;
}

function revokeSessions(userId) {
  var headers = getSessionHeaders_();
  var sheet = ensureHeaders(SESSIONS_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return 0;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var now = ensureISODate(new Date());
  var count = 0;
  for (var i = 0; i < values.length; i++) {
    if (values[i][1] === userId && !values[i][7]) {
      values[i][7] = now;
      values[i][8] = 'SYSTEM';
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      count++;
    }
  }
  if (count) {
    logAction('SYSTEM', SESSIONS_SHEET_NAME, 'REVOKE_USER_SESSIONS', userId, { revoked: count });
  }
  return count;
}

function rowToSession_(row, headers) {
  headers = headers || getSessionHeaders_();
  var session = {};
  for (var i = 0; i < headers.length; i++) {
    session[headers[i]] = row[i];
  }
  return session;
}

// Auth.js — minimal local login backed by SYS_Users (seeds default admin)

function loginAndGetData(username, password, options) {
  options = options || {};
  if (!username || !password) throw new Error('Username and password are required.');

  var seeded = ensureSeedUser_();
  var user = getUserByUsername(username);
  if (!user || !toBoolean(user.IsActive)) throw new Error('Invalid credentials.');

  if (!verifyPassword_(password, user.Password_Hash)) throw new Error('Invalid credentials.');

  // Update last login
  var ss = SpreadsheetApp.getActive();
  var sh = ensureHeaders(USERS_SHEET, USER_HEADERS);
  var values = sh.getDataRange().getValues();
  var head = values[0];
  for (var i = 1; i < values.length; i++) {
    if (values[i][head.indexOf('User_Id')] === user.User_Id) {
      values[i][head.indexOf('Last_Login')] = ensureISODate(new Date());
      values[i][head.indexOf('Updated_At')] = ensureISODate(new Date());
      values[i][head.indexOf('Updated_By')] = user.User_Id;
      sh.getRange(i + 1, 1, 1, head.length).setValues([values[i]]);
      break;
    }
  }
  var session = createSession(
    user.User_Id,
    options.device || 'WEB',
    options.ipAddress || '',
    options.authToken || '',
    user.User_Id
  );
  logAction(user.User_Id, 'AUTH', 'LOGIN', user.User_Id, { sessionId: session.Session_Id });

  return {
    currentUser: {
      userId: user.User_Id,
      fullName: user.Full_Name,
      email: user.Email,
      roleId: user.Role_Id,
      department: user.Department,
    },
    systemOverview: getUsersOverviewSummary(),
  };
}

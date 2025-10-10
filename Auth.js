/**
 * @file Manages user authentication and session handling.
 */

function loginAndGetData(username, password, options) {
  options = options || {};
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  var normalizedUsername = normalizeUsername(username);
  var users = listUsers();
  if (!users || !users.length) {
    throw new Error('Invalid credentials (بيانات الدخول غير صحيحة).');
  }

  var user = null;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (normalizeUsername(u.Username) === normalizedUsername) {
      user = u;
      break;
    }
  }

  if (!user || !toBoolean(user.IsActive)) {
    throw new Error('Invalid credentials (بيانات الدخول غير صحيحة).');
  }

  if (!user.Password_Hash) {
    throw new Error('Local authentication is disabled for this account.');
  }

  var isValid = verifyPassword_(password, user.Password_Hash);
  if (!isValid) {
    throw new Error('Invalid credentials (بيانات الدخول غير صحيحة).');
  }

  updateUser(user.User_Id, { Last_Login: ensureISODate(new Date()) }, 'SYSTEM');

  var usersSheet =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_USERS ? SHEETS.SYS_USERS : 'SYS_Users';
  createSession(user.User_Id, options.device, options.ipAddress, options.authToken, user.User_Id);
  logAction(user.User_Id, usersSheet, 'LOGIN', user.User_Id, {});
  if (typeof logAuditReport === 'function') {
    logAuditReport(user.User_Id, usersSheet, 'LOGIN', user.User_Id, 'User login', {}, 'GLOBAL');
  }

  var rolesPayload = listRoles();
  var permissionsPayload = getPermissions(user.Role_Id);

  var response = {
    currentUser: {
      userId: user.User_Id,
      fullName: user.Full_Name,
      email: user.Email,
      roleId: user.Role_Id,
      department: user.Department,
    },
    roles: rolesPayload,
    permissions: permissionsPayload,
    systemOverview: null,
  };

  try {
    var PK =
      typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS
        ? CONSTANTS.PERMISSION_KEYS
        : null;
    var canView = true;
    if (typeof hasPermission === 'function') {
      var key = PK ? PK.VIEW_USERS : 'VIEW_USERS';
      canView = hasPermission(user.User_Id, key);
    }
    response.systemOverview =
      canView && typeof getUsersOverviewSummary === 'function' ? getUsersOverviewSummary() : null;
  } catch (err) {
    response.systemOverview = null;
  }

  return JSON.parse(JSON.stringify(response));
}

function buildSystemOverviewForUser_(userRecord) {
  if (!userRecord) return null;
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS
      ? CONSTANTS.PERMISSION_KEYS
      : null;
  if (typeof hasPermission === 'function') {
    var key = PK ? PK.VIEW_USERS : 'VIEW_USERS';
    if (!hasPermission(userRecord.User_Id, key)) return null;
  }
  if (typeof getUsersOverviewSummary !== 'function') return null;
  try {
    return getUsersOverviewSummary();
  } catch (err) {
    return null;
  }
}

// Sys_Users.js — minimal users CRUD + seeder

var USERS_SHEET = 'SYS_Users';
var USER_HEADERS = [
  'User_Id',
  'Full_Name',
  'Username',
  'Email',
  'Job_Title',
  'Department',
  'Role_Id',
  'IsActive',
  'Disabled_At',
  'Disabled_By',
  'Password_Hash',
  'Last_Login',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By',
  'External_Id',
  'MFA_Enabled',
  'Notes',
];

function listUsers(options) {
  options = options || {};
  var rows = readSheetAsObjects(USERS_SHEET);
  return rows.filter(function (r) {
    if (options.isActive !== undefined && toBoolean(r.IsActive) !== options.isActive) return false;
    if (options.roleId && String(r.Role_Id) !== String(options.roleId)) return false;
    if (options.department && String(r.Department) !== String(options.department)) return false;
    if (options.search) {
      var s = String(options.search).toLowerCase();
      var hit =
        (r.Full_Name || '').toLowerCase().indexOf(s) !== -1 ||
        (r.Username || '').toLowerCase().indexOf(s) !== -1 ||
        (r.Email || '').toLowerCase().indexOf(s) !== -1;
      if (!hit) return false;
    }
    r.IsActive = toBoolean(r.IsActive);
    r.MFA_Enabled = toBoolean(r.MFA_Enabled);
    return true;
  });
}

function getUserByUsername(username) {
  var uu = normalizeUsername(username);
  var rows = readSheetAsObjects(USERS_SHEET);
  for (var i = 0; i < rows.length; i++) {
    if (normalizeUsername(rows[i].Username) === uu) return rows[i];
  }
  return null;
}

function getUser(userId) {
  var rows = readSheetAsObjects(USERS_SHEET);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].User_Id === userId) return rows[i];
  }
  return null;
}

function createUser(record, actorId) {
  var sh = ensureHeaders(USERS_SHEET, USER_HEADERS);
  var now = ensureISODate(new Date());
  var id = 'USR_' + zeroPad(sh.getLastRow(), 5);
  var normalizedEmail = normalizeEmail(record.Email);
  var normalizedUsername = normalizeUsername(record.Username);
  var row = [
    id,
    record.Full_Name || '',
    normalizedUsername,
    normalizedEmail,
    record.Job_Title || '',
    record.Department || '',
    record.Role_Id || 'User',
    record.IsActive === false ? false : true,
    '',
    '',
    record.Password_Hash || '',
    '',
    now,
    actorId || 'SYSTEM',
    now,
    actorId || 'SYSTEM',
    record.External_Id || '',
    !!record.MFA_Enabled,
    record.Notes || '',
  ];
  sh.appendRow(row);
  logAction(actorId || 'SYSTEM', USERS_SHEET, 'CREATE_USER', id, { username: normalizedUsername });
  return getUser(id);
}

function ensureSeedUser_() {
  var sh = ensureHeaders(USERS_SHEET, USER_HEADERS);
  var u = getUserByUsername('mkhoraiby');
  if (u) return u;
  var hash = hashPassword_('210388');
  return createUser(
    {
      Full_Name: 'Mostafa Khoraiby',
      Username: 'mkhoraiby',
      Email: 'mkhoraiby@example.com',
      Role_Id: 'Admin',
      IsActive: true,
      Password_Hash: hash,
      MFA_Enabled: false,
    },
    'SYSTEM'
  );
}

function getUsersOverviewSummary() {
  var rows = listUsers();
  var total = rows.length,
    active = rows.filter(function (r) {
      return !!r.IsActive;
    }).length;
  var inactive = total - active;
  return {
    totalUsers: total,
    activeUsers: active,
    inactiveUsers: inactive,
    lockedUsers: inactive,
    roles: 0,
    permissions: 0,
    pendingPasswordResets: 0,
  };
}

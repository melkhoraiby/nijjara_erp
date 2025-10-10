var ROLES_SHEET_NAME =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_ROLES ? SHEETS.SYS_ROLES : 'SYS_Roles';
var ROLE_HEADERS_FALLBACK = [
  'Role_Id',
  'Role_Title',
  'Description',
  'Is_System',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By',
];

function getRoleHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(ROLES_SHEET_NAME);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return ROLE_HEADERS_FALLBACK.slice();
}

function listRoles() {
  var headers = getRoleHeaders_();
  var sheet = ensureHeaders(ROLES_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return values.map(function (row) {
    var role = {};
    for (var i = 0; i < headers.length; i++) {
      role[headers[i]] = row[i];
    }
    role.Is_System = toBoolean(role.Is_System);
    return role;
  });
}

function getRole(roleId) {
  if (!roleId) return null;
  var roles = listRoles();
  for (var i = 0; i < roles.length; i++) {
    if (roles[i].Role_Id === roleId) return roles[i];
  }
  return null;
}

function createRole(roleData, actorId) {
  actorId = actorId || 'SYSTEM';
  if (!roleData.Role_Title) throw new Error('Role_Title is required.');
  var headers = getRoleHeaders_();
  var sheet = ensureHeaders(ROLES_SHEET_NAME, headers);
  var now = ensureISODate(new Date());
  var roleId = roleData.Role_Id || createPrefixedId('ROL', ROLES_SHEET_NAME);
  if (getRole(roleId)) {
    throw new Error('Role already exists: ' + roleId);
  }
  var record = {
    Role_Id: roleId,
    Role_Title: roleData.Role_Title,
    Description: roleData.Description || '',
    Is_System: toBoolean(roleData.Is_System),
    Created_At: now,
    Created_By: actorId,
    Updated_At: now,
    Updated_By: actorId,
  };
  var row = headers.map(function (header) {
    return record.hasOwnProperty(header) ? record[header] : '';
  });
  sheet.appendRow(row);
  logAction(actorId, ROLES_SHEET_NAME, 'CREATE_ROLE', roleId, { title: record.Role_Title });
  return record;
}

function assignRole(userId, roleId, actorId, effectiveFrom) {
  ensureRoleExists(roleId);
  return assignRoleToUser(userId, roleId, actorId, effectiveFrom);
}

function ensureRoleExists(roleId) {
  if (!getRole(roleId)) {
    throw new Error('Unknown role: ' + roleId);
  }
}

function getRoles() {
  return listRoles();
}

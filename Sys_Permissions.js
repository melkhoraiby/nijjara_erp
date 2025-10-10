var ROLE_PERMISSIONS_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_ROLE_PERMISSIONS
    ? SHEETS.SYS_ROLE_PERMISSIONS
    : 'SYS_Role_Permissions';
var PERMISSIONS_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_PERMISSIONS
    ? SHEETS.SYS_PERMISSIONS
    : 'SYS_Permissions';

var ROLE_PERMISSION_HEADERS_FALLBACK = [
  'Role_Id',
  'Permission_Key',
  'Scope',
  'Allowed',
  'Constraints',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By',
];

var PERMISSION_HEADERS_FALLBACK = [
  'Permission_Key',
  'Permission_Label',
  'Description',
  'Category',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By',
];

function getRolePermissionHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(ROLE_PERMISSIONS_SHEET);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return ROLE_PERMISSION_HEADERS_FALLBACK.slice();
}

function getPermissionHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(PERMISSIONS_SHEET);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return PERMISSION_HEADERS_FALLBACK.slice();
}

function setPermission(roleId, permissionKey, scope, allow, actorId) {
  actorId = actorId || 'SYSTEM';
  var headers = getRolePermissionHeaders_();
  var sheet = ensureHeaders(ROLE_PERMISSIONS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  var now = ensureISODate(new Date());
  var createdAtIdx = headers.indexOf('Created_At');
  var createdByIdx = headers.indexOf('Created_By');
  var updatedAtIdx = headers.indexOf('Updated_At');
  var updatedByIdx = headers.indexOf('Updated_By');
  var record = {
    Role_Id: roleId,
    Permission_Key: permissionKey,
    Scope: scope || 'GLOBAL',
    Allowed: allow ? true : false,
    Constraints: '',
    Created_At: now,
    Created_By: actorId,
    Updated_At: now,
    Updated_By: actorId,
  };
  var updated = false;
  if (lastRow >= 2) {
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var i = 0; i < values.length; i++) {
      if (values[i][0] === roleId && values[i][1] === permissionKey) {
        var existing = values[i].slice();
        if (createdAtIdx !== -1) record.Created_At = existing[createdAtIdx] || record.Created_At;
        if (createdByIdx !== -1) record.Created_By = existing[createdByIdx] || record.Created_By;
        var rowNumber = i + 2;
        var row = headers.map(function (header) {
          return record[header];
        });
        sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
        updated = true;
        break;
      }
    }
  }
  if (!updated) {
    var rowValues = headers.map(function (header) {
      return record[header];
    });
    sheet.appendRow(rowValues);
  }
  logAction(
    actorId,
    ROLE_PERMISSIONS_SHEET,
    updated ? 'UPDATE_PERMISSION' : 'CREATE_PERMISSION',
    roleId,
    { permissionKey: permissionKey, scope: scope, allowed: !!allow }
  );
}

function listPermissionCatalog() {
  var headers = getPermissionHeaders_();
  var sheet = ensureHeaders(PERMISSIONS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row) {
    var entry = {};
    for (var i = 0; i < headers.length; i++) {
      entry[headers[i]] = row[i];
    }
    return entry;
  });
}

function getPermissions(roleId) {
  ensureRolePermissionsSeeded_();
  var headers = getRolePermissionHeaders_();
  var sheet = ensureHeaders(ROLE_PERMISSIONS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(function (row) {
      return row[0] === roleId;
    })
    .map(function (row) {
      var entry = {};
      for (var i = 0; i < headers.length; i++) {
        entry[headers[i]] = row[i];
      }
      entry.Allowed = toBoolean(entry.Allowed);
      return entry;
    });
}

function listRolePermissionMatrix() {
  ensureRolePermissionsSeeded_();
  var headers = getRolePermissionHeaders_();
  var sheet = ensureHeaders(ROLE_PERMISSIONS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values.map(function (row) {
    var entry = {};
    for (var i = 0; i < headers.length; i++) {
      entry[headers[i]] = row[i];
    }
    entry.Allowed = toBoolean(entry.Allowed);
    return entry;
  });
}

function resolveFieldPerms(userId, fieldId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!userId || !fieldId) return 'READ';
  var canEdit = hasPermission(userId, PK.EDIT_USER, { fieldId: fieldId });
  if (canEdit) return 'WRITE';
  var canView = hasPermission(userId, PK.VIEW_USERS);
  return canView ? 'READ' : 'NONE';
}

function hasPermission(userId, permissionKey, context) {
  context = context || {};
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  var user = getUser(userId);
  if (!user || !user.IsActive) return false;
  if (user.Role_Id === 'Admin') return true;
  ensureRolePermissionsSeeded_();
  var permissions = getPermissions(user.Role_Id);
  var perm = null;
  for (var i = 0; i < permissions.length; i++) {
    if (permissions[i].Permission_Key === permissionKey) {
      perm = permissions[i];
      break;
    }
  }
  if (!perm) {
    return false;
  }
  if (!perm.Allowed) return false;
  var scope = perm.Scope || 'GLOBAL';
  if (scope === 'GLOBAL') return true;
  if (scope === 'LIMITED') {
    if (
      permissionKey === PK.ASSIGN_ROLE &&
      context.newRoleId === 'Admin' &&
      user.Role_Id !== 'Admin'
    ) {
      return false;
    }
    return true;
  }
  if (scope === 'DEPARTMENT') {
    var targetDepartment =
      context.targetDepartment ||
      (context.targetUserId ? (getUser(context.targetUserId) || {}).Department : null);
    return targetDepartment && targetDepartment === user.Department;
  }
  if (scope === 'SELF') {
    return context.targetUserId && context.targetUserId === user.User_Id;
  }
  return false;
}

function ensureRolePermissionsSeeded_() {
  var headers = getRolePermissionHeaders_();
  var sheet = ensureHeaders(ROLE_PERMISSIONS_SHEET, headers);
  if (sheet.getLastRow() >= 2) return;
  var defaults = getDefaultRolePermissions();
  var now = ensureISODate(new Date());
  defaults.forEach(function (perm) {
    var row = headers.map(function (header) {
      if (header === 'Created_At' || header === 'Updated_At') return now;
      if (header === 'Created_By' || header === 'Updated_By') return 'SYSTEM';
      if (header === 'Allowed') return perm.Allowed ? true : false;
      return perm[header] !== undefined ? perm[header] : '';
    });
    sheet.appendRow(row);
  });
}

function cloneRolePermissions(sourceRoleId, targetRoleId, actorId) {
  if (!sourceRoleId || !targetRoleId) {
    throw new Error('Source and target roles are required.');
  }
  if (sourceRoleId === targetRoleId) {
    throw new Error('Source and target roles must be different.');
  }
  var headers = getRolePermissionHeaders_();
  var sheet = ensureHeaders(ROLE_PERMISSIONS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var now = ensureISODate(new Date());
  var preservedRows = [];
  var sourceRows = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === sourceRoleId) {
      sourceRows.push(values[i]);
    } else if (values[i][0] !== targetRoleId) {
      preservedRows.push(values[i]);
    }
  }
  var createdAtIdx = headers.indexOf('Created_At');
  var createdByIdx = headers.indexOf('Created_By');
  var updatedAtIdx = headers.indexOf('Updated_At');
  var updatedByIdx = headers.indexOf('Updated_By');
  var clonedRows = sourceRows.map(function (row) {
    var clone = row.slice();
    clone[0] = targetRoleId;
    if (createdAtIdx !== -1) clone[createdAtIdx] = now;
    if (createdByIdx !== -1) clone[createdByIdx] = actorId || 'SYSTEM';
    if (updatedAtIdx !== -1) clone[updatedAtIdx] = now;
    if (updatedByIdx !== -1) clone[updatedByIdx] = actorId || 'SYSTEM';
    return clone;
  });
  var newRows = preservedRows.concat(clonedRows);
  var range = sheet.getRange(2, 1, Math.max(lastRow - 1, 1), headers.length);
  range.clearContent();
  if (newRows.length) {
    sheet.getRange(2, 1, newRows.length, headers.length).setValues(newRows);
  }
  logAction(actorId || 'SYSTEM', ROLE_PERMISSIONS_SHEET, 'CLONE_ROLE_PERMISSIONS', targetRoleId, {
    sourceRoleId: sourceRoleId,
    cloned: clonedRows.length,
  });
  return clonedRows.length;
}

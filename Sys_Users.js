/**
 * @file Core CRUD helpers for the SYS_Users sheet.
 * Handles ID generation, validation, and audit logging per the access-rights specification.
 */

var USERS_SHEET_NAME =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_USERS ? SHEETS.SYS_USERS : 'SYS_Users';

var USER_HEADERS_FALLBACK = [
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

var USER_PROPERTIES_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_USER_PROPS
    ? SHEETS.SYS_USER_PROPS
    : 'SYS_User_Properties';

var USER_PROPERTY_HEADERS_FALLBACK = [
  'User_Id',
  'Property_Key',
  'Property_Value',
  'Created_At',
  'Created_By',
  'Updated_At',
  'Updated_By',
];

function getUserHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(USERS_SHEET_NAME);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return USER_HEADERS_FALLBACK.slice();
}

function getUserPropertyHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(USER_PROPERTIES_SHEET);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return USER_PROPERTY_HEADERS_FALLBACK.slice();
}

function listUserProperties(userId) {
  var headers = getUserPropertyHeaders_();
  var sheet = ensureHeaders(USER_PROPERTIES_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map(function (row) {
      var prop = {};
      for (var i = 0; i < headers.length; i++) {
        prop[headers[i]] = row[i];
      }
      return prop;
    })
    .filter(function (prop) {
      return !userId || prop.User_Id === userId;
    });
}

function setUserProperty(userId, propertyKey, propertyValue, actorId) {
  actorId = actorId || 'SYSTEM';
  if (!userId || !propertyKey) {
    throw new Error('User_Id and Property_Key are required to set a property.');
  }

  var headers = getUserPropertyHeaders_();
  var sheet = ensureHeaders(USER_PROPERTIES_SHEET, headers);
  var lastRow = sheet.getLastRow();
  var now = ensureISODate(new Date());
  var propertyRow = null;
  var values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];

  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === userId && values[i][1] === propertyKey) {
      propertyRow = { rowNumber: i + 2, values: values[i] };
      break;
    }
  }

  var record = {};
  headers.forEach(function (header) {
    record[header] = '';
  });
  record.User_Id = userId;
  record.Property_Key = propertyKey;
  var normalizedValue = propertyValue;
  if (propertyValue === true || propertyValue === false) {
    normalizedValue = propertyValue ? 'TRUE' : 'FALSE';
  } else if (propertyValue === null || propertyValue === undefined) {
    normalizedValue = '';
  }
  record.Property_Value = normalizedValue;
  record.Updated_At = now;
  record.Updated_By = actorId;

  if (propertyRow) {
    record.Created_At = propertyRow.values[headers.indexOf('Created_At')] || now;
    record.Created_By = propertyRow.values[headers.indexOf('Created_By')] || actorId;
    var updatedRow = headers.map(function (header) {
      return record[header] !== undefined ? record[header] : '';
    });
    sheet.getRange(propertyRow.rowNumber, 1, 1, headers.length).setValues([updatedRow]);
  } else {
    record.Created_At = now;
    record.Created_By = actorId;
    var newRow = headers.map(function (header) {
      return record[header] !== undefined ? record[header] : '';
    });
    sheet.appendRow(newRow);
  }

  return record;
}

function clearUserProperty(userId, propertyKey, actorId) {
  actorId = actorId || 'SYSTEM';
  if (!userId || !propertyKey) return false;
  var headers = getUserPropertyHeaders_();
  var sheet = ensureHeaders(USER_PROPERTIES_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var now = ensureISODate(new Date());
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === userId && values[i][1] === propertyKey) {
      values[i][2] = '';
      var updatedAtIdx = headers.indexOf('Updated_At');
      var updatedByIdx = headers.indexOf('Updated_By');
      if (updatedAtIdx !== -1) values[i][updatedAtIdx] = now;
      if (updatedByIdx !== -1) values[i][updatedByIdx] = actorId;
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      return true;
    }
  }
  return false;
}

function getUsersOverviewSummary() {
  var users = listUsers();
  var total = users.length;
  var active = 0;
  var inactive = 0;
  for (var i = 0; i < users.length; i++) {
    if (toBoolean(users[i].IsActive)) {
      active++;
    } else {
      inactive++;
    }
  }

  var rolesCount = typeof listRoles === 'function' ? listRoles().length : 0;
  var permissionsCount =
    typeof listPermissionCatalog === 'function' ? listPermissionCatalog().length : 0;
  var pendingResets = countPendingPasswordResets_();

  return {
    totalUsers: total,
    activeUsers: active,
    inactiveUsers: inactive,
    lockedUsers: inactive,
    roles: rolesCount,
    permissions: permissionsCount,
    pendingPasswordResets: pendingResets,
  };
}

function countPendingPasswordResets_() {
  var props = listUserProperties();
  var count = 0;
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (prop.Property_Key === 'Must_Change' && toBoolean(prop.Property_Value)) {
      count++;
    }
  }
  return count;
}

function createUser(userInput, actorId) {
  actorId = actorId || 'SYSTEM';
  var headers = getUserHeaders_();
  var sheet = ensureHeaders(USERS_SHEET_NAME, headers);
  var normalizedEmail = normalizeEmail(userInput.Email);
  var normalizedUsername = normalizeUsername(userInput.Username);

  if (!userInput.Full_Name || !normalizedEmail || !normalizedUsername || !userInput.Role_Id) {
    throw new Error('Full name, username, email, and role are required.');
  }
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Invalid email format (صيغة البريد الإلكتروني غير صحيحة).');
  }

  ensureUniqueUserField_('Email', normalizedEmail);
  ensureUniqueUserField_('Username', normalizedUsername);
  ensureRoleExists_(userInput.Role_Id);

  var now = ensureISODate(new Date());
  var userId = createPrefixedId('USR', USERS_SHEET_NAME);
  var tempPassword = null;
  var record = {
    User_Id: userId,
    Full_Name: userInput.Full_Name,
    Username: normalizedUsername,
    Email: normalizedEmail,
    Job_Title: userInput.Job_Title || '',
    Department: userInput.Department || '',
    Role_Id: userInput.Role_Id,
    IsActive: userInput.IsActive === false ? false : true,
    Disabled_At: '',
    Disabled_By: '',
    Password_Hash: userInput.Password_Hash || '',
    Last_Login: '',
    Created_At: now,
    Created_By: actorId,
    Updated_At: now,
    Updated_By: actorId,
    External_Id: userInput.External_Id || '',
    MFA_Enabled: toBoolean(userInput.MFA_Enabled),
    Notes: userInput.Notes || '',
  };

  if (userInput.Password) {
    record.Password_Hash = hashPassword_(userInput.Password);
  } else if (!record.Password_Hash) {
    tempPassword = 'Temp_' + Math.random().toString(36).substring(2, 8);
    record.Password_Hash = hashPassword_(tempPassword);
  }

  var row = headers.map(function (header) {
    return record.hasOwnProperty(header) ? record[header] : '';
  });

  sheet.appendRow(row);
  logAction(actorId, USERS_SHEET_NAME, 'CREATE_USER', userId, {
    email: record.Email,
    roleId: record.Role_Id,
  });
  logAuditReport(
    actorId,
    USERS_SHEET_NAME,
    'CREATE',
    userId,
    'User created',
    { email: record.Email, roleId: record.Role_Id },
    'GLOBAL'
  );

  if (tempPassword) {
    setUserProperty(userId, 'Must_Change', true, actorId);
  }

  record._temporaryPassword = tempPassword;

  tryInvoke_('onUserCreate', record);
  tryInvoke_('sendWelcomeEmail', record);

  return record;
}

function updateUser(userId, updates, actorId) {
  actorId = actorId || 'SYSTEM';
  if (!userId) throw new Error('User_Id is required for update.');

  var headers = getUserHeaders_();
  var sheet = ensureHeaders(USERS_SHEET_NAME, headers);
  var userRowInfo = findUserRow_(sheet, userId);
  if (!userRowInfo) throw new Error('User not found.');

  var originalRecord = Object.assign({}, userRowInfo.record);
  var nextRecord = Object.assign({}, originalRecord);

  if (updates.Email) {
    var normalizedEmail = normalizeEmail(updates.Email);
    if (!isValidEmail(normalizedEmail)) {
      throw new Error('Invalid email format.');
    }
    ensureUniqueUserField_('Email', normalizedEmail, userId);
    nextRecord.Email = normalizedEmail;
  }

  if (updates.Username) {
    var normalizedUsername = normalizeUsername(updates.Username);
    ensureUniqueUserField_('Username', normalizedUsername, userId);
    nextRecord.Username = normalizedUsername;
  }

  if (updates.Role_Id && updates.Role_Id !== originalRecord.Role_Id) {
    ensureRoleExists_(updates.Role_Id);
    nextRecord.Role_Id = updates.Role_Id;
  }

  if (updates.Full_Name) nextRecord.Full_Name = updates.Full_Name;
  if (updates.Job_Title !== undefined) nextRecord.Job_Title = updates.Job_Title || '';
  if (updates.Department !== undefined) nextRecord.Department = updates.Department || '';
  if (updates.Password_Hash !== undefined) nextRecord.Password_Hash = updates.Password_Hash || '';
  if (updates.Last_Login !== undefined) nextRecord.Last_Login = updates.Last_Login || '';
  if (updates.External_Id !== undefined) nextRecord.External_Id = updates.External_Id || '';
  if (updates.MFA_Enabled !== undefined) nextRecord.MFA_Enabled = toBoolean(updates.MFA_Enabled);
  if (updates.Notes !== undefined) nextRecord.Notes = updates.Notes || '';

  if (updates.IsActive !== undefined) {
    var desiredState = toBoolean(updates.IsActive);
    if (!desiredState && originalRecord.IsActive) {
      nextRecord.IsActive = false;
      nextRecord.Disabled_At = ensureISODate(new Date());
      nextRecord.Disabled_By = actorId;
      nextRecord.Last_Login = '';
      revokeSessionsForUser(userId);
      logAction(actorId, USERS_SHEET_NAME, 'DEACTIVATE_USER', userId, {});
    } else if (desiredState && !originalRecord.IsActive) {
      nextRecord.IsActive = true;
      nextRecord.Disabled_At = '';
      nextRecord.Disabled_By = '';
      logAction(actorId, USERS_SHEET_NAME, 'ACTIVATE_USER', userId, {});
    }
  }

  nextRecord.Updated_At = ensureISODate(new Date());
  nextRecord.Updated_By = actorId;

  var updatedRow = headers.map(function (header) {
    return nextRecord.hasOwnProperty(header) ? nextRecord[header] : '';
  });

  sheet.getRange(userRowInfo.rowNumber, 1, 1, headers.length).setValues([updatedRow]);

  var changedFields = diffObjectKeys_(originalRecord, nextRecord);
  if (changedFields.length) {
    logAction(actorId, USERS_SHEET_NAME, 'UPDATE_USER', userId, { changedFields: changedFields });
  }

  if (originalRecord.Role_Id !== nextRecord.Role_Id) {
    logAction(actorId, USERS_SHEET_NAME, 'ROLE_CHANGE', userId, {
      from: originalRecord.Role_Id,
      to: nextRecord.Role_Id,
    });
  }

  tryInvoke_('onUserUpdate', originalRecord, nextRecord);

  return nextRecord;
}

function deleteUser(userId, actorId, options) {
  actorId = actorId || 'SYSTEM';
  if (!userId) throw new Error('User_Id is required for delete.');
  var user = getUser(userId);
  if (!user) throw new Error('User not found.');

  if (user.Role_Id === 'Admin' && countAdmins() <= 1) {
    throw new Error('Cannot remove the last admin user.');
  }

  var updates = { IsActive: false, Disabled_At: ensureISODate(new Date()), Disabled_By: actorId };
  var updated = updateUser(userId, updates, actorId);
  if (options && options.archiveNote) {
    setUserProperty(userId, 'Archive_Note', options.archiveNote, actorId);
  }
  setUserProperty(userId, 'IsArchived', true, actorId);
  logAction(actorId, USERS_SHEET_NAME, 'DELETE_USER', userId, { soft: true });
  logAuditReport(
    actorId,
    USERS_SHEET_NAME,
    'DELETE',
    userId,
    'User archived',
    { reason: options && options.archiveNote ? options.archiveNote : null },
    'GLOBAL'
  );
  tryInvoke_('onUserDelete', user);
  return updated;
}

// Internal: raw status toggling without permission checks.
// Public API with permission checks lives in Permissions.setUserStatus.
function setUserActiveRaw(userId, isActive, actorId) {
  actorId = actorId || 'SYSTEM';
  var payload = { IsActive: !!isActive };
  if (!payload.IsActive) {
    payload.Disabled_At = ensureISODate(new Date());
    payload.Disabled_By = actorId;
  } else {
    payload.Disabled_At = '';
    payload.Disabled_By = '';
  }
  var updated = updateUser(userId, payload, actorId);
  logAuditReport(
    actorId,
    USERS_SHEET_NAME,
    payload.IsActive ? 'ACTIVATE' : 'DEACTIVATE',
    userId,
    payload.IsActive ? 'User reactivated' : 'User deactivated',
    {},
    'GLOBAL'
  );
  return updated;
}

function resetUserPassword(userId, newPassword, actorId) {
  if (!userId) throw new Error('User ID is required for password reset.');
  var passwordToSet = newPassword;
  if (passwordToSet && String(passwordToSet).trim()) {
    passwordToSet = String(passwordToSet).trim();
  } else {
    passwordToSet = 'Temp_' + Math.random().toString(36).substring(2, 10);
  }
  var passwordHash = hashPassword_(passwordToSet);
  updateUser(userId, { Password_Hash: passwordHash }, actorId);
  logAction(actorId, USERS_SHEET_NAME, 'RESET_PASSWORD', userId, {});
  logAuditReport(
    actorId,
    USERS_SHEET_NAME,
    'RESET_PASSWORD',
    userId,
    'Password reset issued',
    {},
    'GLOBAL'
  );
  setUserProperty(userId, 'Must_Change', true, actorId);
  return { password: passwordToSet };
}

function assignRoleToUser(userId, roleId, actorId, effectiveFrom) {
  var updated = updateUser(userId, { Role_Id: roleId }, actorId);
  logAction(actorId, USERS_SHEET_NAME, 'ASSIGN_ROLE', userId, {
    roleId: roleId,
    effectiveFrom: effectiveFrom || null,
  });
  logAuditReport(
    actorId || 'SYSTEM',
    USERS_SHEET_NAME,
    'ASSIGN_ROLE',
    userId,
    'Role assignment',
    { roleId: roleId, effectiveFrom: effectiveFrom || null },
    'GLOBAL'
  );
  return updated;
}

function getUser(userId) {
  if (!userId) return null;
  var headers = getUserHeaders_();
  var sheet = ensureHeaders(USERS_SHEET_NAME, headers);
  var userRow = findUserRow_(sheet, userId);
  return userRow ? userRow.record : null;
}

function findUserByEmail(email) {
  var normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  var users = listUsers();
  for (var i = 0; i < users.length; i++) {
    if (normalizeEmail(users[i].Email) === normalizedEmail) {
      return users[i];
    }
  }
  return null;
}

function listUsers(options) {
  var headers = getUserHeaders_();
  var sheet = ensureHeaders(USERS_SHEET_NAME, headers);
  if (sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var results = values
    .map(function (row) {
      return rowToUser_(row, headers);
    })
    .filter(function (record) {
      if (!options) return true;
      if (options.isActive !== undefined && record.IsActive !== options.isActive) return false;
      if (options.roleId && record.Role_Id !== options.roleId) return false;
      if (options.department && record.Department !== options.department) return false;

      if (options.search) {
        var search = String(options.search).toLowerCase();
        var match =
          (record.Full_Name || '').toLowerCase().indexOf(search) !== -1 ||
          (record.Email || '').toLowerCase().indexOf(search) !== -1 ||
          (record.Username || '').toLowerCase().indexOf(search) !== -1;
        if (!match) return false;
      }
      return true;
    });

  return results;
}

function listActiveUsers() {
  return listUsers({ isActive: true });
}

function countAdmins() {
  return listUsers({ isActive: true, roleId: 'Admin' }).length;
}

function revokeSessionsForUser(userId) {
  if (typeof revokeSessions !== 'function') return;
  try {
    revokeSessions(userId);
  } catch (err) {
    Logger.log('Failed to revoke sessions: ' + err.message);
  }
}

function rowToUser_(row, headers) {
  headers = headers || getUserHeaders_();
  var record = {};
  for (var i = 0; i < headers.length; i++) {
    record[headers[i]] = row[i];
  }
  record.IsActive = toBoolean(record.IsActive);
  record.MFA_Enabled = toBoolean(record.MFA_Enabled);
  return record;
}

function findUserRow_(sheet, userId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;
  var headers = getUserHeaders_();
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === userId) {
      return {
        rowNumber: i + 2,
        record: rowToUser_(values[i], headers),
      };
    }
  }
  return null;
}

function ensureUniqueUserField_(field, value, excludeId) {
  var headers = getUserHeaders_();
  var users = listUsers();
  for (var i = 0; i < users.length; i++) {
    var record = users[i];
    if (excludeId && record.User_Id === excludeId) continue;
    var comparator =
      field === 'Email' ? normalizeEmail(record[field]) : normalizeUsername(record[field]);
    if (comparator === value) {
      if (field === 'Email') {
        throw new Error('Email already exists (مع البريد الإلكتروني موجود بالفعل).');
      }
      if (field === 'Username') {
        throw new Error('Username already exists.');
      }
      throw new Error(field + ' must be unique.');
    }
  }
}

function ensureRoleExists_(roleId) {
  if (!roleId) throw new Error('Role_Id is required.');
  if (typeof getRole === 'function') {
    var role = getRole(roleId);
    if (!role) {
      throw new Error('Role not found: ' + roleId);
    }
  }
}

function diffObjectKeys_(oldObj, newObj) {
  var changed = [];
  for (var key in newObj) {
    if (!newObj.hasOwnProperty(key)) continue;
    if (String(oldObj[key]) !== String(newObj[key])) {
      changed.push(key);
    }
  }
  return changed;
}

function tryInvoke_(fnOrName) {
  var fn = fnOrName;
  if (typeof fnOrName === 'string') {
    var context = typeof globalThis !== 'undefined' ? globalThis : this;
    fn = context && typeof context[fnOrName] === 'function' ? context[fnOrName] : null;
  }
  if (typeof fn !== 'function') return;
  var args = Array.prototype.slice.call(arguments, 1);
  try {
    fn.apply(null, args);
  } catch (err) {
    Logger.log('Callback execution failed: ' + err.message);
  }
}


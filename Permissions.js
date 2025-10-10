function getAllUsers(filterOptions, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (actorId && typeof hasPermission === 'function' && !hasPermission(actorId, PK.VIEW_USERS)) {
    throw new Error('You do not have permission to view users.');
  }
  var options = filterOptions || {};
  return listUsers({
    isActive:
      options.status === 'ACTIVE' ? true : options.status === 'INACTIVE' ? false : undefined,
    roleId: options.roleId,
    department: options.department,
    search: options.search,
  });
}

function createNewUser(userData, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.CREATE_USER)) {
    throw new Error('You do not have permission to create users.');
  }
  if (
    userData.Role_Id === 'Admin' &&
    !hasPermission(actorId, PK.ASSIGN_ROLE, { newRoleId: 'Admin' })
  ) {
    throw new Error('Only administrators can assign the Admin role.');
  }
  var record = createUser(userData, actorId);
  var tempPassword = record._temporaryPassword || null;
  if (tempPassword) delete record._temporaryPassword;
  var response = {
    success: true,
    message: 'User created successfully.',
    user: record,
    newUser: record,
  };
  if (tempPassword) response.temporaryPassword = tempPassword;
  return response;
}

function updateUserData(userId, updates, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  var targetUser = getUser(userId);
  if (!targetUser) throw new Error('Target user not found.');
  if (
    !actorId ||
    !hasPermission(actorId, PK.EDIT_USER, {
      targetUserId: userId,
      targetDepartment: targetUser.Department,
    })
  ) {
    throw new Error('You do not have permission to edit this user.');
  }
  if (
    updates.Role_Id &&
    updates.Role_Id === 'Admin' &&
    !hasPermission(actorId, PK.ASSIGN_ROLE, { newRoleId: 'Admin' })
  ) {
    throw new Error('Only administrators can assign the Admin role.');
  }
  var record = updateUser(userId, updates, actorId);
  return {
    success: true,
    message: 'User updated successfully.',
    user: record,
    updatedUser: record,
  };
}

function setUserStatus(userId, isActive, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  var targetUser = getUser(userId);
  if (!targetUser) throw new Error('Target user not found.');
  if (
    !actorId ||
    !hasPermission(actorId, PK.DEACTIVATE_USER, {
      targetUserId: userId,
      targetDepartment: targetUser.Department,
    })
  ) {
    throw new Error('You do not have permission to update this user.');
  }
  var payload = { IsActive: !!isActive };
  if (!payload.IsActive) {
    payload.Disabled_At = ensureISODate(new Date());
    payload.Disabled_By = actorId;
  } else {
    payload.Disabled_At = '';
    payload.Disabled_By = '';
  }
  var record = updateUser(userId, payload, actorId);
  var USERS_SHEET_KEY =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_USERS ? SHEETS.SYS_USERS : 'SYS_Users';
  if (typeof logAuditReport === 'function') {
    logAuditReport(
      actorId,
      USERS_SHEET_KEY,
      payload.IsActive ? 'ACTIVATE' : 'DEACTIVATE',
      userId,
      payload.IsActive ? 'User reactivated' : 'User deactivated',
      {},
      'GLOBAL'
    );
  }
  return {
    success: true,
    message: isActive ? 'User reactivated.' : 'User deactivated.',
    user: record,
    updatedUser: record,
  };
}

function deleteUserAccount(userId, actorId, options) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.DELETE_USER)) {
    throw new Error('You do not have permission to delete users.');
  }
  var record = deleteUser(userId, actorId, options || {});
  return {
    success: true,
    message: 'User deactivated (soft delete).',
    user: record,
    updatedUser: record,
  };
}

function resetPasswordForUser(userId, actorId, newPassword) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.RESET_PASSWORD)) {
    throw new Error('You do not have permission to reset passwords.');
  }
  var result = resetUserPassword(userId, newPassword, actorId);
  return {
    success: true,
    message: 'Password updated successfully.',
    password: result.password,
    mustChange: true,
  };
}

function bulkAssignRole(userIds, roleId, actorId, effectiveFrom) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.ASSIGN_ROLE, { newRoleId: roleId })) {
    throw new Error('You do not have permission to assign roles.');
  }
  if (!Array.isArray(userIds)) {
    userIds = userIds ? [userIds] : [];
  }
  var results = [];
  var errors = [];
  for (var i = 0; i < userIds.length; i++) {
    try {
      var userId = userIds[i];
      var updated = assignRoleToUser(userId, roleId, actorId, effectiveFrom);
      var USERS_SHEET_KEY =
        typeof SHEETS !== 'undefined' && SHEETS.SYS_USERS ? SHEETS.SYS_USERS : 'SYS_Users';
      logAction(actorId, USERS_SHEET_KEY, 'BULK_ASSIGN_ROLE', userId, { roleId: roleId });
      if (typeof logAuditReport === 'function') {
        logAuditReport(
          actorId,
          USERS_SHEET_KEY,
          'BULK_ASSIGN_ROLE',
          userId,
          'Role assigned in bulk',
          { roleId: roleId },
          'GLOBAL'
        );
      }
      results.push(updated);
    } catch (err) {
      errors.push({ userId: userIds[i], message: err.message });
    }
  }
  return { success: errors.length === 0, updated: results, errors: errors };
}

function getRolesList() {
  return listRoles();
}

function getUserProfile(userId, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  var target = getUser(userId);
  if (!target) throw new Error('User not found.');
  if (
    actorId &&
    !hasPermission(actorId, PK.VIEW_USERS, {
      targetUserId: userId,
      targetDepartment: target.Department,
    })
  ) {
    throw new Error('You do not have permission to view this profile.');
  }
  return {
    user: target,
    sessions: listSessionsForUser(userId),
    auditTrail: getUserAuditTrail(userId, 50),
    permissions: getPermissions(target.Role_Id),
    properties: typeof listUserProperties === 'function' ? listUserProperties(userId) : [],
    documents: typeof listDocs === 'function' ? listDocs('Users', userId) : [],
  };
}

function getSystemManagementOverview(actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_USERS)) {
    throw new Error('You do not have permission to view the overview.');
  }
  if (typeof getUsersOverviewSummary !== 'function') return {};
  return getUsersOverviewSummary();
}

function getUsersDirectory(filterOptions, actorId) {
  return getAllUsers(filterOptions, actorId);
}

function getRolesDirectory(actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.ASSIGN_ROLE)) {
    throw new Error('You do not have permission to view roles.');
  }
  return listRoles();
}

function getPermissionsDirectory(actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_AUDIT)) {
    throw new Error('You do not have permission to view permissions.');
  }
  return typeof listPermissionCatalog === 'function' ? listPermissionCatalog() : [];
}

function getRolePermissionMatrix(actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_AUDIT)) {
    throw new Error('You do not have permission to view role permissions.');
  }
  return typeof listRolePermissionMatrix === 'function' ? listRolePermissionMatrix() : [];
}

function cloneRolePermissionsFromRole(sourceRoleId, targetRoleId, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.ASSIGN_ROLE)) {
    throw new Error('You do not have permission to clone role permissions.');
  }
  if (typeof cloneRolePermissions !== 'function') {
    throw new Error('Role permissions cloning is not available.');
  }
  var cloned = cloneRolePermissions(sourceRoleId, targetRoleId, actorId);
  return { success: true, cloned: cloned };
}

function mapRolePermission(actorId, roleId, permissionKey, scope, allowed) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.ASSIGN_ROLE)) {
    throw new Error('You do not have permission to map role permissions.');
  }
  setPermission(roleId, permissionKey, scope, allowed, actorId);
  var ROLE_PERMS_SHEET_KEY =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_ROLE_PERMISSIONS
      ? SHEETS.SYS_ROLE_PERMISSIONS
      : 'SYS_Role_Permissions';
  if (typeof logAuditReport === 'function') {
    logAuditReport(
      actorId,
      ROLE_PERMS_SHEET_KEY,
      'MAP_ROLE_PERMISSION',
      roleId,
      'Role permission updated',
      { permissionKey: permissionKey, scope: scope, allowed: allowed },
      'GLOBAL'
    );
  }
  return { success: true };
}

function getUserPropertiesList(userId, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_USERS, { targetUserId: userId })) {
    throw new Error('You do not have permission to view user properties.');
  }
  return typeof listUserProperties === 'function' ? listUserProperties(userId) : [];
}

function getUserDocumentsList(userId, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_USERS, { targetUserId: userId })) {
    throw new Error('You do not have permission to view user documents.');
  }
  return typeof listDocs === 'function' ? listDocs('Users', userId) : [];
}

function impersonateUserSession(targetUserId, actorId, justification, durationMinutes) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.IMPERSONATE, { targetUserId: targetUserId })) {
    throw new Error('You do not have permission to impersonate users.');
  }
  var target = getUser(targetUserId);
  if (!target) throw new Error('Target user not found.');
  var session = createSession(targetUserId, 'IMPERSONATION', '', '', actorId + '->' + targetUserId);
  setUserProperty(targetUserId, 'Last_Impersonated_By', actorId, actorId);
  var USERS_SHEET_KEY =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_USERS ? SHEETS.SYS_USERS : 'SYS_Users';
  if (typeof logAuditReport === 'function') {
    logAuditReport(
      actorId,
      USERS_SHEET_KEY,
      'IMPERSONATE',
      targetUserId,
      'Impersonation session created',
      {
        sessionId: session.Session_Id,
        justification: justification,
        durationMinutes: durationMinutes || null,
      },
      'GLOBAL'
    );
  }
  return { success: true, message: 'Impersonation session started.', session: session };
}

function exportUsersDirectory(filterOptions, actorId) {
  var rows = getAllUsers(filterOptions, actorId);
  return rows.map(function (row) {
    return [
      row.User_Id,
      row.Full_Name,
      row.Username,
      row.Email,
      row.Department,
      row.Role_Id,
      row.IsActive ? 'Active' : 'Inactive',
      row.Last_Login || '',
      row.Updated_At || '',
    ];
  });
}

function FORM_SYS_AddUser(formData, actorId) {
  formData = formData || {};
  var payload = {
    Full_Name: formData.Full_Name,
    Username: formData.Username,
    Email: formData.Email,
    Job_Title: formData.Job_Title || '',
    Department: formData.Department || '',
    Role_Id: formData.Role_Id,
    MFA_Enabled: formData.MFA_Enabled === true || formData.MFA_Enabled === 'true',
    Notes: formData.Notes || '',
  };
  return createNewUser(payload, actorId);
}

function FORM_SYS_EditUser(formData, actorId) {
  formData = formData || {};
  if (!formData.User_Id) throw new Error('User_Id is required.');
  var updates = {
    Full_Name: formData.Full_Name,
    Username: formData.Username,
    Email: formData.Email,
    Job_Title: formData.Job_Title,
    Department: formData.Department,
    Role_Id: formData.Role_Id,
    Notes: formData.Notes,
  };
  return updateUserData(formData.User_Id, updates, actorId);
}

function FORM_SYS_ToggleActive(formData, actorId) {
  formData = formData || {};
  var action = (formData.Action || '').toUpperCase();
  var activate = action === 'ACTIVATE';
  var result = setUserStatus(formData.User_Id, activate, actorId);
  if (formData.Reason) {
    setUserProperty(formData.User_Id, 'Last_Status_Reason', formData.Reason, actorId);
  }
  return result;
}

function FORM_SYS_ResetPassword(formData, actorId) {
  formData = formData || {};
  return resetPasswordForUser(formData.User_Id, actorId, formData.New_Password);
}

function FORM_SYS_AssignRole(formData, actorId) {
  formData = formData || {};
  var roleId = formData.Role_Id;
  if (!roleId) throw new Error('Role_Id is required.');
  var selected = formData.Selected_User_Ids || formData.User_Id || formData.User_Ids;
  if (!selected) throw new Error('At least one user must be selected.');
  var userIds = Array.isArray(selected)
    ? selected
    : String(selected)
        .split(',')
        .map(function (id) {
          return id.trim();
        })
        .filter(function (id) {
          return id;
        });
  return bulkAssignRole(userIds, roleId, actorId, formData.Effective_From);
}

function FORM_SYS_DeleteUser(formData, actorId) {
  formData = formData || {};
  return deleteUserAccount(formData.User_Id, actorId, { archiveNote: formData.Archive_Note });
}

function FORM_SYS_Impersonate(formData, actorId) {
  formData = formData || {};
  return impersonateUserSession(
    formData.Target_User_Id,
    actorId,
    formData.Justification || '',
    formData.Duration_Minutes
  );
}

function FORM_SYS_UploadUserDoc(formData, actorId) {
  formData = formData || {};
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_USERS, { targetUserId: formData.User_Id })) {
    throw new Error('You do not have permission to manage user documents.');
  }
  if (typeof uploadDocument !== 'function') {
    throw new Error('Document upload is not configured.');
  }
  var meta = {
    Entity: 'Users',
    Entity_ID: formData.User_Id,
    Label: formData.Document_Label,
    Notes: formData.Notes || '',
    Uploaded_By: actorId,
    File_Name: formData.File_Name || formData.Document_Label || '',
    Drive_URL: formData.File_URL || '',
    Drive_File_ID: formData.Drive_File_ID || '',
  };
  return uploadDocument(null, meta);
}

function FORM_SYS_MapRolePermission(formData, actorId) {
  formData = formData || {};
  return mapRolePermission(
    actorId,
    formData.Role_Id,
    formData.Permission_Key,
    formData.Scope,
    formData.Allowed
  );
}

function FORM_SYS_CloneRolePerms(formData, actorId) {
  formData = formData || {};
  return cloneRolePermissionsFromRole(formData.Source_Role_Id, formData.Target_Role_Id, actorId);
}

function deleteDocument(docId, actorId) {
  var PK =
    typeof CONSTANTS !== 'undefined' && CONSTANTS.PERMISSION_KEYS ? CONSTANTS.PERMISSION_KEYS : {};
  if (!actorId || !hasPermission(actorId, PK.VIEW_USERS)) {
    throw new Error('You do not have permission to delete documents.');
  }
  var success = deleteDoc(docId, actorId);
  return { success: success };
}

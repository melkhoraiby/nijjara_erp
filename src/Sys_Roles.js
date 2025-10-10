// Sys_Roles.js — role and permission management
// Works with sheets: SYS_Roles, SYS_Permissions, SYS_Role_Permissions

/**
 * Get all roles for dropdowns and management UI.
 */
function getRoles() {
  const functionName = 'getRoles';
  try {
    if (!hasPermission('SYS_VIEW_ROLES')) {
      return { success: false, error: 'Access denied to view roles.' };
    }
    const roles = _getRows('SYS_Roles');
    return roles.map((r) => ({
      Role_Id: r.Role_Id,
      Role_Title: r.Role_Title,
      Description: r.Description,
      IsActive: r.IsActive,
    }));
  } catch (e) {
    logAction(functionName, 'ERROR', { error: e.toString() });
    return { success: false, error: 'Failed to get roles.' };
  }
}

/**
 * Create a new role
 */
function createRole(roleData) {
  const functionName = 'createRole';
  try {
    if (!hasPermission('SYS_CREATE_ROLE')) {
      return { success: false, error: 'Access denied to create roles.' };
    }
    if (!roleData.Role_Title) {
      return { success: false, error: 'Role title is required.' };
    }
    const role = {
      Role_Id: Utilities.getUuid(),
      Role_Title: roleData.Role_Title,
      Description: roleData.Description || '',
      IsActive: true,
      Created_At: new Date().toISOString(),
    };
    _addRow('SYS_Roles', role);
    logAction(functionName, 'CREATE_ROLE', { role });
    return { success: true, data: role };
  } catch (e) {
    logAction(functionName, 'ERROR', { error: e.toString() });
    return { success: false, error: 'Failed to create role.' };
  }
}

/**
 * Assign permissions to a role
 */
function assignRolePermissions(roleId, permissionKeys = []) {
  const functionName = 'assignRolePermissions';
  try {
    if (!hasPermission('SYS_ASSIGN_PERMISSIONS')) {
      return { success: false, error: 'Access denied to assign permissions.' };
    }
    const rolePermsSheet = 'SYS_Role_Permissions';
    const existing = _getRows(rolePermsSheet).filter((r) => r.Role_Id === roleId);
    existing.forEach((r) => _deleteRow(rolePermsSheet, 'RolePerm_Id', r.RolePerm_Id));

    permissionKeys.forEach((key) => {
      _addRow(rolePermsSheet, {
        RolePerm_Id: Utilities.getUuid(),
        Role_Id: roleId,
        Permission_Key: key,
        Created_At: new Date().toISOString(),
      });
    });
    logAction(functionName, 'ASSIGN_PERMISSIONS', { roleId, permissionKeys });
    return { success: true };
  } catch (e) {
    logAction(functionName, 'ERROR', { error: e.toString() });
    return { success: false, error: 'Failed to assign role permissions.' };
  }
}

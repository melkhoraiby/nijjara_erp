// Permissions.js — single source of truth for permissions & scopes

/**
 * hasPermission(permissionKey: string, { user }?: {user: obj})
 * - Admin has all permissions.
 * - Otherwise checks SYS_Role_Permissions for Allowed=TRUE.
 */
function hasPermission(permissionKey, opts) {
  try {
    const userObj =
      (opts && opts.user) ||
      safeJsonParse(PropertiesService.getUserProperties().getProperty('currentUser'), null);
    if (!userObj) return false;

    const roleId = userObj.Role_Id;
    if (!roleId) return false;

    // Admin shortcut
    if (String(roleId).toLowerCase() === 'admin') return true;

    // Matrix check
    const rolePerms = _getRows('SYS_Role_Permissions');
    const match = rolePerms.find(
      (r) =>
        r.Role_Id === roleId &&
        r.Permission_Key === permissionKey &&
        (r.Allowed === true || String(r.Allowed).toLowerCase() === 'true')
    );

    return !!match;
  } catch (e) {
    logAction('hasPermission', 'ERROR', { permissionKey, error: e.toString() });
    return false;
  }
}

/**
 * Thin convenience wrapper, used by some modules.
 */
function canPerform(actionKey) {
  return hasPermission(actionKey);
}

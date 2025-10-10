// Sys_Audit.js — centralized audit trail utilities
// Uses SYS_Audit_Report sheet to record CRUD, login, and permission actions.

function logAction(functionName, actionType, meta = {}) {
  try {
    const entry = {
      Audit_Id: Utilities.getUuid(),
      Timestamp: new Date().toISOString(),
      User_Email: Session.getActiveUser().getEmail(),
      Function_Name: functionName,
      Action_Type: actionType,
      Meta_Data: safeJsonStringify(meta),
    };
    _addRow('SYS_Audit_Report', entry);
    return true;
  } catch (e) {
    console.error('logAction error:', e);
    return false;
  }
}

/**
 * Fetches audit logs (filtered optionally by entity or user).
 * Corresponds to view PV_SYS_Audit.
 */
function getAuditLogs(filters = {}) {
  const functionName = 'getAuditLogs';
  try {
    if (!hasPermission('SYS_VIEW_AUDIT')) {
      return { success: false, error: 'Access denied to audit logs.' };
    }

    let rows = _getRows('SYS_Audit_Report');
    if (filters.userEmail)
      rows = rows.filter((r) => r.User_Email && r.User_Email === filters.userEmail);
    if (filters.entity)
      rows = rows.filter((r) => r.Function_Name && r.Function_Name.includes(filters.entity));
    if (filters.actionType) rows = rows.filter((r) => r.Action_Type === filters.actionType);

    rows.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    return { success: true, data: rows };
  } catch (e) {
    logAction(functionName, 'ERROR', { error: e.toString(), stack: e.stack });
    return { success: false, error: 'Failed to fetch audit logs.' };
  }
}

// Sys_ProfileView.js — full user profile fetcher for modal views

function getFullUserProfile(userId) {
  const functionName = 'getFullUserProfile';
  try {
    if (!hasPermission('SYS_VIEW_PROFILE')) {
      return { success: false, error: 'Access denied to view user profile.' };
    }

    const users = _getRows('SYS_Users');
    const docs = _getRows('SYS_Documents');
    const sessions = _getRows('SYS_Sessions');
    const audit = _getRows('SYS_Audit_Report');
    const props = _getRows('SYS_User_Properties');

    const user = users.find((u) => u.User_Id === userId);
    if (!user) return { success: false, error: 'User not found.' };

    return {
      success: true,
      data: {
        user,
        documents: docs.filter((d) => d.Entity === 'Users' && d.Entity_ID === userId),
        sessions: sessions.filter((s) => s.User_Id === userId),
        audit: audit.filter((a) => a.Meta_Data.includes(userId)),
        properties: props.filter((p) => p.User_Id === userId),
      },
    };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString() });
    return { success: false, error: 'Failed to fetch user profile.' };
  }
}

// Auth.js — authentication + initial payload (aligned with Dashboard.html)

function loginAndGetData(username, password) {
  const fn = 'loginAndGetData';
  try {
    const users = _getRows('SYS_Users');

    // Verify active user + password
    const user = users.find(
      (u) =>
        u.Username === username &&
        (u.IsActive === true || String(u.IsActive).toLowerCase() === 'true') &&
        verifyPassword_(password, u.Password_Hash)
    );

    if (!user) {
      logAction(fn, 'LOGIN_FAILED', { username, reason: 'Invalid creds or inactive' });
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // Persist session
    PropertiesService.getUserProperties().setProperty('currentUser', JSON.stringify(user));
    logAction(fn, 'LOGIN_SUCCESS', { username });

    // Overview (KPI cards + users grid)
    const overview = getSysManagementOverview();
    const cards = overview && overview.success ? overview.data.cards : {};
    const usersGrid = overview && overview.success ? overview.data.users : [];

    // Roles for dropdowns
    let roles = [];
    const rolesRes = getRoles();
    if (Array.isArray(rolesRes)) roles = rolesRes; // our getRoles() returns array on success

    return {
      success: true,
      currentUser: {
        User_Id: user.User_Id,
        Full_Name: user.Full_Name,
        Email: user.Email,
        Role_Id: user.Role_Id,
      },
      users: usersGrid,
      roles: roles,
      cards: cards,
    };
  } catch (e) {
    logAction(fn, 'ERROR', { username, error: e.toString() });
    return { success: false, error: 'An unexpected error occurred during login.' };
  }
}

// Backward-compat shim (Dashboard may call this in some places)
function loginAndGetInitialData(username, password) {
  return loginAndGetData(username, password);
}

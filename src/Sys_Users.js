/**
 * Main entry point to fetch all necessary data for the System Management Overview tab.
 * Ensures the user has the required permissions before fetching any data.
 * @returns {object} An object containing summary card data and the initial user list, or an error object.
 */
function getSysManagementOverview() {
  const functionName = 'getSysManagementOverview';
  try {
    // Permission-first design: Abort if user lacks the necessary view permission.
    if (!hasPermission('SYS_VIEW')) {
      const errorMsg = 'Access denied. You do not have permission to view system management data.';
      logAction(functionName, 'PERMISSION_DENIED', { error: errorMsg });
      return { success: false, error: errorMsg };
    }

    // Log the initiation of the data fetch action.
    logAction(functionName, 'FETCH_INITIATED', { user: Session.getActiveUser().getEmail() });

    // Fetch data for both cards and the main user grid.
    const cardData = getSysOverviewCards_();
    const userData = getSysUsersGridData_();

    // Combine results into a single successful response object.
    const response = {
      success: true,
      data: {
        cards: cardData,
        users: userData,
      },
    };

    return response;
  } catch (e) {
    // Comprehensive error logging for debugging.
    logAction(functionName, 'ERROR', { error: e.toString(), stack: e.stack });
    return {
      success: false,
      error: 'An unexpected error occurred while fetching system overview data.',
    };
  }
}

/**
 * Fetches the data required for the summary cards on the System Management Overview page.
 * Corresponds to task T1.0 and view definitions PV_SYS_Overview_*.
 * @private
 * @returns {object} An object with counts for total users, active users, and total roles.
 */
function getSysOverviewCards_() {
  const functionName = 'getSysOverviewCards_';
  try {
    // Get all records from the SYS_Users and SYS_Roles sheets.
    const allUsers = _getRows('SYS_Users');
    const allRoles = _getRows('SYS_Roles');

    // Calculate the required metrics based on the design specification.
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter((user) => user.IsActive === true).length;
    const totalRoles = allRoles.length;

    // Return the data in a structured object for the front end.
    return {
      PV_SYS_Overview_TotalUsers: totalUsers,
      PV_SYS_Overview_Active: activeUsers,
      PV_SYS_Overview_Roles: totalRoles,
    };
  } catch (e) {
    // Log the specific error and re-throw to be caught by the main function.
    logAction(functionName, 'ERROR', {
      error: `Failed to calculate summary card data: ${e.toString()}`,
    });
    throw new Error(`Error in ${functionName}: ${e.message}`);
  }
}

/**
 * Fetches and formats the list of users for the main grid, with optional filtering.
 * Corresponds to task T1.1 and view definition PV_SYS_Users_Table.
 * @private
 * @param {object} [filters={}] - Optional filters for the user list.
 * @param {string} [filters.searchTerm] - A string to search against name, username, and email.
 * @param {string} [filters.department] - The department to filter by.
 * @param {string} [filters.roleId] - The role ID to filter by.
 * @param {boolean} [filters.isActive] - The active status to filter by.
 * @returns {Array<object>} An array of user objects with only the specified columns.
 */
function getSysUsersGridData_(filters = {}) {
  const functionName = 'getSysUsersGridData_';
  try {
    let allUsers = _getRows('SYS_Users');

    // Apply filters if they are provided
    if (filters) {
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        allUsers = allUsers.filter(
          (user) =>
            (user.Full_Name && user.Full_Name.toLowerCase().includes(searchTerm)) ||
            (user.Username && user.Username.toLowerCase().includes(searchTerm)) ||
            (user.Email && user.Email.toLowerCase().includes(searchTerm))
        );
      }
      if (filters.department) {
        allUsers = allUsers.filter((user) => user.Department === filters.department);
      }
      if (filters.roleId) {
        allUsers = allUsers.filter((user) => user.Role_Id === filters.roleId);
      }
      if (filters.isActive !== undefined && filters.isActive !== null) {
        allUsers = allUsers.filter((user) => user.IsActive === filters.isActive);
      }
    }

    // Map the raw data to a clean array of objects with keys matching the spec.
    const formattedUsers = allUsers.map((user) => ({
      User_Id: user.User_Id,
      Full_Name: user.Full_Name,
      Username: user.Username,
      Email: user.Email,
      Department: user.Department,
      Role_Id: user.Role_Id,
      IsActive: user.IsActive,
      Last_Login: user.Last_Login,
      Updated_At: user.Updated_At,
    }));

    return formattedUsers;
  } catch (e) {
    // Log the specific error and re-throw.
    logAction(functionName, 'ERROR', { error: `Failed to fetch user grid data: ${e.toString()}` });
    throw new Error(`Error in ${functionName}: ${e.message}`);
  }
}

/**
 * Fetches the complete profile details for a single user.
 * This includes user data, documents, sessions, and audit logs.
 * @param {string} userId The ID of the user to fetch details for.
 * @returns {object} An object containing the user's full profile, or an error object.
 */
function getUserProfileDetails(userId) {
  const functionName = 'getUserProfileDetails';
  try {
    if (!hasPermission('SYS_VIEW')) {
      const errorMsg = 'Access denied. You do not have permission to view user profiles.';
      logAction(functionName, 'PERMISSION_DENIED', { userId, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    logAction(functionName, 'FETCH_INITIATED', {
      userId,
      user: Session.getActiveUser().getEmail(),
    });

    // Fetch primary user data
    const userProfile = _getRows('SYS_Users').find((u) => u.User_Id === userId);
    if (!userProfile) {
      return { success: false, error: 'User not found.' };
    }

    // Fetch related data from other sheets
    const userDocuments = _getRows('SYS_Documents').filter(
      (d) => d.Entity === 'Users' && d.Entity_ID === userId
    );
    const userSessions = _getRows('SYS_Sessions').filter((s) => s.User_Id === userId);
    const userAuditLogs = _getRows('SYS_Audit_Report').filter(
      (a) => a.Entity === 'Users' && a.Entity_ID === userId
    );

    return {
      success: true,
      data: {
        profile: userProfile,
        documents: userDocuments,
        sessions: userSessions,
        audit: userAuditLogs,
      },
    };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString(), stack: e.stack });
    return {
      success: false,
      error: `An unexpected error occurred while fetching the user profile for User ID: ${userId}`,
    };
  }
}

/**
 * Creates a new user in the system based on the provided form data.
 * Corresponds to form FORM_SYS_AddUser.
 * @param {object} userData - An object containing the new user's information.
 * @returns {object} A success or error object.
 */
function addUser(userData) {
  const functionName = 'addUser';
  try {
    // Permission-first: Ensure the user has rights to create new users.
    if (!hasPermission('SYS_CREATE_USER')) {
      const errorMsg = 'Access denied. You do not have permission to add new users.';
      logAction(functionName, 'PERMISSION_DENIED', { error: errorMsg });
      return { success: false, error: errorMsg };
    }

    // Validate required fields as per the design spec.
    const requiredFields = ['Full_Name', 'Username', 'Email', 'Department', 'Role_Id'];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Auto-generate system-managed fields.
    const newUser = {
      ...userData,
      User_Id: Utilities.getUuid(), // AutoGenerate User_Id
      Password_Hash: 'TEMP_HASH', // Placeholder for password generation/hashing logic
      IsActive: userData.IsActive !== undefined ? userData.IsActive : true, // Default to TRUE
      Created_At: new Date().toISOString(),
      Updated_At: new Date().toISOString(),
    };

    // Add the new row to the sheet.
    _addRow('SYS_Users', newUser);

    // Log the successful creation event for auditing.
    logAction(functionName, 'CREATE_USER', { userId: newUser.User_Id, data: newUser });

    return { success: true, data: newUser };
  } catch (e) {
    logAction(functionName, 'ERROR', { error: e.toString(), stack: e.stack });
    return { success: false, error: 'An unexpected error occurred while adding the user.' };
  }
}

/**
 * Updates an existing user's information.
 * Corresponds to form FORM_SYS_EditUser.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updatedData - An object with the fields to update.
 * @returns {object} A success or error object.
 */
function editUser(userId, updatedData) {
  const functionName = 'editUser';
  try {
    if (!hasPermission('SYS_UPDATE_USER')) {
      const errorMsg = 'Access denied. You do not have permission to edit users.';
      logAction(functionName, 'PERMISSION_DENIED', { userId, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    // Define the fields that are allowed to be edited via this form.
    const editableFields = ['Full_Name', 'Email', 'Department', 'Role_Id'];
    const dataToUpdate = {};
    editableFields.forEach((field) => {
      if (updatedData[field] !== undefined) {
        dataToUpdate[field] = updatedData[field];
      }
    });

    if (Object.keys(dataToUpdate).length === 0) {
      return { success: false, error: 'No valid fields to update were provided.' };
    }

    // Add the timestamp for the update.
    dataToUpdate.Updated_At = new Date().toISOString();

    // Update the row in the sheet.
    const result = _updateRow('SYS_Users', 'User_Id', userId, dataToUpdate);

    if (!result) {
      return { success: false, error: 'User not found or update failed.' };
    }

    logAction(functionName, 'UPDATE_USER', { userId, changes: dataToUpdate });

    return { success: true, data: result };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString(), stack: e.stack });
    return { success: false, error: `An unexpected error occurred while editing user ${userId}.` };
  }
}

/**
 * Toggles the IsActive status of a user.
 * Corresponds to form FORM_SYS_ToggleActive.
 * @param {string} userId - The ID of the user to toggle.
 * @param {boolean} isActive - The new active status for the user.
 * @returns {object} A success or error object.
 */
function toggleUserStatus(userId, isActive) {
  const functionName = 'toggleUserStatus';
  try {
    if (!hasPermission('SYS_TOGGLE_USER_STATUS')) {
      const errorMsg = 'Access denied. You do not have permission to change user status.';
      logAction(functionName, 'PERMISSION_DENIED', { userId, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const currentUser = Session.getActiveUser().getEmail();
    const now = new Date().toISOString();

    const dataToUpdate = {
      IsActive: isActive,
      Updated_At: now,
      Disabled_At: !isActive ? now : '',
      Disabled_By: !isActive ? currentUser : '',
    };

    const result = _updateRow('SYS_Users', 'User_Id', userId, dataToUpdate);

    if (!result) {
      return { success: false, error: 'User not found or update failed.' };
    }

    logAction(functionName, 'TOGGLE_ACTIVE', {
      userId,
      newStatus: isActive,
      toggledBy: currentUser,
    });

    return { success: true, data: result };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString(), stack: e.stack });
    return {
      success: false,
      error: `An unexpected error occurred while toggling status for user ${userId}.`,
    };
  }
}

/**
 * Resets a user's password to a temporary value and flags the account to require a password change on next login.
 * Corresponds to form FORM_SYS_ResetPassword.
 * @param {string} userId - The ID of the user whose password will be reset.
 * @returns {object} A success or error object.
 */
function resetUserPassword(userId) {
  const functionName = 'resetUserPassword';
  try {
    if (!hasPermission('SYS_RESET_PASSWORD')) {
      return {
        success: false,
        error: 'Access denied. You do not have permission to reset passwords.',
      };
    }

    const tempPasswordHash = 'TEMP_HASH_' + Utilities.getUuid(); // Placeholder for actual hash generation.
    _updateRow('SYS_Users', 'User_Id', userId, { Password_Hash: tempPasswordHash });

    _setOrUpdateUserProperty(userId, 'Must_Change_Password', true);

    logAction(functionName, 'RESET_PASSWORD', {
      userId,
      admin: Session.getActiveUser().getEmail(),
    });

    return {
      success: true,
      message: 'Password has been reset. User must change it on next login.',
    };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString() });
    return { success: false, error: 'Failed to reset password.' };
  }
}

/**
 * Assigns a new role to a user.
 * Corresponds to form FORM_SYS_AssignRole.
 * @param {string} userId - The ID of the user.
 * @param {string} newRoleId - The new Role ID to assign.
 * @returns {object} A success or error object.
 */
function assignUserRole(userId, newRoleId) {
  const functionName = 'assignUserRole';
  try {
    if (!hasPermission('SYS_ASSIGN_ROLE')) {
      return {
        success: false,
        error: 'Access denied. You do not have permission to assign roles.',
      };
    }

    const result = _updateRow('SYS_Users', 'User_Id', userId, {
      Role_Id: newRoleId,
      Updated_At: new Date().toISOString(),
    });
    if (!result) {
      return { success: false, error: 'User not found or role assignment failed.' };
    }

    logAction(functionName, 'ASSIGN_ROLE', {
      userId,
      newRoleId,
      admin: Session.getActiveUser().getEmail(),
    });
    return { success: true, data: result };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, newRoleId, error: e.toString() });
    return { success: false, error: 'An unexpected error occurred during role assignment.' };
  }
}

/**
 * Performs a soft delete on a user by deactivating them and adding a deletion note.
 * Corresponds to form FORM_SYS_DeleteUser.
 * @param {string} userId - The ID of the user to soft delete.
 * @param {string} note - A reason or note for the deletion.
 * @returns {object} A success or error object.
 */
function softDeleteUser(userId, note) {
  const functionName = 'softDeleteUser';
  try {
    if (!hasPermission('SYS_DELETE_USER_SOFT')) {
      return {
        success: false,
        error: 'Access denied. You do not have permission to delete users.',
      };
    }

    // Deactivate the user
    toggleUserStatus(userId, false);

    // Add deletion properties
    _setOrUpdateUserProperty(userId, 'Deleted', true);
    _setOrUpdateUserProperty(userId, 'Delete_Note', note);

    logAction(functionName, 'DELETE_USER_SOFT', {
      userId,
      note,
      admin: Session.getActiveUser().getEmail(),
    });

    return { success: true, message: 'User has been soft-deleted.' };
  } catch (e) {
    logAction(functionName, 'ERROR', { userId, error: e.toString() });
    return { success: false, error: 'Failed to perform soft delete.' };
  }
}

/**
 * Helper function to add or update a user property in SYS_User_Properties.
 * @private
 * @param {string} userId - The user's ID.
 * @param {string} key - The property key.
 * @param {*} value - The property value.
 */
function _setOrUpdateUserProperty(userId, key, value) {
  const sheetName = 'SYS_User_Properties';
  const properties = _getRows(sheetName);
  const existingProp = properties.find((p) => p.User_Id === userId && p.Property_Key === key);

  if (existingProp) {
    // Update existing property
    _updateRow(sheetName, 'Property_Id', existingProp.Property_Id, { Property_Value: value });
  } else {
    // Add new property
    _addRow(sheetName, {
      Property_Id: Utilities.getUuid(),
      User_Id: userId,
      Property_Key: key,
      Property_Value: value,
      Created_At: new Date().toISOString(),
    });
  }
}
// === Alignment layer for frontend function calls === //

function getAllUsers() {
  const res = getSysUsersGridData_();
  return res || [];
}

function createNewUser(userData, adminId) {
  const res = addUser(userData);
  return {
    newUser: res.data,
    message: res.success ? 'User created successfully' : res.error,
  };
}

function updateUserData(userId, updatedData, adminId) {
  const res = editUser(userId, updatedData);
  return {
    updatedUser: res.data,
    message: res.success ? 'User updated successfully' : res.error,
  };
}

function setUserStatus(userId, newStatus, adminId) {
  const res = toggleUserStatus(userId, newStatus);
  return {
    updatedUser: res.data,
    message: res.success ? 'Status updated successfully' : res.error,
  };
}

function deleteUser(userId, adminId) {
  const res = softDeleteUser(userId, 'Deactivated by admin.');
  return {
    updatedUser: res.data || null,
    message: res.success ? res.message : res.error,
  };
}

function resetPasswordForUser(userId, adminId, newPassword) {
  const res = resetUserPassword(userId);
  return {
    success: res.success,
    password: newPassword,
    message: res.success ? 'Password reset successfully' : res.error,
  };
}

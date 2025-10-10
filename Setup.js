/**
 * @file Contains all one-time setup, database seeding, and administrative functions.
 */

// Master Schema for the entire ERP database.
const MASTER_SCHEMA = {
  SYS_Users: [
    'User_Id',
    'Full_Name',
    'Username',
    'Email',
    'Job_Title',
    'Department',
    'Role_Id',
    'IsActive',
    'Password_Hash',
    'Last_Login',
    'Created_At',
    'Created_By',
    'Updated_At',
    'Updated_By',
    'External_Id',
    'MFA_Enabled',
    'Notes',
  ],
  SYS_Roles: ['Role_Id', 'Role_Title', 'Description', 'Is_System', 'Created_At', 'Updated_At'],
  SYS_Audit_Log: ['Audit_Id', 'User_Id', 'Sheet', 'Action', 'Target_Id', 'Details', 'Created_At'],
  SYS_Dropdowns: ['Dropdown_Id', 'Category', 'Value', 'IsActive', 'Sort_Order'],
  SYS_Settings: ['Setting_Key', 'Setting_Value', 'Description'],
};

/**
 * Main setup function to be run once. Creates and configures all necessary sheets.
 */
function runDatabaseSetup() {
  const ss = getSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  try {
    const sheetNames = Object.keys(MASTER_SCHEMA);

    sheetNames.forEach((sheetName) => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        Logger.log(`Created sheet: ${sheetName}`);
      }

      sheet.clear();
      const headers = MASTER_SCHEMA[sheetName];
      sheet.appendRow(headers);

      sheet
        .getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4a4a4a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);

      if (ss.getSheets()[0].getName() !== sheet.getName()) {
        sheet.hideSheet();
      }
    });

    ui.alert(
      'Nijjara ERP Database Setup Complete!',
      'All sheets have been created and configured according to the master schema.',
      ui.ButtonSet.OK
    );
  } catch (e) {
    Logger.log(`ERROR in runDatabaseSetup: ${e.message}`);
    ui.alert('Setup Failed', `An error occurred: ${e.message}`, ui.ButtonSet.OK);
  }
}

/**
 * Seeds the SYS_Roles and SYS_Dropdowns sheets with initial, essential data.
 */
function seedInitialSystemData() {
  const ss = getSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  let seededData = false;

  try {
    // --- Seed SYS_Roles ---
    const rolesSheet = ss.getSheetByName('SYS_Roles');
    if (rolesSheet && rolesSheet.getLastRow() === 1) {
      const now = new Date().toISOString();
      const defaultRoles = [
        ['Admin', 'مدير النظام', 'Full system access', true, now, now],
        ['Manager', 'مدير', 'Manages a team or department', false, now, now],
        ['User', 'مستخدم عادي', 'Basic user access', false, now, now],
      ];
      rolesSheet
        .getRange(2, 1, defaultRoles.length, defaultRoles[0].length)
        .setValues(defaultRoles);
      Logger.log('Seeded SYS_Roles with default roles.');
      seededData = true;
    }

    // --- Seed SYS_Dropdowns ---
    const dropdownsSheet = ss.getSheetByName('SYS_Dropdowns');
    if (dropdownsSheet && dropdownsSheet.getLastRow() === 1) {
      const dropdownValues = [
        ['Job Titles', 'مدير عام', true, 1],
        ['Job Titles', 'مدير مشاريع', true, 2],
        ['Job Titles', 'محاسب', true, 3],
        ['Departments', 'الإدارة العليا', true, 1],
        ['Departments', 'المشاريع', true, 2],
      ];

      const finalDropdownValues = dropdownValues.map((row, index) => {
        const id = `DD_${String(index + 1).padStart(5, '0')}`;
        return [id, ...row];
      });

      dropdownsSheet
        .getRange(2, 1, finalDropdownValues.length, finalDropdownValues[0].length)
        .setValues(finalDropdownValues);
      Logger.log('Seeded SYS_Dropdowns with initial data.');
      seededData = true;
    }

    if (seededData) {
      ui.alert('System Data Seeding Complete!', 'The sheets have been populated.', ui.ButtonSet.OK);
    } else {
      ui.alert('No Action Taken', 'The system sheets already contain data.', ui.ButtonSet.OK);
    }
  } catch (error) {
    Logger.log(`ERROR in seedInitialSystemData: ${error.message}`);
    ui.alert('Error', `An error occurred during data seeding: ${error.message}`, ui.ButtonSet.OK);
  }
}

/**
 * ONE-TIME SEED FUNCTION: Creates the very first administrator user.
 */
function createFirstAdminUser() {
  const ss = getSpreadsheet();
  const usersSheet = ss.getSheetByName('SYS_Users');
  const ui = SpreadsheetApp.getUi();

  if (usersSheet.getLastRow() > 1) {
    ui.alert(
      'Operation Cancelled',
      'The SYS_Users sheet already contains user data.',
      ui.ButtonSet.OK
    );
    return;
  }

  const ONE_TIME_PASSWORD = 'NijjaraAdmin2025!';
  const passwordHash = hashPassword_(ONE_TIME_PASSWORD);

  const adminData = {
    User_Id: 'USR_00001',
    Full_Name: 'Mohamed Sherif El Khoraiby',
    Username: 'mkhoraiby',
    Email: 'm.sherif@nijjara.com',
    Role_Id: 'Admin',
    IsActive: true,
    Password_Hash: passwordHash,
    Created_At: new Date().toISOString(),
    Created_By: 'SYSTEM_SETUP',
  };

  const headers = MASTER_SCHEMA['SYS_Users'];
  const newRow = headers.map((header) => adminData[header] || '');

  usersSheet.appendRow(newRow);

  Logger.log(`Successfully created the first admin user: ${adminData.Username}`);

  const alertMessage = `The user '${adminData.Username}' has been created. \n\nYour one-time password is: \n${ONE_TIME_PASSWORD}`;
  ui.alert('First Administrator Created!', alertMessage, ui.ButtonSet.OK);
}


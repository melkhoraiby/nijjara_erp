/**
 * L10NSetup.gs – Arabic Dropdowns & Named Ranges for Nijjara ERP
 * Safe to paste anywhere in your Apps Script project.
 * It DOES NOT modify existing seeders or sheets other than creating:
 *   - SYS_L10N (headers + optional seed rows)
 *   - SYS_NR (hidden helper for formulas powering Named Ranges)
 *   - Named ranges used by Data Validation (AR display & ID lists)
 *
 * Public entrypoint you can run manually:
 *   seedArabicLocalization();
 */

function seedArabicLocalization() {
  const ss = _l10n_getSS();
  const l10nSh = _l10n_ensureSheetWithHeaders(ss, 'SYS_L10N', [
    'Dict',
    'Key',
    'Value_EN',
    'Value_AR',
    'Is_Active',
    'Sort_Order',
    'Updated_At',
  ]);
  _l10n_seedSYS_L10N(l10nSh);

  const nrSh = _l10n_ensureSheetWithHeaders(ss, 'SYS_NR', [
    'NR_DD_YesNo_AR',
    'NR_DD_Boolean_AR',
    'NR_DD_User_Status_AR',
    'NR_DD_MFA_Status_AR',
    'NR_DD_Scopes_AR',
    'NR_Attachment_Entities_AR',
    'NR_Export_Formats_AR',
    'NR_DD_Roles_AR',
    'NR_DD_Departments_AR',
    'NR_DD_Permissions_AR',
    'NR_DD_Users_AR',
    'NR_DD_Roles_ID',
    'NR_DD_Departments_ID',
    'NR_DD_Permissions_ID',
    'NR_DD_Users_ID',
  ]);
  _l10n_seedSYS_NR_Formulas(nrSh);
  _l10n_setNamedRanges(ss, nrSh);
  nrSh.hideSheet();
  SpreadsheetApp.getUi().alert('Arabic L10N seeding complete (SYS_L10N, SYS_NR, Named Ranges).');
}

/** ==================== Sheet Creation & Seeding ==================== **/
function _l10n_seedSYS_L10N(sh) {
  // Idempotent insert – only add if not present (by Dict+Key)
  const rows = [
    ['Roles', 'Admin', 'Administrator', 'المدير', 'TRUE', 1, _l10n_today()],
    ['Roles', 'HR_Manager', 'HR Manager', 'مدير الموارد البشرية', 'TRUE', 2, _l10n_today()],
    ['Roles', 'Manager', 'Manager', 'مدير', 'TRUE', 3, _l10n_today()],
    ['Roles', 'Basic_User', 'Basic User', 'مستخدم أساسي', 'TRUE', 4, _l10n_today()],
    ['SYS_OVERVIEW', 'Total_Users', 'Total Users', 'إجمالي المستخدمين', 'TRUE', 1, _l10n_today()],
    ['SYS_OVERVIEW', 'Active_Users', 'Active Users', 'المستخدمون النشطون', 'TRUE', 2, _l10n_today()],
    ['SYS_OVERVIEW', 'Locked_Users', 'Locked / Inactive', 'المستخدمون المعطلون', 'TRUE', 3, _l10n_today()],
    ['SYS_OVERVIEW', 'Roles_Count', 'Roles', 'الأدوار', 'TRUE', 4, _l10n_today()],
    ['SYS_OVERVIEW', 'Permissions_Count', 'Permissions', 'الأذونات', 'TRUE', 5, _l10n_today()],
    ['SYS_OVERVIEW', 'Pending_Password_Resets', 'Pending Password Resets', 'إعادات كلمة المرور المعلقة', 'TRUE', 6, _l10n_today()],
    ['SYS_ACTIONS', 'Add_User_Button', 'Add User', 'مستخدم جديد', 'TRUE', 1, _l10n_today()],
    ['SYS_ACTIONS', 'Export_Button', 'Export', 'تصدير', 'TRUE', 2, _l10n_today()],
    ['SYS_ACTIONS', 'Role_Permission_Setup_Button', 'Role / Permission Setup', 'إعدادات الأذونات', 'TRUE', 3, _l10n_today()],
    ['SYS_DIRECTORY', 'Users_Title', 'Users Directory', 'دليل المستخدمين', 'TRUE', 1, _l10n_today()],
    // Extend freely with Departments/Permissions/Users when needed
  ];
  _l10n_upsertByKey(sh, ['Dict', 'Key'], rows);
}

function _l10n_seedSYS_NR_Formulas(sh) {
  // Clear existing formula row (keep headers)
  const lastCol = sh.getLastColumn();
  if (sh.getLastRow() < 2) sh.insertRowsAfter(1, 1);
  sh.getRange(2, 1, 1, lastCol).clearContent();

  // Col A: DD_YesNo_AR (Arabic titles from SYS_Dropdowns)
  sh.getRange('A2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_YesNo", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col B: DD_Boolean_AR
  sh.getRange('B2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_Boolean", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col C: DD_User_Status_AR
  sh.getRange('C2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_User_Status", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col D: DD_MFA_Status_AR
  sh.getRange('D2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_MFA_Status", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col E: DD_Scopes_AR
  sh.getRange('E2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_Scopes", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col F: Attachment_Entities_AR
  sh.getRange('F2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_Attachment_Entities", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );
  // Col G: Export_Formats_AR
  sh.getRange('G2').setFormula(
    '=SORT(FILTER(SYS_Dropdowns!C:C, SYS_Dropdowns!A:A="DD_Export_Formats", SYS_Dropdowns!D:D=TRUE),1,TRUE)'
  );

  // Dynamic Arabic labels via SYS_L10N fallback to EN
  // Col H: Roles_AR
  sh.getRange('H2').setFormula(
    '=ARRAYFORMULA(IFERROR(VLOOKUP(FILTER(SYS_Roles!A:A, LEN(SYS_Roles!A:A)), FILTER({SYS_L10N!B:B, SYS_L10N!D:D}, SYS_L10N!A:A="Roles", SYS_L10N!E:E=TRUE), 2, FALSE), FILTER(SYS_Roles!B:B, LEN(SYS_Roles!A:A))))'
  );
  // Col I: Departments_AR (requires HR_Departments sheet if used)
  sh.getRange('I2').setFormula(
    '=IFERROR(ARRAYFORMULA(IFERROR(VLOOKUP(FILTER(HR_Departments!A:A, LEN(HR_Departments!A:A)), FILTER({SYS_L10N!B:B, SYS_L10N!D:D}, SYS_L10N!A:A="Departments", SYS_L10N!E:E=TRUE), 2, FALSE), FILTER(HR_Departments!B:B, LEN(HR_Departments!A:A)))), )'
  );
  // Col J: Permissions_AR
  sh.getRange('J2').setFormula(
    '=ARRAYFORMULA(IFERROR(VLOOKUP(FILTER(SYS_Permissions!A:A, LEN(SYS_Permissions!A:A)), FILTER({SYS_L10N!B:B, SYS_L10N!D:D}, SYS_L10N!A:A="Permissions", SYS_L10N!E:E=TRUE), 2, FALSE), FILTER(SYS_Permissions!B:B, LEN(SYS_Permissions!A:A))))'
  );
  // Col K: Users_AR
  sh.getRange('K2').setFormula(
    '=ARRAYFORMULA(IFERROR(VLOOKUP(FILTER(SYS_Users!A:A, LEN(SYS_Users!A:A)), FILTER({SYS_L10N!B:B, SYS_L10N!D:D}, SYS_L10N!A:A="Users", SYS_L10N!E:E=TRUE), 2, FALSE), FILTER(SYS_Users!B:B, LEN(SYS_Users!A:A))))'
  );

  // ID lists (for storing canonical values)
  sh.getRange('L2').setFormula('=SORT(FILTER(SYS_Roles!A:A, LEN(SYS_Roles!A:A)))');
  sh.getRange('M2').setFormula(
    '=IFERROR(SORT(FILTER(HR_Departments!A:A, LEN(HR_Departments!A:A))), )'
  );
  sh.getRange('N2').setFormula('=SORT(FILTER(SYS_Permissions!A:A, LEN(SYS_Permissions!A:A)))');
  sh.getRange('O2').setFormula('=SORT(FILTER(SYS_Users!A:A, LEN(SYS_Users!A:A)))');
}

function _l10n_setNamedRanges(ss, nrSh) {
  const map = {
    NR_DD_YesNo_AR: 'SYS_NR!A2:A',
    NR_DD_Boolean_AR: 'SYS_NR!B2:B',
    NR_DD_User_Status_AR: 'SYS_NR!C2:C',
    NR_DD_MFA_Status_AR: 'SYS_NR!D2:D',
    NR_DD_Scopes_AR: 'SYS_NR!E2:E',
    NR_Attachment_Entities_AR: 'SYS_NR!F2:F',
    NR_Export_Formats_AR: 'SYS_NR!G2:G',
    NR_DD_Roles_AR: 'SYS_NR!H2:H',
    NR_DD_Departments_AR: 'SYS_NR!I2:I',
    NR_DD_Permissions_AR: 'SYS_NR!J2:J',
    NR_DD_Users_AR: 'SYS_NR!K2:K',
    NR_DD_Roles_ID: 'SYS_NR!L2:L',
    NR_DD_Departments_ID: 'SYS_NR!M2:M',
    NR_DD_Permissions_ID: 'SYS_NR!N2:N',
    NR_DD_Users_ID: 'SYS_NR!O2:O',
  };
  const named = ss.getNamedRanges().reduce((acc, nr) => {
    acc[nr.getName()] = nr;
    return acc;
  }, {});
  Object.keys(map).forEach((name) => {
    const range = ss.getRange(map[name]);
    if (named[name]) {
      named[name].setRange(range);
    } else {
      ss.setNamedRange(name, range);
    }
  });
}

/** ==================== Small Utilities ==================== **/
function _l10n_getSS() {
  try {
    return getSpreadsheet();
  } catch (e) {
    return SpreadsheetApp.getActive();
  }
}

function _l10n_ensureSheetWithHeaders(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  // Write headers exactly once (Row 1)
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  // Style header (bold + grey)
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eeeeee');
  return sh;
}

function _l10n_upsertByKey(sh, keyCols, rows) {
  const data = sh.getDataRange().getValues();
  const headers = data[0];
  const idx = {};
  headers.forEach((h, i) => (idx[h] = i));
  const map = {};
  for (let r = 1; r < data.length; r++) {
    if (!data[r] || data[r][0] === '') continue;
    const k = keyCols.map((kc) => data[r][idx[kc]]).join('\u0001');
    map[k] = r + 1; // row number
  }
  rows.forEach((row) => {
    const k = keyCols.map((kc, i) => row[keyCols.indexOf(kc)]).join('\u0001');
    if (map[k]) {
      sh.getRange(map[k], 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
  });
}

function _l10n_today() {
  const d = new Date();
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');
}

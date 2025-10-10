function seedSysRoles() {
  var sheetName =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_ROLES ? SHEETS.SYS_ROLES : 'SYS_Roles';
  var headers = (typeof getHeaders === 'function' && getHeaders(sheetName)) || [
    'Role_Id',
    'Role_Title',
    'Description',
    'Is_System',
    'Created_At',
    'Created_By',
    'Updated_At',
    'Updated_By',
  ];
  var sh = ensureHeaders(sheetName, headers);
  var lastRow = sh.getLastRow();
  var existing = {};
  if (lastRow >= 2) {
    var vals = sh.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      existing[String(vals[i][0])] = i + 2;
    }
  }
  var now = ensureISODate(new Date());
  var actor = 'SYSTEM';
  var rows = [
    {
      Role_Id: 'Admin',
      Role_Title: 'Administrator',
      Description: 'Full system access',
      Is_System: true,
    },
    {
      Role_Id: 'HR_Manager',
      Role_Title: 'HR Manager',
      Description: 'Human resources manager',
      Is_System: false,
    },
    {
      Role_Id: 'Manager',
      Role_Title: 'Manager',
      Description: 'Department manager',
      Is_System: false,
    },
    {
      Role_Id: 'Basic_User',
      Role_Title: 'Basic User',
      Description: 'Standard user',
      Is_System: false,
    },
  ];
  for (var r = 0; r < rows.length; r++) {
    var rec = rows[r];
    var rowArr = [
      rec.Role_Id,
      rec.Role_Title,
      rec.Description,
      !!rec.Is_System,
      now,
      actor,
      now,
      actor,
    ];
    if (existing.hasOwnProperty(rec.Role_Id)) {
      sh.getRange(existing[rec.Role_Id], 1, 1, headers.length).setValues([rowArr]);
    } else {
      sh.appendRow(rowArr);
    }
  }
}

function seedSysDropdowns() {
  var sheetName =
    typeof SHEETS !== 'undefined' && SHEETS.SYS_DROPDOWNS ? SHEETS.SYS_DROPDOWNS : 'SYS_Dropdowns';
  var headers = (typeof getHeaders === 'function' && getHeaders(sheetName)) || [
    'Key',
    'English_Title',
    'Arabic_Title',
    'Is_Active',
    'Sort_Order',
  ];
  var sh = ensureHeaders(sheetName, headers);
  var lastRow = sh.getLastRow();
  var data = lastRow >= 2 ? sh.getRange(2, 1, lastRow - 1, headers.length).getValues() : [];
  var keyIdx = 0,
    enIdx = 1;
  var idx = {};
  for (var i = 0; i < data.length; i++) {
    var k = String(data[i][keyIdx]);
    var en = String(data[i][enIdx]);
    idx[k + '\u0001' + en] = i + 2;
  }
  var rows = [
    ['DD_YesNo', 'Yes', 'نعم', true, 1],
    ['DD_YesNo', 'No', 'لا', true, 2],
    ['DD_Boolean', 'True', 'صحيح', true, 1],
    ['DD_Boolean', 'False', 'خطأ', true, 2],
    ['DD_User_Status', 'Active', 'نشط', true, 1],
    ['DD_User_Status', 'Inactive', 'غير نشط', true, 2],
    ['DD_MFA_Status', 'Enabled', 'مُفعّل', true, 1],
    ['DD_MFA_Status', 'Disabled', 'غير مُفعّل', true, 2],
    ['DD_Permission_Categories', 'USERS', 'المستخدمون', true, 1],
    ['DD_Permission_Categories', 'SECURITY', 'الأمان', true, 2],
    ['DD_Permission_Categories', 'AUDIT', 'التدقيق', true, 3],
    ['DD_Scopes', 'GLOBAL', 'عالمي', true, 1],
    ['DD_Scopes', 'DEPARTMENT', 'الإدارة', true, 2],
    ['DD_Scopes', 'SELF', 'ذاتي', true, 3],
    ['DD_Scopes', 'LIMITED', 'محدود', true, 4],
    ['DD_Attachment_Entities', 'Users', 'المستخدمون', true, 1],
    ['DD_Attachment_Entities', 'Roles', 'الأدوار', true, 2],
    ['DD_Attachment_Entities', 'Permissions', 'الأذونات', true, 3],
    ['DD_Attachment_Entities', 'Role_Permissions', 'أذونات_الأدوار', true, 4],
    ['DD_Export_Formats', 'CSV', 'CSV', true, 1],
    ['DD_Export_Formats', 'XLSX', 'XLSX', true, 2],
    ['DD_Export_Formats', 'JSON', 'JSON', true, 3],
  ];
  for (var r = 0; r < rows.length; r++) {
    var k = rows[r][0],
      en = rows[r][1];
    var key = k + '\u0001' + en;
    if (idx.hasOwnProperty(key)) {
      sh.getRange(idx[key], 1, 1, headers.length).setValues([rows[r]]);
    } else {
      sh.appendRow(rows[r]);
    }
  }
}

function seedDropdownsAndRoles() {
  seedSysRoles();
  seedSysDropdowns();
}

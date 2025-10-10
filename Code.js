/**
 * @file Main server-side entry point for the Nijjara ERP web application.
 * Handles serving the main HTML file and creating custom menus in the Google Sheet.
 */

/**
 * The main function to serve the web application.`
 * It loads the main HTML file and evaluates it as a template.
 * @returns {HtmlOutput} The HTML service object for the web app.
 */
function doGet() {
  var template = HtmlService.createTemplateFromFile('Dashboard.html');
  return template
    .evaluate()
    .setTitle('Nijjara ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ...existing code...

function include(filename) {
  if (!filename) return '';
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiGetUsers(state) {
  state = state || {};
  var q = (state.q || '').toLowerCase();
  var limit = Number(state.limit || 25);
  var offset = Number(state.offset || 0);
  var dept = state.dept || '';
  var role = state.role || '';
  var status =
    state.status === 'TRUE' || state.status === 'FALSE' ? state.status === 'TRUE' : null;

  var users = _u_rows('SYS_Users');
  var scope = _u_getViewerScope(); // {type:'GLOBAL'|... , dept:'...'}
  users = _u_filterByScope(users, scope);

  users = users.filter(function (r) {
    if (dept && String(r.Department) !== String(dept)) return false;
    if (role && String(r.Role_Id) !== String(role)) return false;
    if (status !== null && String(r.IsActive).toLowerCase() !== String(status)) return false;
    if (!q) return true;
    r._score = _u_scoreUser(r, q);
    return r._score > 0;
  });

  users.sort(function (a, b) {
    var sa = a._score || 0;
    var sb = b._score || 0;
    if (sb !== sa) return sb - sa;
    return _u_cmpDesc(a.Updated_At, b.Updated_At);
  });

  var total = users.length;

  var roleMapAR = _u_l10nMap('Roles');
  var deptMapAR = _u_l10nMap('Departments');
  users.forEach(function (r) {
    r.Role_AR = roleMapAR[r.Role_Id] || r.Role_Id;
    r.Department_AR = deptMapAR[r.Department] || r.Department;
  });

  var page = users.slice(offset, offset + limit).map(function (r) {
    return {
      User_Id: r.User_Id,
      Full_Name: r.Full_Name,
      Username: r.Username,
      Email: r.Email,
      Department: r.Department,
      Department_AR: r.Department_AR,
      Role_Id: r.Role_Id,
      Role_AR: r.Role_AR,
      IsActive: String(r.IsActive).toLowerCase() === 'true',
      Last_Login: r.Last_Login || '',
      Updated_At: r.Updated_At || '',
    };
  });

  return { rows: page, total: total, offset: offset, limit: limit };
}

function apiGetUsersFilters() {
  var l10nRoles = _u_l10nMap('Roles');
  var roles = _u_rows('SYS_Roles').map(function (r) {
    return { value: r.Role_Id, label: l10nRoles[r.Role_Id] || r.Role_Title || r.Role_Id };
  });
  var departments = [];
  var depSheet = SpreadsheetApp.getActive().getSheetByName('HR_Departments');
  if (depSheet) {
    var l10nDepartments = _u_l10nMap('Departments');
    departments = _u_rows('HR_Departments').map(function (r) {
      return {
        value: r.Dept_Code,
        label: l10nDepartments[r.Dept_Code] || r.Dept_Name_EN || r.Dept_Code,
      };
    });
  }
  return { roles: roles, departments: departments };
}

function uiHandleUserAction(type, userId) {
  switch (type) {
    case 'view':
      return _ui_openProfile(userId);
    case 'edit':
      return _ui_openForm('FORM_SYS_EditUser', userId);
    case 'toggle':
      return _ui_openForm('FORM_SYS_ToggleActive', userId);
    case 'reset':
      return _ui_openForm('FORM_SYS_ResetPassword', userId);
    case 'role':
      return _ui_openForm('FORM_SYS_AssignRole', userId);
    case 'delete':
      return _ui_openForm('FORM_SYS_DeleteUser', userId);
    case 'impersonate':
      return _ui_openForm('FORM_SYS_Impersonate', userId);
    case 'docs':
      return _ui_openForm('FORM_SYS_UploadUserDoc', userId);
  }
}

function _u_rows(sheetName) {
  var sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (!values || !values.length) return [];
  var head = values.shift();
  return values
    .filter(function (row) {
      return row[0] !== '';
    })
    .map(function (row) {
      var obj = {};
      head.forEach(function (h, i) {
        obj[h] = row[i];
      });
      return obj;
    });
}

function _u_cmpDesc(a, b) {
  var da = new Date(a || 0).getTime();
  var db = new Date(b || 0).getTime();
  return db - da;
}

function _u_scoreUser(r, q) {
  var s = 0;
  var Q = q.toLowerCase();
  function bump(txt, w) {
    txt = (txt || '').toString().toLowerCase();
    if (!txt) return;
    if (txt === Q) s += 30 * w;
    if (txt.indexOf(Q) === 0) s += 20 * w;
    if (txt.indexOf(Q) >= 0) s += 10 * w;
  }
  bump(r.Full_Name, 2.0);
  bump(r.Username, 2.5);
  bump(r.Email, 1.5);
  bump(r.Department, 1.2);
  bump(r.Role_Id, 1.2);
  return s;
}

function _u_getViewerScope() {
  var me =
    typeof getCurrentUserRecord === 'function' ? getCurrentUserRecord() : null;
  var scope = 'GLOBAL';
  var dept = me ? me.Department : '';
  return { type: scope, dept: dept, userId: me ? me.User_Id : '' };
}

function _u_filterByScope(users, scope) {
  if (!scope || !scope.type) return users;
  if (scope.type === 'GLOBAL') return users;
  if (scope.type === 'DEPARTMENT') {
    return users.filter(function (u) {
      return String(u.Department) === String(scope.dept);
    });
  }
  if (scope.type === 'SELF') {
    return users.filter(function (u) {
      return String(u.User_Id) === String(scope.userId);
    });
  }
  return users;
}

function _u_l10nMap(dict) {
  var sh = SpreadsheetApp.getActive().getSheetByName('SYS_L10N');
  if (!sh) return {};
  var values = sh.getDataRange().getValues();
  if (!values || !values.length) return {};
  var head = values.shift();
  var idx = {};
  head.forEach(function (h, i) {
    idx[h] = i;
  });
  var map = {};
  values.forEach(function (row) {
    var activeIndex = idx.Is_Active;
    if (activeIndex === undefined) return;
    var isActive = row[activeIndex];
    if (isActive !== true && String(isActive).toUpperCase() !== 'TRUE') return;
    if (row[idx.Dict] !== dict) return;
    map[row[idx.Key]] = row[idx.Value_AR];
  });
  return map;
}

function _ui_openForm(formId, userId) {
  // TODO: integrate with form engine
  Logger.log('uiHandleUserAction -> open form %s for user %s', formId, userId);
}

function _ui_openProfile(userId) {
  Logger.log('uiHandleUserAction -> open profile for user %s', userId);
}

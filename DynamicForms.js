function df_getFormDefinition(key) {
  if (typeof CONSTANTS === 'undefined' || !CONSTANTS.getFormDefinition) return null;
  return CONSTANTS.getFormDefinition(key);
}

function df_listForms() {
  if (typeof CONSTANTS === 'undefined' || !CONSTANTS.listEnum) return [];
  return CONSTANTS.listEnum('FORM_KEYS');
}

function df_getDropdownOptions(key) {
  key = String(key || '');
  var staticKeys = {
    DD_YesNo: 1,
    DD_Boolean: 1,
    DD_User_Status: 1,
    DD_MFA_Status: 1,
    DD_Permission_Categories: 1,
    DD_Scopes: 1,
    DD_Attachment_Entities: 1,
    DD_Export_Formats: 1,
  };

  if (staticKeys[key]) {
    var s1 = ensureHeaders('SYS_Dropdowns', [
      'Key',
      'English_Title',
      'Arabic_Title',
      'Is_Active',
      'Sort_Order',
    ]);
    var rng1 = s1.getDataRange().getValues();
    var h1 = rng1.shift();
    var idx = {};
    for (var i = 0; i < h1.length; i++) idx[h1[i]] = i;
    var rows = rng1
      .filter(function (r) {
        return r[idx.Key] === key && String(r[idx.Is_Active]).toUpperCase() === 'TRUE';
      })
      .sort(function (a, b) {
        return Number(a[idx.Sort_Order] || 0) - Number(b[idx.Sort_Order] || 0);
      });
    return rows.map(function (r) {
      return { value: r[idx.English_Title], label: r[idx.Arabic_Title] || r[idx.English_Title] };
    });
  }

  if (key === 'DD_Roles') {
    var s2 = ensureHeaders('SYS_Roles', [
      'Role_Id',
      'Role_Title',
      'Description',
      'Is_System',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ]);
    var rng2 = s2.getDataRange().getValues();
    var h2 = rng2.shift();
    var iId = h2.indexOf('Role_Id');
    var iLbl = h2.indexOf('Role_Title');
    return rng2
      .filter(function (r) {
        return r[iId];
      })
      .map(function (r) {
        return { value: r[iId], label: r[iLbl] };
      });
  }

  if (key === 'DD_Permissions') {
    var s3 = ensureHeaders('SYS_Permissions', [
      'Permission_Key',
      'Permission_Label',
      'Description',
      'Category',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ]);
    var rng3 = s3.getDataRange().getValues();
    var h3 = rng3.shift();
    var iK = h3.indexOf('Permission_Key');
    var iL = h3.indexOf('Permission_Label');
    return rng3
      .filter(function (r) {
        return r[iK];
      })
      .map(function (r) {
        return { value: r[iK], label: r[iL] };
      });
  }

  if (key === 'DD_Users') {
    var s4 = ensureHeaders('SYS_Users', [
      'User_Id',
      'Full_Name',
      'Username',
      'Email',
      'Job_Title',
      'Department',
      'Role_Id',
      'IsActive',
      'Disabled_At',
      'Disabled_By',
      'Password_Hash',
      'Last_Login',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
      'External_Id',
      'MFA_Enabled',
      'Notes',
    ]);
    var rng4 = s4.getDataRange().getValues();
    var h4 = rng4.shift();
    var iu = h4.indexOf('User_Id');
    var iname = h4.indexOf('Full_Name');
    return rng4
      .filter(function (r) {
        return r[iu];
      })
      .map(function (r) {
        return { value: r[iu], label: r[iname] };
      });
  }

  if (key === 'DD_Departments') {
    var s5 = SpreadsheetApp.getActive().getSheetByName('HR_Departments');
    if (!s5) return [];
    var rng5 = s5.getDataRange().getValues();
    var h5 = rng5.shift();
    var iD = h5.indexOf('Dept_Code');
    var iN = h5.indexOf('Dept_Name_EN');
    if (iD === -1 || iN === -1) return [];
    return rng5
      .filter(function (r) {
        return r[iD];
      })
      .map(function (r) {
        return { value: r[iD], label: r[iN] };
      });
  }

  return [];
}

function df_submitForm(formKey, formData, actorId) {
  formKey = String(formKey || '');
  formData = formData || {};
  var fn = null;
  try {
    var ctx = typeof globalThis !== 'undefined' ? globalThis : this;
    fn = ctx && typeof ctx[formKey] === 'function' ? ctx[formKey] : null;
  } catch (e) {
    fn = null;
  }
  if (!fn) {
    var map = {
      FORM_SYS_AddUser: 'FORM_SYS_AddUser',
      FORM_SYS_EditUser: 'FORM_SYS_EditUser',
      FORM_SYS_ToggleActive: 'FORM_SYS_ToggleActive',
      FORM_SYS_ResetPassword: 'FORM_SYS_ResetPassword',
      FORM_SYS_AssignRole: 'FORM_SYS_AssignRole',
      FORM_SYS_DeleteUser: 'FORM_SYS_DeleteUser',
      FORM_SYS_Impersonate: 'FORM_SYS_Impersonate',
      FORM_SYS_UploadUserDoc: 'FORM_SYS_UploadUserDoc',
      FORM_SYS_MapRolePermission: 'FORM_SYS_MapRolePermission',
      FORM_SYS_CloneRolePerms: 'FORM_SYS_CloneRolePerms',
    };
    var alt = map[formKey];
    if (alt) {
      try {
        var ctx2 = typeof globalThis !== 'undefined' ? globalThis : this;
        fn = ctx2 && typeof ctx2[alt] === 'function' ? ctx2[alt] : null;
      } catch (e2) {
        fn = null;
      }
    }
  }
  if (!fn) throw new Error('Unknown form: ' + formKey);
  return fn(formData, actorId);
}

function df_renderFormMeta(formKey) {
  var def = df_getFormDefinition(formKey);
  if (!def) return null;
  var fields = [];
  if (def.tabs) {
    Object.keys(def.tabs).forEach(function (tab) {
      fields = fields.concat(def.tabs[tab]);
    });
  }
  if (def.fields) {
    fields = def.fields.map(function (f) {
      return f.name;
    });
  }
  return { key: def.key || formKey, label: def.label || '', fields: fields };
}

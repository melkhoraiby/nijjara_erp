// Dynamic form rendering and submit routing for Nijjara ERP
// Key functions: getRenderedForm, submitForm
// Works with: SYS_Dynamic_Forms, SYS_Dropdowns, SYS_L10N and existing FORM_* server handlers
// Language-aware (AR-first), idempotent helpers, and safe fallbacks.

/**
 * Return a render-ready form schema with resolved dropdown options.
 * @param {string} formId - e.g. "FORM_SYS_AddUser" (must exist in SYS_Dynamic_Forms)
 * @param {Object=} context - optional { lang: 'AR'|'EN', userId, selection }
 * @returns {Object} schema { formId, title, tabId, sections:[{header, fields:[]}] }
 */
function getRenderedForm(formId, context) {
  context = context || {};
  var lang = (context.lang || 'AR').toUpperCase();
  if (!formId) throw new Error('getRenderedForm: formId is required');

  var rows = _fr_readDynamicForms().filter(function (r) {
    return r.Form_ID === formId;
  });
  if (!rows.length) throw new Error('Form not found in SYS_Dynamic_Forms: ' + formId);

  var head = rows[0];
  var sections = _fr_groupBy(rows, 'Section_Header');

  // Resolve dropdown options per field
  Object.keys(sections).forEach(function (section) {
    sections[section] = sections[section].map(function (r) {
      var f = _fr_rowToField(r);
      if (f.type === 'Dropdown' && f.dropdownKey) {
        f.options = _fr_getDropdownOptionsSafe(f.dropdownKey, lang, r.Source_Sheet, r.Source_Range);
      }
      if (f.type === 'Auto' || String(r.Default_Value).toLowerCase() === 'computed') {
        f.readOnly = true;
      }
      return f;
    });
  });

  // reshape to schema
  var schema = {
    formId: formId,
    title: head.Form_Title || formId,
    tabId: head.Tab_ID || '',
    tabName: head.Tab_Name || '',
    sections: Object.keys(sections).map(function (header) {
      return { header: header || '', fields: sections[header] };
    }),
  };
  return schema;
}

/**
 * Submit handler. Routes payload to the corresponding FORM_* function when available,
 * or applies friendly mappings for common system forms.
 * @param {string} formId
 * @param {Object} payload - keyed by Field_ID values from the rendered form
 * @param {Object=} user - current user { userId }
 * @returns {*} backend function result
 */
function submitForm(formId, payload, user) {
  if (!formId) throw new Error('submitForm: formId is required');
  payload = payload || {};
  var actorId = (user && (user.userId || user.User_Id)) || null;

  // 1) Friendly mappers for the main system forms
  switch (formId) {
    case 'FORM_SYS_AddUser': {
      var data = {
        Full_Name: payload.USR_Full_Name,
        Username: payload.USR_Username,
        Email: payload.USR_Email,
        Job_Title: payload.USR_Job_Title || '',
        Department: payload.USR_Department || '',
        Role_Id: payload.USR_Role,
        IsActive: _fr_toBool(payload.USR_IsActive, true),
        MFA_Enabled: _fr_toBool(payload.USR_MFA, false),
        Notes: payload.USR_Notes || '',
      };
      if (typeof FORM_SYS_AddUser === 'function') return FORM_SYS_AddUser(data, actorId);
      if (typeof createNewUser === 'function') return createNewUser(data, actorId);
      throw new Error('AddUser handler is not available.');
    }
    case 'FORM_SYS_EditUser': {
      var upd = {
        User_Id: payload.User_Id,
        Full_Name: payload.USR_Full_Name,
        Email: payload.USR_Email,
        Department: payload.USR_Department,
        Role_Id: payload.USR_Role,
      };
      if (!upd.User_Id) throw new Error('User_Id is required to edit user');
      if (typeof FORM_SYS_EditUser === 'function') return FORM_SYS_EditUser(upd, actorId);
      if (typeof updateUserData === 'function') return updateUserData(upd.User_Id, upd, actorId);
      throw new Error('EditUser handler is not available.');
    }
    case 'FORM_SYS_ToggleActive': {
      var targetId = payload.User_Id;
      var desired = payload.USR_IsActive; // "Active" / "Inactive" or boolean
      var activate = _fr_toBool(desired, null);
      // If user sent a literal label from DD_User_Status, map strings
      if (activate === null) {
        var s = String(desired || '').toLowerCase();
        if (s === 'active' || s === 'true' || s === 'نشط') activate = true;
        if (s === 'inactive' || s === 'false' || s === 'غير نشط') activate = false;
      }
      var action = activate ? 'ACTIVATE' : 'DEACTIVATE';
      var dataToggle = { User_Id: targetId, Action: action, Reason: payload.USR_Reason || '' };
      if (!targetId) throw new Error('User_Id is required to toggle active');
      if (typeof FORM_SYS_ToggleActive === 'function')
        return FORM_SYS_ToggleActive(dataToggle, actorId);
      if (typeof setUserStatus === 'function') return setUserStatus(targetId, activate, actorId);
      throw new Error('ToggleActive handler is not available.');
    }
    case 'FORM_SYS_ResetPassword': {
      var rp = { User_Id: payload.User_Id, New_Password: payload.USR_Temp_Password };
      if (!rp.User_Id) throw new Error('User_Id is required for reset');
      if (typeof FORM_SYS_ResetPassword === 'function') return FORM_SYS_ResetPassword(rp, actorId);
      if (typeof resetPasswordForUser === 'function')
        return resetPasswordForUser(rp.User_Id, actorId, rp.New_Password);
      throw new Error('ResetPassword handler is not available.');
    }
    case 'FORM_SYS_AssignRole': {
      var ar = {
        Role_Id: payload.USR_Role,
        Selected_User_Ids:
          payload.Selected_User_Ids ||
          payload.User_Ids ||
          (payload.User_Id ? [payload.User_Id] : []),
      };
      if (!ar.Role_Id) throw new Error('Role_Id is required');
      if (!ar.Selected_User_Ids || !ar.Selected_User_Ids.length)
        throw new Error('At least one user must be selected');
      if (typeof FORM_SYS_AssignRole === 'function') return FORM_SYS_AssignRole(ar, actorId);
      if (typeof bulkAssignRole === 'function')
        return bulkAssignRole(ar.Selected_User_Ids, ar.Role_Id, actorId);
      throw new Error('AssignRole handler is not available.');
    }
    case 'FORM_SYS_DeleteUser': {
      var du = { User_Id: payload.User_Id, Archive_Note: payload.USR_Delete_Note || '' };
      if (!du.User_Id) throw new Error('User_Id is required to delete');
      if (typeof FORM_SYS_DeleteUser === 'function') return FORM_SYS_DeleteUser(du, actorId);
      if (typeof deleteUserAccount === 'function')
        return deleteUserAccount(du.User_Id, actorId, { archiveNote: du.Archive_Note });
      throw new Error('DeleteUser handler is not available.');
    }
    case 'FORM_SYS_UploadUserDoc': {
      var ud = {
        User_Id: payload.User_Id || payload.DOC_Entity_ID,
        Document_Label: payload.DOC_Label,
        Notes: payload.DOC_Notes || '',
        File_Name: payload.DOC_File_Name || '',
        File_URL: payload.DOC_File_URL || '',
        Drive_File_ID: payload.DOC_File || payload.DOC_Drive_File_ID || '',
      };
      if (!ud.User_Id) throw new Error('User_Id (or DOC_Entity_ID) is required');
      if (typeof FORM_SYS_UploadUserDoc === 'function') return FORM_SYS_UploadUserDoc(ud, actorId);
      throw new Error('UploadUserDoc handler is not available.');
    }
    case 'FORM_SYS_Impersonate': {
      var im = {
        Target_User_Id: payload.IMP_Target,
        Justification: payload.IMP_Justification || '',
        Duration_Minutes: payload.IMP_Duration_Minutes || '',
      };
      if (!im.Target_User_Id) throw new Error('Target user is required');
      if (typeof FORM_SYS_Impersonate === 'function') return FORM_SYS_Impersonate(im, actorId);
      if (typeof impersonateUserSession === 'function')
        return impersonateUserSession(
          im.Target_User_Id,
          actorId,
          im.Justification,
          im.Duration_Minutes
        );
      throw new Error('Impersonate handler is not available.');
    }
  }

  // 2) If there is a direct FORM_* function matching formId, delegate
  if (typeof this[formId] === 'function') {
    return this[formId](payload, actorId);
  }

  throw new Error('No submit handler found for ' + formId);
}

/** ============================ Helpers ============================ **/
function _fr_readDynamicForms() {
  var sh = SpreadsheetApp.getActive().getSheetByName('SYS_Dynamic_Forms');
  if (!sh) throw new Error('SYS_Dynamic_Forms sheet not found');
  var values = sh.getDataRange().getValues();
  var head = values.shift();
  return values
    .filter(function (r) {
      return r && r[0] !== '';
    })
    .map(function (r) {
      var o = {};
      head.forEach(function (h, i) {
        o[h] = r[i];
      });
      return o;
    });
}

function _fr_groupBy(rows, key) {
  var map = {};
  rows.forEach(function (r) {
    var k = r[key] || '';
    (map[k] = map[k] || []).push(r);
  });
  return map;
}

function _fr_rowToField(r) {
  return {
    id: r.Field_ID,
    label: r.Field_Label,
    type: r.Field_Type || 'Text',
    required: String(r.Mandatory || '').toLowerCase() === 'yes',
    defaultValue: r.Default_Value,
    dropdownKey: r.Dropdown_Key || '',
    sourceSheet: r.Source_Sheet || '',
    sourceRange: r.Source_Range || '',
    targetSheet: r.Target_Sheet || '',
    targetColumn: r.Target_Column || '',
  };
}

function _fr_getDropdownOptionsSafe(key, lang, sourceSheet, sourceRange) {
  // Prefer a global getDropdownOptions service if present (supports AR overlays)
  try {
    if (typeof getDropdownOptions === 'function') {
      return getDropdownOptions(key, lang);
    }
  } catch (e) {
    Logger.log('getDropdownOptions failed: ' + e);
  }

  // Fallbacks:
  if (_fr_isDynamicKey(key))
    return _fr_dynamicOptionsFromSource(key, lang, sourceSheet, sourceRange);
  return _fr_staticOptionsFromSYS_Dropdowns(key, lang);
}

function _fr_isDynamicKey(key) {
  return ['DD_Roles', 'DD_Departments', 'DD_Permissions', 'DD_Users'].indexOf(key) !== -1;
}

function _fr_dynamicOptionsFromSource(key, lang, sheetName, rangeStr) {
  var config = {
    DD_Roles: { sheet: 'SYS_Roles', id: 'Role_Id', labelEN: 'Role_Title', dict: 'Roles' },
    DD_Departments: {
      sheet: 'HR_Departments',
      id: 'Dept_Code',
      labelEN: 'Dept_Name_EN',
      dict: 'Departments',
    },
    DD_Permissions: {
      sheet: 'SYS_Permissions',
      id: 'Permission_Key',
      labelEN: 'Permission_Label',
      dict: 'Permissions',
    },
    DD_Users: { sheet: 'SYS_Users', id: 'User_Id', labelEN: 'Full_Name', dict: 'Users' },
  }[key];
  if (!config) return [];
  var sh = SpreadsheetApp.getActive().getSheetByName(sheetName || config.sheet);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  var head = values.shift();
  var idx = {};
  head.forEach(function (h, i) {
    idx[h] = i;
  });
  var l10n = _fr_l10nMap();
  var opts = [];
  values.forEach(function (r) {
    if (!r || r[0] === '') return;
    var id = r[idx[config.id]];
    var labelEn = r[idx[config.labelEN]];
    var ar = l10n[config.dict] && l10n[config.dict][id] ? l10n[config.dict][id] : labelEn;
    opts.push({ value: id, label: lang === 'AR' ? ar : labelEn });
  });
  return opts;
}

function _fr_staticOptionsFromSYS_Dropdowns(key, lang) {
  var sh = SpreadsheetApp.getActive().getSheetByName('SYS_Dropdowns');
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  var head = values.shift();
  var idx = {};
  head.forEach(function (h, i) {
    idx[h] = i;
  });
  return values
    .filter(function (r) {
      return (
        r[idx.Key] === key &&
        (r[idx.Is_Active] === true || String(r[idx.Is_Active]).toUpperCase() === 'TRUE')
      );
    })
    .sort(function (a, b) {
      return Number(a[idx.Sort_Order] || 0) - Number(b[idx.Sort_Order] || 0);
    })
    .map(function (r) {
      var en = r[idx.English_Title],
        ar = r[idx.Arabic_Title];
      return { value: en, label: lang === 'AR' && ar ? ar : en };
    });
}

function _fr_l10nMap() {
  var sh = SpreadsheetApp.getActive().getSheetByName('SYS_L10N');
  if (!sh) return {};
  var values = sh.getDataRange().getValues();
  var head = values.shift();
  var idx = {};
  head.forEach(function (h, i) {
    idx[h] = i;
  });
  var map = {};
  values.forEach(function (r) {
    if (!r || r[0] === '') return;
    var active = r[idx.Is_Active];
    if (!(active === true || String(active).toUpperCase() === 'TRUE')) return;
    var dict = r[idx.Dict];
    var key = r[idx.Key];
    var val = r[idx.Value_AR];
    map[dict] = map[dict] || {};
    map[dict][key] = val;
  });
  return map;
}

function _fr_toBool(val, fallback) {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (val == null) return typeof fallback === 'boolean' ? fallback : null;
  var s = String(val).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'enabled', 'active', 'نشط', 'مفعل', 'مُفعّل'].indexOf(s) !== -1)
    return true;
  if (
    ['false', '0', 'no', 'n', 'disabled', 'inactive', 'غير نشط', 'غير مُفعّل', 'غير مفعل'].indexOf(
      s
    ) !== -1
  )
    return false;
  return typeof fallback === 'boolean' ? fallback : null;
}

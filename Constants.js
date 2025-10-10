/**
 * @file Centralised constants used across the Nijjara ERP Apps Script project.
 * - All internals live inside a single global "CONSTANTS" object to avoid
 *   polluting the Apps Script global scope (and clashing with other files).
 * - UI labels are Arabic; technical keys are Pascal_Case.
 * - Nothing here should make network/file calls; pure data + helpers only.
 */
var CONSTANTS = (function () {
  'use strict';

  /**
   * SHEETS
   * ------
   * Internal map of logical keys -> actual sheet names.
   * Wrapped (not global) to avoid "Identifier 'SHEETS' has already been declared".
   */
  const SHEETS = Object.freeze({
    SYS_USERS: 'SYS_Users',
    SYS_ROLES: 'SYS_Roles',
    SYS_PERMISSIONS: 'SYS_Permissions',
    SYS_ROLE_PERMISSIONS: 'SYS_Role_Permissions',
    SYS_DROPDOWNS: 'SYS_Dropdowns',
    SYS_DOCUMENTS: 'SYS_Documents',
    SYS_AUDIT_LOG: 'SYS_Audit_Log',
    SYS_AUDIT_REPORT: 'SYS_Audit_Report',
    SYS_SETTINGS: 'SYS_Settings',
    SYS_SESSIONS: 'SYS_Sessions',
    SYS_USER_PROPS: 'SYS_User_Properties',
  });

  /**
   * HEADERS
   * -------
   * Sheet header rows (Pascal_Case). Keep these in sync with your actual
   * spreadsheet. Consumers should ONLY read these (never mutate).
   */
  const HEADERS = Object.freeze({
    SYS_Users: [
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
    ],
    SYS_Roles: [
      'Role_Id',
      'Role_Title',
      'Description',
      'Is_System',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ],
    SYS_Permissions: [
      'Permission_Key',
      'Permission_Label',
      'Description',
      'Category',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ],
    SYS_Role_Permissions: [
      'Role_Id',
      'Permission_Key',
      'Scope',
      'Allowed',
      'Constraints',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ],
    SYS_Audit_Log: ['Audit_Id', 'User_Id', 'Sheet', 'Action', 'Target_Id', 'Details', 'Created_At'],
    SYS_Audit_Report: [
      'Audit_Id',
      'Entity',
      'Entity_Id',
      'Action',
      'Actor_Id',
      'Summary',
      'Details',
      'Scope',
      'Created_At',
    ],
    SYS_Sessions: [
      'Session_Id',
      'User_Id',
      'Device',
      'Ip_Address',
      'Auth_Token',
      'Created_At',
      'Last_Seen',
      'Revoked_At',
      'Revoked_By',
    ],
    SYS_User_Properties: [
      'User_Id',
      'Property_Key',
      'Property_Value',
      'Created_At',
      'Created_By',
      'Updated_At',
      'Updated_By',
    ],
  });

  /**
   * FORM_DEFINITIONS
   * ----------------
   * Declarative form meta. Useful for:
   *  - Validating payloads before write
   *  - Auto-building UI
   *  - Enforcing conventions (IDs, dropdowns, inheritance)
   */
  const FORM_DEFINITIONS = Object.freeze({
    Add_User: {
      key: 'Add_User',
      label: 'إضافة مستخدم جديد',
      tabs: {
        // Group fields for UI tabs (right-to-left rendering handled by the UI)
        Profile: ['Full_Name', 'Email', 'Username'],
        Work: ['Job_Title', 'Department', 'Role_Id'],
        Security: ['IsActive', 'MFA_Enabled', 'Password_Hash', 'Disabled_At', 'Disabled_By'],
        Meta: ['Created_By', 'Created_At', 'Updated_By', 'Updated_At'],
      },
      fields: [
        // System ID: "USR_00001" style (prefix-based, fixed width)
        {
          name: 'User_Id',
          inputType: 'system-id',
          required: true,
          auto: true,
          validation: { pattern: '^USR_\\d{5}$' },
          labelAr: 'معرف_المستخدم',
        },
        {
          name: 'Full_Name',
          inputType: 'text',
          required: true,
          validation: { maxLength: 150 },
          labelAr: 'الاسم_الكامل',
        },
        // Normalize usernames to lowercase, simple safe charset
        {
          name: 'Username',
          inputType: 'text',
          required: true,
          validation: { unique: true, normalize: 'lowercase', pattern: '^[a-z0-9_.-]+$' },
          labelAr: 'اسم_المستخدم',
        },
        {
          name: 'Email',
          inputType: 'email',
          required: true,
          validation: { unique: true },
          labelAr: 'البريد_الإلكتروني',
        },

        // Dropdowns reference dynamic sources (sheet + category/column)
        {
          name: 'Job_Title',
          inputType: 'dropdown',
          required: false,
          datasource: { sheet: SHEETS.SYS_DROPDOWNS, category: 'Job Titles' },
          labelAr: 'المسمى_الوظيفي',
        },
        {
          name: 'Department',
          inputType: 'dropdown',
          required: false,
          datasource: { sheet: SHEETS.SYS_DROPDOWNS, category: 'Departments' },
          labelAr: 'القسم',
        },
        {
          name: 'Role_Id',
          inputType: 'dropdown',
          required: true,
          datasource: { sheet: SHEETS.SYS_ROLES, column: 'Role_Id' },
          labelAr: 'الدور',
        },

        // Permissions-first logic: IsActive default true, MFA optional
        {
          name: 'IsActive',
          inputType: 'checkbox',
          required: true,
          defaultValue: true,
          labelAr: 'نشط',
        },
        { name: 'Password_Hash', inputType: 'system', required: false, labelAr: 'كلمة_السر_hash' },
        {
          name: 'Disabled_At',
          inputType: 'system-date',
          required: false,
          labelAr: 'تاريخ_إلغاء_التفعيل',
        },
        { name: 'Disabled_By', inputType: 'system', required: false, labelAr: 'أُلغي_بواسطة' },
        { name: 'Last_Login', inputType: 'date', required: false, labelAr: 'آخر_تسجيل_دخول' },

        // Audit stamps (ISO dates expected elsewhere in code)
        { name: 'Created_At', inputType: 'system-date', required: true, labelAr: 'تاريخ_الإنشاء' },
        { name: 'Created_By', inputType: 'system', required: true, labelAr: 'أنشأ_بواسطة' },
        { name: 'Updated_At', inputType: 'system-date', required: false, labelAr: 'تاريخ_التعديل' },
        { name: 'Updated_By', inputType: 'system', required: false, labelAr: 'عدل_بواسطة' },

        { name: 'External_Id', inputType: 'text', required: false, labelAr: 'معرف_خارجي' },
        {
          name: 'MFA_Enabled',
          inputType: 'checkbox',
          required: false,
          defaultValue: false,
          labelAr: 'مصادقة_ثنائية',
        },
        { name: 'Notes', inputType: 'textarea', required: false, labelAr: 'ملاحظات' },
      ],
    },

    // Edit inherits Add (UI may hide system-only fields)
    Edit_User: {
      key: 'Edit_User',
      label: 'تعديل المستخدم',
      inherits: 'Add_User',
      extraControls: ['Change_Role', 'Deactivate_User'],
    },

    Reset_Password: {
      key: 'Reset_Password',
      label: 'إعادة تعيين كلمة السر',
      fields: [
        { name: 'User_Id', inputType: 'hidden', required: true },
        { name: 'Temp_Password', inputType: 'system', required: true }, // generated on server if empty
        { name: 'Expire_At', inputType: 'date', required: true },
      ],
    },

    Assign_Role: {
      key: 'Assign_Role',
      label: 'Assign Role',
      fields: [
        { name: 'Selected_User_Ids', inputType: 'multi-select', required: true },
        { name: 'Role_Id', inputType: 'dropdown', required: true },
        { name: 'Effective_From', inputType: 'date', required: false },
      ],
    },

    // Concrete form keys used by workflows
    FORM_SYS_AddUser: {
      key: 'FORM_SYS_AddUser',
      label: 'Add User',
      inherits: 'Add_User',
      workflow: 'SYS_Users',
    },
    FORM_SYS_EditUser: {
      key: 'FORM_SYS_EditUser',
      label: 'Edit User',
      inherits: 'Edit_User',
      workflow: 'SYS_Users',
    },
    FORM_SYS_ResetPassword: {
      key: 'FORM_SYS_ResetPassword',
      label: 'Reset Password',
      inherits: 'Reset_Password',
      workflow: 'SYS_Security',
    },
    FORM_SYS_ToggleActive: {
      key: 'FORM_SYS_ToggleActive',
      label: 'Deactivate / Activate',
      fields: [
        { name: 'User_Id', inputType: 'hidden', required: true },
        {
          name: 'Action',
          inputType: 'dropdown',
          required: true,
          options: ['DEACTIVATE', 'ACTIVATE'],
        },
        { name: 'Reason', inputType: 'textarea', required: false },
      ],
    },
    FORM_SYS_AssignRole: {
      key: 'FORM_SYS_AssignRole',
      label: 'Assign Role',
      inherits: 'Assign_Role',
      workflow: 'SYS_Roles',
    },
    FORM_SYS_DeleteUser: {
      key: 'FORM_SYS_DeleteUser',
      label: 'Delete User',
      fields: [
        { name: 'User_Id', inputType: 'hidden', required: true },
        { name: 'Archive_Note', inputType: 'textarea', required: false },
      ],
    },
    FORM_SYS_Impersonate: {
      key: 'FORM_SYS_Impersonate',
      label: 'Impersonate User',
      fields: [
        { name: 'Target_User_Id', inputType: 'hidden', required: true },
        { name: 'Justification', inputType: 'textarea', required: true },
        { name: 'Duration_Minutes', inputType: 'number', required: false, defaultValue: 15 },
      ],
    },
    FORM_SYS_UploadUserDoc: {
      key: 'FORM_SYS_UploadUserDoc',
      label: 'User Documents',
      fields: [
        { name: 'User_Id', inputType: 'hidden', required: true },
        { name: 'Document_Label', inputType: 'text', required: true },
        { name: 'Attachment', inputType: 'file', required: true },
        { name: 'Notes', inputType: 'textarea', required: false },
      ],
    },
  });

  /**
   * Permission keys used throughout the System Management module
   * (kept flat for ease of storage + dropdown use).
   */
  const PERMISSION_KEYS = Object.freeze({
    VIEW_USERS: 'VIEW_USERS',
    CREATE_USER: 'CREATE_USER',
    EDIT_USER: 'EDIT_USER',
    ASSIGN_ROLE: 'ASSIGN_ROLE',
    DEACTIVATE_USER: 'DEACTIVATE_USER',
    DELETE_USER: 'DELETE_USER',
    RESET_PASSWORD: 'RESET_PASSWORD',
    VIEW_AUDIT: 'VIEW_AUDIT',
    IMPERSONATE: 'IMPERSONATE',
    EXPORT_USERS: 'EXPORT_USERS',
  });

  /**
   * Default role-permission seed data.
   * Scope values are domain-specific: GLOBAL / LIMITED / DEPARTMENT / SELF.
   * Keep these minimal; real scope checks live in backend logic.
   */
  const DEFAULT_ROLE_PERMISSIONS = Object.freeze([
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.VIEW_USERS,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.CREATE_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    { Role_Id: 'Admin', Permission_Key: PERMISSION_KEYS.EDIT_USER, Scope: 'GLOBAL', Allowed: true },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.ASSIGN_ROLE,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.DEACTIVATE_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.DELETE_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.RESET_PASSWORD,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.VIEW_AUDIT,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.IMPERSONATE,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'Admin',
      Permission_Key: PERMISSION_KEYS.EXPORT_USERS,
      Scope: 'GLOBAL',
      Allowed: true,
    },

    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.VIEW_USERS,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.CREATE_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.EDIT_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.ASSIGN_ROLE,
      Scope: 'LIMITED',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.DEACTIVATE_USER,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.RESET_PASSWORD,
      Scope: 'GLOBAL',
      Allowed: true,
    },
    {
      Role_Id: 'HR_Manager',
      Permission_Key: PERMISSION_KEYS.VIEW_AUDIT,
      Scope: 'LIMITED',
      Allowed: true,
    },

    {
      Role_Id: 'Manager',
      Permission_Key: PERMISSION_KEYS.VIEW_USERS,
      Scope: 'DEPARTMENT',
      Allowed: true,
    },
    {
      Role_Id: 'Manager',
      Permission_Key: PERMISSION_KEYS.EDIT_USER,
      Scope: 'DEPARTMENT',
      Allowed: true,
    },
    {
      Role_Id: 'Manager',
      Permission_Key: PERMISSION_KEYS.DEACTIVATE_USER,
      Scope: 'DEPARTMENT',
      Allowed: true,
    },

    {
      Role_Id: 'Basic_User',
      Permission_Key: PERMISSION_KEYS.VIEW_USERS,
      Scope: 'SELF',
      Allowed: false,
    },
  ]);

  /* ==========================
     Helper (namespaced) APIs
     ========================== */

  // Return the whole constants bag (frozen) for read-only use.
  function getAll() {
    return Object.freeze({
      SHEETS,
      HEADERS,
      FORM_DEFINITIONS,
      PERMISSION_KEYS,
      DEFAULT_ROLE_PERMISSIONS,
    });
  }

  // Safe lookup of a sheet's physical name from its logical key.
  function getSheetName(sheetKey) {
    return SHEETS[sheetKey] || null;
  }

  // Return a shallow copy of headers for a given sheet name (so callers can't mutate).
  function getHeaders(sheetName) {
    return HEADERS[sheetName] ? HEADERS[sheetName].slice() : null;
  }

  // Form metadata by key.
  function getFormDefinition(formKey) {
    return FORM_DEFINITIONS[formKey] || null;
  }

  // Simple enum lister for UI dropdowns, etc.
  function listEnum(key) {
    if (key === 'PERMISSION_KEYS') return Object.values(PERMISSION_KEYS);
    if (key === 'FORM_KEYS') return Object.keys(FORM_DEFINITIONS);
    return [];
  }

  // Copy default role-permissions (avoid exposing the original array).
  function getDefaultRolePermissions() {
    return DEFAULT_ROLE_PERMISSIONS.map(function (entry) {
      return Object.assign({}, entry);
    });
  }

  // Expose a small, safe surface under the single global CONSTANTS.
  return Object.freeze({
    SHEETS,
    HEADERS,
    FORM_DEFINITIONS,
    PERMISSION_KEYS,
    DEFAULT_ROLE_PERMISSIONS,
    getAll,
    getSheetName,
    getHeaders,
    getFormDefinition,
    listEnum,
    getDefaultRolePermissions,
  });
})();

/**
 * Compatibility shims
 * -------------------
 * If older code expects global functions (e.g., getConstants()), we add them
 * only if they don't already exist. This prevents "already declared" errors.
 */
(function (g) {
  if (typeof g.getConstants !== 'function') {
    g.getConstants = function () {
      return CONSTANTS;
    };
  }
  if (typeof g.getSheetName !== 'function') {
    g.getSheetName = CONSTANTS.getSheetName;
  }
  if (typeof g.getHeaders !== 'function') {
    g.getHeaders = CONSTANTS.getHeaders;
  }
  if (typeof g.getFormDefinition !== 'function') {
    g.getFormDefinition = CONSTANTS.getFormDefinition;
  }
  if (typeof g.listEnum !== 'function') {
    g.listEnum = CONSTANTS.listEnum;
  }
  if (typeof g.getDefaultRolePermissions !== 'function') {
    g.getDefaultRolePermissions = CONSTANTS.getDefaultRolePermissions;
  }
})(this); // "this" is the Apps Script global

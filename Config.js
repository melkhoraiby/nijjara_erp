/**
 * Config.js — System Management Module (Patched)
 *
 * Purpose:
 *  - Centralize spreadsheet/sheet IDs and feature flags
 *  - Provide safe helpers to access the primary Spreadsheet and named Sheets
 *  - Stay backward-compatible with legacy references to `SHEETS.*`
 *  - Enforce naming consistency (Pascal_Case keys) without blocking runtime
 *
 * Notes:
 *  - UI labels remain Arabic in the front-end; code is English.
 *  - This file is Apps Script compatible (no module.exports).
 */

// =============================================================================
// Core Config (edit values here as needed)
// =============================================================================
var CONFIG = {
  /**
   * If this script is NOT container-bound, set the Spreadsheet ID here.
   * If left empty/null, the helpers will fall back to SpreadsheetApp.getActive().
   */
  PRIMARY_SPREADSHEET_ID: '1GX4xeV3BHmSNlSrecy8Yh1rbg_NReDGoGd7GQs7MbHA',

  /**
   * Canonical Sheet Name map (Pascal_Case keys). Keep in sync with your workbook.
   */
  SHEET_IDS: {
    PRJ_Main: 'PRJ_Main',
    PRJ_Tasks: 'PRJ_Tasks',
    PRJ_Costs: 'PRJ_Costs',
    PRJ_Clients: 'PRJ_Clients',
    PRJ_Materials: 'PRJ_Materials',
    PRJ_InDirExp_Allocations: 'PRJ_InDirExp_Allocations',
    PRJ_Schedule_Calc: 'PRJ_Schedule_Calc',
    PRJ_Dashboard: 'PRJ_Dashboard',
    PRJ_KPIs: 'PRJ_KPIs',
    FIN_DirectExpenses: 'FIN_DirectExpenses',

    // System Management backbone
    SYS_Documents: 'SYS_Documents',
    SYS_Users: 'SYS_Users',
    SYS_Roles: 'SYS_Roles',
    SYS_Permissions: 'SYS_Permissions',
    SYS_Role_Permissions: 'SYS_Role_Permissions',
    SYS_Dynamic_Forms: 'SYS_Dynamic_Forms',
    SYS_Dropdowns: 'SYS_Dropdowns',
    SYS_Profile_View: 'SYS_Profile_View',
    SYS_Audit_Report: 'SYS_Audit_Report',
    SYS_Audit_Log: 'SYS_Audit_Log',
    SYS_Sessions: 'SYS_Sessions',
    SYS_User_Properties: 'SYS_User_Properties',
  },

  /** Optional: Drive folders used by features */
  FOLDER_IDS: {
    // Example: ProjectDocs: 'FOLDER_ID_HERE'
  },

  /** Feature flags/toggles for safe rollout */
  FEATURE_FLAGS: {
    // Example: EnableArabicUI: true
  },
};

// Backward-compatible alias so legacy code can still call SHEETS.SYS_Users, etc.
// (Read-only by convention; mutate CONFIG.SHEET_IDS, not SHEETS.)
var SHEETS = CONFIG.SHEET_IDS;

// =============================================================================
// Public Accessors
// =============================================================================

/** Get a deep copy of CONFIG (avoid accidental external mutation). */
function getConfig() {
  return JSON.parse(JSON.stringify(CONFIG));
}

/**
 * setConfig — supports top-level keys (e.g., 'PRIMARY_SPREADSHEET_ID')
 * or nested via path array (e.g., ['FEATURE_FLAGS','EnableArabicUI']).
 */
function setConfig(key, val) {
  if (Array.isArray(key)) {
    var ref = CONFIG;
    for (var i = 0; i < key.length - 1; i++) {
      var k = key[i];
      if (!(k in ref) || typeof ref[k] !== 'object' || ref[k] === null) {
        ref[k] = {};
      }
      ref = ref[k];
    }
    ref[key[key.length - 1]] = val;
  } else {
    CONFIG[key] = val;
  }
}

function getSheetId(name) {
  return CONFIG.SHEET_IDS && CONFIG.SHEET_IDS[name] ? CONFIG.SHEET_IDS[name] : null;
}

function getFolderId(name) {
  return CONFIG.FOLDER_IDS && CONFIG.FOLDER_IDS[name] ? CONFIG.FOLDER_IDS[name] : null;
}

function getFeatureFlag(flagName, defaultValue) {
  if (!CONFIG.FEATURE_FLAGS) return defaultValue;
  return Object.prototype.hasOwnProperty.call(CONFIG.FEATURE_FLAGS, flagName)
    ? CONFIG.FEATURE_FLAGS[flagName]
    : defaultValue;
}

function setFeatureFlag(flagName, value) {
  CONFIG.FEATURE_FLAGS = CONFIG.FEATURE_FLAGS || {};
  CONFIG.FEATURE_FLAGS[flagName] = value;
}

// =============================================================================
// Spreadsheet & Sheet Helpers (Apps Script Safe)
// =============================================================================

/** Resolve the primary spreadsheet (by ID if provided; otherwise active). */
function getPrimarySpreadsheet() {
  var id = CONFIG.PRIMARY_SPREADSHEET_ID;
  try {
    if (id && typeof SpreadsheetApp !== 'undefined') {
      return SpreadsheetApp.openById(id);
    }
  } catch (e) {
    // Fall back to active spreadsheet if openById fails (bad permission/ID)
  }
  if (typeof SpreadsheetApp !== 'undefined') {
    return SpreadsheetApp.getActive();
  }
  throw new Error('SpreadsheetApp is not available in this runtime.');
}

/** True if the named sheet exists in the primary spreadsheet. */
function hasSheet(name) {
  var ss = getPrimarySpreadsheet();
  return !!ss.getSheetByName(name);
}

/** Get the named sheet or throw a descriptive error. */
function getSheet(name) {
  var ss = getPrimarySpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('Sheet not found: ' + name + ' (check Config.SHEET_IDS and workbook)');
  }
  return sheet;
}

/** Assert sheet exists; returns the Sheet to be chainable. */
function assertSheet(name) {
  return getSheet(name); // will throw if missing
}

// =============================================================================
// System Backbone: quick sanity helper (non-throwing)
// =============================================================================

/**
 * Non-throwing readiness probe for System Management backbone sheets.
 * Returns an object mapping sheet key -> Boolean (exists?).
 */
function probeSystemSheets() {
  var keys = [
    'SYS_Users',
    'SYS_Roles',
    'SYS_Permissions',
    'SYS_Role_Permissions',
    'SYS_User_Properties',
    'SYS_Documents',
    'SYS_Profile_View',
    'SYS_Dynamic_Forms',
    'SYS_Dropdowns',
    'SYS_Audit_Log',
    'SYS_Sessions',
  ];
  var status = {};
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var name = getSheetId(k) || k; // fallback to key if mapping is 1:1
    try {
      status[k] = hasSheet(name);
    } catch (e) {
      status[k] = false;
    }
  }
  return status;
}

// =============================================================================
// Exposed for global use (Apps Script global scope)
// =============================================================================
// (Functions are already in global scope in Apps Script; these assignments just
//  make intent explicit if you import this in other contexts.)
var NijjaraConfig = {
  getConfig: getConfig,
  setConfig: setConfig,
  getSheetId: getSheetId,
  getFolderId: getFolderId,
  getFeatureFlag: getFeatureFlag,
  setFeatureFlag: setFeatureFlag,
  getPrimarySpreadsheet: getPrimarySpreadsheet,
  hasSheet: hasSheet,
  getSheet: getSheet,
  assertSheet: assertSheet,
  probeSystemSheets: probeSystemSheets,
  SHEETS: SHEETS,
};

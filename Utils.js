// ID generation, date formatting, and safe sheet utilities

function zeroPad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function formatISODate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function parseISODate(str) {
  if (!str) return null;
  var parts = str.split('-');
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function safeSetValues(sheet, rangeA1, values) {
  var range = sheet.getRange(rangeA1);
  range.setValues(values);
}

var SPREADSHEET_CACHE_ = null;
var SPREADSHEET_ID_CACHE_ = null;

function getSpreadsheet() {
  if (SPREADSHEET_CACHE_) {
    try {
      SPREADSHEET_CACHE_.getId();
      return SPREADSHEET_CACHE_;
    } catch (err) {
      SPREADSHEET_CACHE_ = null;
      SPREADSHEET_ID_CACHE_ = null;
    }
  }

  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    ss = null;
  }

  if (ss) {
    SPREADSHEET_CACHE_ = ss;
    SPREADSHEET_ID_CACHE_ = ss.getId();
    try {
      PropertiesService.getScriptProperties().setProperty(
        'PRIMARY_SPREADSHEET_ID',
        SPREADSHEET_ID_CACHE_
      );
    } catch (err) {}
    return ss;
  }

  var spreadsheetId = SPREADSHEET_ID_CACHE_;

  if (!spreadsheetId) {
    try {
      var scriptProps = PropertiesService.getScriptProperties();
      spreadsheetId = scriptProps ? scriptProps.getProperty('PRIMARY_SPREADSHEET_ID') : null;
    } catch (err) {
      spreadsheetId = null;
    }
  }

  if (!spreadsheetId && typeof CONFIG !== 'undefined' && CONFIG.PRIMARY_SPREADSHEET_ID) {
    spreadsheetId = CONFIG.PRIMARY_SPREADSHEET_ID;
  }

  if (!spreadsheetId && typeof getConfig === 'function') {
    try {
      var cfg = getConfig();
      spreadsheetId = cfg && cfg.PRIMARY_SPREADSHEET_ID ? cfg.PRIMARY_SPREADSHEET_ID : null;
    } catch (err) {
      spreadsheetId = null;
    }
  }

  if (!spreadsheetId) {
    throw new Error(
      'Primary spreadsheet ID not available. Set PRIMARY_SPREADSHEET_ID in Config.js or Script Properties.'
    );
  }

  ss = SpreadsheetApp.openById(spreadsheetId);
  SPREADSHEET_CACHE_ = ss;
  SPREADSHEET_ID_CACHE_ = spreadsheetId;
  return ss;
}

function setPrimarySpreadsheetId(id) {
  if (!id) throw new Error('Spreadsheet ID is required.');
  PropertiesService.getScriptProperties().setProperty('PRIMARY_SPREADSHEET_ID', id);
  SPREADSHEET_ID_CACHE_ = id;
  SPREADSHEET_CACHE_ = SpreadsheetApp.openById(id);
  return SPREADSHEET_ID_CACHE_;
}

function generateId(prefix, sheetName) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var propKey = 'SEQ_' + prefix + '_' + sheetName;
    var props = PropertiesService.getDocumentProperties();
    var seq = parseInt(props.getProperty(propKey) || '0', 10) + 1;
    props.setProperty(propKey, seq);
    return prefix + '_' + zeroPad(seq, 5);
  } finally {
    lock.releaseLock();
  }
}

function createPrefixedId(prefix, sheetName) {
  return generateId(prefix, sheetName || prefix);
}

function ensureISODate(value) {
  return formatISODate(value || new Date());
}

function normalizeUsername(username) {
  if (typeof username !== 'string') return '';
  return username.trim().toLowerCase();
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    var normalized = value.trim().toLowerCase();
    return (
      normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y'
    );
  }
  return false;
}

function safeJsonStringify(obj) {
  try {
    return JSON.stringify(obj || {});
  } catch (err) {
    Logger.log('safeJsonStringify failed: ' + err.message);
    return '{}';
  }
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback || {};
  try {
    return JSON.parse(str);
  } catch (err) {
    Logger.log('safeJsonParse failed: ' + err.message);
    return fallback || {};
  }
}

const HASH_ALGORITHM = Utilities.DigestAlgorithm.SHA_256;

function hashPassword_(password) {
  const salt = Utilities.getUuid();
  const saltedPassword = password + salt;
  const hashBytes = Utilities.computeDigest(HASH_ALGORITHM, saltedPassword);
  const hash = Utilities.base64Encode(hashBytes);
  return salt + ':' + hash;
}

function verifyPassword_(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const parts = storedHash.split(':');
  const salt = parts[0];
  const hash = parts[1];
  const saltedPassword = password + salt;
  const hashBytesToVerify = Utilities.computeDigest(HASH_ALGORITHM, saltedPassword);
  const hashToVerify = Utilities.base64Encode(hashBytesToVerify);
  return hashToVerify === hash;
}

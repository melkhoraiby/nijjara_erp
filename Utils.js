// Utils.js — shared helpers

function zeroPad(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function formatISODate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
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
  } catch (e) {
    return '{}';
  }
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback || {};
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback || {};
  }
}

// Password hashing (Apps Script)
const HASH_ALGORITHM = Utilities.DigestAlgorithm.SHA_256;
function hashPassword_(password) {
  const salt = Utilities.base64Encode(Math.random().toString(36).substring(2, 15));
  const bytes = Utilities.computeDigest(HASH_ALGORITHM, password + salt);
  return salt + ':' + Utilities.base64Encode(bytes);
}
function verifyPassword_(password, salted) {
  if (!salted || salted.indexOf(':') === -1) return false;
  var parts = salted.split(':');
  var salt = parts[0],
    hash = parts[1];
  var bytes = Utilities.computeDigest(HASH_ALGORITHM, password + salt);
  return Utilities.base64Encode(bytes) === hash;
}

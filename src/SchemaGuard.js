// SchemaGuard.js — sheet I/O core utilities

function ensureHeaders(sheetName, headersArray) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(sheetName);
  if (!sh) sh = ss.insertSheet(sheetName);

  const headers = headersArray || [];
  if (!headers.length) return sh;

  const range = sh.getRange(1, 1, 1, headers.length);
  const current = range.getValues()[0];
  const diff = headers.some((h, i) => current[i] !== h);
  if (diff) range.setValues([headers]).setFontWeight('bold').setBackground('#D9D9D9');
  if (sh.getFrozenRows() !== 1) sh.setFrozenRows(1);
  return sh;
}

function readSheetAsObjects(sheetName) {
  const sh = ensureHeaders(sheetName);
  if (sh.getLastRow() < 2) return [];

  const data = sh.getDataRange().getValues();
  const headers = data.shift();

  return data
    .filter((row) => row[0] !== '')
    .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
}

function _getRows(sheetName) {
  const sh = ensureHeaders(sheetName);
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  return data
    .filter((r) => r[0] !== '')
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

function _addRow(sheetName, obj) {
  const sh = ensureHeaders(sheetName);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const row = headers.map((h) => (h in obj ? obj[h] : ''));
  sh.appendRow(row);
  return obj;
}

function _updateRow(sheetName, keyField, keyValue, updates) {
  const sh = ensureHeaders(sheetName);
  const values = sh.getDataRange().getValues();
  const headers = values.shift();
  const idx = headers.indexOf(keyField);
  if (idx === -1) return false;

  for (let i = 0; i < values.length; i++) {
    if (values[i][idx] === keyValue) {
      headers.forEach((h, j) => {
        if (updates[h] !== undefined) values[i][j] = updates[h];
      });
      sh.getRange(2, 1, values.length, headers.length).setValues(values);
      return true;
    }
  }
  return false;
}

function _deleteRow(sheetName, keyField, keyValue) {
  const sh = ensureHeaders(sheetName);
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  const idx = headers.indexOf(keyField);
  for (let i = 0; i < data.length; i++) {
    if (data[i][idx] === keyValue) {
      sh.deleteRow(i + 2);
      return true;
    }
  }
  return false;
}

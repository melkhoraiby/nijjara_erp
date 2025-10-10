// SchemaGuard.js — sheet + headers helpers

function ensureHeaders(sheetName, headersArray) {
  if (!sheetName) throw new Error('ensureHeaders requires a sheet name.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  var headers = headersArray || [];
  if (!headers.length) return sheet;

  var currentRange = sheet.getRange(1, 1, 1, headers.length);
  var currentValues = currentRange.getValues()[0];
  var needsUpdate = currentValues.length !== headers.length;
  if (!needsUpdate) {
    for (var i = 0; i < headers.length; i++) {
      if (currentValues[i] !== headers[i]) {
        needsUpdate = true;
        break;
      }
    }
  }
  if (needsUpdate) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#D9D9D9');
  if (sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1);
  return sheet;
}

function readSheetAsObjects(sheetName) {
  var sheet = ensureHeaders(sheetName);
  if (sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values.shift();
  return values
    .filter(function (r) {
      return r[0] !== '';
    })
    .map(function (row) {
      var obj = {};
      for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
      return obj;
    });
}

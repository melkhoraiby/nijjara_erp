/**
 * @file Helper utilities that guarantee required system sheets exist
 * and expose the expected header structure.
 */

function ensureHeaders(sheetName, headersArray) {
  if (!sheetName) throw new Error('ensureHeaders requires a sheet name.');
  var ss =
    typeof getSpreadsheet === 'function' ? getSpreadsheet() : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (!sheet) {
    throw new Error('Unable to access sheet: ' + sheetName);
  }

  var headers =
    headersArray || (typeof getHeaders === 'function' ? getHeaders(sheetName) : null) || [];
  if (!headers.length) {
    return sheet;
  }

  var lastCol = sheet.getLastColumn();
  var current = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var same = current.length === headers.length;
  if (same) {
    for (var i = 0; i < headers.length; i++) {
      if (current[i] !== headers[i]) {
        same = false;
        break;
      }
    }
  }

  if (!same) {
    if (lastCol > headers.length) {
      sheet.getRange(1, headers.length + 1, 1, lastCol - headers.length).clearContent();
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#D9D9D9');
  if (sheet.getFrozenRows() !== 1) sheet.setFrozenRows(1);
  return sheet;
}

function ensureSheet(sheetKey) {
  var sheetName = typeof getSheetName === 'function' ? getSheetName(sheetKey) : sheetKey;
  var headers = typeof getHeaders === 'function' && sheetName ? getHeaders(sheetName) : null;
  return ensureHeaders(sheetName, headers);
}

function readSheetAsObjects(sheetName) {
  var sheet = ensureHeaders(sheetName);
  if (sheet.getLastRow() < 2) return [];
  var range = sheet.getDataRange();
  var values = range.getValues();
  var headers = values.shift();
  return values.map(function (row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
    return obj;
  });
}

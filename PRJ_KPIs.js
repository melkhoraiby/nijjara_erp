// Project KPIs
// Key functions: recordKPI, getKPIs

function getKPISheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_KPIs');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function recordKPI(metric, value, notes) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_KPIs');
  const map = getKPISheetMap();
  const row = [];
  Object.keys(map).forEach((col) => {
    switch (col) {
      case 'Metric':
        row[map[col]] = metric;
        break;
      case 'Value':
        row[map[col]] = value;
        break;
      case 'Notes':
        row[map[col]] = notes || '';
        break;
      default:
        row[map[col]] = '';
    }
  });
  sheet.appendRow(row);
  return { success: true };
}

function getKPIs(filter) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_KPIs');
  const map = getKPISheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    let match = true;
    if (filter) {
      Object.keys(filter).forEach((col) => {
        if (map[col] !== undefined && values[i][map[col]] != filter[col]) match = false;
      });
    }
    if (match) {
      const obj = {};
      Object.keys(map).forEach((col) => (obj[col] = values[i][map[col]]));
      results.push(obj);
    }
  }
  return results;
}


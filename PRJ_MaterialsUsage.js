// Project materials usage and reconciliation
// Key functions: recordMaterialUsage, getUsage, reconcileUsage

function getUsageSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials_Usage');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function recordMaterialUsage(projectId, line, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials_Usage');
  const map = getUsageSheetMap();
  const usageId = generateId('USG', 'PRJ_Materials_Usage');
  const now = formatISODate(new Date());
  const row = [];
  Object.keys(map).forEach((col) => {
    switch (col) {
      case 'Usage_ID':
        row[map[col]] = usageId;
        break;
      case 'Project_ID':
        row[map[col]] = projectId;
        break;
      case 'Material_ID':
        row[map[col]] = line.Material_ID;
        break;
      case 'Qty':
        row[map[col]] = line.Qty;
        break;
      case 'Unit':
        row[map[col]] = line.Unit;
        break;
      case 'Unit_Price':
        row[map[col]] = line.Unit_Price;
        break;
      case 'Line_Total':
        row[map[col]] = (Number(line.Qty) * Number(line.Unit_Price)).toFixed(2);
        break;
      case 'Created_At':
        row[map[col]] = now;
        break;
      case 'Created_By':
        row[map[col]] = user.User_ID || user.Email;
        break;
      case 'Source_Cost_ID':
        row[map[col]] = line.Source_Cost_ID || '';
        break;
      default:
        row[map[col]] = '';
    }
  });
  sheet.appendRow(row);
  logAction(user.User_ID, 'MATERIAL_USAGE', 'Material usage recorded: ' + usageId, { line });
  return { success: true, Usage_ID: usageId };
}

function getUsage(projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials_Usage');
  const map = getUsageSheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Project_ID']] === projectId) {
      const obj = {};
      Object.keys(map).forEach((col) => (obj[col] = values[i][map[col]]));
      results.push(obj);
    }
  }
  return results;
}

function reconcileUsage(projectId) {
  // Implement reconciliation logic as needed
  return {};
}


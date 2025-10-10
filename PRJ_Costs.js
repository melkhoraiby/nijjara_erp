// Project direct costs
// Key functions: createCost, listCosts, sumCosts

function getCostSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Costs');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function createCost(data, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Costs');
  const map = getCostSheetMap();
  const costId = generateId('COST', 'PRJ_Costs');
  const now = formatISODate(new Date());
  const row = [];
  Object.keys(map).forEach((col) => {
    switch (col) {
      case 'Cost_ID':
        row[map[col]] = costId;
        break;
      case 'Created_At':
        row[map[col]] = now;
        break;
      case 'Created_By':
        row[map[col]] = user.User_ID || user.Email;
        break;
      default:
        row[map[col]] = data[col] || '';
    }
  });
  sheet.appendRow(row);
  logAction(user.User_ID, 'COST_CREATE', 'Cost created: ' + costId, { data });
  return { success: true, Cost_ID: costId };
}

function listCosts(projectId, filter) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Costs');
  const map = getCostSheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    let match = true;
    if (projectId && values[i][map['Project_ID']] !== projectId) match = false;
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

function sumCosts(projectId, category) {
  const costs = listCosts(projectId);
  let sum = 0;
  costs.forEach((cost) => {
    if (!category || cost.Category === category) {
      sum += Number(cost.Amount) || 0;
    }
  });
  return sum;
}


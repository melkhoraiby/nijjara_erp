// Indirect expense allocations
// Key functions: allocateInDirExpense, listAllocationsForProject, computeAllocationAmount

function getAllocSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_InDirExp_Allocations');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function allocateInDirExpense(expenseId, allocationsMap, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_InDirExp_Allocations');
  const map = getAllocSheetMap();
  const now = formatISODate(new Date());
  Object.keys(allocationsMap).forEach((projectId) => {
    const alloc = allocationsMap[projectId];
    const allocId = generateId('ALLOC', 'PRJ_InDirExp_Allocations');
    const row = [];
    Object.keys(map).forEach((col) => {
      switch (col) {
        case 'Expense_ID':
          row[map[col]] = expenseId;
          break;
        case 'Project_ID':
          row[map[col]] = projectId;
          break;
        case 'Allocation_Percentage':
          row[map[col]] = alloc.percentage;
          break;
        case 'Allocation_Amount':
          row[map[col]] = alloc.amount;
          break;
        case 'Created_At':
          row[map[col]] = now;
          break;
        case 'Created_By':
          row[map[col]] = user.User_ID || user.Email;
          break;
        case 'Allocation_ID':
          row[map[col]] = allocId;
          break;
        case 'Allocation_Method':
          row[map[col]] = alloc.method || '';
          break;
        default:
          row[map[col]] = '';
      }
    });
    sheet.appendRow(row);
    logAction(user.User_ID, 'ALLOCATION_CREATE', 'Indirect expense allocated: ' + allocId, {
      expenseId,
      projectId,
      alloc,
    });
  });
  return { success: true };
}

function listAllocationsForProject(projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_InDirExp_Allocations');
  const map = getAllocSheetMap();
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

function computeAllocationAmount(total, percentage) {
  return Math.round(((Number(total) * Number(percentage)) / 100) * 100) / 100;
}


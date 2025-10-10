// Finance integration helpers
// Key functions: createDirectExpenseFromCart, linkCostToFinance

function createDirectExpenseFromCart(costRow) {
  const sheet = getSpreadsheet().getSheetByName('FIN_DirectExpenses');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  const expenseId = generateId('FIN', 'FIN_DirectExpenses');
  const row = [];
  Object.keys(map).forEach((col) => {
    if (costRow[col] !== undefined) row[map[col]] = costRow[col];
    else if (col === 'Expense_ID') row[map[col]] = expenseId;
    else row[map[col]] = '';
  });
  sheet.appendRow(row);
  return { success: true, Expense_ID: expenseId };
}

function linkCostToFinance(costId, financeId) {
  // Optionally update PRJ_Costs with Finance_Link_ID
  const sheet = getSpreadsheet().getSheetByName('PRJ_Costs');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Cost_ID']] === costId) {
      if (map['Finance_Link_ID'] !== undefined) values[i][map['Finance_Link_ID']] = financeId;
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      return { success: true };
    }
  }
  return { error: { code: 'NOT_FOUND' } };
}


// Validation helpers for Projects module
// Key functions: validateProject, validateTask, validateCost, validateMaterial, validateCart

function validateProject(projectRow) {
  const required = ['Project_ID', 'Project_Name', 'Start_Date', 'End_Date'];
  for (let k of required) {
    if (!projectRow[k] || String(projectRow[k]).trim() === '')
      return { error: { code: 'MISSING_' + k } };
  }
  if (new Date(projectRow['End_Date']) < new Date(projectRow['Start_Date']))
    return { error: { code: 'DATE_INVALID' } };
  return { success: true };
}

function validateTask(taskRow) {
  const required = ['Task_ID', 'Task_Name', 'Project_ID', 'Start_Date', 'End_Date'];
  for (let k of required) {
    if (!taskRow[k] || String(taskRow[k]).trim() === '') return { error: { code: 'MISSING_' + k } };
  }
  if (new Date(taskRow['End_Date']) < new Date(taskRow['Start_Date']))
    return { error: { code: 'DATE_INVALID' } };
  return { success: true };
}

function validateCost(costRow) {
  const required = ['Cost_ID', 'Project_ID', 'Amount', 'Cost_Type'];
  for (let k of required) {
    if (!costRow[k] || String(costRow[k]).trim() === '') return { error: { code: 'MISSING_' + k } };
  }
  if (isNaN(Number(costRow['Amount'])) || Number(costRow['Amount']) < 0)
    return { error: { code: 'AMOUNT_INVALID' } };
  return { success: true };
}

function validateMaterial(materialRow) {
  const required = ['Material_ID', 'Material_Name', 'Unit', 'Unit_Price'];
  for (let k of required) {
    if (!materialRow[k] || String(materialRow[k]).trim() === '')
      return { error: { code: 'MISSING_' + k } };
  }
  if (isNaN(Number(materialRow['Unit_Price'])) || Number(materialRow['Unit_Price']) < 0)
    return { error: { code: 'PRICE_INVALID' } };
  return { success: true };
}

function validateCart(cartRow) {
  if (!cartRow['Cart_ID'] || String(cartRow['Cart_ID']).trim() === '')
    return { error: { code: 'MISSING_Cart_ID' } };
  if (!Array.isArray(cartRow['Lines']) || cartRow['Lines'].length === 0)
    return { error: { code: 'EMPTY_CART' } };
  for (let line of cartRow['Lines']) {
    if (!line['Material_ID'] || !line['Quantity'] || Number(line['Quantity']) <= 0)
      return { error: { code: 'INVALID_LINE' } };
  }
  return { success: true };
}


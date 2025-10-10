// Form rendering helpers for Projects module
// Key functions: renderProjectForm, renderTaskForm, renderCostForm, renderMaterialForm, renderCartForm

function renderProjectForm(projectRow) {
  // Returns HTML string for project form
  return `<form id="projectForm">
    <label>Project Name: <input name="Project_Name" value="${projectRow?.Project_Name || ''}" /></label><br/>
    <label>Start Date: <input type="date" name="Start_Date" value="${projectRow?.Start_Date || ''}" /></label><br/>
    <label>End Date: <input type="date" name="End_Date" value="${projectRow?.End_Date || ''}" /></label><br/>
    <button type="submit">Save</button>
  </form>`;
}

function renderTaskForm(taskRow) {
  return `<form id="taskForm">
    <label>Task Name: <input name="Task_Name" value="${taskRow?.Task_Name || ''}" /></label><br/>
    <label>Project ID: <input name="Project_ID" value="${taskRow?.Project_ID || ''}" /></label><br/>
    <label>Start Date: <input type="date" name="Start_Date" value="${taskRow?.Start_Date || ''}" /></label><br/>
    <label>End Date: <input type="date" name="End_Date" value="${taskRow?.End_Date || ''}" /></label><br/>
    <button type="submit">Save</button>
  </form>`;
}

function renderCostForm(costRow) {
  return `<form id="costForm">
    <label>Amount: <input name="Amount" value="${costRow?.Amount || ''}" /></label><br/>
    <label>Cost Type: <input name="Cost_Type" value="${costRow?.Cost_Type || ''}" /></label><br/>
    <label>Project ID: <input name="Project_ID" value="${costRow?.Project_ID || ''}" /></label><br/>
    <button type="submit">Save</button>
  </form>`;
}

function renderMaterialForm(materialRow) {
  return `<form id="materialForm">
    <label>Material Name: <input name="Material_Name" value="${materialRow?.Material_Name || ''}" /></label><br/>
    <label>Unit: <input name="Unit" value="${materialRow?.Unit || ''}" /></label><br/>
    <label>Unit Price: <input name="Unit_Price" value="${materialRow?.Unit_Price || ''}" /></label><br/>
    <button type="submit">Save</button>
  </form>`;
}

function renderCartForm(cartRow) {
  let linesHtml = '';
  if (Array.isArray(cartRow?.Lines)) {
    for (let line of cartRow.Lines) {
      linesHtml += `<div>Material: <input name="Material_ID" value="${line.Material_ID || ''}" /> Quantity: <input name="Quantity" value="${line.Quantity || ''}" /></div>`;
    }
  }
  return `<form id="cartForm">
    <label>Cart ID: <input name="Cart_ID" value="${cartRow?.Cart_ID || ''}" /></label><br/>
    ${linesHtml}
    <button type="submit">Checkout</button>
  </form>`;
}

/***** Employees (HR) - Minimal API *****/

function HR_createEmployee(data){
  const u = requireRole_(['Admin','Manager']);
  if(!data || !data.Full_Name) throw new Error('Full_Name is required.');

  const sh = getSheet(SHEETS.HR_EMPLOYEES);
  const id = 'HR_' + pad(sh.getLastRow());
  const row = {
    Employee_ID: id,
    Full_Name: String(data.Full_Name||'').trim(),
    National_ID: String(data.National_ID||'').trim(),
    Phone: String(data.Phone||'').trim(),
    Email: String(data.Email||'').trim().toLowerCase(),
    Hire_Date: String(data.Hire_Date||'').trim() || new Date().toISOString().slice(0,10),
    Status: 'Active'
  };
  appendRowByMap_(SHEETS.HR_EMPLOYEES, row);
  logAction_(u.email, 'CREATE', 'HR', id, row);
  return { ok:true, id };
}

function HR_listEmployees(limit, offset){
  requireRole_(['Admin','Manager','Viewer']);
  const fields = ['Employee_ID','Full_Name','Phone','Email','Status'];
  return listRows_(SHEETS.HR_EMPLOYEES, fields, limit||50, offset||0);
}


/***** Projects - Minimal API *****/

function PRJ_createProject(data){
  const u = requireRole_(['Admin','Manager']);
  if(!data || !data.Name) throw new Error('Name is required.');

  const sh = getSheet(SHEETS.PRJ_PROJECTS);
  const id = 'PRJ_' + pad(sh.getLastRow());
  const row = {
    Project_ID: id,
    Name: String(data.Name||'').trim(),
    Customer: String(data.Customer||'').trim(),
    Start_Date: String(data.Start_Date||'').trim() || new Date().toISOString().slice(0,10),
    End_Date: String(data.End_Date||'').trim(),
    Status: 'Open'
  };
  appendRowByMap_(SHEETS.PRJ_PROJECTS, row);
  logAction_(u.email, 'CREATE', 'PRJ', id, row);
  return { ok:true, id };
}

function PRJ_listProjects(limit, offset){
  requireRole_(['Admin','Manager','Viewer']);
  const fields = ['Project_ID','Name','Customer','Status'];
  return listRows_(SHEETS.PRJ_PROJECTS, fields, limit||50, offset||0);
}

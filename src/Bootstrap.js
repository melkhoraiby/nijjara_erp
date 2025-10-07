/***** =========================================================
 * Nijjara ERP - One-time Bootstrap
 * Creates core sheets with Pascal_Case headers and seeds Admin
 * Run DB_bootstrap() ONCE, then delete or keep for re-runs.
 * ========================================================= *****/

const __SHEETS__ = {
  SYS_USERS: 'SYS_Users',
  SYS_AUDIT_LOG: 'SYS_Audit_Log',
  HR_EMPLOYEES: 'HR_Employees',
  PRJ_PROJECTS: 'PRJ_Projects'
};

const __SCHEMA__ = {
  SYS_Users: ['User_ID','Email','Display_Name','Role','Status','Last_Login_On'],
  SYS_Audit_Log: ['Audit_ID','Timestamp','Email','Action','Module','Entity_ID','Details_JSON'],
  HR_Employees: ['Employee_ID','Full_Name','National_ID','Phone','Email','Hire_Date','Status'],
  PRJ_Projects: ['Project_ID','Name','Customer','Start_Date','End_Date','Status']
};

function DB_bootstrap(){
  const db = SpreadsheetApp.openById(typeof SPREADSHEET_ID === 'string' && SPREADSHEET_ID
                                      ? SPREADSHEET_ID : SpreadsheetApp.getActive().getId());

  // 1) Create sheets if missing + set headers
  Object.entries(__SCHEMA__).forEach(([sheetName, headers])=>{
    let sh = db.getSheetByName(sheetName);
    if(!sh){ sh = db.insertSheet(sheetName); }
    if(sh.getLastRow() === 0){ // empty brand-new tab
      sh.getRange(1,1,1,headers.length).setValues([headers]);
      sh.setFrozenRows(1);
    } else {
      // Validate headers
      const got = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
      const want = headers.map(String);
      const same = got.length===want.length && got.every((v,i)=>v===want[i]);
      if(!same) throw new Error('Header mismatch in '+sheetName+'\nWant: '+JSON.stringify(want)+'\nGot : '+JSON.stringify(got));
    }
  });

  // 2) Seed current user as Admin if SYS_Users empty
  const uSh = db.getSheetByName(__SHEETS__.SYS_USERS);
  if(uSh.getLastRow() < 2){
    const email = Session.getActiveUser().getEmail();
    if(!email) throw new Error('No active Google account detected. Open the web app or run after login.');
    const now = new Date().toISOString();
    uSh.getRange(2,1,1,6).setValues([['USR_00001', String(email).toLowerCase(), 'Primary Admin', 'Admin', 'Active', now]]);
  }

  // 3) Tiny helpers to prove write works (ID padding)
  if(typeof pad !== 'function'){
    this.pad = n => String(n).padStart(5,'0');
  }

  Logger.log('Bootstrap OK. Tabs ready and Admin seeded.');
  return 'Bootstrap OK';
}

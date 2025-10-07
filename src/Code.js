/***** =========================================================
 * Nijjara ERP — Minimal MVP Core
 * - Config (Spreadsheet ID)
 * - doGet() entry returning Index.html
 * - Utilities (sheet access, IDs, audit)
 * - Simple auth (role from SYS_Users)
 * ========================================================= *****/

// === CONFIG ===
// If you already set SPREADSHEET_ID in this file, keep your value:
const SPREADSHEET_ID = '1GX4xeV3BHmSNlSrecy8Yh1rbg_NReDGoGd7GQs7MbHA';   // <<-- paste your real ID here
const APP_TITLE = 'Nijjara ERP (MVP)';

// === ENTRY ===
function doGet() {
  // Ensure tabs/headers and seed Admin (uses your Bootstrap.gs)
  try { DB_bootstrap(); } catch(e) { Logger.log(e); }
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function include(name){ return HtmlService.createHtmlOutputFromFile(name).getContent(); }

// === SHEET NAMES (must match Bootstrap) ===
const SHEETS = {
  SYS_USERS: 'SYS_Users',
  SYS_AUDIT_LOG: 'SYS_Audit_Log',
  HR_EMPLOYEES: 'HR_Employees',
  PRJ_PROJECTS: 'PRJ_Projects',
};

// === UTILITIES ===
function ss(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function getSheet(name){
  const s = ss().getSheetByName(name);
  if(!s) throw new Error('Missing sheet: '+name);
  return s;
}
function getHeadersMap(sheetName){
  const sh = getSheet(sheetName);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h,i)=> map[String(h).trim()] = i);
  return map;
}
function isoNow(){ return new Date().toISOString(); }
function pad(n, size=5){ return String(n).padStart(size,'0'); }

// === AUTH (simple: reads SYS_Users) ===
function getCurrentUser(){
  const email = String(Session.getActiveUser().getEmail()||'').toLowerCase();
  if(!email) throw new Error('No active Google account detected.');
  const sh = getSheet(SHEETS.SYS_USERS);
  const map = getHeadersMap(SHEETS.SYS_USERS);
  const rows = sh.getRange(2,1,Math.max(0, sh.getLastRow()-1), sh.getLastColumn()).getValues();
  const row = rows.find(r => String(r[map['Email']]).toLowerCase() === email);
  if(!row) throw new Error('User not found in SYS_Users: '+email);
  if(String(row[map['Status']]).toLowerCase() !== 'active') throw new Error('User is not active.');

  // update last login
  sh.getRange(rows.indexOf(row)+2, map['Last_Login_On']+1).setValue(isoNow());
  return { email, role: String(row[map['Role']]||'Viewer'), displayName: row[map['Display_Name']]||email };
}
function requireRole_(roles){
  const u = getCurrentUser();
  if(!roles.includes(String(u.role))) throw new Error('Permission denied. Need role: '+roles.join(', '));
  return u;
}

// === AUDIT ===
function logAction_(email, action, module, entityId, details){
  const sh = getSheet(SHEETS.SYS_AUDIT_LOG);
  const id = 'AUD_' + pad(sh.getLastRow());
  sh.appendRow([id, isoNow(), email, action, module, entityId||'', JSON.stringify(details||{})]);
}

// === GENERIC CRUD HELPERS ===
function appendRowByMap_(sheetName, obj){
  const sh = getSheet(sheetName), map = getHeadersMap(sheetName);
  const arr = new Array(sh.getLastColumn()).fill('');
  Object.keys(obj).forEach(k=>{
    if(map[k] === undefined) throw new Error(`Unknown field "${k}" for ${sheetName}`);
    arr[map[k]] = obj[k];
  });
  sh.appendRow(arr);
}
function listRows_(sheetName, fields, limit, offset){
  const sh = getSheet(sheetName), map = getHeadersMap(sheetName);
  const start = 2 + (offset||0);
  const total = Math.max(0, sh.getLastRow()-1);
  if(total<=0 || start>sh.getLastRow()) return [];
  const end = Math.min(sh.getLastRow(), start + (limit||50) - 1);
  const rows = sh.getRange(start,1,end-start+1, sh.getLastColumn()).getValues();
  return rows.map(r=>{
    const o={}; fields.forEach(f=> o[f]=r[map[f]]||''); return o;
  });
}

// === Tiny ping for UI ===
function api_ping(){ return { ok:true, at: isoNow(), user: getCurrentUser() }; }

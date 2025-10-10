// Logger.js — bridges console + centralized audit sheet

function appLog(context, action, details = {}) {
  console.log(`${context} → ${action}`, details);
  try {
    logAction(context, action, details); // implemented in Sys_Audit.js
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

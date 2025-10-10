/**
 * Code.js — Main entry point
 * - Serves Dashboard.html
 * - Exposes small helpers used by the UI
 */

function doGet() {
  var template = HtmlService.createTemplateFromFile('Dashboard.html');
  return template
    .evaluate()
    .setTitle('Nijjara ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Include HTML partials */
function include(filename) {
  if (!filename) return '';
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Minimal API used by the front-end
 */
function api_login(username, password) {
  return loginAndGetData(username, password, { device: 'WEB', ipAddress: '', authToken: '' });
}

function api_getOverview() {
  return getUsersOverviewSummary();
}

function api_getUsers(state) {
  state = state || {}; // {q, roleId, department, status}
  return listUsers({
    isActive: state.status === true ? true : state.status === false ? false : undefined,
    roleId: state.roleId,
    department: state.department,
    search: state.q || '',
  });
}

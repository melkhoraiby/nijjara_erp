// Project dashboard aggregators
// Key functions: getProjectDashboard, listDashboardProjects, computeProfit, computeProjectKPIs

function getDashboardSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Dashboard');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function getProjectDashboard(projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Dashboard');
  const map = getDashboardSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Project_ID']] === projectId) {
      const obj = {};
      Object.keys(map).forEach((col) => (obj[col] = values[i][map[col]]));
      return obj;
    }
  }
  return null;
}

function listDashboardProjects(filter) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Dashboard');
  const map = getDashboardSheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    let match = true;
    if (filter) {
      Object.keys(filter).forEach((col) => {
        if (map[col] !== undefined && values[i][map[col]] != filter[col]) match = false;
      });
    }
    if (match) {
      const obj = {};
      Object.keys(map).forEach((col) => (obj[col] = values[i][map[col]]));
      results.push(obj);
    }
  }
  return results;
}

function computeProfit(projectId) {
  const dashboard = getProjectDashboard(projectId);
  if (!dashboard) return 0;
  return (
    Number(dashboard.Proj_Budget || 0) -
    Number(dashboard.Actual_Material_Expense || 0) -
    Number(dashboard.Total_Ind_Expense || 0)
  );
}

function computeProjectKPIs(projectId) {
  // Implement KPI calculation logic as needed
  return {};
}


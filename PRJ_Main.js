// Project master data management
// Key functions: createProject, updateProject, getProject, listProjects, computePlannedEndDate, reconcileProjectTotals

function getProjectSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function createProject(data, user) {
  try {
    const sheet = getSpreadsheet().getSheetByName('PRJ_Main');
    const map = getProjectSheetMap();
    const projectId = generateId('PRJ', 'PRJ_Main');
    const now = formatISODate(new Date());
    const plannedEndDate = computePlannedEndDate(data.Start_Date, data.Planned_Days);

    // Build row in header order
    const row = [];
    Object.keys(map).forEach((col) => {
      switch (col) {
        case 'Project_ID':
          row[map[col]] = projectId;
          break;
        case 'Created_At':
          row[map[col]] = now;
          break;
        case 'Created_By':
          row[map[col]] = user.User_ID || user.Email;
          break;
        case 'Planned_End_Date':
          row[map[col]] = plannedEndDate;
          break;
        default:
          row[map[col]] = data[col] || '';
      }
    });

    sheet.appendRow(row);
    logAction(user.User_ID, 'PROJECT_CREATE', 'Project created: ' + projectId, { data });
    recalcProjectSchedule(projectId);
    return { success: true, Project_ID: projectId };
  } catch (e) {
    return { error: { code: 'CREATE_ERROR', msg: e.message } };
  }
}

function updateProject(projectId, data, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const map = getProjectSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Project_ID']] === projectId) {
      Object.keys(data).forEach((col) => {
        if (map[col] !== undefined) values[i][map[col]] = data[col];
      });
      values[i][map['Updated_At']] = formatISODate(new Date());
      values[i][map['Updated_By']] = user.User_ID || user.Email;
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      logAction(user.User_ID, 'PROJECT_UPDATE', 'Project updated: ' + projectId, { data });
      recalcProjectSchedule(projectId);
      return { success: true, Project_ID: projectId };
    }
  }
  return { error: { code: 'NOT_FOUND', msg: 'Project not found' } };
}

function getProject(projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const map = getProjectSheetMap();
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

function listProjects(filter) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const map = getProjectSheetMap();
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

function computePlannedEndDate(startDate, plannedDays) {
  if (!startDate || !plannedDays) return '';
  const d = parseISODate(startDate);
  d.setDate(d.getDate() + Number(plannedDays) - 1);
  return formatISODate(d);
}

function reconcileProjectTotals(projectId) {
  // Example: sum costs, update Actual_Material_Expense, etc.
  // Implement aggregation logic as needed.
  // ...existing code...
  return {};
}


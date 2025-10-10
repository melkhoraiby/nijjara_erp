// Project tasks (Kanban)
// Key functions: createTask, updateTask, listTasks, moveTask

function getTaskSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Tasks');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function createTask(data, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Tasks');
  const map = getTaskSheetMap();
  const taskId = generateId('TASK', 'PRJ_Tasks');
  const now = formatISODate(new Date());
  const row = [];
  Object.keys(map).forEach((col) => {
    switch (col) {
      case 'Task_ID':
        row[map[col]] = taskId;
        break;
      case 'Created_At':
        row[map[col]] = now;
        break;
      case 'Created_By':
        row[map[col]] = user.User_ID || user.Email;
        break;
      default:
        row[map[col]] = data[col] || '';
    }
  });
  sheet.appendRow(row);
  logAction(user.User_ID, 'TASK_CREATE', 'Task created: ' + taskId, { data });
  return { success: true, Task_ID: taskId };
}

function updateTask(taskId, data, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Tasks');
  const map = getTaskSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Task_ID']] === taskId) {
      Object.keys(data).forEach((col) => {
        if (map[col] !== undefined) values[i][map[col]] = data[col];
      });
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      logAction(user.User_ID, 'TASK_UPDATE', 'Task updated: ' + taskId, { data });
      return { success: true, Task_ID: taskId };
    }
  }
  return { error: { code: 'NOT_FOUND', msg: 'Task not found' } };
}

function listTasks(projectId, filter) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Tasks');
  const map = getTaskSheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    let match = true;
    if (projectId && values[i][map['Project_ID']] !== projectId) match = false;
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

function moveTask(taskId, newStage, user) {
  // Kanban move: update Status or Stage field
  const sheet = getSpreadsheet().getSheetByName('PRJ_Tasks');
  const map = getTaskSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Task_ID']] === taskId) {
      values[i][map['Status']] = newStage;
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      logAction(user.User_ID, 'TASK_MOVE', 'Task moved: ' + taskId + ' to ' + newStage, {});
      return { success: true, Task_ID: taskId };
    }
  }
  return { error: { code: 'NOT_FOUND', msg: 'Task not found' } };
}


// Project schedule calculations and flags
// Key functions: recalcProjectSchedule, recalcAllSchedules, computeScheduleFlag

function getScheduleSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Schedule_Calc');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function recalcProjectSchedule(projectId) {
  // Example: update schedule flag for a project
  const mainSheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const scheduleSheet = getSpreadsheet().getSheetByName('PRJ_Schedule_Calc');
  const mainMap = getProjectSheetMap();
  const scheduleMap = getScheduleSheetMap();
  const mainValues = mainSheet.getDataRange().getValues();
  for (let i = 1; i < mainValues.length; i++) {
    if (mainValues[i][mainMap['Project_ID']] === projectId) {
      const plannedDays = Number(mainValues[i][mainMap['Planned_Days']]) || 0;
      const startDate = mainValues[i][mainMap['Start_Date']];
      const plannedEndDate = computePlannedEndDate(startDate, plannedDays);
      const flag = computeScheduleFlag(mainValues[i]);
      // Update PRJ_Schedule_Calc
      const scheduleValues = scheduleSheet.getDataRange().getValues();
      let found = false;
      for (let j = 1; j < scheduleValues.length; j++) {
        if (scheduleValues[j][scheduleMap['Project_ID']] === projectId) {
          scheduleValues[j][scheduleMap['Planned_End_Date']] = plannedEndDate;
          scheduleValues[j][scheduleMap['Schedule_Flag']] = flag;
          scheduleSheet
            .getRange(j + 1, 1, 1, scheduleValues[j].length)
            .setValues([scheduleValues[j]]);
          found = true;
          break;
        }
      }
      if (!found) {
        const row = [];
        Object.keys(scheduleMap).forEach((col) => {
          switch (col) {
            case 'Project_ID':
              row[scheduleMap[col]] = projectId;
              break;
            case 'Project_Name':
              row[scheduleMap[col]] = mainValues[i][mainMap['Project_Name']];
              break;
            case 'Start_Date':
              row[scheduleMap[col]] = startDate;
              break;
            case 'Planned_Days':
              row[scheduleMap[col]] = plannedDays;
              break;
            case 'Planned_End_Date':
              row[scheduleMap[col]] = plannedEndDate;
              break;
            case 'Schedule_Flag':
              row[scheduleMap[col]] = flag;
              break;
            default:
              row[scheduleMap[col]] = '';
          }
        });
        scheduleSheet.appendRow(row);
      }
      // Also update flag in PRJ_Main
      mainValues[i][mainMap['Schedule_Flag']] = flag;
      mainSheet.getRange(i + 1, 1, 1, mainValues[i].length).setValues([mainValues[i]]);
      break;
    }
  }
}

function recalcAllSchedules() {
  const mainSheet = getSpreadsheet().getSheetByName('PRJ_Main');
  const mainMap = getProjectSheetMap();
  const values = mainSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    recalcProjectSchedule(values[i][mainMap['Project_ID']]);
  }
}

function computeScheduleFlag(projectRow) {
  // Example: OnTrack / AtRisk / Delayed
  // Implement logic based on planned vs actual progress
  // For now, return 'OnTrack' as default
  return 'OnTrack';
}


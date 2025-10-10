// Project materials catalog
// Key functions: createMaterial, updateMaterial, getMaterial, searchMaterials

function getMaterialsSheetMap() {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  return map;
}

function createMaterial(data, user) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials');
  const map = getMaterialsSheetMap();
  const materialId = generateId('MAT', 'PRJ_Materials');
  const row = [];
  Object.keys(map).forEach((col) => {
    switch (col) {
      case 'Material_ID':
        row[map[col]] = materialId;
        break;
      case 'Active':
        row[map[col]] = true;
        break;
      default:
        row[map[col]] = data[col] || '';
    }
  });
  sheet.appendRow(row);
  logAction(user.User_ID, 'MATERIAL_CREATE', 'Material created: ' + materialId, { data });
  return { success: true, Material_ID: materialId };
}

function updateMaterial(materialId, data) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials');
  const map = getMaterialsSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Material_ID']] === materialId) {
      Object.keys(data).forEach((col) => {
        if (map[col] !== undefined) values[i][map[col]] = data[col];
      });
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      logAction('system', 'MATERIAL_UPDATE', 'Material updated: ' + materialId, { data });
      return { success: true, Material_ID: materialId };
    }
  }
  return { error: { code: 'NOT_FOUND', msg: 'Material not found' } };
}

function getMaterial(materialId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials');
  const map = getMaterialsSheetMap();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Material_ID']] === materialId) {
      const obj = {};
      Object.keys(map).forEach((col) => (obj[col] = values[i][map[col]]));
      return obj;
    }
  }
  return null;
}

function searchMaterials(query, filters) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Materials');
  const map = getMaterialsSheetMap();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {
    let match = true;
    if (query) {
      const nameAR = values[i][map['Name_AR']] || '';
      if (!nameAR.includes(query)) match = false;
    }
    if (filters) {
      Object.keys(filters).forEach((col) => {
        if (map[col] !== undefined && values[i][map[col]] != filters[col]) match = false;
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


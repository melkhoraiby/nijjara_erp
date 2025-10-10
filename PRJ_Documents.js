// Document helpers for Projects module
// Key functions: createDocument, getDocuments, linkDocumentToProject

function createDocument(docRow) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Documents');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  const docId = generateId('DOC', 'PRJ_Documents');
  const row = [];
  Object.keys(map).forEach((col) => {
    if (docRow[col] !== undefined) row[map[col]] = docRow[col];
    else if (col === 'Document_ID') row[map[col]] = docId;
    else row[map[col]] = '';
  });
  sheet.appendRow(row);
  return { success: true, Document_ID: docId };
}

function getDocuments(projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Documents');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  const values = sheet.getDataRange().getValues();
  const docs = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Project_ID']] === projectId) docs.push(values[i]);
  }
  return docs;
}

function linkDocumentToProject(docId, projectId) {
  const sheet = getSpreadsheet().getSheetByName('PRJ_Documents');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => (map[h] = i));
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][map['Document_ID']] === docId) {
      values[i][map['Project_ID']] = projectId;
      sheet.getRange(i + 1, 1, 1, values[i].length).setValues([values[i]]);
      return { success: true };
    }
  }
  return { error: { code: 'NOT_FOUND' } };
}


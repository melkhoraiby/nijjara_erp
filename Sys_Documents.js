// Drive upload + metadata in SYS_Documents
// Key functions: uploadDocument(blob,meta), listDocs(entity,entityId), getDoc(docId), deleteDoc(docId)
// Uses DriveApp; stores Drive_File_ID & URL
// Required Scopes: Drive; ROLE_Admin

var DOCUMENTS_SHEET =
  typeof SHEETS !== 'undefined' && SHEETS.SYS_DOCUMENTS
    ? SHEETS.SYS_DOCUMENTS
    : 'SYS_Documents';

var DOCUMENT_HEADERS_FALLBACK = [
  'Doc_ID',
  'Entity',
  'Entity_ID',
  'File_Name',
  'Label',
  'Drive_File_ID',
  'Drive_URL',
  'Uploaded_By',
  'Created_At',
];

function getDocumentHeaders_() {
  if (typeof getHeaders === 'function') {
    var headers = getHeaders(DOCUMENTS_SHEET);
    if (headers && headers.length) {
      return headers.slice();
    }
  }
  return DOCUMENT_HEADERS_FALLBACK.slice();
}

function uploadDocument(blob, meta) {
  meta = meta || {};
  var headers = getDocumentHeaders_();
  var sheet = ensureHeaders(DOCUMENTS_SHEET, headers);
  var docId = createPrefixedId('DOC', DOCUMENTS_SHEET);
  var now = ensureISODate(new Date());

  var fileName =
    meta.File_Name ||
    (blob && typeof blob.getName === 'function' ? blob.getName() : '') ||
    docId + '.bin';
  var driveFileId =
    meta.Drive_File_ID || (blob && typeof blob.getId === 'function' ? blob.getId() : '');
  var driveUrl =
    meta.Drive_URL || (blob && typeof blob.getUrl === 'function' ? blob.getUrl() : '');

  var record = {
    Doc_ID: docId,
    Entity: meta.Entity || '',
    Entity_ID: meta.Entity_ID || '',
    File_Name: fileName,
    Label: meta.Label || fileName,
    Drive_File_ID: driveFileId,
    Drive_URL: driveUrl,
    Uploaded_By: meta.Uploaded_By || 'SYSTEM',
    Created_At: now,
  };

  var row = headers.map(function (header) {
    return record.hasOwnProperty(header) ? record[header] : '';
  });
  sheet.appendRow(row);
  logAction(record.Uploaded_By, DOCUMENTS_SHEET, 'UPLOAD_DOCUMENT', docId, {
    entity: record.Entity,
    entityId: record.Entity_ID,
    fileName: record.File_Name,
  });
  return record;
}

function listDocs(entity, entityId) {
  var headers = getDocumentHeaders_();
  var sheet = ensureHeaders(DOCUMENTS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map(function (row) {
      var doc = {};
      for (var i = 0; i < headers.length; i++) {
        doc[headers[i]] = row[i];
      }
      return doc;
    })
    .filter(function (doc) {
      if (entity && doc.Entity !== entity) return false;
      if (entityId && doc.Entity_ID !== entityId) return false;
      return true;
    });
}

function getDoc(docId) {
  if (!docId) return null;
  var docs = listDocs();
  for (var i = 0; i < docs.length; i++) {
    if (docs[i].Doc_ID === docId) {
      return docs[i];
    }
  }
  return null;
}

function deleteDoc(docId, actorId) {
  actorId = actorId || 'SYSTEM';
  if (!docId) throw new Error('Doc_ID is required.');
  var headers = getDocumentHeaders_();
  var sheet = ensureHeaders(DOCUMENTS_SHEET, headers);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === docId) {
      sheet.deleteRow(i + 2);
      logAction(actorId, DOCUMENTS_SHEET, 'DELETE_DOCUMENT', docId, {});
      return true;
    }
  }
  return false;
}

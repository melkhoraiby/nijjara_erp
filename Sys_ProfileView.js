// Profile view assembly for entity pages
// Key functions: getProfileViews(entity, entityId), getViewDefinition(key)
// Reads SYS_Profile_View for layout metadata

function getProfileViews(tabId, entityId) {
  var rows = _u_rows('SYS_Profile_View');
  if (!rows || !rows.length) return [];
  return rows.filter(function (row) {
    if (!tabId) return true;
    return String(row.Tab_ID) === String(tabId);
  });
}

function getViewDefinition(key) {
  if (!key) return null;
  var rows = _u_rows('SYS_Profile_View');
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].View_ID) === String(key)) {
      return rows[i];
    }
  }
  return null;
}

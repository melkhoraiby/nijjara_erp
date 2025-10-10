// Sys_Utils.js — shared backend helpers

function getCurrentUserEmail() {
  try {
    const u = PropertiesService.getUserProperties().getProperty('currentUser');
    if (u) return JSON.parse(u).Email || JSON.parse(u).Username;
    return Session.getActiveUser().getEmail();
  } catch (e) {
    return Session.getActiveUser().getEmail();
  }
}

function nowISO() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

function isAdmin() {
  const userJSON = PropertiesService.getUserProperties().getProperty('currentUser');
  if (!userJSON) return false;
  const user = JSON.parse(userJSON);
  return user.Role_Id === 'Admin';
}

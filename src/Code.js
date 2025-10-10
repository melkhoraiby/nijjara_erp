// Global variable for Spreadsheet ID
const SPREADSHEET_ID = '1g3a_f_D4A8z-7yS0gq4cu-2de2z1DkqkBC8k2lA7DqM';

/**
 * Serves the main HTML page of the web app.
 * @param {object} e - The event parameter for a simple get request.
 * @returns {HtmlOutput} The main page of the web app.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('Nijjara ERP')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Includes the content of another HTML file.
 * This is a utility function for templated HTML.
 * @param {string} filename - The name of the HTML file to include.
 * @returns {string} The content of the HTML file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

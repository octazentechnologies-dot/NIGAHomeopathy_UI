/**
 * Homeocentrum — Assigned To dropdowns follow 00_Employees column B.
 * One-time setup in Google Sheets:
 *   Extensions → Apps Script → paste this file → Save → Run setupAssignedDropdowns → Allow.
 * After that, type a new name in 00_Employees column B and it appears on every module sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Homeocentrum")
    .addItem("Connect Assigned dropdowns to Employees", "setupAssignedDropdowns")
    .addToUi();
}

function setupAssignedDropdowns() {
  var ss = SpreadsheetApp.getActive();
  var emp = ss.getSheetByName("00_Employees");
  if (!emp) {
    SpreadsheetApp.getUi().alert("Sheet 00_Employees was not found.");
    return;
  }
  var nameRange = emp.getRange("B3:B100");
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(nameRange, true)
    .setAllowInvalid(true)
    .setHelpText("Pick a name from 00_Employees column B. New names appear automatically.")
    .build();

  var sheetsDone = 0;
  ss.getSheets().forEach(function (sh) {
    if (!/^M\d{2}_/.test(sh.getName())) return;
    var lastCol = Math.max(sh.getLastColumn(), 42);
    var headers = sh.getRange(2, 1, 1, lastCol).getValues()[0];
    var lastRow = Math.max(sh.getLastRow(), 3);
    var height = lastRow - 2;
    if (height < 1) return;
    headers.forEach(function (h, i) {
      var title = String(h || "");
      if (title === "Assigned To (lead)" || / Assigned$/.test(title)) {
        sh.getRange(3, i + 1, height, 1).setDataValidation(rule);
      }
    });
    sheetsDone++;
  });
  SpreadsheetApp.getUi().alert(
    "Done. Assigned To on " + sheetsDone +
    " module sheets now follows 00_Employees column B.\n\n" +
    "Type a new name in column B — it appears in the dropdown. You do not need to run this again."
  );
}

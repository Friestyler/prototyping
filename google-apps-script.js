/*
================================================================================
  JE MAKELAAR CYBER INSURANCE FORM - GOOGLE APPS SCRIPT BACKEND
  Web App Backend for Form Submissions to Google Sheet
================================================================================

SETUP INSTRUCTIONS:
===================

STEP 1: Create a Google Sheet
------------------------------
1. Go to https://sheets.google.com
2. Click "+ New" > "Blank spreadsheet"
3. Rename it to "Je Makelaar Cyber Insurance Submissions"
4. Copy the Sheet ID from the URL (between /d/ and /edit)
   Example URL: https://docs.google.com/spreadsheets/d/ABC123XYZ/edit
   Sheet ID = ABC123XYZ

STEP 2: Open Google Apps Script Editor
---------------------------------------
1. In the same Google Sheet, go to menu: Extensions > Apps Script
2. A new tab will open with the Apps Script editor
3. You should see a blank "Code.gs" file

STEP 3: Paste This Script
--------------------------
1. Clear any existing code in Code.gs
2. Copy and paste this entire script into Code.gs
3. In the script, find the line: const SHEET_ID = "YOUR_SHEET_ID_HERE";
4. Replace "YOUR_SHEET_ID_HERE" with your actual Sheet ID from Step 1
5. Save the script (Ctrl+S or Cmd+S)

STEP 4: Deploy as Web App
--------------------------
1. In Apps Script editor, click "Deploy" > "New deployment"
2. Click the dropdown that says "Select type" > choose "Web app"
3. Under "Execute as", select your Google Account
4. Under "Who has access", select "Anyone"
5. Click "Deploy"
6. A popup will show your deployment URL. Copy it.
   Format: https://script.google.com/macros/d/DEPLOYMENT_ID/userweb

STEP 5: Set Web App URL in HTML Form
-------------------------------------
1. In your HTML form file, find the JavaScript section
2. Look for: const WEB_APP_URL = "https://script.google.com/..."
3. Replace it with the deployment URL from Step 4
4. The form will now send submissions to this script

STEP 6: Test the Integration
-----------------------------
1. Open your HTML form in a browser
2. Fill out and submit the form
3. Check your Google Sheet to see the new row
4. If there are issues, check Apps Script Executions (Ctrl+Enter)

================================================================================
*/

// CONFIGURATION
// ============================================================================
// UPDATE THIS WITH YOUR GOOGLE SHEET ID FROM STEP 1
const SHEET_ID = "YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Submissions";

// Column headers - order must match the data being written
const HEADERS = [
  "Submission Date",
  "Policyholder",
  "Legal Form",
  "CBE Number",
  "Activities",
  "Turnover",
  "Insured Address",
  "Q1 Subsidiary",
  "Q1 System Interconnectivity",
  "Q2 Establishments outside EEA",
  "Q3 Already insured (Cyber)",
  "Q4 Business in sanctioned countries",
  "Q5 Collects PII",
  "Q5 PII record count",
  "Q6 Collects PCI",
  "Q6 PCI DSS certified",
  "Q6 PCI transactions / year",
  "Q7 Collects PHI",
  "Q8 Depends on Outsourced Provider",
  "Q8 Provider list",
  "Q9 Monthly patching",
  "Q10 Security software & firewalls",
  "Q11 Access controls",
  "Q12 Weekly backups (tested)",
  "Q13 Employee training",
  "Q14 No claims in last 5 years",
  "Custom Offer Required",
  "Q15a Fraudulent transaction impact",
  "Q15b Credential/data modification impact",
  "Q15c SCADA/ICS/OT impact",
  "Q15d Insider disclosure impact",
  "Option 1 - Limit of Liability (EUR)",
  "Option 1 - Premium (EUR)",
  "Option 1 - Retention (EUR)",
  "Option 2 - Limit of Liability (EUR)",
  "Option 2 - Premium (EUR)",
  "Option 2 - Retention (EUR)",
  "Commission Rate",
  "Declaration Place",
  "Declaration Date",
  "Declaration First Name",
  "Declaration Last Name",
  "Declaration Email",
  "Declaration Function",
  "Declaration Company",
  "Additional Notes"
];

const CUSTOM_OFFER_COLUMN = 27; // Column AA (1-indexed)


// MAIN HANDLER
// ============================================================================
function doPost(e) {
  try {
    // Parse the incoming JSON payload
    const payload = JSON.parse(e.postData.contents);

    // Validate required fields
    validatePayload(payload);

    // Get or create the sheet
    const sheet = getOrCreateSheet();

    // Prepare the row data in the correct order
    const rowData = prepareRowData(payload);

    // Append the row to the sheet
    sheet.appendRow(rowData);

    // Apply conditional formatting to the Custom Offer column
    applyConditionalFormatting(sheet);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Submission recorded successfully",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error for debugging
    console.error("Error in doPost:", error.message);

    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


// HANDLE CORS PREFLIGHT REQUESTS
// ============================================================================
function doOptions(e) {
  const output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}


// GET OR CREATE SHEET WITH HEADERS
// ============================================================================
function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    // Create new sheet if it doesn't exist
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Check if sheet is empty (no headers)
  if (sheet.getLastRow() === 0) {
    // Add headers as the first row
    sheet.appendRow(HEADERS);

    // Format header row (bold, light gray background)
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#f0f0f0");
  }

  return sheet;
}


// VALIDATE INCOMING PAYLOAD
// ============================================================================
function validatePayload(payload) {
  // Check for required top-level fields
  const requiredFields = [
    "submissionDate",
    "policyholder",
    "legalForm",
    "cbeNumber",
    "activities",
    "turnover",
    "insuredAddress",
    "declarationDate",
    "declarationFirstName",
    "declarationLastName",
    "declarationEmail"
  ];

  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

}


// PREPARE ROW DATA IN CORRECT ORDER
// ============================================================================
function prepareRowData(payload) {
  return [
    payload.submissionDate || "",
    payload.policyholder || "",
    payload.legalForm || "",
    payload.cbeNumber || "",
    payload.activities || "",
    payload.turnover || "",
    payload.insuredAddress || "",
    payload.q1_subsidiary || "",
    payload.q1_interconnect || "",
    payload.q2_outsideEEA || "",
    payload.q3_alreadyInsured || "",
    payload.q4_sanctionedBusiness || "",
    payload.q5_hasPII || "",
    payload.q5_piiCount || "",
    payload.q6_hasPCI || "",
    payload.q6_pciDss || "",
    payload.q6_pciCount || "",
    payload.q7_hasPHI || "",
    payload.q8_outsourced || "",
    payload.q8_providers || "",
    payload.q9_patching || "",
    payload.q10_securitySoftware || "",
    payload.q11_accessControls || "",
    payload.q12_backups || "",
    payload.q13_training || "",
    payload.q14_noClaims || "",
    payload.isCustomOffer || "",
    payload.q15a_fraudulentTx || "",
    payload.q15b_credentialsModified || "",
    payload.q15c_scadaIcsOt || "",
    payload.q15d_insiderDisclosure || "",
    payload.option1Lol || "",
    payload.option1Premium || "",
    payload.option1Retention || "",
    payload.option2Lol || "",
    payload.option2Premium || "",
    payload.option2Retention || "",
    payload.commissionRate || "",
    payload.declarationPlace || "",
    payload.declarationDate || "",
    payload.declarationFirstName || "",
    payload.declarationLastName || "",
    payload.declarationEmail || "",
    payload.declarationFunction || "",
    payload.declarationCompany || "",
    payload.additionalNotes || ""
  ];
}


// APPLY CONDITIONAL FORMATTING
// ============================================================================
function applyConditionalFormatting(sheet) {
  try {
    // Get the range of the custom offer column (all rows except header)
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      // No data yet, skip formatting
      return;
    }

    const customOfferRange = sheet.getRange(2, CUSTOM_OFFER_COLUMN, lastRow - 1, 1);

    // Create a conditional formatting rule
    // Red background (#FF0000) when cell value equals "YES"
    const rule = SpreadsheetApp.newConditionalFormatRule()
      .whenCellEqual("YES")
      .setBackground("#FF0000")
      .setFontColor("#FFFFFF")
      .setRanges([customOfferRange])
      .build();

    // Clear existing rules for this range and apply new one
    const existingRules = sheet.getConditionalFormatRules();
    for (const existingRule of existingRules) {
      if (existingRule.getRanges()[0].getColumn() === CUSTOM_OFFER_COLUMN) {
        sheet.deleteConditionalFormatRule(existingRule);
      }
    }

    sheet.setConditionalFormatRules([...sheet.getConditionalFormatRules(), rule]);

  } catch (error) {
    // Log but don't fail - conditional formatting is nice-to-have
    console.log("Warning: Could not apply conditional formatting:", error.message);
  }
}


// HELPER: Get Sheet ID (for testing purposes)
// ============================================================================
function getSpreadsheetInfo() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return {
    sheetId: SHEET_ID,
    sheetName: ss.getName(),
    url: ss.getUrl(),
    sheets: ss.getSheets().map(s => s.getName())
  };
}


// HELPER: Clear All Data (for testing - uncomment if needed)
// ============================================================================
function clearAllData() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet && sheet.getLastRow() > 0) {
    sheet.clearContents();
    // Re-add headers
    sheet.appendRow(HEADERS);
  }
}

# Je Makelaar Cyber Insurance PoC — Quick Start Guide

## What's in this folder

| File | Purpose |
|------|---------|
| `sps-cyber-form.html` | The complete form application. Open in any browser to use. |
| `google-apps-script.js` | Backend code to paste into Google Apps Script for Sheets integration. |
| `POC_Strategic_Plan.md` | Strategic plan document for stakeholders. |
| `SETUP_GUIDE.md` | This file. |

## 1. Try the form immediately

Double-click `sps-cyber-form.html` to open it in your browser. The form works fully offline — you can fill it out, see conditional logic in action, and generate PDF quotes right away. Google Sheets integration requires step 2 below.

## 2. Connect Google Sheets (10 minutes)

### Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it "Je Makelaar Cyber Submissions"
3. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/`**THIS_PART**`/edit`

### Deploy the Apps Script
1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Paste the entire contents of `google-apps-script.js`
4. Replace `YOUR_SHEET_ID_HERE` on line 34 with your actual Sheet ID
5. Click **Deploy → New deployment**
6. Select type: **Web app**
7. Set "Execute as": **Me**
8. Set "Who has access": **Anyone** (for PoC; restrict later for production)
9. Click **Deploy** and authorize when prompted
10. Copy the **Web app URL**

### Connect the form
1. Open `sps-cyber-form.html` in a text editor
2. Find `const GOOGLE_SCRIPT_URL = '';` near the top
3. Paste your Web app URL between the quotes
4. Save the file

Now every form submission will automatically appear as a new row in your Google Sheet.

## 3. How the form works

The form is a 6-step wizard:

**Step 1 — General Info**: Company details and turnover tier. The turnover determines which coverage options are available.

**Step 2 — Applicant Declarations**: 14 yes/no questions covering corporate structure, data handling (PII/PCI/PHI), outsourcing, and core security controls. Some questions (Q1, Q5, Q6, Q8) reveal follow-up fields when answered "Yes". A submission is flagged as a **custom offer** when any of Q1–Q4 or Q7 is "Yes", or any of Q9–Q14 is "No".

**Step 3 — Impact Assessment**: Question 15 — four scenarios rated on a six-level scale (Catastrophic / Damaging / Moderate / Minor / Unclear / N/A).

**Step 4 — Coverage Selection**: The user picks two Limit of Liability options. Only limits available for their turnover tier are shown (per the underwriter pricing matrix). Premium and retention are calculated automatically.

**Step 5 — Declaration**: Legal confirmation and signature fields.

**Step 6 — Review & Submit**: Full summary. On submit, data goes to Google Sheets and a PDF quote is generated.

## 4. The generated PDF

The PDF is a generic cyber-insurance quote letter with:
- Coverage schedule showing both selected options side by side
- All sub-limits (eCrime at 10% with 250K max, etc.)
- General information, policy details, subjectivities, and conditions
- "CUSTOM OFFER" flag if any critical requirement was not met

## 5. For production (post-PoC)

After the PoC is validated, recommended next steps:
- Host the form on a proper domain (e.g., via Netlify, Vercel, or Je Makelaar infrastructure)
- Add user authentication
- Move to a proper backend (Node.js/Python) instead of Apps Script
- Add email notifications on submission
- Implement digital signature capture
- Add file upload for annual reports and org charts

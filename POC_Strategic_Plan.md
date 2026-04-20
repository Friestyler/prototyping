# Je Makelaar Cyber Insurance PoC Strategic Plan

**Document Version:** 1.0
**Date:** April 2026
**Duration:** 2-week sprint
**Status:** Ready for Kickoff

---

## 1. Executive Summary

Qollabi will deliver a custom-built cyber insurance quote system for Je Makelaar, enabling rapid, rule-based underwriter cyber policy quotes via a conditional web form. The system automates submission capture, pricing calculation, and PDF generation—eliminating manual quote workflows and reducing quote turnaround from 2-3 days to minutes.

**Scope:** Single-page web application + Google Sheets integration + automated PDF generation
**Timeline:** 14 days (2 weeks)
**Key Success Metric:** 100% of submissions captured with accurate underwriter pricing and auto-generated compliant PDFs

---

## 2. System Architecture

### Text-based Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Broker]  →  [Conditional Web Form]  →  [PDF Quote]           │
│             (React Single Page App)        (jsPDF client-side)   │
│                                                                   │
│                 ↓ (JSON submission)                               │
│                                                                   │
│          [Google Apps Script Web App]                            │
│          (Validation + Sheet Insert)                             │
│                                                                   │
│                 ↓ (append row)                                    │
│                                                                   │
│          [Google Sheet Backend]                                  │
│          (One row = one submission)                              │
│          (Audit trail + custom offer flags)                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

PRICING ENGINE (Client-side):
  underwriter Matrix (Turnover × LOL) → Premium + Retention
  Commission tier logic applied inline
```

### Component Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Form UI** | HTML5 + React (or vanilla JS) | Conditional questionnaire with branching logic |
| **Pricing Engine** | JavaScript (JSON matrix lookup) | Real-time premium calculation from underwriter data |
| **Backend API** | Google Apps Script Web App | Form submission handler + Google Sheet append |
| **Data Store** | Google Sheets | Single source of truth for submissions + audit |
| **PDF Generation** | jsPDF (client-side) | Auto-generated quote PDFs (zero server processing) |
| **Hosting** | Google Apps Script or static HTML | No external infrastructure required |

---

## 3. Why Custom-Built (Not Tally)

### 1. **Complex Conditional Logic**
Tally is form-builder focused; Je Makelaar's questionnaire has multi-level branching (revenue → EDR, OT presence → segmentation, sanctioned territory flags). Custom code allows nested conditionals without workarounds.

### 2. **underwriter Pricing Matrix Integration**
The pricing matrix (10 turnover tiers × 8 LOL options) requires:
- Real-time client-side lookup without external API calls
- Commission tier switching at 50M EUR threshold
- Accurate premium + retention pair extraction
- Tally cannot embed proprietary pricing rules; custom build owns the logic entirely.

### 3. **Custom Offer Flagging on "NO" Answers**
A "NO" to critical security questions **does not reject**—it flags as "custom offer" for manual review. This nuance is underwriter-specific business logic; Tally's conditional block logic is designed for accept/reject gates, not flag logic.

### 4. **PDF Generation & Branding Control**
underwriter quotes must match Je Makelaar's brand identity and include:
- Logo placement
- Custom quote number formatting
- Pricing breakdown layout
- Legal disclaimers (client-side ensures zero latency, data stays on browser)

Custom build = full design control; Tally PDF export is generic.

---

## 4. Component Breakdown

### 4.1 Web Form (SPA)
- **Conditional Questions:**
  - Company name, revenue, sector
  - Number of employees
  - OT environment presence → *if YES: OT segmentation question*
  - Revenue > 50M EUR → *if YES: EDR question*
  - Sanctioned territory exposure → *flag if YES*
  - Critical security controls (5 yes/no questions) → *flag if any NO*
- **Dynamic Pricing Display:**
  - User selects 2 LOL options from available combos for their turnover tier
  - Premium + retention auto-calculated and displayed in real-time
- **Output:** Form data as JSON payload

### 4.2 Backend Handler (Google Apps Script)
- **Endpoint:** `doPost(e)` webhook
- **Tasks:**
  1. Validate JSON payload (required fields, data types)
  2. Apply underwriter pricing matrix lookup (confirm pricing from form)
  3. Generate unique quote ID
  4. Append row to Google Sheet with timestamp, all form data, pricing, flags
  5. Return JSON response with quote ID + PDF link
- **Error handling:** Return 400 for validation failures; 500 for sheet errors

### 4.3 Google Sheets Backend
- **Structure (one row per submission):**
  - `Timestamp` | `Quote_ID` | `Company_Name` | `Revenue` | `Sector` | `Employees` | `OT_Present` | `OT_Segment` | `Revenue_>50M` | `EDR_Enabled` | `Sanctioned_Territory` | `Critical_Security_Flag` | `Premium` | `Retention` | `LOL_1` | `LOL_2` | `Notes`
- **Read access:** Je Makelaar team for real-time submission tracking
- **Write access:** Only via Apps Script endpoint (no manual entries)
- **Archive:** Monthly backup for compliance

### 4.4 PDF Generation (Client-side jsPDF)
- **Trigger:** After form submission succeeds
- **Content:**
  - Quote header (Je Makelaar logo, quote ID, date)
  - Company summary (name, revenue, sector, employees)
  - Coverage summary (LOL selections, premium, retention)
  - Pricing breakdown table
  - Risk flags (if applicable) with "Custom Quote - Broker Review Required" banner
  - Legal disclaimers + underwriter underwriting contact
  - Footer with quote validity (30 days assumed)
- **Output:** File named `Je Makelaar_Quote_{QuoteID}_{CompanyName}_{Date}.pdf`

---

## 5. Two-Week Sprint Plan

### **Week 1: Foundation & Integration**

**Day 1–2: Setup & Design**
- [ ] Kickoff with Je Makelaar stakeholders (Google Workspace access, branding assets delivery)
- [ ] Finalize underwriter pricing matrix (JSON format)
- [ ] Define critical security questions (exact wording + scoring)
- [ ] Mock up form UI (Figma or wireframe)
- [ ] Create Google Sheet template + Apps Script project structure

**Day 3–4: Web Form Development**
- [ ] Build HTML form structure (semantic markup)
- [ ] Implement conditional branching logic (JavaScript event listeners)
- [ ] Add revenue threshold logic (>50M EDR question, OT segmentation)
- [ ] Create LOL selector with available combo validation
- [ ] Test form flow with sample data (all branches)

**Day 5: Backend Setup**
- [ ] Create Google Apps Script web app (deploy as endpoint)
- [ ] Write form submission handler (`doPost`)
- [ ] Build Google Sheet append logic
- [ ] Implement pricing matrix lookup + validation
- [ ] Test end-to-end: form → sheet row insertion

### **Week 2: Integration, PDF, Testing & Deployment**

**Day 6–7: PDF Generation & Polish**
- [ ] Integrate jsPDF library
- [ ] Design quote PDF template (with Je Makelaar branding)
- [ ] Build PDF generation logic (dynamic content insertion)
- [ ] Add risk flag banners ("Custom Quote" if flagged)
- [ ] Test PDF output with 5+ sample quotes

**Day 8–9: Testing & Edge Cases**
- [ ] UAT with Je Makelaar team (broker walkthrough)
- [ ] Test all conditional branches + edge cases
  - Minimum revenue (sub-1M)
  - Maximum revenue (500M+)
  - All LOL combinations per tier
  - All critical security flag scenarios
- [ ] Validate pricing accuracy against underwriter matrix
- [ ] Performance testing (form load time, sheet append latency)

**Day 10: Deployment & Handoff**
- [ ] Deploy to production (Google Apps Script + static form)
- [ ] Create user documentation (broker quick-start guide)
- [ ] Set up monitoring/audit logs (Sheet access logs)
- [ ] Train Je Makelaar team on system use + data exports
- [ ] Archive URL + credentials securely

**Buffer Days 11–14:** Issue resolution, optimization, post-launch support

---

## 6. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **underwriter matrix incorrect/incomplete** | Medium | Critical | Validate matrix with underwriter underwriter on Day 2; freeze on Day 5 before PDF build |
| **Google Sheets quota limits (write API)** | Low | High | Use batch append; monitor sheet size; implement daily archive rotation |
| **Compliance/audit trail gaps** | Medium | High | Log all submissions with timestamp + user IP; enable Sheet version history |
| **PDF generation performance** | Low | Medium | Test with large payloads; use jsPDF optimizations; fallback to server-side if needed |
| **Conditional logic mismatches** | Medium | Medium | Create detailed test matrix (Day 8); pair-test all branches with Je Makelaar |
| **Browser compatibility** | Low | Medium | Test on Chrome, Safari, Firefox; provide edge/IE deprecation notice |
| **Commission tier boundary errors (50M)** | Medium | Critical | Unit test 49.9M vs 50M vs 50.1M; hardcode threshold with comment |

---

## 7. What Qollabi Needs from Je Makelaar

### **Pre-Launch (Days 1–2)**

1. **Google Workspace Access**
   - Je Makelaar Google account with Google Apps Script enabled
   - Google Sheet creation permission in shared team folder
   - Service account email (if additional security required)

2. **underwriter Pricing Data**
   - Final, signed-off pricing matrix (Excel or CSV acceptable)
   - All 10 turnover tiers × 8 LOL combos with premium + retention values
   - Commission % per tier (confirm 30% <50M, 25% >50M)
   - Effective date + validity period

3. **Business Requirements**
   - Exact list of critical security control questions (5 questions + scoring)
   - OT segmentation options (if OT environment = YES)
   - EDR feature options/tiers (if revenue > 50M)
   - Sanctioned territory list (if applicable)
   - Quote validity period (default: 30 days?)
   - Custom offer escalation contact (email/team)

4. **Branding Assets**
   - Je Makelaar logo (PNG/SVG, high resolution for PDF)
   - Brand colors (primary, secondary)
   - Legal disclaimer text (for PDF footer)
   - Quote template approval (mockup)

### **Launch Support (Days 10+)**

5. **Stakeholder Training**
   - 1-hour session with Je Makelaar team (form walkthrough, data export, Google Sheet management)
   - Recorded walkthrough for future reference

6. **Post-Launch Availability**
   - Qollabi on-call for 1 week (critical bug fixes, pricing adjustments)
   - Handoff documentation (system admin guide, troubleshooting)

---

## 8. Success Criteria

- [ ] All form submissions land in Google Sheet within 5 seconds
- [ ] Pricing matches underwriter matrix 100% (spot-checked by Je Makelaar)
- [ ] PDFs generate within 2 seconds, render correctly on all devices
- [ ] All conditional branches execute as specified (verified UAT)
- [ ] Custom offer flags trigger correctly (no false positives/negatives)
- [ ] Zero data loss; full audit trail in Sheet version history
- [ ] Je Makelaar team can independently manage + export submissions

---

## 9. Next Steps

1. **Schedule kickoff meeting** (Week of April 7)
2. **Je Makelaar delivers pricing matrix + requirements** (by April 10)
3. **Qollabi requests Google Workspace access** (by April 10)
4. **Development begins** (April 14)
5. **UAT handoff** (April 25)
6. **Go-live** (April 28)

---

**Document Owner:** Qollabi Product Team
**Last Updated:** April 3, 2026
**Approval:** [Signature block for Je Makelaar stakeholder sign-off]

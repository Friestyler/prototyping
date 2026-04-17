---
epic: Lead Campaigns
label: Lead-Campaigns
month: April
sprints: S62 + S63
tec-epic: —
status: Draft
last-updated: 2026-04-13
version: 18
---

# Epic Master Document: Lead Campaigns

> This is the single source of truth for this epic.
> Update it after every iteration using `/save-epic Lead Campaigns`.
> Upload to project knowledge after each update.
> The Cowork agent reads this document to create QA stories and TEC tickets.
>
> **Story granularity note:** Stories are written at the user-facing flow level — one story per coherent feature area. The Cowork agent creates one TEC ticket per story. The development team is responsible for deciding how to split tickets into frontend, backend, or other sub-tasks. The agent must not suggest or impose FE/BE splits.

---

## Epic overview

### Goal
Enable insurance brokers to run email campaigns directly to leads — people who have submitted a form (e.g. AON, Vivium) and are not yet customers. This introduces Leads as a first-class entity in the platform with its own data model, list page, and campaign target group, separate from the existing customer campaign flow.

### User personas
- **Broker (campaign sender):** Receives form submissions from insurers as leads. Wants to follow up with personalised emails containing an offer document, without having to manually send each one.
- **Insurer (e.g. AON, Vivium):** Creates forms that generate leads in the broker's workspace. Wants brokers to act on those leads efficiently through the platform.

### Business value
Lead Campaigns unlock a new activation loop: insurer-generated form submissions → broker follow-up via automated email. This increases the value of insurer integrations, drives more campaign volume on the platform, and creates a conversion path from lead to customer that runs through Qollabi rather than outside it.

### Dependencies
- **Depends on:** Qollabi endpoint for lead ingestion (Story 4 of this epic — receives form data, creates leads, fills Google Sheet)
- **Depends on:** Form app update (Story 5 of this epic — redirects submissions to the Qollabi endpoint)
- **Depends on:** Existing campaign infrastructure (flow builder, settings step, draft & send all reused)
- **Depends on:** Smart lists (lead smart lists must support dynamic filtering)
- **Blocks:** Lead-to-customer conversion (future epic — requires leads to exist first)
- **Related epics:** Campaign Blockers (QA-324/TEC-1356 auto-send; QA-379/TEC-1414 stop/re-activate), Tasks in Campaigns

### Out of scope (epic level)
- Lead-to-customer conversion — separate epic
- Multiple attachment links per lead — v1 supports one URL attribute per lead; multi-document support is a future story
- Insurer-facing lead management — out of scope for this epic
- Lead deduplication on form submission — separate concern
- Lead import via CSV — separate story

---

## Lead data model

Leads are a distinct entity from customers and contacts. The lead data model for v1 is:

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| externalId | string | no | Optional. Same pattern as on other entities. Used for future integration/import matching. Add at lead-to-customer conversion if needed. |
| firstName | string | no | — |
| lastName | string | no | — |
| email | string | no | No email = lead cannot be emailed. Flagged as "Missing info" in Draft & Send. |
| company | string | no | — |
| attachmentLink | URL string | no | URL pointing to the personalised offer document for this lead. First of potentially multiple URL attributes. A "Form summary PDF" (`formSummaryPdfLink`) attribute is planned for a future iteration. |
| source | string (alphanumeric) | no | Identifier of the Google Sheet this lead came from. Alphanumeric characters only. Used to trace which sheet/integration produced the lead. Populated automatically by Story 5 (Google Sheet ingestion) — not editable by the broker. |
| owner | User reference | no | Links to a Qollabi user. Same pattern as customer owner. |

All attributes are optional. A lead can be created with minimal information and enriched later.

---

## Stories

---

### Story 1 — Leads: entity, page, lists, filters & bulk actions

**Status:** Draft
**QA key:** QA-380, QA-381
**TEC key:** TEC-1416
**Month:** April
**Sprint:** 62
**Epic label:** Lead-Campaigns
**V0 prototype:** none
**Active mockup:** Claude HTML (qollabi-v5.html) — no V0 yet

> ⚠️ **Mockup reference only.** The HTML file referenced above (`qollabi-v5.html`) was built during product discovery to validate flows and identify decisions — not to specify the final UI. The component structure and screen layout may be used as a starting reference, but the UI/UX must be fully redesigned for implementation based on the requirements, edge cases, and decisions in this epic document. When there is any conflict between the mockup and this epic, this epic wins.

#### What this story covers

Everything needed to bring Leads into the platform as a first-class entity — the data model, the Leads page, the data table, filtering, smart lists, CRUD operations, and bulk actions. This is a single consolidated ticket because all of these pieces are tightly coupled and form one cohesive deliverable. The Leads page is the only broker-facing surface for leads in v1 (no detail/profile page).

#### Mockup description
A new "Leads" sub-item under the Smart Lists section of the sidebar, alongside Partners, Customers, Opportunities, Products, Contacts, Key Metric.

The Leads page follows the same layout and behaviour as the Customers page:

**Page header:** "Leads" title, no subtitle. Buttons: "New lead" (primary, same behaviour as "New customer" on the Customers page) + "Export leads as CSV" (secondary).

**Smart list tabs row** (same pattern as Customers): Qollabi Templates / Offered Templates / Market Radar Templates / Saved Lists, with a Cards/List view toggle. Brokers can create, edit, and delete lead lists from this page — full list management parity with customer lists.

**Smart list empty state** if no lists exist.

**Toolbar:** search input ("Lead name"), Filters button. All filters are behind the Filters button — not shown inline.

**Bulk bar** (dark, appears on checkbox selection): shows count of leads selected, "Add to list" action, "Clear selection" link.

**No stats bar.** The Leads page does not show a stats bar.

**Data table (columns in order):** checkbox | Lead | First Name | Last Name | Email | Company | Attachment Link | Owner

**Owner column:** Displays a coloured avatar (initials) + user name. Same visual pattern as the owner column on the Customers page.

**Attachment Link column:** Displays a download icon + filename/link. Clickable. Links directly to the stored URL.

**Sorting:** All columns are sortable. Default sort order matches the other entity tables in the platform.

**Pagination:** Same pagination behaviour as the Customers table.

**Lead column:** Displays the lead's full name (first + last). If both are empty, the cell is empty/muted — same as other empty cells in the table. No special fallback identifier.

**No detail/profile page in v1.** The list view is the only surface for leads. Clicking a lead name does nothing (or is plain text, not a link).

#### Lead data model

Leads are a distinct entity from customers and contacts. They stand alone — a Lead is not attached to a Customer, and the same person can exist as both a Customer and a Lead simultaneously as independent records with no link between them in v1.

All attributes are optional. A lead can be created with minimal information and enriched later.

| Attribute | Type | Required | Notes |
|-----------|------|----------|-------|
| externalId | string | no | Optional. Same pattern as on other entities. Used for future integration/import matching. |
| firstName | string | no | — |
| lastName | string | no | — |
| email | string | no | No email = lead cannot be emailed. Flagged as "Missing info" in Draft & Send. |
| company | string | no | — |
| attachmentLink | URL string | no | URL pointing to the personalised offer document for this lead. One URL per lead in v1. |
| source | string (alphanumeric) | no | Identifier of the Google Sheet this lead came from. Alphanumeric characters only. Set automatically by the ingestion pipeline (Story 4) — not editable by the broker. |
| owner | User reference | no | Links to a Qollabi user. Same pattern as customer owner. |

#### Advanced filters

The Filters button opens a filter panel. Filters are available on all lead attributes. The filter component and operators follow the same pattern as the Customers page (reference: TEC-942, TEC-1151).

**Filter attributes and operators:**

| Attribute | Type | Operators |
|-----------|------|-----------|
| First Name | Text | contains, does not contain, is, is not, is empty, is not empty |
| Last Name | Text | contains, does not contain, is, is not, is empty, is not empty |
| Email | Text | contains, does not contain, is, is not, is empty, is not empty |
| Company | Text | contains, does not contain, is, is not, is empty, is not empty |
| External ID | Text | contains, does not contain, is, is not, is empty, is not empty |
| Source | Text | contains, does not contain, is, is not, is empty, is not empty |
| Attachment Link | URL | is empty, is not empty |
| Owner | User reference | is [user], is not [user], is empty, is not empty |

**Note on Attachment Link filtering:** The only meaningful filter operations are whether the URL is populated or not. Contains/equals operators are not included for this attribute.

Multiple filters can be combined. Filter state persists within the session.

#### Lead smart lists

Lead smart lists are a distinct list type, separate from customer smart lists. A lead smart list only contains leads — it never appears in customer campaign flows, and customer smart lists never appear in lead campaign flows. This separation is enforced in both the UI and the data model.

**Static lead lists:** Manually curated. Leads are added one by one or via bulk "Add to list" action.

**Dynamic lead lists:** Auto-populate based on filter rules applied to lead attributes (same attributes and operators as the filter panel). Auto-update in real time as new leads are created — this is the trigger for auto-send in lead campaigns.

Each list card shows: list name, list type (Static/Dynamic), lead count.

Full CRUD (create, edit, delete) from the Leads page Saved Lists tab — parity with customer list management.

#### Dependencies / blockers
- [ ] Story 4 (Qollabi endpoint for lead ingestion) — leads must be creatable before this page is useful, but this story can be built and tested with manually created leads

#### User story
As a broker, I want to see and manage all my leads in one place, with smart lists and filtering, so that I can track who has submitted forms, organise them, and add them to campaigns.

#### Happy flow
1. Broker navigates to Smart Lists → Leads in the sidebar
2. Broker sees the Leads page with the data table listing all leads
3. Broker clicks "Filters" → filter panel opens
4. Broker applies a filter (e.g. Owner is "Kevin Kools") → table updates to show matching leads
5. Broker selects one or more leads using checkboxes → bulk bar appears
6. Broker clicks "Add to list" to add selected leads to a smart list
7. Broker clicks "New lead" to manually create a lead (opens creation modal)
8. Broker creates a dynamic list "AON Cybersecurity Leads" with rule: Source is "aon-cybersecurity"
9. New leads matching that rule are automatically added to the list in real time

#### Requirements
1. A "Leads" navigation item appears under Smart Lists in the sidebar.
2. The page header shows "Leads" as the title. No subtitle/description text beneath the title. No stats bar.
3. A "New lead" button (primary CTA) is shown in the page header. Its behaviour matches the "New customer" button on the Customers page. The creation modal shows all lead attributes: External ID, First Name, Last Name, Email, Company, Attachment Link, Owner. **Source is not shown in the creation modal** — it is set automatically by the ingestion pipeline, not by the broker.
4. An "Export leads as CSV" button (secondary) is shown alongside "New lead". Exports all leads in the workspace (not filtered).
5. Smart list tabs appear below the header: Qollabi Templates / Offered Templates / Market Radar Templates / Saved Lists, with a Cards/List view toggle. Brokers can create, edit, and delete lead lists from this page.
6. The note "Selecting a list will automatically include any leads added to that list in the future." is shown below the list selector tabs.
7. A Filters button in the toolbar opens a filter panel. All filters are hidden behind this button.
8. Advanced filters are available on all lead attributes with the operators specified in the filter table above. Attachment Link filter supports only: is empty, is not empty.
9. The data table shows columns: checkbox | Lead | First Name | Last Name | Email | Company | Attachment Link | Owner.
10. The Lead column shows the full name as plain text (no clickable link — no detail page in v1). Empty/muted if both names are absent.
11. The Owner column shows a coloured avatar (initials) + user name, matching the Customers page pattern.
12. The Attachment Link column shows a download icon and the filename/URL, clickable. Empty/muted if no link is stored.
13. Checkboxes on each row enable bulk selection. A "select all" checkbox in the header selects/deselects all rows.
14. When one or more leads are selected, a bulk action bar appears with: count label, "Add to list" button, "Clear selection" link.
15. Search filters leads by name (first name, last name, or full name).
16. All table columns are sortable. Default sort order matches the Customers table. Pagination follows the same behaviour as the Customers table.
17. Lead smart lists are a distinct type from customer smart lists — they do not appear in each other's pages or campaign flows.
18. Dynamic lead lists auto-update when new leads matching their rules are created.
19. **source attribute:** alphanumeric only, not exposed as editable in any broker-facing UI. It is writable by the ingestion pipeline only. It appears in filter panels so brokers can filter by source but cannot change its value through the UI.
20. **attachmentLink attribute:** a plain URL string, not a file upload. Validates as a valid URL format before saving.
21. CRUD operations (create, read, update, delete) for leads follow the same patterns as customers. **source is read-only** — it cannot be updated through any broker-facing operation.

#### Edge cases
- **Empty state:** Page shows an appropriate empty state when no leads exist.
- **No attachment link:** Attachment Link cell shows a muted dash.
- **No owner assigned:** Owner cell shows a muted dash.
- **No email:** Email cell shows a muted dash. Lead can appear in lists but cannot be emailed.
- **Lead with no name:** Lead column shows a muted dash.
- **source with non-alphanumeric characters:** Reject with a validation error.
- **attachmentLink that is not a valid URL:** Reject with a validation error.
- **owner references a user removed from the workspace:** Lead record remains intact. Owner cell shows a muted dash.

#### Acceptance criteria
- [ ] Given the broker navigates to Leads, then all leads are displayed in the table with the correct columns.
- [ ] Given the page loads, then no subtitle/description is shown and no stats bar is shown.
- [ ] Given the broker clicks "New lead", then a creation modal opens with all broker-editable attributes. No Source field.
- [ ] Given the broker clicks "Filters", then a filter panel opens with filters for all lead attributes.
- [ ] Given the Attachment Link filter, then only "is empty" and "is not empty" operators are available.
- [ ] Given the broker selects one or more leads, then the bulk action bar appears with the correct count.
- [ ] Given the broker creates a dynamic lead list with a rule, then any lead matching that rule is included immediately.
- [ ] Given a new lead is created that matches a dynamic list rule, then it is auto-added to that list.
- [ ] Given the broker is in the campaign wizard with target group = Leads, then only lead smart lists appear as recipient options.
- [ ] Given a source value with non-alphanumeric characters is submitted, then the request is rejected.
- [ ] Given an update request attempts to change source, then the request is rejected.
- [ ] Given no leads exist, then an appropriate empty state is shown.

#### Out of scope (story level)
- Lead detail/profile page — not in v1
- Export of filtered results only (export is full list)
- Lead deduplication — each lead record is independent
- Lead-to-customer conversion — separate epic

---

### Story 2 — Lead campaign creation flow

**Status:** Draft
**QA key:** QA-382
**TEC key:** TEC-1423
**Month:** April
**Sprint:** 62
**Epic label:** Lead-Campaigns
**V0 prototype:** none
**Active mockup:** Claude HTML (qollabi-v5.html) — no V0 yet

> ⚠️ **Mockup reference only.** The HTML file referenced above (`qollabi-v5.html`) was built during product discovery to validate flows and identify decisions — not to specify the final UI. The component structure and screen layout may be used as a starting reference, but the UI/UX must be fully redesigned for implementation based on the requirements, edge cases, and decisions in this epic document. When there is any conflict between the mockup and this epic, this epic wins.

#### Architectural approach

When the broker selects "Leads" as the target group in Step 1, the campaign flow for leads runs as a **separate implementation** from the customer campaign flow. It is not a generic multi-entity system. The goal is to reuse as many components and functionalities from the customer campaign flow as possible — flow builder, settings step, draft & send mechanics, campaign analytics — while adapting the parts that are lead-specific (recipient selection, merge tags, step labels, Draft & Send UI).

Once the lead campaign flow is working, the team can evaluate whether to refactor and generalise both flows into a unified multi-entity campaign architecture. That refactor is explicitly out of scope for this story — it is a future technical decision.

#### Mockup description
The campaign creation wizard (5 steps) adapts when the broker selects "Leads" as the target group in Step 1. The overall wizard structure is the same as customer campaigns. The lead campaign wizard shares as many UI components as possible with the customer campaign — it adapts, not duplicates where not necessary.

**Step 1 — Campaign Details:**
The Target Group selector shows "Customers" (default) and "Leads" (new option, labelled "New"). Selecting "Leads" enables lead-specific behaviour for the rest of the wizard. The target group is locked once any email has been sent (`sentCount > 0`) — see Requirement 13.

**Step 2 — Select Recipients:**
- Stats bar shows three summary cards (customer campaigns have four; lead campaigns drop "Total Recipients" as it is redundant with "Leads Selected" for this simpler recipient model):
  - **Leads Selected** (replaces "Customers Selected")
  - **Leads with Email** (replaces "Contacts With Email")
  - **Missing info** (unchanged)
- **General copy rule for lead campaigns:** Throughout all 5 wizard steps, all instances of "customer(s)" and "contact(s)" in UI labels, hints, and descriptions are replaced with "lead(s)".
- List selector: shows lead smart lists only (Static and Dynamic tabs).
- Note below tabs: "Selecting a list will automatically include any leads added to that list in the future."
- **Recipients table is a flat list — no expand/collapse.** Each row is a lead directly. No chevrons, no expand/collapse logic.
- The "Missing any contacts under a customer?" info card is NOT shown in lead campaigns.
- Recipients table columns: First Name | Last Name | Email | Company | Owner. No Type column. No Attachment Link column.
- **Selected tab:** First Name | Last Name | Email | Company | Owner. No checkbox, no Type, no Attachment Link.

**Step 3 — Flow Builder:**
Same canvas as customer campaigns. Merge tags available in a lead campaign's flow builder:
- `sender.name`
- `sender.signature`
- `lead.firstName`
- `lead.lastName`
- `lead.email`
- `lead.company`
- `lead.owner`
- `lead.attachmentLink`

`customer.*` and `contact.*` merge tags do NOT appear in the lead campaign flow builder.

`lead.attachmentLink` renders in the email body as a clickable hyperlink (not a file attachment). The broker inserts `{{lead.attachmentLink}}` to produce a clickable link to the PDF. If the lead has no URL stored, the merge tag renders as an empty string — the email still sends.

**Step 4 — Settings:**
Identical behaviour to customer campaigns. Only label change: CC Recipients and BCC Recipients "Use Customer Owner column" → **"Use Lead Owner"** for lead campaigns.

CTA behaviour from Automation Settings selection (same as QA-324 / TEC-1356):
- "Hold for manual review" → Draft & Send CTA is **"Send all"**
- "Send automatically" → Draft & Send CTA is **"Activate campaign"** (Send all is hidden)

**Step 5 — Draft & Send:**
- Left panel: flat list of leads
  - Primary label: First Name + Last Name
  - Subtitle: email · Company
  - "Exclude" button per lead
  - Search input
  - Filter tabs: All / Sent / Pending
  - "With contacts" and "Without contacts" filter tabs are NOT shown
- Lead with no email: "Incomplete information" badge + "No email address" where the email would appear in subtitle. In the right panel preview for that lead: Send button disabled + "Incomplete lead information" badge.
- Primary CTA: "Send all" or "Activate campaign" per Automation Settings

**Campaign list page:**
A new "Target Group" column is added showing "Customers" or "Leads" badge per campaign.

#### Dependencies / blockers
- [ ] Story 1 (Lead data model + smart lists) must be done first
- [ ] QA-324 / TEC-1356 (auto-send + Activate campaign CTA) — must be live for the Settings step to work correctly
- [ ] QA-379 / TEC-1414 (stop/re-activate) — needed for full campaign lifecycle management

#### User story
As a broker, I want to create an email campaign targeting leads, so that I can follow up automatically with personalised emails when new leads come in from form submissions.

#### Happy flow
1. Broker clicks "New campaign" on the Campaigns page
2. Broker enters campaign name and selects "Leads" as target group
3. Broker proceeds to Step 2 — only lead smart lists are shown. Selects "AON Cybersecurity Leads" (dynamic list, 3 leads)
4. Broker reviews the flat recipients table (First Name | Last Name | Email | Company | Owner)
5. Broker continues to Step 3 — builds email using `{{lead.firstName}}`, `{{lead.company}}`, `{{lead.attachmentLink}}`
6. Broker continues to Step 4 — selects "Send automatically"
7. Broker continues to Step 5 — sees "Activate campaign" CTA
8. Broker clicks "Activate campaign" → campaign is live, initial emails dispatched
9. New form submission arrives → lead added to list → email auto-sent within ~5–10 min

#### Requirements
1. The Target Group selector in Step 1 includes "Leads" as a new option alongside "Customers".
2. When "Leads" is selected, only lead smart lists appear in Step 2. Customer smart lists are not shown.
3. The recipients table in Step 2 shows columns: First Name | Last Name | Email | Company | Owner. No Type column. No Attachment Link column.
4. The Selected tab in Step 2 shows columns: First Name | Last Name | Email | Company | Owner. No checkbox, no Type, no Attachment Link.
5. Stats bar in Step 2 shows three cards: Leads Selected | Leads with Email | Missing info. No "Total Recipients" card.
6. The Flow Builder in Step 3 exposes only lead merge tags: `sender.name`, `sender.signature`, `lead.firstName`, `lead.lastName`, `lead.email`, `lead.company`, `lead.owner`, `lead.attachmentLink`. `customer.*` and `contact.*` tags are not available.
7. `lead.attachmentLink` renders in the email as a clickable hyperlink to the stored URL. It is NOT a file attachment. If the lead has no URL stored, it renders as an empty string — the email still sends.
8. The Settings step (Step 4) behaves identically to customer campaigns, except: CC Recipients and BCC Recipients "Use Customer Owner column" is relabelled to **"Use Lead Owner"**.
9. The Draft & Send step (Step 5) shows First Name + Last Name as the primary label and email · Company as the subtitle. "With contacts" / "Without contacts" filter tabs are not shown.
10. Missing info flag in Draft & Send applies to leads with no email address — same visual pattern as the existing incomplete contact state in customer campaigns.
11. CTA in Draft & Send: "Send all" when "Hold for manual review", "Activate campaign" when "Send automatically" (per QA-324 / TEC-1356).
12. The Campaigns list page gains a "Target Group" column showing a "Customers" or "Leads" badge per campaign.
13. **Target group editability — locked by sends, not by status:**
    - Editable only when `sentCount = 0`. When `sentCount > 0`: field is disabled regardless of status (Draft, Active, Stopped, Complete). Tooltip: *"The target group cannot be changed after emails have been sent."*
    - Changing when `sentCount = 0` is destructive: confirmation modal required — *"Changing the target group will remove all selected recipients and delete all merge tags used in your email. This cannot be undone."* On confirm: recipients cleared, merge tags deleted, email structure preserved.
14. **Reuse from customer campaigns:** The implementation should reuse as many components, hooks, and functionalities from the customer campaign flow as possible. Lead-specific pages/components are only created where the customer flow cannot be adapted. A future refactor to generalise both flows is anticipated — the code should not make that refactor harder.

#### Edge cases
- **Lead has no email:** Shown in Draft & Send with "Incomplete information" badge. Send disabled in the preview panel.
- **Lead has no attachment link:** `{{lead.attachmentLink}}` renders as an empty string. Email still sends.
- **Dynamic list with 0 leads at activation:** Campaign activates; emails sent when new leads enter the list.
- **Campaign shows as Draft but has sentCount > 0 (TEC-1138 regression):** Target group field is still read-only. Lock is based on sentCount, not the status label.

#### Acceptance criteria
- [ ] Given the broker selects "Leads" as target group, then only lead smart lists appear in Step 2.
- [ ] Given the broker selects a lead smart list, then the recipients table shows First Name | Last Name | Email | Company | Owner (no Type, no Attachment Link, no chevrons).
- [ ] Given the broker opens the Flow Builder merge tag picker, then only `sender.*` and `lead.*` tags appear.
- [ ] Given `{{lead.attachmentLink}}` is inserted, then it renders as a clickable hyperlink in the sent email.
- [ ] Given a lead has no attachment link URL, then `{{lead.attachmentLink}}` renders as empty string and the email still sends.
- [ ] Given "Send automatically" is selected, then the Draft & Send CTA is "Activate campaign".
- [ ] Given "Hold for manual review" is selected, then the Draft & Send CTA is "Send all".
- [ ] Given a lead has no email, then in Draft & Send left panel it shows "Incomplete information" badge and "No email address".
- [ ] Given sentCount > 0, then the Target Group field is disabled regardless of campaign status.
- [ ] Given the broker changes target group when sentCount = 0, then a destructive confirmation modal appears.

#### Out of scope (story level)
- Multiple attachment links per lead — v1 supports one URL
- Draft & Send warning when `{{lead.attachmentLink}}` is used but no URL is stored — separate ticket
- Refactoring to generalise customer and lead campaign flows — future technical decision
- Campaign analytics — no changes needed; identical to customer campaigns

---

### Story 3 — Campaign templates: target group selection and merge tags

**Status:** Draft
**QA key:** QA-383
**TEC key:** TEC-1427
**Month:** April
**Sprint:** 63
**Epic label:** Lead-Campaigns
**V0 prototype:** none
**Active mockup:** None

#### Mockup description
Campaign templates currently exist for customer campaigns. This story extends templates to support the target group attribute, so brokers can create and reuse templates specifically for lead campaigns.

The target group selector on templates works the same way as in Step 1 of the campaign creation wizard — the broker selects Customers or Leads when creating or editing a template. The selected target group determines which merge tags appear in the template flow builder.

The merge tag picker in a template with target group = Leads shows only `sender.*` and `lead.*` tags. A template with target group = Customers shows the existing `sender.*`, `customer.*`, and `contact.*` tags.

The target group is shown on the template card so brokers can distinguish lead templates from customer templates at a glance.

When a broker creates a campaign from a template, the campaign inherits the target group. The target group field in Step 1 is pre-populated. It can still be changed (following the same `sentCount = 0` rule), which clears recipients and merge tags.

#### Dependencies / blockers
- [ ] Story 2 (Lead campaign creation flow) must define the merge tag namespace before this story
- [ ] Existing campaign template infrastructure must support a target group attribute

#### User story
As a broker, I want to create campaign templates for lead campaigns, so that I can reuse email structures with lead-specific merge tags across multiple campaigns.

#### Requirements
1. Campaign templates include a target group attribute (Customers or Leads), set at template creation/edit time.
2. The merge tag picker in the template flow builder shows only merge tags appropriate for the selected target group: `sender.*` + `lead.*` for Leads; `sender.*` + `customer.*` + `contact.*` for Customers.
3. When a broker creates a campaign from a template, the campaign inherits the template's target group. The target group field in Step 1 is pre-populated. It can still be changed when sentCount = 0 (same destructive behaviour as Story 2, Requirement 13).
4. The target group is displayed on the template card so brokers can identify lead templates vs customer templates at a glance.
5. Existing templates (created before this feature) default to target group = Customers. No data migration needed beyond setting a default.

#### Acceptance criteria
- [ ] Given a broker creates a template with target group = Leads, then only `sender.*` and `lead.*` merge tags appear in the flow editor.
- [ ] Given a broker creates a template with target group = Customers, then `sender.*`, `customer.*`, and `contact.*` merge tags appear (existing behaviour).
- [ ] Given a broker creates a campaign from a Leads template, then the campaign's target group is pre-set to Leads.
- [ ] Given an existing template with no target group, then it defaults to Customers.

#### Out of scope (story level)
- Template versioning
- Template sharing between workspaces

---

### Story 4 — Qollabi endpoint: receive form data, create lead, fill Google Sheet

**Status:** Draft
**QA key:** QA-384
**TEC key:** TEC-1429
**Month:** April
**Sprint:** 62
**Epic label:** Lead-Campaigns
**V0 prototype:** none
**Active mockup:** None

#### What this story covers

Today, when a lead fills in an insurer form (e.g. AON, Vivium), the form sends the data directly to a Google Sheet. This story changes that architecture: a new Qollabi endpoint receives the form data, **creates a Lead record** in the broker's workspace, and **also fills the Google Sheet** with that data.

This is a pure infrastructure story — no broker-facing UI. Leads simply appear in the Leads page automatically once the endpoint is live and the form app has been updated (Story 5).

The technical approach for the endpoint is intentionally left open — dev decides how to implement it.

#### The `source` attribute

When the form app sends data to the Qollabi endpoint, the payload must include a `source` field containing the **Google Sheet ID** for that form. This is how Qollabi knows which integration produced the lead, and it populates the `source` attribute on the Lead record. The `source` value is set by the incoming request — it is not derived or inferred by Qollabi. It is the form app's responsibility to send the correct Google Sheet ID as the source.

#### Mockup description
No UI. This is a pure infrastructure story. Leads created by this endpoint appear in the broker's Leads page automatically.

#### Open questions for this story
- [ ] Endpoint URL — to be determined by dev and shared with the form app team (Story 5 depends on this)
- [ ] Authentication/security for the endpoint — how does the endpoint verify the request is from a trusted form app?
- [ ] Column-to-attribute mapping — which form fields map to which lead attributes? To be confirmed once the form structure is shared.
- [ ] Multi-workspace — does one form endpoint create leads in one workspace or can it route to multiple? How is the target workspace identified?
- [ ] Error handling — if the Lead creation succeeds but the Google Sheet write fails (or vice versa), how is that handled? Atomic or best-effort?

#### Dependencies / blockers
- [ ] Story 1 (Lead entity + data model) must be built first — the Lead record must be creatable
- [ ] Story 5 (Form app update) depends on this story being complete — the endpoint URL must be shared before Story 5 can be built

#### User story
As the system, I want form submissions to automatically create Lead records in Qollabi and fill the Google Sheet, so that brokers receive leads in their workspace without any manual data entry.

#### Happy flow
1. A lead fills in an insurer form (e.g. AON Cybersecurity)
2. The form app sends a POST request to the Qollabi endpoint with the lead's data, including `source` = the Google Sheet ID for that form
3. Qollabi receives the request, validates it, and creates a Lead record in the broker's workspace with the provided attributes
4. Qollabi also writes the data to the configured Google Sheet (filling a new row)
5. The lead appears in the broker's Leads page
6. If the lead matches the rules of a dynamic smart list, it is automatically added to that list
7. If a lead campaign is active with "Send automatically" and that smart list as its recipient source, the email is dispatched within ~5–10 minutes

#### Requirements
1. A new Qollabi endpoint accepts incoming form data payloads.
2. The payload includes a `source` field containing the Google Sheet ID. This value is stored as the `source` attribute on the created Lead record.
3. On receipt of a valid request, Qollabi creates a Lead record in the appropriate broker workspace with the attributes mapped from the payload.
4. Qollabi also writes the received data to the configured Google Sheet (a new row). The exact columns and mapping to be confirmed when the sheet structure is shared.
5. The lead is automatically evaluated against all dynamic lead smart list rules and added to any matching lists.
6. Row-level idempotency: if the same request is retried, only one Lead record is created. Attribute-based deduplication is not applied — multiple submissions with identical field values each create separate Lead records.
7. Failure handling: if a request cannot be processed, the failure is logged. The error does not affect subsequent requests.
8. The endpoint URL is determined by dev and must be shared with the form app team before Story 5 can proceed.

#### Edge cases
- **Google Sheet write fails but Lead creation succeeds (or vice versa):** Error handling approach to be decided by dev. The preferred default is to log the failure and not silently discard data.
- **Payload missing the `source` field:** Create the lead with an empty source attribute. Do not reject the request.
- **Payload with extra fields beyond the attribute mapping:** Ignore or store gracefully — do not block lead creation.
- **Existing customer submits the form:** A Lead record is created regardless. Customer and Lead are separate entities in v1 — no cross-entity deduplication.

#### Acceptance criteria
- [ ] Given a POST request with valid form data including `source`, then a Lead record is created in the broker's workspace with the correct attribute values.
- [ ] Given the lead is created, then it appears in the broker's Leads page.
- [ ] Given the lead is created, then it is also written as a new row in the configured Google Sheet.
- [ ] Given the lead matches a dynamic list rule, then it is automatically added to that list.
- [ ] Given the same request is received twice (retry), then only one Lead record is created.
- [ ] Given a request with extra fields beyond the attribute mapping, then lead creation proceeds normally.

#### Out of scope (story level)
- Broker-facing UI for configuring the endpoint — not in v1
- Multiple endpoint targets per workspace — v1 supports one configuration
- Form UI — built and owned externally; this story covers receiving the data only
- Two-way sync (changes to leads writing back to the sheet) — future story

---

### Story 5 — Update form app: redirect submissions to Qollabi endpoint

**Status:** Draft
**QA key:** —
**TEC key:** TEC-1433
**Month:** April
**Sprint:** 62
**Epic label:** Lead-Campaigns
**V0 prototype:** none
**Active mockup:** None

#### What this story covers

Today the form app (the form that leads fill in on the insurer's side) sends submitted data **directly to the Google Sheet**. This story updates the form app to send the data to the **Qollabi endpoint** instead (created in Story 4). Once the form sends to the Qollabi endpoint, the endpoint takes care of both creating the lead in Qollabi and filling the Google Sheet — the form app no longer writes to the sheet directly.

This story also includes fixing any security issues or logic that does not make sense in the current form app implementation.

The Qollabi endpoint URL is not yet known — dev will share it once Story 4 is complete. This story cannot be started until the endpoint URL is available.

#### Mockup description
No UI changes visible to brokers. The form UI seen by leads does not change. Only the backend destination for submitted data changes.

#### Dependencies / blockers
- [ ] Story 4 (Qollabi endpoint) must be complete and the endpoint URL must be shared before this story can be built

#### User story
As the system, I want form submissions to go to the Qollabi endpoint so that lead data is centralised in one place and the Google Sheet is filled from a single source of truth.

#### Happy flow
1. Story 4 is complete. Dev shares the Qollabi endpoint URL with the form app team.
2. The form app is updated to POST submitted data to the Qollabi endpoint instead of directly to the Google Sheet.
3. A lead fills in the form → data is sent to the Qollabi endpoint.
4. The Qollabi endpoint creates the lead and fills the Google Sheet (Story 4 logic).
5. The form app no longer writes directly to the Google Sheet.

#### Requirements
1. The form app is updated to send submitted form data to the Qollabi endpoint URL (to be provided by dev after Story 4 is built).
2. The form app no longer writes directly to the Google Sheet — that responsibility moves to the Qollabi endpoint.
3. The `source` field in the payload must contain the Google Sheet ID for that form (as specified in Story 4).
4. Any security issues in the current form app (e.g. exposed credentials, missing validation, insecure data handling) are identified and fixed.
5. Any logic in the current form app that does not make sense (inconsistencies, dead code, broken flows) is cleaned up.

#### Edge cases
- **Qollabi endpoint is temporarily unavailable:** The form app should handle errors gracefully — log the failure, do not silently discard the submission. Error handling approach to be determined.
- **Endpoint URL changes after initial integration:** The form app should be updated with the new URL. No hardcoded fallback to the old Google Sheet path.

#### Acceptance criteria
- [ ] Given a lead submits the form, then the data is sent to the Qollabi endpoint (not directly to the Google Sheet).
- [ ] Given the payload is sent to the Qollabi endpoint, then it includes the `source` field with the Google Sheet ID.
- [ ] Given the form app is updated, then it no longer writes directly to the Google Sheet.
- [ ] Given the endpoint is unavailable, then the form app logs the error and does not silently discard the submission.

#### Out of scope (story level)
- Changes to the form UI visible to leads — no changes to form fields or layout
- The Qollabi endpoint logic — Story 4
- New form fields or validation rules — not in scope unless identified as a security issue


## Mockup log

| Story | Type | Description / URL | Status |
|-------|------|-------------------|--------|
| Story 1 — Leads entity, page, lists, filters & bulk actions | Claude HTML | qollabi-v5.html — Leads page with table (Lead, First Name, Last Name, Email, Company, Attachment Link, Owner), bulk bar, no stats bar | Active |
| Story 2 — Lead campaign creation flow | Claude HTML | qollabi-v5.html — Full 5-step campaign wizard with lead-specific Step 2 (recipients table, selected tab), merge tags list, Draft & Send labels | Active |
| Story 3 — Campaign templates | None | No mockup yet | N/A |
| Story 4 — Qollabi endpoint: receive form data, create lead, fill Google Sheet | None | No UI — infrastructure story | N/A |
| Story 5 — Update form app | None | No UI changes visible to brokers | N/A |

---

## Open questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What fields are shown in the "New lead" creation modal? | PM | ✅ Resolved — all lead attributes are shown in the creation modal. |
| 2 | In Step 2 recipients table — live snapshot or point-in-time on page load? | PM | ✅ Resolved — same behaviour as the Select Recipients step in customer campaigns. |
| 3 | In Draft & Send, lead with no email — shown with warning or hidden entirely? | PM | ✅ Resolved — same behaviour as contact with no email in customer campaigns. See Story 3 requirements. |
| 4 | Should CC "Use Customer Owner column" be relabelled to "Use Lead Owner" in lead campaigns? | PM | ✅ Resolved — relabelled to "Use Lead Owner" for CC and BCC in lead campaigns. |
| 5 | What fields are available for dynamic filter rules on lead smart lists? | PM | ✅ Resolved — all lead attributes with the operators defined in Story 1 filter table. |
| 6 | If `{{lead.attachmentLink}}` is in the email but the lead has no URL stored — what renders? | Dev | ✅ Resolved — renders as empty string (industry standard). Email still sends. Draft & Send warning for missing attachment link URLs is a separate ticket — out of scope here. |
| 7 | Can the target group be changed? Behaviour when changed? | PM | ✅ Resolved — editable only when sentCount = 0 (no emails sent), regardless of status label. Even a Draft campaign with past sends has the field locked. When locked: disabled with inline message explaining why. When editable: destructive confirmation required. Broader campaign edit/publish model is out of scope — belongs in Campaign Blockers epic. |
| 8 | Endpoint URL for Story 5 | Dev | 🔴 Blocked — dev must share the Qollabi endpoint URL (from Story 4) before Story 5 can begin. |
| 9 | Story 4 — form field to lead attribute mapping | PM | 🔴 Open — column-to-attribute mapping to be confirmed once the form structure is shared. |
| 10 | Story 4 — authentication/security for the endpoint | Dev | 🔴 Open — how does the endpoint verify the request is from a trusted form app? |

---

## CEO feedback log

| Date | Feedback | Stories affected | Applied |
|------|----------|-----------------|---------|
| — | No CEO feedback yet | — | — |

---

## Iteration log

| Date | What changed | Chat |
|------|-------------|------|
| 2026-04-13 | v18 — Structural overhaul to align with the confirmed 4-ticket delivery approach. Stories 1+2 (Leads page + Lead smart lists) consolidated into one story (Story 1, TEC-1416). Story 3 (Lead campaigns) renumbered to Story 2 (TEC-1423); architectural note added: separate lead campaign implementation reusing customer components, future generalisation is a separate decision. Story 5 (Google Sheet ingestion) replaced with two new stories: Story 4 (TEC-1429) — Qollabi endpoint receives form data, creates lead, fills Google Sheet; Story 5 (TEC-1433) — update form app to redirect to Qollabi endpoint. `source` attribute clarified: value is the Google Sheet ID sent by the form app in the payload. Story 4 campaign templates renumbered to Story 3 (TEC-1427), Sprint 63. Open questions updated: endpoint URL blocker added, form field mapping and endpoint security flagged as open. |
| 2026-04-10 | v17 — `offerPdfLink` reverted to `attachmentLink` (display: "Attachment Link") throughout. `source` attribute added to lead data model: alphanumeric string, stores Google Sheet ID the lead came from, set automatically by ingestion pipeline (not broker-editable). Source added to filter table (text operators) and Story 5 column mapping. Source excluded from New lead creation modal. |
| 2026-04-10 | v16 — Mockup disclaimer added directly into the mockup description section of Stories 1 and 3. |
| 2026-04-10 | v15 — Five structural fixes: (1) Stories reordered to numerical sequence (1→2→3→4→5) in document; (2) Story 5 restructured to match standard template (Mockup description, Happy flow, Edge cases, Requirements heading); (3) Stale dependency references in Stories 1 and 2 updated to point to Story 5; (4) Story 3 and Story 1 empty open question sections cleaned; (5) Story 4 template versioning question removed — existing platform behaviour applies (editing a template does not affect campaigns created from it). Story 5 context updated: existing customers who submit forms are created as leads — same flow as any other submission, no cross-entity deduplication in v1. |
| 2026-04-10 | v14 — `attachmentLink` renamed to `attachmentLink` (display: "Attachment Link") throughout. First of potentially multiple PDF URL attributes — "Form summary PDF" noted as a future addition. |
| 2026-04-10 | v13 — Story 5: removed reference to Website Signup Story 0 / Anthropic Agent SDK. Technical approach note simplified. |
| 2026-04-10 | v12 — Story 5: deduplication rule resolved — each row creates a unique lead regardless of matching values. Row-level idempotency (retry protection) is still required but attribute-based deduplication is not. |
| 2026-04-10 | v11 — Story 5 added: automatic lead creation from Google Sheet. 30-second SLA, column mapping TBD, smart list auto-assignment criteria TBD, deduplication rule TBD. Infrastructure story — no broker-facing UI. Technical approach left open for dev. |
| 2026-04-10 | v10 — attachmentLink empty = empty string confirmed; Draft & Send warning for missing attachment link URLs scoped out as separate ticket. |
| 2026-04-10 | v9 — 17 decisions applied: Q2 resolved (same as customers); Q4 resolved (CC/BCC relabelled to "Use Lead Owner"); Q5 resolved (all attributes with operators already defined); Q6 resolved (empty string, warning at send time); Story 4 confirmed (target group selector same as campaigns); sorting/pagination same as customers; Lead column empty = empty cell; no source attribute; Type column removed from recipients table; Target Group column added to campaign list; empty state in Step 2 same as customers; exclude previously sent same as customers; CRUD same as customers; analytics unchanged; Note under tabs formalised as requirement; Story 4 target group selector confirmed. | Lead Campaigns planning session |
| 2026-04-10 | v8 — Info banner removed from Step 2. Story 3 open questions cleaned. Iteration log restructured. | Lead Campaigns planning session |
| 2026-04-10 | v7 — Target group lock condition corrected: locked by sentCount > 0, not by status label. Covers TEC-1138 Draft regression edge case. Campaign edit/publish model scoped out to Campaign Blockers epic. | Lead Campaigns planning session |
| 2026-04-10 | v6 — Target group change is a destructive action requiring confirmation modal: clears recipients, deletes merge tags from email body, preserves email structure. | Lead Campaigns planning session |
| 2026-04-10 | v5 — Step 2: 3 summary cards (Total Recipients removed), general copy rule (customer→lead throughout), flat recipients table (no chevrons), missing contacts card removed, analytics page specified, Story 4 (campaign templates) added, target group editability resolved. | Lead Campaigns planning session |
| 2026-04-10 | v4 — Step 2 summary card copy: "Leads Selected", "Leads with Email", "Missing info". | Lead Campaigns planning session |
| 2026-04-10 | v3 — New lead modal resolved (all attributes). Draft & Send no-email behaviour specified: Incomplete information badge, No email address text, Send disabled. | Lead Campaigns planning session |
| 2026-04-10 | v2 — All attributes optional. External ID added. "Field" → "Attribute". Leads page: no subtitle, no stats bar, New lead button, full list management, smart list tabs, advanced filters with operator table, no detail page. | Lead Campaigns planning session |
| 2026-04-10 | v1 — Epic created. 3 stories: Leads page, Lead smart lists, Lead campaign creation flow. Data model, merge tags, attachment link pattern, selected tab columns, Draft & Send adaptations, Settings step all defined. | Lead Campaigns planning session |

---

## How to use this document

**During iteration (in Claude chat):**
- Start any chat with "load the Lead Campaigns epic doc" — I read it and continue exactly where you left off
- End the session with `/save-epic Lead Campaigns` — I produce the updated version

**After iteration:**
- Download and re-upload to project knowledge, replacing the old version

**When ready for development:**
- Review stories, confirm Status: Ready for Cowork
- Trigger the Cowork agent — it creates QA stories + TEC tickets

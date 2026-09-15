# S1 Week 1 — Web-only Task Explanation and Implementation Plan

**Source tracker:** `UI/NIGAHomeopathy_UI/NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx`  
**Sheet:** `S1_Week1` (Sprint window Day 1–7 — Foundation, Admin closeout, mobile bootstrap)  
**Date of analysis:** 11 Sep 2026  
**Status of this document:** Plan only. **Do not implement until this plan is approved.**

---

## How to use this document

1. Read **Section A** (scope) so you know what was included and what was deliberately skipped.
2. Read **Section B** (landscape) so dual-API and “already done” modules make sense.
3. Read **Section C** (scorecard) for the 30-second view.
4. Read **Section D** (what is already done) before any implementation discussion.
5. Read **Section E** (week execution plan) for day-by-day remaining work.
6. Use **Section F** as the encyclopaedia: **every Web Frontend / Web API / Web Other sub-task, one by one**, with meaning, current code, and the plan if we implement later.

When you approve, we implement remaining items in the order in Section E. We do **not** rebuild M02 masters.

---

## A. Scope of this plan

### Included (64 sub-tasks)

Only rows on `S1_Week1` whose **Work Bifurcation (column H)** is one of:

| Work Bifurcation | Count | Meaning |
|---|---|---|
| **Web Other** | 15 | Decisions, config, docs, dual-API placement rules — often not a UI screen |
| **Web Frontend** | 6 | React web app (`UI/NIGAHomeopathy_UI`) — layouts, ACL, login/logout/reset wiring |
| **Web API** | 43 | HTTP/backend on New-API and/or dual-API freeze on Old-API |

**Total in this document: 64 / 178 S1 rows.**

### Deliberately excluded (114 rows)

These are on S1_Week1 but **out of this plan**, as requested (“only web, not UI”):

| Bifurcation | Count | Why excluded |
|---|---|---|
| QA | 48 | Test track |
| Security | 27 | M02 ACL rows (`.02` ACL). Code is already Done; this plan is not the Security track |
| Database | 10 | Schema-only rows (FND-01.02 roles, SEC token/OTP/audit tables, CON tables) |
| Mobile Frontend | 9 | Patient/Doctor mobile |
| Mobile UI | 8 | Patient/Doctor mobile screens |
| API Mobile | 8 | Mobile wiring |
| Web UI | 2 | `CON-01.03`, `CON-02.03` — UI track, consumed in Phase 16 |
| UI | 1 | `ADM-B04.03` — frontend consume menu API instead of hard-coded `LayoutMenuData` |
| Integration | 1 | `CON-02.04` OTP-on-caregiver-grant (depends on CON APIs) |

**Important:** Database siblings are mentioned as **dependencies** where a Web API cannot ship without them. We still do not treat Database / UI / QA / Mobile as our tickets.

### Repos in play

| Repo | Role |
|---|---|
| `New-API/NIGA_NewAPI` | NigaHomeopathy-API (.NET 8). **All new HTTP.** |
| `Old-API/NIGA_OldAPI` | Classic API. Login, Rx-write, Razorpay until formal cut-over. Many Admin masters still live here. |
| `UI/NIGAHomeopathy_UI` | Single React web SPA (Velzon). Doctor / Reception / Admin today. Account + Pharmacy shells are missing. |

**Hard rule from the tracker:** do not create a third API.

---

## B. Codebase landscape (why M01 / M02 look “already done”)

S1 Week 1 is not a greenfield week. Two modules already have substantial code:

### B.1 Dual-API (this is the operating system of S1)

UI helper `src/helpers/realbackend_helper.js` already documents the rule:

- New domain / new HTTP → New-API (`nigahomeoAPI` / `API_URL_NIGAHOMEOPATHY`).
- Do not create a third API.
- Keep on classic (`api` / `API_URL`) until explicit cut-over: **Login, Rx-write, Razorpay**.
- Do not silently switch hosts for an existing call.

So for M02, “Web API task Done” usually means: **host is frozen correctly + mutate is ACL-locked**, not “ported to .NET 8”.

### B.2 What “Done” vs tracker “Not Started” means

The Excel **S1_Week1 layer statuses** are often stale:

- Almost every **M01** Web row still says `Not Started`.
- Almost every **M02** Web API row says Backend/API `Done`.

Code review shows M01 backend security is **largely built**, while M01 frontend wiring and M00 decisions are **not**. This document uses **code truth**, not Excel layer cells.

Status used below:

| Code status | Meaning |
|---|---|
| **DONE** | Behaviour exists. Tracker may still say Not Started. Close-out = demo + mark tracker. |
| **PARTIAL** | Skeleton / helper / one side (API or UI) exists. Remaining work listed. |
| **NOT STARTED** | No product artefact (decision, config, endpoint, or screen). |
| **CONFIRM-ONLY** | M02 dual-API freeze — no rebuild. Confirm host + do not switch. |

---

## C. Executive scorecard (web-only)

| Module | Web sub-tasks | Already in code | Remaining after approval |
|---|---|---|---|
| **M00 PRE — Client gates** | 11 Web Other | 0 | All 11 (mostly decisions + 2 config records) |
| **M01 Foundation** | 5 (3 Other + 2 Frontend) | Dual-API rule documented; roles constants exist; 3-role home redirect | Shared-key design doc; Account/Pharmacy shells; deny-by-default ACL; five-portal doc |
| **M01 Security** | 18 (13 API + 4 Frontend + 1 Other) | Login hash, reset APIs, logout API, consent, OTP, secure docs, GetMenuByRole | Wire UI reset/logout; remove fakeBackend; ownership enforcement; disable directory browsing; audit middleware; Account vs Admin seed |
| **M02 Admin Clinical** | 28 Web API | **27 CONFIRM-ONLY Done**; ADM-B04.02 partial | Finish Account/Pharmacy **menu seed** (template exists, not applied) |
| **M16 Patient APIs** | 2 Web API | 0 | Family CRUD + Caregiver grant/revoke/list |

**Recommended remaining engineering (after approval), ignoring client-decision workshops:**

1. Close M02 leftover: live Account/Pharmacy menu seed (`ADM-B04.02`).
2. Close M01 frontend gaps (fakeBackend, reset page, logout New-API, role ACL, Account/Pharmacy stubs).
3. Close M01 API gaps (DoctorId ownership on clinical APIs, directory browsing, audit helper usage, settlement config after PRE decisions).
4. Start M16 family/caregiver APIs (Day 5–7 P1) only after OTP infra (already exists) and PRE-03 SMS vendor decision if SMS is required for caregiver OTP (that OTP-on-grant row is Integration, not this plan).

---

## D. What is already done (deep analysis)

This section is the answer to: “M01 and M02 are already done — what exactly exists?”

### D.1 M02 Admin Clinical — keep and harden (do not rebuild)

**Intent of every M02 Web API `.03` row:** confirm the UI still talks to the **correct host** (classic vs .NET 8) and **do not silently switch**. ACL (`.02` Security track) is already Done in code.

**What was done in code:**

1. **Admin mutate lock:** `[Authorize(Policy = AdminPortal)]` on add/update/delete for Admin masters. Policy = RoleId 1 or Admin/Management. Doctor is a read-only consumer on Patient Board.
2. **SPA lock:** `AdminProtected.js` + `canAccessAdminPortal` / `canMutateAdminMasters` in `roles.js`.
3. **Host freeze comments** in `realbackend_helper.js` (W1–W7). Admin CRUD for most repertory/diagnosis/MM/drug masters stays on **Old-API**. A few surfaces were intentionally born on **New-API**.
4. **Probe endpoints:** `GET /api/AdminAcl/me|ping|coverage` on New-API.

**Frozen on New-API (`nigahomeoAPI`):**

- 3D mesh key, 3D section, 3D hotspots (full CRUD)
- Doctor qualifications admin
- Rubric–remedy **save + Excel**
- `GET /api/mastersAPI/GetMenuByRole`
- Doctor Widgets package **reads** (`/mastersAPI/GetPackages`)
- Allopathic **dropdown** for the board

**Frozen on Old-API (`api`):**

- Drug system / drug group
- Allopathic **admin CRUD** + side-effect deletes
- Diagnosis system / therapeutics / conditions
- Author, Materia medica master/heads/remedies admin
- Question section/group/sub-group + clinical question mapping
- Repertory sections, subsection/rubric tree CRUD, language, body part, intensity, remedy, remedy grade
- Lab catalog admin + PatientLab board catalogue reads
- Package **admin** mutate
- Roles / MenuMaster CRUD

**M02 leftover (web):** `ADM-B04.02` — `GetMenuByRole` is restored on .NET 8, but Account/Pharmacy **menu seed is still a commented SQL template**. Frontend still uses hard-coded `LayoutMenuData` (that consume-API work is UI track `ADM-B04.03`, out of this plan).

**Do not do:** rebuild any Admin master screens or migrate a frozen Old-API master to New-API “while we are here”.

### D.2 M01 Foundation & Security — backend mostly present, frontend incomplete

**Already in New-API / SQL:**

| Capability | Where |
|---|---|
| Password hashing verify on login; Role + `DoctorID` JWT claims | New and Old `AccountController` + `TokenService` |
| `PasswordResetToken` table; Forgot / Reset / Change password | New `POST /api/Account/ForgotPassword`, `ResetPassword`, `ChangePassword` |
| Logout + `UserLoginStatus` OutTime; in-memory jti denylist on New | `POST /api/Account/Logout` |
| Consent types + Grant / Withdraw / ListMine / AdminAudit | `ConsentController` |
| Generic OTP request/verify, rate-limit, lockout, SMS **stub**, Audit (Account+Admin) | `OtpController` |
| Secure document multipart upload + authorised GET | `SecureDocumentController` |
| `GetMenuByRole` restored | `MastersAPIController` |
| `DoctorOwnership` helper | `Niga-Domain/Security/DoctorOwnership.cs` (**almost unused**) |
| `IAuditEventWriter` | Used on Account password paths only, **not** as middleware |
| Role constants Patient / Account / PharmacyPartner | `roles.js` + `M01_Foundation_Security_Server.sql` |
| Dual-API placement comment | `realbackend_helper.js` |
| Home redirect for Doctor / Reception / Admin | `getHomeDashboardPath` |

**Not done / incomplete:**

- `fakeBackend()` still called from `App.js`.
- Forget-password thunk still Firebase/fake JWT — does **not** call `forgotPasswordSecure`.
- No `/reset-password/:token` route.
- Logout.js hits **classic** `/Account/Logout`, not New-API denylist.
- JWT denylist is not hooked in `Program.cs` `OnTokenValidated`.
- No Account layout, no Pharmacy layout stub; Account role would land on Admin `/dashboard`.
- `AuthProtected` is login-only, not deny-by-default role ACL.
- Velzon demo menus still in `LayoutMenuData.js`.
- `UseDirectoryBrowser` still **enabled** for `/attachments` and `/Blogs`.
- Doctor ownership **not enforced** on Patient / Appointment / Case / Rx / labs.
- No `SettlementModel` / commission / T+N config.
- No FamilyMember / CaregiverAuth APIs.
- No published shared-key design (`ErxId`, `LedgerTxnId`, `MedicineOrderId` do not exist).

### D.3 M00 PRE — not done (and must block money/SMS/video coding)

There is no `SettlementModel`, no payout mechanic record, no MSG91/DLT, no video SDK, no unpaid-slot hold. Razorpay on Old-API is **order create only**, not Route/linked accounts. These are **client decisions first**, then one config write.

---

## E. Proposed Week 1 execution order (after approval)

S1 calendar from the sheet: Day 1–2 PRE, Day 2–6 Foundation/Security, Day 3–7 Admin closeout, Day 5–7 Patient APIs (P1).

### Day 1–2 — M00 PRE (Web Other) — **blockers**

Cannot honestly code money spine, SMS, or telemedicine later without these answers. Engineering work on Day 1–2 is **documentation + config keys**, not features.

| Order | IDs | Outcome needed |
|---|---|---|
| 1 | PRE-01.01, PRE-01.02 | Workshop notes: merchant of record + payout mechanic (NEFT/IMPS vs Razorpay Route) |
| 2 | PRE-01.03 | `SettlementModel` config record (no hardcoded split) |
| 3 | PRE-02.01, PRE-02.02, PRE-02.03 | Cash retain/remit + GST note + commission % / T+N / invoice series as config |
| 4 | PRE-03.01 … PRE-03.05 | Video vendor, SMS+DLT, legal copy owners, unpaid hold policy, credentialing backfill |

### Day 2–6 — M01 Foundation + Security (the real web build)

Suggested implementation sequence (dependencies first):

1. **FND-01.03** — reaffirm dual-API (already documented; add a one-pager if missing).
2. **FND-01.01** — publish shared-key + event list (design, not tables for missing IDs yet).
3. **FND-02.04** — five-portal document.
4. **FND-02.01** — Account layout + home redirect; Pharmacy stub.
5. **FND-02.02** — per-route deny-by-default ACL skeleton.
6. **SEC-01.02** — confirm login hash/claims (likely tracker close-out only).
7. **SEC-01.03** — remove `fakeBackend()` from production path.
8. **SEC-02.02** — confirm reset APIs (likely tracker close-out).
9. **SEC-02.03** — wire forgetpwd + `/reset-password/:token`.
10. **SEC-03.01 / SEC-03.02 / SEC-03.03** — logout denylist hook + UI call New-API + mobile contract note.
11. **SEC-04.01 / SEC-04.02 / SEC-04.03** — money/PII attributes, hide routes + strip Velzon demos, Account vs Admin seed.
12. **SEC-05.01 / SEC-05.02** — apply `DoctorOwnership`; disable directory browsing.
13. **SEC-06.02 / SEC-06.03** — confirm consent APIs; document AudioCaseConsentLog → ConsentRecord for Phase 11.
14. **SEC-07.02 / SEC-07.03** — confirm OTP (likely close-out); keep SMS stub until PRE-03.02.
15. **SEC-08.02** — turn audit writer into something later phases can call on money/Rx/approval.
16. **SEC-09.02** — confirm SecureDocument; pair with SEC-05.02 browsing off.

### Day 3–7 — M02 Web API closeout

- Treat **27 dual-API `.03` rows as Done**. Demo once using AdminAcl coverage + helper comments. Update tracker if S1 overall status is blank.
- Finish **ADM-B04.02** seed (after PRE/role IDs exist). Do **not** do `ADM-B04.03` (UI track).

### Day 5–7 — M16 (P1 parallel)

- **CON-01.02** Family CRUD + book-as-member (needs Database sibling CON-01.01).
- **CON-02.02** Caregiver grant/revoke/list + booking check (needs CON-02.01). OTP-on-grant is Integration, out of scope here but API should accept “OTP verified” later.

---

## F. Every included task, one by one

Legend for each sub-task:

- **Bifurcation / Day / Priority / Work type** from the sheet
- **What it is** — plain language
- **Why** — product meaning
- **Code today**
- **Plan after approval** (not started now)
- **Done when**

---

# MODULE M00 — PRE Client gates (Day 1–2, P0)

**Main idea:** Before money, SMS, or video is built, the **client** must sign business rules. These rows are workshops, legal, and configuration — not feature screens.

---

## MAIN TASK PRE-01 — Decide settlement model (Homeocentrum holds all money)

**Business meaning:** Every consult fee, medicine order, and subscription payment should pass through Homeocentrum (food-delivery / quick-commerce pattern). Engineering must not invent a “doctor’s Razorpay vs pharmacy’s Razorpay” split in code.

**Siblings (all Web Other, all in this plan):** PRE-01.01, PRE-01.02, PRE-01.03.

**Success:** All three done. Later payment phases read `SettlementModel` instead of hardcoding.

---

### PRE-01.01 — Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Day / Priority | Day 1–2 / P0 |
| Work type | Client Decision |
| Layers | None marked Yes (decision, not code) |
| PDF | Every transaction passes through Homeocentrum |
| Code status | **NOT STARTED** |

**What this sub-task is**

A **finance workshop**, not an API. “Merchant of record” means: the legal entity that appears on the patient’s card/UPI statement and that is responsible for GST/refunds. Confirm that **one** entity — Homeocentrum — is merchant of record for:

1. Consultation fees  
2. Medicine / HomeoMeds orders  
3. SaaS subscription (doctor packages)

**Why it exists**

If doctors or pharmacies collect on their own merchant accounts, later Account ledger, refunds, and commission become a different product. The PDF says the platform holds money centrally.

**Code today**

No `SettlementModel`, no merchant-of-record flag. Old-API Razorpay `OrderController.GenerateOrderId` creates **orders** only. UI checkout lives in doctor `Widgets.js`. That is **not** a signed settlement model.

**Plan (after approval)**

1. Schedule finance + product + tech lead workshop.
2. Write a one-page decision: merchant legal name, GSTIN, what flows through Homeocentrum, what (if anything) never does.
3. File it under an agreed docs folder (e.g. `New-API/NIGA_NewAPI/docs/PRE/` or `UI/.../docs/pre/`).
4. Link path in sprint Notes. Client/lead sign-off.
5. **Do not** start Razorpay Route or ledger tables in this ticket.

**Done when:** Signed note exists; a teammate can read “Homeocentrum is MOR for consult + medicine + subscription” without asking you; module sheet `M00_PRE_Client_Gates` updated.

**You must not:** Implement payment split, change Razorpay keys, or build Account UI.

---

### PRE-01.02 — Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Day / Priority | Day 1–2 / P0 |
| Work type | Client Decision |
| Layers | Integration = Yes / Not Started |
| Code status | **NOT STARTED** |

**What this sub-task is**

After money sits with Homeocentrum, **how does the doctor/clinic get paid out?** Two v1 options:

- **A. Homeocentrum-held + NEFT/IMPS:** platform runs a payout batch (bank transfer) from Account portal later.
- **B. Razorpay Route / linked accounts:** gateway auto-splits/transfers to linked doctor accounts.

**Why it exists**

Account module (M08) and payout OTP (SEC-07) cannot be designed until this is chosen. Route vs NEFT changes tables, vendors, and compliance.

**Code today**

No Route, no linked accounts, no NEFT batch, no payout entity.

**Plan (after approval)**

1. Same workshop as PRE-01.01 or immediate follow-up.
2. Record chosen mechanic, why, and what is **out of v1** (e.g. instant split).
3. If B: list Razorpay Route prerequisites (linked accounts, KYC). If A: list bank file format and T+N (ties to PRE-02.03).
4. Do **not** integrate Route in this ticket. Integration layer “Done” means the **decision is recorded** so later phases can implement one path.

**Done when:** Written choice A or B with sign-off; tracker Integration status Done; no code path hardcoded to the unchosen model.

---

### PRE-01.03 — Record decision in config (`SettlementModel`) — engineering must not hardcode a split model

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Day / Priority | Day 1–2 / P0 |
| Work type | Configuration |
| Layers | Backend = Yes / Not Started |
| Code status | **NOT STARTED** |

**What this sub-task is**

Turn PRE-01.01 + PRE-01.02 into a **config record** the APIs can read. Example shape (illustrative, not implemented):

- `SettlementModel` = `HomeocentrumHeld`
- `PayoutMechanic` = `NeftImps` or `RazorpayRoute`
- `MerchantOfRecord` = Homeocentrum legal name

Later payment code reads this. Nobody writes `if (doctorId == X) use doctor razorpay`.

**Why it exists**

Config, not a hardcoded `if`. Changing payout later should be data, not a rewrite.

**Code today**

No table, no `appsettings` key, no options class named SettlementModel.

**Plan (after approval)** — depends on PRE-01.01 and PRE-01.02

1. Add a small config store (prefer DB `PlatformConfig` or dedicated row, not only `appsettings`, so Account can view later).
2. New-API only. Seed the signed values.
3. Read API optional (`GET /api/Platform/SettlementModel` for Admin/Account) — only if lead wants it visible; otherwise internal options is enough for v1.
4. Add a comment in Razorpay order code: “consult/medicine settlement follows SettlementModel; do not add per-doctor merchants.”

**Done when:** Config exists; a new engineer cannot accidentally add a split merchant without changing config; Backend marked Done.

---

## MAIN TASK PRE-02 — Decide reception cash policy (clinic retains vs remits)

**Business meaning:** Reception can take cash/UPI/card. Who **keeps** that cash — the clinic or Homeocentrum? Also GST and commission numbers.

**Siblings:** PRE-02.01, PRE-02.02, PRE-02.03.

---

### PRE-02.01 — OQ: cash collected at reception retained by clinic or remitted to Homeocentrum?

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| Code status | **NOT STARTED** |

**What this sub-task is**

An **open question** that must be closed. Two answers:

- **Retain:** clinic keeps cash; platform only **records** the consult as paid-cash (ledger may show “collected at clinic”).
- **Remit:** clinic must send that cash to Homeocentrum (or it is deducted from future payouts).

**Why it exists**

Reception payment (later M06/M07) will post different ledger entries. Wrong guess = rewrite.

**Code today**

No cash-policy flag. Reception payment collection in the product sense is not this week’s feature.

**Plan (after approval)**

1. Ask client in the same finance workshop.
2. Document answer + edge cases (partial pay, refund of cash consult).
3. Store later in the same config as PRE-02.03. This ticket is the **decision**, not the reception screen.

**Done when:** Written answer exists; module sheet updated.

---

### PRE-02.02 — Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN)

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision (documentation) |
| Assigned role in sheet | Tech Lead / documentation |
| Code status | **NOT STARTED** |

**What this sub-task is**

A **GST policy note**, not GST invoice software. Must answer:

- Consult fee: taxable? which GSTIN (clinic vs Homeocentrum)?
- Platform/commission fee: on which base amount?
- Medicine: pharmacy GSTIN vs platform?

**Why it exists**

Invoice numbering (PRE-02.03) and Account invoices will copy this. Engineering must not invent GST %.

**Code today**

Velzon demo invoice pages only. No product GST rules.

**Plan (after approval)**

1. Markdown doc with tables: supply type → taxable amount → GSTIN → SAC/HSN if known.
2. Lead + finance review.
3. No invoice PDF builder in this ticket.

**Done when:** Doc path linked in Notes; lead thumbs-up.

---

### PRE-02.03 — Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Configuration |
| Layers | Backend = Yes / Not Started |
| Code status | **NOT STARTED** |

**What this sub-task is**

Record three numbers/strings the Account module will use later:

- Commission percent (consult vs medicine vs subscription — confirm granularity)
- Settlement hold **T+N** (payout delay after capture)
- Invoice number series (prefix, FY reset, separate series per GSTIN)

**“Configuration not code”** means: store as config. Do not bake `0.15` into C#.

**Plan (after approval)** — after PRE-02.01/02

1. Extend the same `PlatformConfig` / settlement config as PRE-01.03.
2. Fields: `CommissionPercent`, `SettlementHoldDays`, `InvoiceSeriesConsult`, `InvoiceSeriesMedicine`, `InvoiceSeriesPlatform` (names TBD with lead).
3. No invoice generator, no payout job.

**Done when:** Values readable from config; Backend Done.

---

## MAIN TASK PRE-03 — Vendor and legal gates (video, SMS, WhatsApp, push, DPDP copy)

**Business meaning:** Telemedicine (§10) and notifications need vendors and legal copy **before** coding SDKs.

**Siblings:** PRE-03.01 … PRE-03.05.

---

### PRE-03.01 — Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host)

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| Layers | Integration = Yes / Not Started |
| PDF | Telemedicine + notifications + consent |
| Code status | **NOT STARTED** |

**What this sub-task is**

Pick **one** video stack that works in **browser and mobile**. Options in the sheet: Agora, Twilio, Daily, or self-hosted WebRTC. Required before telemedicine module.

**Code today**

No video SDK. Icon/demo leftovers only.

**Plan (after approval)**

1. Compare: India connectivity, recording consent, cost, mobile SDKs, HIPAA-like handling.
2. Decision record: vendor, who pays, recording yes/no (ties to PRE-03.03 and ConsentType `TeleRecording`).
3. Do **not** npm-install Agora in this ticket.

**Done when:** Named vendor in the decision log; Integration marked Done meaning “vendor selected”, not “calls work”.

---

### PRE-03.02 — Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment / OTP / cancel

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| Layers | Integration = Yes / Not Started |
| Code status | **NOT STARTED** (OTP API exists with **SMS stub**) |

**What this sub-task is**

India SMS requires:

1. Provider (MSG91, Twilio, …)
2. **DLT** registered templates for appointment confirm, OTP, cancel (and later payout OTP)

**Why it exists**

`OtpController` already says “SMS stub — provider not configured”. SEC-07.02 must stay stub until this decision.

**Plan (after approval)**

1. Choose provider + DLT entity.
2. List template IDs needed in v1 (OTP, appointment, cancel).
3. Adapter interface can wait for communications module; this ticket is the **choice + template list**.

**Done when:** Provider + DLT template names/IDs documented. Do not wire live SMS until credentials exist (secrets never in git).

---

### PRE-03.03 — Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders)

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| PDF | Draft for §4 + §17 |
| Code status | **PARTIAL** (generic landing Privacy/Terms pages exist; not DPDP-bound) |

**What this sub-task is**

**Legal drafts**, not a coder inventing policy. Need copy for:

- Privacy: data protection, recording, pharmacy share
- Terms: payments, refunds, telemedicine, medicine orders

These later bind to `ConsentType` codes already seeded: Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver.

**Plan (after approval)**

1. Legal/product own the drafts.
2. Engineering stores versioned HTML/markdown and a `DocumentVersion` if lead wants; **minimum** is files the Patient website can show later.
3. Do not fake “I agree” without storing ConsentRecord (that wiring is later modules). This ticket is **copy exists**.

**Done when:** Drafts reviewed; path linked; ConsentType codes mapped to document sections.

---

### PRE-03.04 — OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| Code status | **NOT STARTED** |

**What this sub-task is**

When a patient picks a slot but does not pay: **hold the slot N minutes** or **release immediately**?

**Code today**

`PatientAppointmentService` treats slots as booked / past / available. No unpaid-hold TTL.

**Plan (after approval)**

1. Decide hold minutes (e.g. 10) or immediate release.
2. Write it into platform config (same store as PRE-01.03) as `UnpaidSlotHoldMinutes` (0 = release immediately).
3. Do **not** implement the hold job in this ticket unless lead expands scope — the sheet is the **OQ**. Recording the number is enough for Week 1; implementing hold is a later appointment task. **Recommend:** store the config key now so appointment phase does not re-ask.

**Done when:** Number (or “immediate”) is written and signed.

---

### PRE-03.05 — OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic?

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Client Decision |
| Code status | **PARTIAL** (register currently auto-activates; not a governed policy) |

**What this sub-task is**

Existing live doctors have no credentialing workflow. Choose:

- Auto-approve everyone already in `UserMaster`, or
- Unverified doctors visible only inside their clinic (not on Patient website directory)

**Code today**

`UserService.RegisterDoctor` sets `IsUserActivated = true` — immediate login. That is **not** this policy; it is a convenience. No credentialing status, no public-directory flag.

**Plan (after approval)**

1. Decision record for backfill + directory visibility.
2. If auto-approve: SQL note to set a future `CredentialStatus = Approved` when that column exists (column may be a later module — do not invent a full credentialing product here).
3. If clinic-only: document the visibility rule for Patient website (M10).

**Done when:** Written rule. Do not build the full credentialing admin in Week 1.

---

# MODULE M01 — Foundation and Security (Day 2–6, P0)

---

## MAIN TASK FND-01 — One connected ecosystem (shared keys)

**Business meaning:** A patient created at Reception, an appointment on Doctor web, a payment on Patient web, and a prescription must be the **same records** everywhere — shared IDs, not copies.

**Web siblings in S1:** FND-01.01 (design), FND-01.03 (dual-API).  
**Not in this plan:** FND-01.02 (Database roles), FND-01.04 (QA).

---

### FND-01.01 — Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | New |
| Layers | Backend + Database Yes / Not Started |
| Code status | **PARTIAL** |

**What this sub-task is**

A **design document**, not implementing all tables. Publish:

**Keys (stable IDs everyone uses):**

| Key | Exists in DB today? | Notes |
|---|---|---|
| DoctorId | Yes | JWT claim `DoctorID` |
| PatientId | Yes | Clinical patient |
| PatientAppId | Yes | Patient-app identity (used in appointments) |
| CaseId | Yes | Case entry |
| ErxId | **No** | Digital prescription identity for later eRx |
| LedgerTxnId | **No** | Account ledger |
| MedicineOrderId | **No** | HomeoMeds order |

**Events (minimum list from the sheet):** created / rescheduled / cancelled / paid / signed / accepted.

**Why it exists**

Without this, Patient APIs (M16), payments, and eRx will invent parallel IDs and the “one ecosystem” promise breaks.

**Plan (after approval)**

1. Markdown: `docs/FND-01_SHARED_KEYS_AND_EVENTS.md`.
2. For each key: table, who creates it, which API returns it, which clients must send it.
3. For each event: producer, payload (ids only), consumers (web/mobile/account).
4. Explicitly mark ErxId / LedgerTxnId / MedicineOrderId as **reserved — tables in later phases**, do not create unused tables unless lead wants stubs.
5. Backend/Database “Done” on this row means **the design is published and IDs that already exist are named consistently in DTOs**, not that all future tables exist.

**Done when:** Doc exists; lead agrees; no new module invents a second patient id.

---

### FND-01.03 — All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic only for login / Rx-write / Razorpay until ported

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | Existing Modification |
| Layers | Backend + API Yes / Not Started (tracker stale) |
| Code status | **DONE as a rule; PARTIAL as cut-over** |

**What this sub-task is**

The **placement law** for every later ticket:

- New HTTP → New-API only.
- No third host.
- Classic remains for Login, prescription **write**, Razorpay until a formal port.

**Code today**

- New-API `net8.0`, README NigaHomeopathy-API.
- Old-API `netcoreapp2.2`.
- Comment at top of `realbackend_helper.js` (FND-01.03).
- UI login → classic `/Account/Login`.
- Rx save → Old `PrescriptionController`; New has GET-only prescription details.
- Razorpay → Old `OrderController` only.

**Plan (after approval)**

1. Treat as **close-out**: add a short dual-API runbook if not already in docs (hosts, env vars `API_URL` vs `API_URL_NIGAHOMEOPATHY`).
2. PR checklist item: “new endpoint went to New-API; no silent host switch.”
3. Do not port Login/Rx/Razorpay in Week 1.

**Done when:** Runbook exists; random new controller is not added to Old-API; tracker Backend/API marked Done.

---

## MAIN TASK FND-02 — Delivery footprint (programme skeleton)

**Business meaning:** Product is 2 mobile apps + 5 web portals + payment + telemedicine + eRx + HomeoMeds. Week 1 only **skeleton**: empty Account/Pharmacy shells, ACL skeleton, documentation. Not the screens.

**Web siblings:** FND-02.01, FND-02.02, FND-02.04.  
**Excluded:** FND-02.03 (Mobile Frontend).

---

### FND-02.01 — Web: add Account layout + home redirect; Pharmacy layout stub; do not build screens yet

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Work type | New |
| Layers | Frontend Yes / Not Started |
| Code status | **PARTIAL** |

**What this sub-task is**

When an **Account** user logs in, they must **not** land on Admin or Doctor dashboard. They need:

1. An **Account layout** shell (header/nav empty, home redirect to e.g. `/account/home`).
2. A **Pharmacy layout stub** (e.g. `/pharmacy/home`) for PharmacyPartner — empty, not HomeoMeds screens.

**Do not** build ledger, payout, or pharmacy order screens.

**Code today**

- `getHomeDashboardPath`: Doctor/Reception → `/doctordashboard`; **everyone else including Account → `/dashboard` (Admin)**. That is wrong for Account.
- `roles.js` has ACCOUNT and PHARMACY_PARTNER constants.
- Landing marketing route `/account` is **not** the Account portal.
- `RoleBasedHomeRedirect.js` uses `getHomeDashboardPath`.

**Plan (after approval)**

1. Add routes `/account/home` and `/pharmacy/home` with placeholder pages (“Account portal — coming in later phase”).
2. Minimal layouts (reuse Velzon chrome, **no** Admin clinical menu).
3. Extend `getHomeDashboardPath`: Account → `/account/home`; PharmacyPartner → `/pharmacy/home`; Patient → existing patient site path if any, else a safe stub.
4. Guard: Doctor must not see Account layout.
5. Out of scope: money widgets, pharmacy SKU UI.

**Done when:** Login as Account (even a seeded user) lands on Account shell; PharmacyPartner on pharmacy stub; no clinical masters in that nav.

---

### FND-02.02 — Extend `roles.js` and `AuthProtected` with per-route ACL skeleton (deny-by-default for new routes)

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Improvement |
| Code status | **PARTIAL** |

**What this sub-task is**

Today `AuthProtected` only checks “is there a token?”. Any logged-in Doctor can open any authenticated URL if they know it.

Need a **deny-by-default** map for **new** routes (Account, Pharmacy, future Patient web):

- Route path → allowed roles
- Unknown new route → deny
- Existing Doctor/Admin/Reception routes can be allow-listed as today so we do not break the clinic

**Code today**

- `roles.js`: role constants + `canAccessAdminPortal` + `AdminProtected.js` for admin paths only.
- `AuthProtected.js`: token/profile only.

**Plan (after approval)**

1. Add `routeAcl.js` (or extend `roles.js`): `{ pathPrefix, roles[] }`.
2. Wrap new routes in a `RoleProtected` that reads the map; default deny for prefixes `/account`, `/pharmacy`.
3. Do not invent a full CASL system. Skeleton is enough.
4. Keep Velzon demo routes out of the **allow** map (ties to SEC-04.02).

**Done when:** Hitting `/account/home` as Doctor redirects/403; Account user can open it; new route without an ACL entry is denied.

---

### FND-02.04 — Document the five portals

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Work type | New |
| Code status | **NOT STARTED** (roles seeded; doc missing) |

**What this sub-task is**

Write down the **five web portals** the PDF counts:

1. Patient Website  
2. Doctor Web Portal  
3. Reception Portal  
4. Admin Portal  
5. Account Department  

**Pharmacy console is HomeoMeds, not a 6th portal** in the PDF count. Reception may share Doctor chrome today — document that as an implementation note, not a 6th product.

**Plan (after approval)**

1. Short doc: URL prefixes, roles, which API host, what is built vs stub vs future module.
2. Mention Reception currently shares doctor dashboard UI.

**Done when:** Doc exists; Pharmacy not listed as a 6th PDF portal.

---

## MAIN TASK SEC-01 — Secure login (protected credentials)

**Siblings in this plan:** SEC-01.02 (API), SEC-01.03 (Frontend).  
**Excluded:** SEC-01.01 Database hash migration, SEC-01.04 QA.

---

### SEC-01.02 — API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Modification |
| Tracker | Backend/API Not Started (**stale**) |
| Code status | **DONE** |

**What this sub-task is**

Login must:

1. Verify **hashed** password (not plaintext compare).
2. Put **Role** and **DoctorId** in the JWT.
3. UI must keep calling **classic** `/Account/Login` until a formal .NET 8 cut-over.

**Code today**

- New `AccountController.Login` uses `UserPasswordHasher.Verify`; `TokenService.CreateToken` adds Role + `DoctorID`.
- Old-API same pattern.
- UI `login` → `api.post(LOGIN)` → classic `/Account/Login`.
- New-API also has Login (for future cut-over / mobile) but UI is not switched.

**Plan (after approval)**

1. **Close-out / demo:** Admin, Doctor, Reception login; JWT decoded shows role + doctor id; UI network tab shows classic host.
2. Do not switch UI login host.
3. If any plaintext compare remains on a dead path, remove it (Old ForgetPassword already comments to use New-API).

**Done when:** Demo of hash verify + claims + classic URL; tracker updated to Done.

---

### SEC-01.03 — UI: remove `fakeBackend()` from `App.js` production path; login still Formik/Yup

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Modification |
| Code status | **NOT STARTED** (fake backend **still active**) |

**What this sub-task is**

Velzon’s `fakeBackend()` intercepts axios and can serve dummy login/users. It must **not** run in production (ideally not in our real-auth development either). Login page stays Formik + Yup validation.

**Code today**

`App.js` imports and **calls** `fakeBackend()`. File: `src/helpers/AuthType/fakeBackend.js`. Real login already uses `loginApi`, but the interceptor is still on.

**Plan (after approval)**

1. Remove the call from `App.js`, or gate with an env flag that is **off** by default.
2. Confirm login still validates with Formik/Yup.
3. Smoke: Admin/Doctor/Reception login against classic API; no dummy token.

**Done when:** Production bundle has no fake interceptor; real 401 on bad password.

---

## MAIN TASK SEC-02 — Secure password reset (time-limited links)

Stop plaintext email and the fake forget-password thunk.

**Web siblings:** SEC-02.02 API, SEC-02.03 Frontend.  
**Excluded:** SEC-02.01 DB table (already exists in SQL scripts), SEC-02.04 QA.

---

### SEC-02.02 — API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **DONE** (New-API) |

**What this sub-task is**

- Forgot: create `PasswordResetToken` (hashed token, expiry), email **link**, never email the password.
- Reset: consume token once, set new hash.
- ChangePassword: logged-in user, old+new password.

**Code today**

`AccountController`: `ForgotPassword`, `ResetPassword`, `ChangePassword`. Email link format `.../reset-password?token=`. Table `PasswordResetToken` in `M01_Foundation_Security_Server.sql`. UI helpers `forgotPasswordSecure` / `resetPasswordSecure` / `changePasswordSecure` already point at New-API — **unused by the thunk**.

**Plan (after approval)**

1. Close-out demo via Swagger/Postman: unknown email does not enumerate; token expires; reuse fails; ChangePassword requires auth.
2. Confirm no plaintext password email on Old `ForgetPassword` path (deprecated comment exists).

**Done when:** API demo recorded; tracker Done. Frontend wiring is SEC-02.03.

---

### SEC-02.03 — UI: replace `slices/auth/forgetpwd` fake/Firebase with real APIs; `/reset-password/:token` success/expiry states

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Layers | Frontend + API Yes / Not Started |
| Code status | **NOT STARTED** on UI (helpers exist unused) |

**What this sub-task is**

The forget-password **screen** must call New-API. Add a reset page that reads the token from the URL and shows success vs expired/used.

**Code today**

`src/slices/auth/forgetpwd/thunk.js` still uses Firebase / `postJwtForgetPwd` / `postFakeForgetPwd`. Routes: `/forgot-password` exists; **no** `/reset-password/:token` in `allRoutes.js`. API emails `reset-password?token=` (query) vs sheet’s `/reset-password/:token` (path) — **align one format** when implementing.

**Plan (after approval)**

1. Rewrite thunk to `forgotPasswordSecure`.
2. Add reset page: submit new password via `resetPasswordSecure`.
3. States: loading, success, expired/invalid token, network error.
4. Optional: authenticated Change Password settings later — sheet includes API ChangePassword; UI change-password can be a small authenticated form if already a Velzon page exists; do not build a new settings module.
5. Match token transport (path vs query) to the email link.

**Done when:** Real email flow (or intercepted link in dev) resets password; fake/Firebase path gone from this flow.

---

## MAIN TASK SEC-03 — Session control (proper sign-out)

**Web siblings:** SEC-03.01 API, SEC-03.02 Frontend, SEC-03.03 contract.

---

### SEC-03.01 — API: `POST /Account/Logout`; persist `UserLoginStatus`; optional denylist until token expiry

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **PARTIAL** |

**What this sub-task is**

Logout must:

1. Write logout time on `UserLoginStatus`.
2. Optionally **deny the JWT** until it would have expired (so stolen tokens die).

**Code today**

- New-API `POST /api/Account/Logout`: OutTime + **in-memory jti denylist**.
- Old-API Logout: UserLoginStatus only.
- **Gap:** `Program.cs` JWT bearer does **not** check the denylist in `OnTokenValidated`. Logout is recorded; token still works until expiry.

**Plan (after approval)**

1. Hook denylist in JWT validation on New-API.
2. Document: in-memory denylist is **per process** (multi-instance needs shared store later — note as known limit, do not build Redis unless lead asks).
3. Keep classic Logout working for current UI until SEC-03.02 switches.

**Done when:** After New-API logout, same JWT gets 401; UserLoginStatus has OutTime.

---

### SEC-03.02 — Web: `Logout.js` calls API then clears `authUser` + patient-board session (keep existing board clear)

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Code status | **PARTIAL** |

**What this sub-task is**

Clicking Logout must call the **logout API**, then clear `authUser` and the existing patient-board backup/session clear (already in `logoutWithBackupPrompt`).

**Code today**

`Logout.js` → `logoutWithBackupPrompt`. `logoutApi` posts to **classic** `/Account/Logout`. Board clear exists. New-API denylist is never hit from the SPA.

**Plan (after approval)**

1. Call New-API Logout (or both classic + New if login is still classic — **lead decision**: prefer New-API if tokens are issued by New, classic if UI still uses Old tokens). Because login is still classic, **v1 should logout on the same host that issued the JWT** (classic), and additionally call New if the user also holds a New token. Simplest correct Week-1 behaviour: logout the **issuer** of `authUser` token + keep board clear.
2. Do not drop the backup prompt.

**Done when:** Network shows Logout API; sessionStorage authUser gone; board session cleared; back-button cannot use old token for board APIs.

---

### SEC-03.03 — Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17)

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Work type | New (contract) |
| Code status | **NOT STARTED** as a published contract |

**What this sub-task is**

Not building mobile logout. **Publish the contract:** Patient and Doctor apps (M17/M18) must call the **same** `POST /Account/Logout` (New-API once cut over). No local “pretend logged out”.

**Plan (after approval)**

1. Short API contract in the shared-keys or auth doc: method, host, auth header, 401 after denylist.
2. No mobile code in this ticket.

**Done when:** Doc exists; mobile teams can implement against it in later weeks.

---

## MAIN TASK SEC-04 — Role-based access

**Web siblings:** SEC-04.01 API, SEC-04.02 Frontend, SEC-04.03 seed.

---

### SEC-04.01 — Backend: restore `GetMenuByRole`; add role attributes on new money and PII APIs

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **PARTIAL** |

**What this sub-task is**

1. `GetMenuByRole` must work on .NET 8 (menus for that user’s role).
2. New APIs that touch **money or PII** must have `[Authorize]` + role/policy — not anonymous.

**Code today**

- Restored: `GET /api/mastersAPI/GetMenuByRole` with IDOR harden (own user / admin).
- Old GetMenuByRole commented out; `MenuMaster/GetMenuByUserId` still on classic.
- AdminPortal policy on master mutates; OTP Audit allows Account+Admin.
- **Gap:** there are almost **no money APIs** yet. PII (patients, appointments) often `[Authorize]` without DoctorId ownership (SEC-05.01). Role attributes on “new money APIs” are a **pattern to apply as those APIs appear**.

**Plan (after approval)**

1. Confirm GetMenuByRole with an Admin and a Doctor user (different menus).
2. Add a coding standard snippet: money → Account (and Admin read-only or as PDF §8); PII → treating doctor / patient / admin audit.
3. Apply attributes on Consent AdminAudit, OTP Audit (already), SecureDocument (already), and any new Week-1 APIs.
4. Do not implement Account ledger here.

**Done when:** GetMenuByRole demo; checklist for money/PII attributes exists and Week-1 new endpoints comply.

---

### SEC-04.02 — Frontend: hide routes the role cannot view; keep Velzon demo routes out of production menus

| Field | Value |
|---|---|
| Bifurcation | Web Frontend |
| Code status | **NOT STARTED** / weak |

**What this sub-task is**

1. Sidebar/topbar must **not show** routes the role cannot use.
2. Velzon demos (Crypto, NFT, ecommerce, apps gallery, etc.) must **not** appear in production menus.

**Code today**

Admin routes guarded. Other auth routes open to any login. `LayoutMenuData.js` still contains large Velzon demo trees. `allRoutes.js` still registers demo pages.

**Plan (after approval)**

1. Production menu: Admin clinical + Doctor/Reception clinical only (existing), plus Account/Pharmacy stubs from FND-02.01.
2. Remove or `#ifdef` demo menu blocks; hide demo routes behind `REACT_APP_SHOW_DEMOS` default false.
3. Combine with FND-02.02 so hidden ≠ still open via URL.

**Done when:** Doctor login shows no Crypto/NFT; typing a demo URL does not work in production mode; Admin still sees admin masters.

---

### SEC-04.03 — Separation of duties seed: Account controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8)

| Field | Value |
|---|---|
| Bifurcation | Web Other |
| Layers | Backend + Database Yes / Not Started |
| Code status | **PARTIAL** |

**What this sub-task is**

**Seed data / policy**, not the full Account app.

- Account role: money (ledger, payouts, settlements) — **cannot** edit diagnosis/repertory.
- Admin: platform + clinical masters — **cannot** approve payouts / run ledger mutate.

**Code today**

Account role seeded in M01 SQL. OTP Audit allows Account+Admin. Menu seed for Account is **commented** (`M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`). No money APIs to lock yet. Admin can still do everything clinical.

**Plan (after approval)**

1. Written matrix: Role × (clinical mutate, money mutate, user admin).
2. Apply AdminPortal already blocking Account from master mutate (verify with an Account JWT).
3. When money endpoints appear, they must **forbid Admin mutate** if PDF §8 is strict — confirm with product; some products allow Admin read. Document the chosen matrix.
4. Coordinate seed rows with ADM-B04.02.

**Done when:** Matrix doc + Account user cannot hit diagnosis Save; Admin cannot hit a placeholder “payout approve” if you add a stub policy test — if no money endpoint exists, a failing unit/policy test or documented “enforced when M08 lands” is the honest Done. Prefer a tiny `AccountAcl/ping` that only Account can call, for demo.

---

## MAIN TASK SEC-05 — Patient data protection

Health records only for the **treating doctor** and the **patient**.

---

### SEC-05.01 — API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **PARTIAL** (helper only) |

**What this sub-task is**

If Doctor A’s JWT is used with Doctor B’s `PatientId` / `CaseId` / appointment id, API must **403**. Admin portal may bypass. Reception should only see their clinic’s doctors’ patients (confirm rule with lead — sheet says treating doctor).

**Code today**

`DoctorOwnership.EnsureDoctorOwns` / `ForbidIfNotOwner` exist. Essentially **not called** from Patient / Appointment / Case / Rx / Lab controllers. `PatientBoardBackupController` only references `GetDoctorId`. This is an **IDOR hole**.

**Plan (after approval)**

1. Inventory mutating + sensitive GETs on those controllers (New-API first; classic where UI still reads).
2. Add ownership check using JWT `DoctorID` vs resource’s DoctorId.
3. Tests: swap ids → 403; owner → 200; Admin → 200.
4. Do not “fix” by trusting client-sent DoctorId.

**Done when:** IDOR demo fails (blocked); board backup included.

---

### SEC-05.02 — Disable directory browsing on `/attachments` and `/Blogs`; signed-URL or authorised download for documents

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **NOT STARTED** (browsing **enabled**) |

**What this sub-task is**

Nobody should list files at `/attachments` or `/Blogs`. Downloads should be **authorised** (SecureDocument or signed URL).

**Code today**

`Program.cs` `UseStaticFiles` **and** `UseDirectoryBrowser` for both paths. SecureDocument authorised GET exists but public folders still listable.

**Plan (after approval)**

1. Remove both `UseDirectoryBrowser` blocks.
2. Decide: keep static files behind auth (harder with `UseStaticFiles`) vs migrate new uploads to SecureDocument only.
3. Minimum Week 1: browsing **off**; old URLs may still be guessable if static files remain public — document residual risk; prefer auth on new uploads (SEC-09.02).
4. Signed URLs optional if authorised GET is accepted as the sheet’s “or”.

**Done when:** Hitting `/attachments` does not list files; anonymous SecureDocument GET is 401.

---

## MAIN TASK SEC-06 — Consent records infrastructure

---

### SEC-06.02 — API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the response beyond type+time)

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **DONE** |

**What this sub-task is**

Generic consent API. Response must **not** leak case notes — only type, time, ids.

**Code today**

`ConsentController`: Grant, Withdraw, ListMine, AdminAudit. Types seeded including Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver.

**Plan (after approval)**

1. Close-out demo; confirm payload has no clinical fields.
2. AdminAudit restricted to Admin.

**Done when:** Four endpoints demonstrated; tracker Done.

---

### SEC-06.03 — Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **PARTIAL** |

**What this sub-task is**

There is already `AudioCaseConsentLog`. Telemedicine recording consent (Phase 11) must write **`ConsentRecord` with type TeleRecording`**, not a third table. This ticket is **do not fork** + document the mapping. Not migrating audio history unless lead wants.

**Code today**

AudioCaseConsentLog table still separate. Comment in code/SQL that Phase 11 uses ConsentRecord.

**Plan (after approval)**

1. Short note in consent doc: AudioCaseConsentLog = legacy audio-case; new tele = ConsentRecord TeleRecording; do not add `TeleConsent` table.
2. No Phase 11 video UI.

**Done when:** Note exists; no new consent table in Week 1 PRs.

---

## MAIN TASK SEC-07 — OTP verification infrastructure

Used later for payouts and pharmacy acceptance. Week 1 = generic engine + stub SMS.

---

### SEC-07.02 — API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS adapter stub until PRE-03 vendor is live

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Layers | Backend + API + Integration Not Started (tracker stale) |
| Code status | **DONE** (SMS stub) |

**What this sub-task is**

Generic OTP for any `Action` + `EntityType` + `EntityId`. Rate-limit, max attempts lockout. SMS not live until PRE-03.02.

**Code today**

`POST /api/Otp/RequestOtp`, `VerifyOtp`. Max 3/minute/entity, 5 attempts, 15 min lock, 10 min TTL. SMS stub; `devCode` only in Development.

**Plan (after approval)**

1. Close-out demo (devCode in Development).
2. Do not add MSG91 until PRE-03.02.
3. Integration Done = stub adapter exists, not live SMS.

**Done when:** Replay/expiry/lockout behave; tracker updated.

---

### SEC-07.03 — `GET /api/Otp/Audit` for Account and Admin (masked destination)

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **DONE** |

**What this sub-task is**

Account and Admin can list OTP audit. Destination **masked** (no full phone). Doctor/Reception forbidden.

**Code today**

`OtpController.Audit` checks Account or AdminPortal; returns masked fields.

**Plan (after approval)**

Close-out: Doctor 403; Admin 200; no raw phone.

---

## MAIN TASK SEC-08 — Complete audit trail

---

### SEC-08.02 — API middleware: write audit on mutating money / Rx / approval endpoints (start with a helper used by later phases)

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **PARTIAL** |

**What this sub-task is**

Not a full SIEM. A **helper** later phases call when money, prescription sign, or approval mutates. Sheet says “start with a helper”.

**Code today**

`AuditEvent` table + `IAuditEventWriter`. Used on Account password/migrate paths only. **No** global middleware. Rx save is still Old-API and not using this writer.

**Plan (after approval)**

1. Keep the writer; add a simple filter or convention sample (e.g. attribute `[AuditEvent("Rx.Sign")]`).
2. Wire **one** New-API mutating example (even ChangePassword already writes — document it as the sample) plus a stub method `WriteMoneyOrRx` for M07/M11.
3. Do not port Old Rx into New just to audit.

**Done when:** Helper documented; one endpoint proves a row in `AuditEvent`; later phases have a copy-paste pattern.

---

## MAIN TASK SEC-09 — Secure documents

---

### SEC-09.02 — API: upload (multipart) + authorised GET; no public folder listing

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Code status | **DONE** for API; listing still public via SEC-05.02 gap |

**What this sub-task is**

Upload files with owner type/id; GET only if owner/creator/Admin/Doctor rules pass. No public listing.

**Code today**

`POST /api/SecureDocument/Upload`, `GET /api/SecureDocument/{id}`. Stores under `Data/SecureDocuments`. Public `/attachments` listing is a **separate hole** (SEC-05.02).

**Plan (after approval)**

1. Close-out demo upload + authorised GET + anonymous 401.
2. Pair with SEC-05.02 browsing off so “no public folder listing” is true globally.

**Done when:** Both this API and directory browsing satisfy the sentence.

---

# MODULE M02 — Admin clinical masters (Day 3–7, P0)

**Programme rule:** **Keep and harden. Do not rebuild.**

Every M02 Web API row in S1 except `ADM-B04.02` is the same kind of ticket: **dual-API host confirmation**. ACL is the Security track (excluded) and is already Done.

Below, each sub-task still gets a full explanation (what the master is, where it lives, what “Done” means, what we will do after approval).

**Shared plan for all CONFIRM-ONLY rows:**

1. Open UI admin screen for that master (or helper function).
2. Confirm Network host matches the freeze table in Section D.1.
3. Confirm mutate as Doctor is blocked (already ACL).
4. **Do not** retarget the helper to the other API.
5. Mark S1 overall status Done if still blank.

**Shared “you must not”:** no new CRUD UI, no schema redesign, no silent New-API switch.

---

## MAIN TASK ADM-3D1 — Keep and harden Admin 3D mesh key master

**What the master is:** Keys that bind 3D body-part meshes (Patient Board 3D). Admin maintains; Doctor consumes read-only.

### ADM-3D1.03 — Dual-API: confirm UI hits correct host for 3D mesh key master; do not silently switch

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Tracker | Backend/API **Done** |
| Code status | **DONE / CONFIRM-ONLY** |

**Code today:** New-API `ThreeDBodyPartMeshKeyMasterController` (`/api/threeDBodyPartMeshKeyMaster/*`). UI `nigahomeoAPI`. No Old controller. Mutate `AdminPortal`.

**Plan after approval:** Confirm-only demo. No rebuild.

---

## MAIN TASK ADM-3D2 — Admin 3D section master

**What the master is:** Sections on the 3D body model.

### ADM-3D2.03 — Dual-API confirm for 3D section master

**Code today:** New-API `ThreeDBodyPartSectionMasterController`. UI New-API. **DONE.**

**Plan:** Confirm-only.

---

## MAIN TASK ADM-3D3 — Admin 3D hotspots

**What the master is:** Clickable hotspots on 3D sections.

### ADM-3D3.03 — Dual-API confirm for 3D hotspots

**Code today:** New-API `ThreeDBodyPartSectionHotspotController`. UI New-API. **DONE.**

**Plan:** Confirm-only.

---

## MAIN TASK ADM-A01 — Admin Drug system

**What the master is:** Homeopathic/allopathic **drug system** catalogue (admin). Doctor uses on board.

### ADM-A01.03 — Dual-API confirm for Drug system

**Code today:** **Old-API** `DrugSystemController`. UI `api`. No New admin controller. **DONE freeze on classic.**

**Plan:** Confirm UI still classic. Do not port.

---

## MAIN TASK ADM-A02 — Admin Drug group

**What the master is:** Groups under drug systems.

### ADM-A02.03 — Dual-API confirm for Drug group

**Code today:** Old `DrugGroupController`. UI classic. **DONE.**

---

## MAIN TASK ADM-A03 — Admin Allopathic drug & side effects

**What the master is:** Allopathic drugs plus serious/other/adverse side effects.

### ADM-A03.03 — Dual-API confirm (intentional split)

**Code today:** Admin CRUD **Old**. Board dropdown **New** `GetAllopathicDrugfordropdown`. New also has `AllopathicDrugController` / `SeriousSideEffectController` (parity). UI deletes use classic.

**This is the one 3D-like “split host” to explain carefully:** dropdown New, admin Old. **Do not unify “to be tidy”.**

**Plan:** Confirm both calls stay on their hosts.

---

## MAIN TASK ADM-B01 — Doctor qualifications

**What the master is:** Qualification list used in doctor registration/credentialing later.

### ADM-B01.03 — Confirm UI uses newer API (not classic) for qualifications

| Code status | **DONE** |

**Code today:** New `QualificationController`. UI `getQualificationList` → `nigahomeoAPI`. Old controller unused by admin UI path.

**Plan:** Confirm Network tab is New-API. Do not switch back to classic.

---

## MAIN TASK ADM-B02 — Lab & imaging test catalog

**What the master is:** Lab/imaging catalogue that eRx lab orders will pick from.

### ADM-B02.03 — Confirm classic PatientLab APIs still read this catalogue

| Code status | **DONE** |

**Code today:** Admin mutate Old `PatientLabTestController`. Board `PatientLab` / `DropdownList/GetPatientLabTestDDL` **classic**. New `PatientLabController.GetAllLabTests` exists as parity; **UI board stays classic**.

**Plan:** Confirm board still reads classic catalogue. Do not silently point board at New.

---

## MAIN TASK ADM-B03 — Subscription packages (S1 SaaS)

**What the master is:** Doctor **SaaS subscription packages** (plan the doctor buys from Homeocentrum). **Not** consult fees and **not** medicine SKUs.

### ADM-B03.03 — Note in code: `PackageEntryDetail` is S1 only — never reuse for S2 consult or S5 medicine

| Code status | **DONE** (comments present) |

**Code today:** Admin mutate **Old** `PackageController`. Doctor Widgets **New** `getPackages` → `/mastersAPI/GetPackages`. Comments on New/Old `PackageEntryDetail` + `PackageService`: S1 only.

**Why the note matters:** Later Account ledger and medicine orders must **new tables**, not overload package lines.

**Plan:** Confirm comments still present; do not reuse `PackageEntryDetail` in any Week 1 payment spike.

---

## MAIN TASK ADM-B04 — Roles & menu permissions

**What it is:** `RoleMaster` / `MenuMaster` / `RoleDetails` already in DB. Runtime leftover was GetMenuByRole missing on .NET 8.

**Excluded from this plan:** ADM-B04.01 Database seed-if-needed, ADM-B04.03 UI consume menu API, ADM-B04.04 QA.

### ADM-B04.02 — Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy

| Field | Value |
|---|---|
| Tracker | Backend/API Done, Database **In Progress** |
| Code status | **PARTIAL** |

**What this sub-task is (two parts)**

1. **Restore API** — `GET /api/mastersAPI/GetMenuByRole` on New-API. **Done.**
2. **Seed menus** for Account and later Pharmacy so those roles get dashboard items. **Not applied.** File: `New-API/NIGA_NewAPI/Database/Scripts/M02_W7_MenuMaster_Account_Pharmacy_Seed.sql` is a **commented template** with TODOs for ModuleId/RoleId.

**Plan (after approval)** — the only real M02 web build

1. Confirm RoleMaster has Account / PharmacyPartner (M01 SQL).
2. Fill ModuleIds / RoleIds for the environment.
3. Insert MenuMaster rows matching FND-02.01 routes (`/account/home`, `/pharmacy/home`).
4. Insert RoleDetails view permissions.
5. Do **not** switch SPA to consume this API (that is UI `ADM-B04.03`). Seeding still matters so the API returns something real when UI later consumes it.
6. GetMenuByRole already IDOR-hardened — do not take `userId` from client for another user unless Admin.

**Done when:** Calling GetMenuByRole for an Account user returns Account dashboard menu (even if SPA ignores it this week); SQL is no longer a TODO template.

---

## MAIN TASK ADM-D01 — Admin Diagnosis system

**What the master is:** Diagnosis system catalogue.

### ADM-D01.03 — Dual-API confirm

**Code today:** Old `DiagnosisSystemController`. UI classic. No New diagnosis controllers. **DONE.**

---

## MAIN TASK ADM-D02 — Admin Diagnosis therapeutics

### ADM-D02.03 — Dual-API confirm

**Code today:** Old `DiagnosisTherapeuticsDetailController`. UI classic. **DONE.**

---

## MAIN TASK ADM-D03 — Admin Diagnosis conditions

### ADM-D03.03 — Dual-API confirm

**Code today:** Old `DiagnosisController` Save/Delete `AdminPortal`; some board keyword reads more open. UI admin classic. **DONE freeze.** Do not “fix” board reads in this ticket unless lead expands SEC-05.

---

## MAIN TASK ADM-M01 — Admin Author master

**What the master is:** Materia medica authors.

### ADM-M01.03 — Dual-API confirm

**Code today:** Old `AuthorController`. UI classic. **DONE.**

---

## MAIN TASK ADM-M02 — Admin Materia medica master

### ADM-M02.03 — Dual-API confirm

**Code today:** Old `MateriaMedicaMasterController`. UI classic. **DONE.**

---

## MAIN TASK ADM-M03 — Admin Materia medica heads

### ADM-M03.03 — Dual-API confirm

**Code today:** Old `MateriaMedicaHeadController`. UI classic. **DONE.**

---

## MAIN TASK ADM-M04 — Admin Materia medica remedies

### ADM-M04.03 — Dual-API confirm

**Code today:** Admin path **Old**. New has GET-only `MateriaMedicaRemediesDetailsController` unused by admin helper. **DONE freeze.** Do not point admin CRUD at New GET-only.

---

## MAIN TASK ADM-Q01 — Admin Question section, group & sub-group

**What the master is:** Clinical question tree (section → group → sub-group) used on the case board.

### ADM-Q01.03 — Dual-API confirm

**Code today:** UI admin **Old**. New has locked parity `QuestionSection|Group|SubGroupController` with AdminPortal — **unused by admin UI**. **DONE freeze on Old.** Do not switch.

---

## MAIN TASK ADM-Q02 — Admin Clinical question mapping

**What the master is:** Maps questions to keywords/clinical use.

### ADM-Q02.03 — Dual-API confirm

**Code today:** Old `ClinicalQuestionsController` / `ClinicalQueKeywordController`. UI Old. **DONE.**

---

## MAIN TASK ADM-R01 — Admin Repertory sections

### ADM-R01.03 — Dual-API confirm

**Code today:** Admin **Old**. New `SectionController` parity unused by admin UI. **DONE freeze Old.**

---

## MAIN TASK ADM-R02 — Admin Subsection & rubric tree

### ADM-R02.03 — Dual-API confirm (split)

**Code today:** Tree CRUD **Old**. Excel/search-by-keyword pieces **New** `SubSectionController`. Documented split. **DONE.** Do not move tree CRUD to New.

---

## MAIN TASK ADM-R03 — Admin Rubric–remedy mapping

### ADM-R03.03 — Dual-API confirm (split)

**Code today:** **Save + Excel → New** `RubricRemedyController`. Many reads still Old. Both hosts mutate AdminPortal. **DONE.** Do not silently move reads.

---

## MAIN TASK ADM-R04 — Admin Remedy-linked rubrics

### ADM-R04.03 — Dual-API confirm

**Code today:** Mostly Old reads/flags; mapping writes via RubricRemedy New. **DONE freeze.**

---

## MAIN TASK ADM-R05 — Admin Language master

### ADM-R05.03 — Dual-API confirm

**Code today:** Old `LanguageMasterController`. New MastersAPI GET only. UI Old. **DONE.**

---

## MAIN TASK ADM-R06 — Admin Body part master

### ADM-R06.03 — Dual-API confirm

**Code today:** Old `BodyPartController`. UI Old. **DONE.**

---

## MAIN TASK ADM-R07 — Admin Intensity master

### ADM-R07.03 — Dual-API confirm

**Code today:** Old `IntensityController`. UI Old. **DONE.**

---

## MAIN TASK ADM-R08 — Admin Remedy master

### ADM-R08.03 — Dual-API confirm

**Code today:** Admin Old. New `RemedyController` parity unused by admin UI. **DONE freeze Old.**

---

## MAIN TASK ADM-R09 — Admin Remedy grade master

### ADM-R09.03 — Dual-API confirm

**Code today:** Admin Old. New `RemedyGradeController` parity. **DONE freeze Old.**

---

# MODULE M16 — Patient APIs (Day 5–7, P1)

These are **parallel must-finish** APIs for family/caregiver. UI consumption is Phase 16 (`CON-01.03` / `CON-02.03` Web UI — excluded). Database table rows (`CON-01.01`, `CON-02.01`) are excluded but **block** the APIs.

---

## MAIN TASK CON-01 — Family members under one account

**Business meaning:** One Patient login can attach family members (child, spouse) and book for them.

**Web in this plan:** CON-01.02 only.

---

### CON-01.02 — API: CRUD family; book-as-member

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend + Database + API Not Started |
| Code status | **NOT STARTED** |

**What this sub-task is**

New-API endpoints, for example (names TBD with lead):

- `GET /api/FamilyMember` — list mine  
- `POST /api/FamilyMember` — add (name, relation, DOB, sex, …)  
- `PUT /api/FamilyMember/{id}`  
- `DELETE` or deactivate  
- Book-as-member: booking payload accepts `familyMemberId`; appointment `PatientId`/`PatientAppId` must resolve to that member **owned by** the caller

**Why it exists**

Patient website/app (later) must not create a second login per child. Shared keys: family member still needs a PatientId (FND-01.01) so clinical records attach correctly.

**Code today**

No `FamilyMember` entity, table, or controller.

**Plan (after approval)** — depends on Database CON-01.01 (coordinate even though DB is not “our” bifurcation)

1. Design with FND-01.01: does a family member get a real `PatientId` now or a stub until first booking?
2. New-API controller + DTOs + JWT patient/user ownership (never trust client userId).
3. Book-as-member: if appointment APIs are still classic, add a New-API wrapper **or** extend classic carefully — **prefer New-API** per FND-01.03. If classic appointment write is the only write path, document an anti-corruption call; do not create a third API.
4. Validation: cannot attach someone else’s member; minors consent **documented** (QA CON-01.04 is out of scope but API should store relation/DOB for later rules).
5. No Patient website screens (Web UI excluded).

**Done when:** Postman CRUD + book-as-member creates an appointment visible with the same PatientId on Doctor web (may require appointment API cooperation — call out if blocked).

**You must not:** Build family UI; skip ownership checks.

---

## MAIN TASK CON-02 — Caregiver authorization

**Business meaning:** An adult family member may **book and manage** on behalf of another (elderly parent), with grant/revoke.

**Web in this plan:** CON-02.02 only. OTP-on-grant is Integration CON-02.04 (out of scope but API should have a hook).

---

### CON-02.02 — API: grant / revoke / list; booking authorisation check

| Field | Value |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Code status | **NOT STARTED** |

**What this sub-task is**

- Grant: patient (or account holder) authorises a caregiver (another PatientAppId/UserId) to book/manage.
- Revoke: immediate; further booking 403.
- List: mine as grantor and as caregiver.
- Booking check: appointment create must verify active `CaregiverAuth` when booking “as” another person.

**Code today**

Only ConsentType seed name `Caregiver`. No `CaregiverAuth` table/API.

**Plan (after approval)** — depends on CON-02.01 DB and preferably CON-01 family model

1. Table: GrantorPatientAppId, CaregiverPatientAppId, scope (book/manage), GrantedAt, RevokedAt, maybe ConsentRecordId.
2. New-API only.
3. Grant should **later** require OTP (CON-02.04 / SEC-07). Week 1 Web API can accept `otpChallengeId` optional or require VerifyOtp first if lead wants it in the same sprint — **default:** implement grant/revoke/list + booking check; add `RequiresVerifiedOtp` flag so Integration can plug in without rewrite.
4. Revoked token cannot book (the QA row will test this).

**Done when:** Grant → book OK; revoke → book 403; list works; no UI.

---

## G. Tracker hygiene (do this when implementing, not before approval)

S1_Week1 **Overall Status** cells are often blank even when M02 layers say Done. After approval and work:

1. Update yellow Status on the **module sheets** (`M00_PRE_Client_Gates`, `M01_Foundation_Security`, `M02_Admin_Clinical`, `M16_Patient_APIs`) — the workbook says product truth lives there.
2. S1 week sheet should follow.
3. Do not mark Done without the Definition of Done demo.

M01 Web rows that are **already built** should be moved to Done after a short demo, not re-implemented:

- FND-01.03 (rule)
- SEC-01.02, SEC-02.02, SEC-06.02, SEC-07.02, SEC-07.03, SEC-09.02 (API)
- Most M02 `.03` dual-API rows

---

## H. Out of scope reminder (so nothing looks “skipped by accident”)

Not in this web plan:

- All QA, Mobile UI/Frontend, API Mobile, Integration CON-02.04
- Web UI CON-01.03, CON-02.03
- UI ADM-B04.03 (SPA consumes GetMenuByRole)
- Security-track M02 `.02` ACL (already Done in code)
- Database-only table creates (we only depend on them)
- Rebuilding Admin masters
- Porting Login / Rx-write / Razorpay to New-API
- Live MSG91, Agora, Razorpay Route, ledger, telemedicine UI

---

## I. Approval checkpoint

This document is the **plan**. No code will be changed until you approve.

Please confirm:

1. Scope (64 web-only sub-tasks) is correct.
2. M02 27 dual-API rows = confirm-only, not rebuild.
3. M01 APIs that already exist = demo + tracker update, then only the listed gaps.
4. Implementation order in **Section E**.
5. First implementation slice after approval (recommended): **M01 frontend security gaps + SEC-05 ownership + SEC-05.02 browsing**, in parallel with **M00 decision workshops** (those need the client, not just engineering).

When you say which slice to implement first, implementation starts there only.

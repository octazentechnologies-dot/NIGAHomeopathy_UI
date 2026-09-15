# S1 Week 1 — Web tasks: full explanation and plan

_Reference only. **No implementation until you approve.**_

Source: `NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx` sheet **S1_Week1**.
Filter applied: **Web + UI tracks only**. Mobile and QA rows are excluded.

Sprint window: **Day 1–7** — Foundation, Admin closeout, mobile bootstrap.
This document is only the **clinic web / UI** slice of that week.

---

## How to read this document

1. A **Main Task** is a whole feature (example: Secure login).
2. A **Sub Task** is one ticket you (or a teammate) finish (example: remove `fakeBackend()`).
3. Layers on a row: Frontend / Backend / Database / API / Mobile / Integration. `Yes` means that layer is in scope for the ticket.
4. **Your implementation queue** (this UI repo) = rows where **Frontend = Yes** and status is not Done.
5. Web-track backend/API/decision rows are still explained so you know why the UI is blocked or already safe.
6. After you approve, we implement **one Frontend ticket at a time** in the order in the plan below.

---

## Scope that was included vs skipped

| Bucket | Count on S1_Week1 | In this doc? |
|---|---:|---|
| Web track | 96 | Yes |
| UI track | 9 | Yes |
| **Web + UI total** | **105** | **Yes — every row** |
| Mobile track | 25 | No |
| QA track | 48 | No |
| All S1_Week1 rows | 178 | Only Web+UI |

Streams inside this doc: **A-ClinicWeb** (98) and **B-PatientEco** (7 family/caregiver API+UI contracts).

---

## Status snapshot (Web + UI only)

- Subtasks in this doc: **105** across **44** main tasks
- Derived overall **Done**: **54** (almost all M02 Admin harden + dual-API)
- Derived overall **In Progress**: **2** (ADM-B04 menu seed)
- Derived overall **Not Started**: **42**
- Decision/documentation (no code layers): **7**
- Frontend = Yes: **37** → Done **27**, Not Started **10**

### Frontend tickets still open (this is the UI implementation list)

| ID | Module | Day | Sub task | Blocked by |
|---|---|---|---|---|
| `FND-01.02` | M01 | Day 2–6 | Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused) | Backend Not Started, DB Not Started |
| `FND-02.01` | M01 | Day 2–6 | Web: add Account layout + home redirect; Pharmacy layout stub; do not build screens yet | Can start in UI (confirm with lead) |
| `FND-02.02` | M01 | Day 2–6 | Extend roles.js and AuthProtected with per-route ACL skeleton (deny-by-default for new routes) | Can start in UI (confirm with lead) |
| `SEC-01.03` | M01 | Day 2–6 | UI: remove fakeBackend() from App.js production path; login still Formik/Yup | Can start in UI (confirm with lead) |
| `SEC-02.03` | M01 | Day 2–6 | UI: replace slices/auth/forgetpwd fake/Firebase with real APIs; /reset-password/:token success/expiry states | API Not Started |
| `SEC-03.02` | M01 | Day 2–6 | Web: Logout.js calls API then clears authUser + patient-board session (keep existing board clear) | API Not Started |
| `SEC-04.02` | M01 | Day 2–6 | Frontend: hide routes the role cannot view; keep Velzon demo routes out of production menus | Can start in UI (confirm with lead) |
| `ADM-B04.03` | M02 | Day 3–7 | Admin role pages remain; frontend consumes menu API instead of hard-coded LayoutMenuData for domain items | API Not Started |
| `CON-01.03` | M16 | Day 5–7 | Consumed in Phase 16 | API Not Started |
| `CON-02.03` | M16 | Day 5–7 | Consumed in Phase 16 | API Not Started |

---

## What is already done (and what that means in the UI)

### 1. M02 Admin clinical masters — keep and harden (Days 3–7)

For almost every Admin master the Week-1 work was **not a rebuild**. It was:

1. **ACL (`.02` tickets)** — only Admin Portal roles can mutate; Doctor uses the data read-only on Patient Board.
2. **Dual-API (`.03` tickets)** — freeze which HTTP host the existing screen already uses (Old-API vs New-API).

How ACL is implemented today:

- `src/Routes/index.js` wraps every `admin/*` and `/dashboard` path in `AdminProtected`.
- `canAccessAdminPortal()` allows Admin, Management, or RoleId `1`.
- Doctor/Reception are sent to `/doctordashboard`.
- Per-page mutate buttons are **not** individually wired to `canMutateAdminMasters` in Admin list pages; the **route guard** is the main lock. That matches “do not rebuild” — keep screens, block the portal.

Masters covered (each has `.02` ACL Done + `.03` dual-API Done):

3D mesh / 3D section / 3D hotspots; Drug system / Drug group / Allopathic; Qualifications; Lab catalog; Packages; Diagnosis system / therapeutics / conditions; Author / Materia medica / heads / remedies; Question taxonomy / clinical mapping; Repertory section / subsection-rubric tree / rubric–remedy / remedy-linked rubrics; Language / Body part / Intensity / Remedy / Remedy grade.

**Exception still open:** **ADM-B04** Roles & menus (In Progress + UI not started). See that main task below.

### 2. Partial M01 work already in the UI (tracker still says Not Started)

Do not redo these blindly — complete the gaps:

| Piece | In code today | Still missing |
|---|---|---|
| Role enums Patient / Account / PharmacyPartner | `roles.js` (FND-01.02 comment) | Login + home-path for those roles |
| Dual-API rule comment | `realbackend_helper.js` header | Discipline on every new call |
| Real login | `login()` → Old-API `/Account/Login` + Formik | `fakeBackend()` still activated in `App.js` |
| Logout API helper | `logoutApi()` | Not called; logout is local-only |
| Forgot/Reset/Change helpers | New-API Account endpoints in helper | Forget thunk still fake/Firebase; no token reset page |
| GetMenuByRole helper | New-API `mastersAPI/GetMenuByRole` | Layout still hard-coded |
| Admin portal guard | `AdminProtected` | Per-route ACL for Account/Pharmacy; Velzon demos still routed |

---

## Plan for remaining work (implementation order — wait for your approval)

Nothing below will be coded until you say so. Suggested order for **this UI repo**:

### Wave 0 — Do not code (client / docs)
M00 PRE-01, PRE-02, PRE-03 and FND-02.04. You only need to understand them. They block later money, SMS, video, and GST screens.

### Wave 1 — Foundation shells (can start in UI, Days 2–6)
1. **FND-01.02** — finish role home-paths (enums already present).
2. **FND-02.01** — Account layout + Pharmacy stub + redirects.
3. **FND-02.02** — per-route `allowedRoles` skeleton (deny-by-default for new routes).
4. **SEC-01.03** — remove `fakeBackend()` from production `App.js`.
5. **SEC-04.02** — hide Velzon demo menus; block demo routes for real roles.

### Wave 2 — Needs working Account APIs (coordinate with backend)
6. **SEC-03.02** — call `logoutApi()` from existing logout/backup flow.
7. **SEC-02.03** — real forgot/reset password UI (`/reset-password/:token`).

### Wave 3 — Needs MenuMaster seed (ADM-B04.01/02 In Progress)
8. **ADM-B04.03** — render domain nav from `getMenuByRole`.

### Wave 4 — Do not build in Week 1 UI (Phase 16)
9. **CON-01.03** and **CON-02.03** — family/caregiver UI is “consumed in Phase 16”. Keep as contract only unless you explicitly want stubs.

### Standing rule for every Wave
**FND-01.03** — new APIs on New-API only; do not silently switch Old-API hosts for existing Admin masters.

---

## Dual-API host cheat sheet (M02, already Done)

| Area | UI HTTP client to keep |
|---|---|
| Login, Rx-write, Razorpay, most classic masters | Old-API `api` |
| 3D mesh / section / hotspot | New-API `nigahomeoAPI` |
| Qualifications | New-API |
| Rubric–remedy save + Excel import/export | New-API |
| Packages, lab catalog admin, diagnosis, repertory CRUD, materia medica, questions | Old-API (as annotated) |
| GetMenuByRole, AdminAcl probes | New-API |
| Forgot/Reset/Change password helpers | New-API (backend may still be incomplete) |

---

## Main tasks and subtasks (complete, one by one)


# Module M00 — PRE Client gates

_PRE — Client gates_

## 1. `PRE-01` — Decide settlement model — Homeocentrum holds all money (food-delivery / quick-commerce pattern)

- **Module:** M00 — PRE — Client gates
- **Phase:** PRE — Client gates (must sign before Phase 6 money spine)
- **Day focus:** Day 1–2
- **Priority:** P0 Critical path
- **PDF feature:** Every transaction passes through Homeocentrum
- **Subtasks in Week 1 (web/UI):** 3 (No code layers (decision / documentation): 1, Not Started: 2)

### Why this main task exists

Before any money feature is coded, the business must decide that Homeocentrum (not the individual doctor) is the merchant of record — same pattern as food-delivery holding the payment, then settling to partners. If this is wrong, every Razorpay/ledger screen will be built twice.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `PRE-01.01` [Web] — Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription — **No code layers (decision / documentation)**
- `PRE-01.02` [Web] — Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts — **Not Started**
- `PRE-01.03` [Web] — Record decision in config (SettlementModel) — engineering must not hardcode a split model — **Not Started**

### Subtask `PRE-01.01`

**Statement to make true:** Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** A finance workshop, not a screen. Client/finance must confirm Homeocentrum is the single merchant of record for consult fees, medicine orders, and subscriptions (like Swiggy/Zomato holding payment centrally).
**Already done:** Nothing recorded. No SettlementModel in the web UI.
**Your web work:** None this week. You only need to know the decision later, so payment screens never assume doctor-direct Razorpay split.
**Plan:** Attend/read the decision note. Do not code payment split logic.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-01.02`

**Statement to make true:** Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = **Not Started**
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Choose v1 payout mechanic: Homeocentrum-held wallet + NEFT/IMPS vs Razorpay Route / linked accounts.
**Already done:** Not started. Integration layer is Yes / Not Started.
**Your web work:** None until the choice exists. Later Account portal will show payouts based on this.
**Plan:** Wait for client + backend. Do not hardcode Razorpay Route in UI.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-01.03`

**Statement to make true:** Record decision in config (SettlementModel) — engineering must not hardcode a split model

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Configuration
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Store the settlement decision in config (`SettlementModel`) so engineers never hardcode a split model.
**Already done:** Backend Not Started. No config screen in UI.
**Your web work:** Not this ticket (backend config). Later you may display the chosen model as read-only in Account settings.
**Plan:** After backend adds the config key, UI must read it — never invent a second model.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 2. `PRE-02` — Decide reception cash policy — clinic retains vs remits to Homeocentrum

- **Module:** M00 — PRE — Client gates
- **Phase:** PRE — Client gates (must sign before Phase 6 money spine)
- **Day focus:** Day 1–2
- **Priority:** P0 Critical path
- **PDF feature:** Reception payment collection
- **Subtasks in Week 1 (web/UI):** 3 (No code layers (decision / documentation): 2, Not Started: 1)

### Why this main task exists

Reception often collects cash. GST and who keeps cash change Account + Reception UI later. Wrong assumption = wrong invoices.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `PRE-02.01` [Web] — OQ: cash collected at reception retained by clinic or remitted to Homeocentrum? — **No code layers (decision / documentation)**
- `PRE-02.02` [Web] — Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN) — **No code layers (decision / documentation)**
- `PRE-02.03` [Web] — Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code — **Not Started**

### Subtask `PRE-02.01`

**Statement to make true:** OQ: cash collected at reception retained by clinic or remitted to Homeocentrum?

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Open question — cash collected at Reception: clinic keeps it, or remits to Homeocentrum?
**Already done:** Decision not recorded.
**Your web work:** None now. Reception cash screens (later modules) will change based on this.
**Plan:** Do not build cash-settlement UI until answered.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-02.02`

**Statement to make true:** Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Document GST: on consult fee, platform fee, medicine — which amount, which GSTIN.
**Already done:** Not started.
**Your web work:** None. Later invoice/print UI must show the agreed GST breakup.
**Plan:** Keep GST fields out of new screens until documented.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-02.03`

**Statement to make true:** Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Configuration
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Confirm commission %, settlement hold T+N days, invoice numbering — configuration, not feature code.
**Already done:** Backend Not Started.
**Your web work:** None this week. Later Account UI will show these as settings.
**Plan:** Wait for config values.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 3. `PRE-03` — Vendor and legal gates — video SDK, SMS, WhatsApp, push, DPDP copy

- **Module:** M00 — PRE — Client gates
- **Phase:** PRE — Client gates (must sign before Phase 6 money spine)
- **Day focus:** Day 1–2
- **Priority:** P0 Critical path
- **PDF feature:** Telemedicine + notifications + consent
- **Subtasks in Week 1 (web/UI):** 5 (Not Started: 2, No code layers (decision / documentation): 3)

### Why this main task exists

Telemedicine, OTP, WhatsApp, and legal consent copy all need vendor + legal sign-off. Coding a video SDK now would likely be thrown away.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `PRE-03.01` [Web] — Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host) — required for §10 — **Not Started**
- `PRE-03.02` [Web] — Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment/OTP/cancel — **Not Started**
- `PRE-03.03` [Web] — Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) drafted for §4 + §17 — **No code layers (decision / documentation)**
- `PRE-03.04` [Web] — OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay — **No code layers (decision / documentation)**
- `PRE-03.05` [Web] — OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic? — **No code layers (decision / documentation)**

### Subtask `PRE-03.01`

**Statement to make true:** Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host) — required for §10

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = **Not Started**
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Pick video vendor for in-browser + mobile telemedicine (Agora / Twilio / Daily / self-host WebRTC). Required before Phase 10.
**Already done:** Not started.
**Your web work:** Do not embed a video SDK yet.
**Plan:** Note only — blocks telemedicine UI later.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-03.02`

**Statement to make true:** Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment/OTP/cancel

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = **Not Started**
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Pick SMS provider (MSG91 / Twilio / etc.) and DLT templates for appointment / OTP / cancel.
**Already done:** Not started.
**Your web work:** None. OTP screens (SEC-07, CON-02) need this vendor later.
**Plan:** Do not build SMS-provider-specific UI.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-03.03`

**Statement to make true:** Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) drafted for §4 + §17

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Legal drafts: privacy, recording, pharmacy consent, payments, refunds, telemedicine, medicine orders (PDF §4 + §17).
**Already done:** Not started.
**Your web work:** Later Patient Website / consent checkboxes will use this copy. Not a S1 UI build.
**Plan:** Do not invent legal text in the app.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-03.04`

**Statement to make true:** OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Open question — unpaid booking: hold the slot for N minutes, or release immediately if patient does not pay?
**Already done:** Not started.
**Your web work:** Appointment booking UI (later) depends on this.
**Plan:** Do not implement hold timers yet.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `PRE-03.05`

**Statement to make true:** OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic?

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Client Decision
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M00_PRE_Client_Gates`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Open question — existing live doctors: auto-Approve for credentialing, or unverified doctors visible only to their own clinic?
**Already done:** Not started.
**Your web work:** Doctor directory / credentialing screens later.
**Plan:** Do not change doctor visibility filters yet.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---


# Module M01 — Foundation and security

_Foundation & Security_

## 4. `FND-01` — One connected ecosystem — shared keys so a patient, appointment, prescription and payment created anywhere are visible everywhere

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** One connected ecosystem serving six types of users
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

One patient / one appointment / one prescription must be the same record in Admin web, Doctor web, Reception, Patient website, and both mobile apps. Shared IDs and shared roles are the foundation.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `FND-01.01` [Web] — Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list (created/rescheduled/cancelled/paid/signed/accepted) — **Not Started**
- `FND-01.02` [Web] — Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused) — **Not Started**
- `FND-01.03` [Web] — All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic API only where login/Rx-write/Razorpay already live until ported — **Not Started**

### Subtask `FND-01.01`

**Statement to make true:** Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list (created/rescheduled/cancelled/paid/signed/accepted)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Publish the shared-ID design so a patient created in one app is the same patient everywhere: `DoctorId`, `PatientId`, `PatientAppId`, `CaseId`, `ErxId`, `LedgerTxnId`, `MedicineOrderId`, plus events (created / rescheduled / cancelled / paid / signed / accepted).
**Already done:** Backend/DB Not Started. UI already uses mixed names (`patientID`, `patientId`, `PatientId`) in helpers.
**Your web work:** When you add new API calls, keep using these shared IDs. Do not invent local-only IDs.
**Plan:** Read the design when backend publishes it; align new payloads.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `FND-01.02`

**Statement to make true:** Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/Components/constants/roles.js`, `src/slices/auth/login/thunk.js`, `src/helpers/dashboard_helper.js`

**What this is:** Add ecosystem roles **Patient**, **Account**, **PharmacyPartner** next to existing Admin / Doctor / Reception. Keep Management / Supervisor / Inspector unused.
**Tracker status:** Frontend / Backend / DB all Not Started.
**Already done in UI (partial — tracker not updated):**
- `src/Components/constants/roles.js` already defines `PATIENT`, `ACCOUNT`, `PHARMACY_PARTNER` with comment `M01 FND-01.02`.
- Login thunk (`src/slices/auth/login/thunk.js`) still only redirects Admin → `/dashboard`, Doctor/Reception → `/doctordashboard`. Account / Patient / Pharmacy have **no home path**.
- `getHomeDashboardPath()` in `dashboard_helper.js` falls back to `/dashboard` for everyone else (wrong for Account/Pharmacy).
**Plan (after approval):**
1. Keep the enum values (already there).
2. Add home-path mapping for Account → `/account` (or `/account/home`) and PharmacyPartner → `/pharmacy` stub.
3. Confirm RoleMaster seed exists on backend (not your job if DB is not ready — UI can still map strings).
4. Do not activate unused Management/Supervisor/Inspector in menus.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `FND-01.03`

**Statement to make true:** All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic API only where login/Rx-write/Razorpay already live until ported

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Modification
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API rule: all **new** domain work goes to New-API (`NIGA_NewAPI`, .NET 8). Do **not** create a third API. Classic Old-API stays only for Login, Rx-write, Razorpay until ported.
**Already done in UI (partial):** `realbackend_helper.js` header comment documents this exact rule. Two clients exist: `api` (classic) and `nigahomeoAPI` (New-API).
**Your web work:** When you add any new HTTP call this week, use `nigahomeoAPI` unless the ticket says classic. Never silently switch an existing call’s host.
**Plan:** Treat this as a standing rule for every S1 UI change.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 5. `FND-02` — Delivery footprint — 2 mobile apps · 5 web portals · payment · telemedicine · digital prescription · HomeoMeds (programme skeleton)

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Delivery covers
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 2, No code layers (decision / documentation): 1)

### Why this main task exists

The product is five web portals + two mobile apps. Week 1 only adds empty Account/Pharmacy shells and an ACL skeleton so later money/pharmacy screens have a home.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `FND-02.01` [UI] — Web: add Account layout + home redirect; Pharmacy layout stub; do not build screens yet — **Not Started**
- `FND-02.02` [UI] — Extend roles.js and AuthProtected with per-route ACL skeleton (deny-by-default for new routes) — **Not Started**
- `FND-02.04` [Web] — Document the five portals: Patient Website, Doctor Web Portal, Reception Portal, Admin Portal, Account Department (Pharmacy console is HomeoMeds, not a 6th portal in the PDF count) — **No code layers (decision / documentation)**

### Subtask `FND-02.01`

**Statement to make true:** Web: add Account layout + home redirect; Pharmacy layout stub; do not build screens yet

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** New: `src/pages/Account/Home.js`, `src/pages/Pharmacy/Home.js`; `src/Routes/allRoutes.js`; `dashboard_helper.js`; login thunk

**What this is:** Add **Account layout + home redirect** and a **Pharmacy layout stub**. Do **not** build Account/Pharmacy feature screens yet. This is only the shell so those roles have a place to land after login.
**Already done:** Not started.
- No Account layout under `src/Layouts` or `src/pages/Account`.
- Landing `AccountPage.js` is a public marketing page, **not** the Account Department portal.
- `getHomeDashboardPath` has no Account/Pharmacy branch.
**Plan (after approval):**
1. Create empty pages: `pages/Account/Home.js`, `pages/Pharmacy/Home.js` (“Coming soon” / stub).
2. Register routes `/account` and `/pharmacy` (auth-protected, role-gated).
3. Redirect Account role to `/account`, PharmacyPartner to `/pharmacy`.
4. Reuse existing layout chrome (topbar) with a minimal nav — no money screens.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `FND-02.02`

**Statement to make true:** Extend roles.js and AuthProtected with per-route ACL skeleton (deny-by-default for new routes)

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/Routes/AuthProtected.js`, `src/Routes/index.js`, `src/Routes/allRoutes.js`, `src/Components/constants/roles.js`

**What this is:** Extend `roles.js` + `AuthProtected` with a **per-route ACL skeleton**. New routes are **deny-by-default** unless the role is allowed.
**Already done (partial):**
- `AdminProtected.js` already blocks non-admin from Admin Portal routes (`isAdminRoutePath`: `dashboard`, `admin/*`).
- `AuthProtected.js` only checks “is logged in”, **not** role vs route.
- No `allowedRoles` field on most `allRoutes.js` entries.
**Plan (after approval):**
1. Add optional `allowedRoles` on route objects.
2. Wrap `AuthProtected` (or a new `RoleProtected`) so unknown roles cannot open Account/Pharmacy/Admin URLs.
3. Deny-by-default for **new** routes only; do not break Doctor/Reception patient board.
4. This is the skeleton — SEC-04.02 later hides menus and Velzon demos.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `FND-02.04`

**Statement to make true:** Document the five portals: Patient Website, Doctor Web Portal, Reception Portal, Admin Portal, Account Department (Pharmacy console is HomeoMeds, not a 6th portal in the PDF count)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** No code layers (decision / documentation)
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Document the five web portals (not a sixth Pharmacy portal in the PDF count):
1. Patient Website
2. Doctor Web Portal
3. Reception Portal
4. Admin Portal
5. Account Department
Pharmacy console = HomeoMeds (separate), not portal #6.
**Already done:** Not a code ticket. No dedicated doc in `docs/` besides this file.
**Your web work:** Keep this map in mind when adding routes. Reception currently shares Doctor dashboard (`/doctordashboard`) — that is existing, not a new portal this week.
**Plan:** Use this naming in PRs; do not create a 6th “Pharmacy Portal” route name that conflicts with the PDF.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 6. `SEC-01` — Secure login — protected credentials for every user type

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Secure login
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Login must use hashed passwords and real JWT claims. The Velzon fake backend must not intercept production traffic.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-01.01` [Web] — DB/Migration: hash existing UserMaster passwords (bcrypt/PBKDF2); never store new plaintext — **Not Started**
- `SEC-01.02` [Web] — API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over — **Not Started**
- `SEC-01.03` [UI] — UI: remove fakeBackend() from App.js production path; login still Formik/Yup — **Not Started**

### Subtask `SEC-01.01`

**Statement to make true:** DB/Migration: hash existing UserMaster passwords (bcrypt/PBKDF2); never store new plaintext

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Data Migration
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Database migration — hash existing `UserMaster` passwords (bcrypt/PBKDF2). Never store new plaintext.
**Already done:** Backend/DB Not Started.
**Your web work:** None. Login UI already posts username/password; hashing is server-side.
**Plan:** After migration, only retest login. Do not send extra hash fields from the browser.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-01.02`

**Statement to make true:** API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Modification
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Login API verifies hash; JWT must embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over.
**Already done:** UI already calls classic `POST /Account/Login` via `api` (Old-API) in `realbackend_helper.js` `login()`. Tracker says API Not Started (hash + claims work).
**Your web work:** Keep login on classic URL. After re-login, `AdminAcl/me` needs RoleId/RoleName claims (comment already in helper).
**Plan:** Do not move login to New-API this week.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-01.03`

**Statement to make true:** UI: remove fakeBackend() from App.js production path; login still Formik/Yup

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Modification
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/App.js`, `src/helpers/AuthType/fakeBackend.js`

**What this is:** Remove `fakeBackend()` from the production App path. Login page stays Formik + Yup.
**Already done:** **Not done.** `src/App.js` still does:
```
import fakeBackend from "./helpers/AuthType/fakeBackend";
fakeBackend();
```
Login page (`pages/Authentication/Login.js`) already uses real `loginUser` + Formik/Yup (good). Fake interceptor can still intercept some axios calls.
**Plan (after approval):**
1. Stop calling `fakeBackend()` in `App.js` (or gate it behind `REACT_APP_DEFAULTAUTH === "fake"` and never set that in prod).
2. Confirm login / forget-password / admin lists still hit real APIs.
3. Leave Formik/Yup validation as-is.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 7. `SEC-02` — Secure password reset — time-limited reset links (stop plaintext email + fake thunk)

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Secure password reset
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Today forget-password still goes through fake/Firebase helpers. Production must send a time-limited link, never email a plaintext password.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-02.01` [Web] — DB: PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt) — **Not Started**
- `SEC-02.02` [Web] — API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user — **Not Started**
- `SEC-02.03` [UI] — UI: replace slices/auth/forgetpwd fake/Firebase with real APIs; /reset-password/:token success/expiry states — **Not Started**

### Subtask `SEC-02.01`

**Statement to make true:** DB: PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** New table `PasswordResetToken` (UserId, TokenHash, ExpiresAt, UsedAt).
**Already done:** DB Not Started.
**Your web work:** None until API exists. UI will only send email + token.
**Plan:** Blocked on backend.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-02.02`

**Statement to make true:** API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Modification
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** APIs: ForgotPassword (send link), ResetPassword (consume token), stop emailing plaintext password, ChangePassword for logged-in user.
**Already done in UI helpers (API may not be live):**
- `forgotPasswordSecure` → New-API `POST /Account/ForgotPassword`
- `resetPasswordSecure` → `POST /Account/ResetPassword`
- `changePasswordSecure` → `POST /Account/ChangePassword`
Tracker still says API Not Started — helpers were added early; backend may be incomplete.
**Your web work:** SEC-02.03 wires the screens. Do not implement API here.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-02.03`

**Statement to make true:** UI: replace slices/auth/forgetpwd fake/Firebase with real APIs; /reset-password/:token success/expiry states

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/slices/auth/forgetpwd/thunk.js`, `src/pages/Authentication/ForgetPassword.js`, new reset page + `allRoutes.js`

**What this is:** Replace forget-password Redux thunk (fake/Firebase) with real APIs. Add `/reset-password/:token` with success and expiry states.
**Already done:**
- `ForgetPassword.js` still dispatches `userForgetPassword`.
- `slices/auth/forgetpwd/thunk.js` still uses Firebase / `postJwtForgetPwd` / `postFakeForgetPwd` — **not** `forgotPasswordSecure`.
- No `/reset-password/:token` route found in the auth pages (only Velzon inner “create password” demos).
**Depends on:** SEC-02.02 API actually working.
**Plan (after approval, after API ready):**
1. Point forgetpwd thunk at `forgotPasswordSecure`.
2. Add public route `reset-password/:token` with Formik new-password + confirm.
3. Call `resetPasswordSecure`; show success, invalid/expired token, and “request a new link”.
4. Keep existing Forget Password page layout.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 8. `SEC-03` — Session control — proper sign-out across web and mobile

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Session control
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Logout must tell the server so the JWT can be denylisted. Today logout only clears the browser (plus patient-board backup prompt).

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-03.01` [Web] — API: POST /Account/Logout; persist UserLoginStatus; optional denylist until token expiry — **Not Started**
- `SEC-03.02` [UI] — Web: Logout.js calls API then clears authUser + patient-board session (keep existing board clear) — **Not Started**
- `SEC-03.03` [Web] — Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17) — **Not Started**

### Subtask `SEC-03.01`

**Statement to make true:** API: POST /Account/Logout; persist UserLoginStatus; optional denylist until token expiry

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Backend `POST /Account/Logout`; persist UserLoginStatus; optional JWT denylist until expiry.
**Already done in UI helper:** `logoutApi = () => api.post("/Account/Logout")` (classic). Comment says New-API also has logout with denylist. Tracker: API Not Started.
**Your web work:** SEC-03.02 must call this. Do not build denylist UI.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-03.02`

**Statement to make true:** Web: Logout.js calls API then clears authUser + patient-board session (keep existing board clear)

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/pages/Authentication/Logout.js`, `src/slices/doctor/patientBoardBackup/thunk.js` (`logoutWithBackupPrompt`), `src/helpers/realbackend_helper.js` (`logoutApi`)

**What this is:** `Logout.js` must call the Logout API, then clear `authUser` and patient-board session (keep existing board-backup prompt).
**Already done (partial):**
- `Logout.js` calls `logoutWithBackupPrompt()`.
- That thunk prompts to save patient-board backup, then **locally** clears session. It does **not** call `logoutApi()`.
- `logoutUser()` in login thunk also only clears storage + optional Firebase.
**Plan (after approval):**
1. After backup prompt, `await logoutApi()` (ignore 401 if token already dead).
2. Then existing clear: patient-board session, `authUser`, layout classes.
3. Redirect to `/login`.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-03.03`

**Statement to make true:** Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = **Not Started**; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Contract note — mobile apps must use the same Logout endpoint (Phases 16–17).
**Already done:** Not a web UI ticket.
**Your web work:** None. Just keep the web logout URL stable so mobile can share it.
**Plan:** Document the URL when SEC-03.01 is live.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 9. `SEC-04` — Role-based access — each role sees only what it is permitted to see

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Role-based access
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Each role sees only its portal. Velzon demo pages must not appear in production menus. Account vs Admin duties must not overlap.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-04.01` [Web] — Backend: restore GetMenuByRole; add role attributes on new money and PII APIs — **Not Started**
- `SEC-04.02` [UI] — Frontend: hide routes the role cannot view; keep Velzon demo routes out of production menus — **Not Started**
- `SEC-04.03` [Web] — Separation of duties seed: Account role controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8) — **Not Started**

### Subtask `SEC-04.01`

**Statement to make true:** Backend: restore GetMenuByRole; add role attributes on new money and PII APIs

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Backend restore `GetMenuByRole`; add role attributes on new money and PII APIs.
**Already done (partial overlap with ADM-B04.02):** UI has `getMenuByRole()` → New-API `/mastersAPI/GetMenuByRole`. Tracker still Not Started on SEC-04.01.
**Your web work:** ADM-B04.03 consumes the menu. Money/PII role attributes are backend.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-04.02`

**Statement to make true:** Frontend: hide routes the role cannot view; keep Velzon demo routes out of production menus

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/Layouts/LayoutMenuData.js`, `src/Routes/allRoutes.js`, `src/Routes/index.js`

**What this is:** Hide routes the current role cannot view. Keep Velzon demo routes **out of production menus**.
**Already done (partial):**
- Admin routes are wrapped in `AdminProtected`.
- `LayoutMenuData.js` still contains Velzon demo trees (Apps, Base UI, Charts, Crypto, NFT, Jobs, etc.).
- `allRoutes.js` still registers hundreds of demo paths (`/dashboard-crypto`, `/apps-ecommerce-*`, …). Logged-in Doctor can still type those URLs (AuthProtected only checks login).
**Plan (after approval):**
1. Filter sidebar/topbar to domain menus only (Admin masters, Doctor board, etc.).
2. Either drop demo routes from production build or block them unless Admin+debug flag.
3. Combine with FND-02.02 `allowedRoles` so Account cannot open `/admin/*` or `/doctor/patientboard`.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-04.03`

**Statement to make true:** Separation of duties seed: Account role controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Web Other
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Seed separation of duties: Account role = money; Admin role = platform + clinical data; neither can do the other’s job (PDF §8).
**Already done:** Backend/DB Not Started.
**Your web work:** After seed exists, FND-02.02 / SEC-04.02 must enforce it in routes. Do not give Admin money-menu items or Account clinical-master items.
**Plan:** Coordinate with backend seed; then hide menus.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 10. `SEC-05` — Patient data protection — health records restricted to the treating doctor and the patient

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Patient data protection
- **Subtasks in Week 1 (web/UI):** 2 (Not Started: 2)

### Why this main task exists

A doctor must only see their own patients’ health data. Static folders must not list attachments.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-05.01` [Web] — API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup — **Not Started**
- `SEC-05.02` [Web] — Disable directory browsing on /attachments and /Blogs; signed-URL or authorised download for documents — **Not Started**

### Subtask `SEC-05.01`

**Statement to make true:** API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** API must enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup (doctor A cannot load doctor B’s patient).
**Already done:** Backend Not Started. UI already sends patient/case ids from the board.
**Your web work:** None except: never trust a client-picked `DoctorId` to bypass; send the logged-in identity only.
**Plan:** After API returns 403, show a clear “not your patient” toast — small follow-up, not this subtask’s core.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-05.02`

**Statement to make true:** Disable directory browsing on /attachments and /Blogs; signed-URL or authorised download for documents

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Modification
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Disable IIS/static directory browsing on `/attachments` and `/Blogs`; downloads via signed URL or authorised GET.
**Already done:** Backend Not Started.
**Your web work:** When you link files, do not point at open folder URLs. Use API download helpers once they exist.
**Plan:** Audit any `<a href="/attachments/...">` later; not a Week-1 screen.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 11. `SEC-06` — Consent records infrastructure — every consent captured, stored and reviewable

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Consent records
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Consent is a first-class record (privacy, booking, recording, pharmacy share, marketing, caregiver), reused later by telemedicine.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-06.01` [Web] — DB: ConsentRecord + ConsentType master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver) — **Not Started**
- `SEC-06.02` [Web] — API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the API response beyond type+time) — **Not Started**
- `SEC-06.03` [Web] — Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine (Phase 11 will write TeleRecording into ConsentRecord) — **Not Started**

### Subtask `SEC-06.01`

**Statement to make true:** DB: ConsentRecord + ConsentType master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** New DB `ConsentRecord` + `ConsentType` master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver).
**Already done:** Not started.
**Your web work:** None this week. Later Patient Website / telemedicine will collect these types.
**Plan:** Do not create a one-off consent table in UI state.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-06.02`

**Statement to make true:** API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the API response beyond type+time)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Consent APIs: Grant / Withdraw / List-mine / Admin-audit. Response must not leak clinical content — only type + time.
**Already done:** Not started.
**Your web work:** No consent admin screen in S1 Week 1 tracker for UI. Patient UI comes later.
**Plan:** Wait for API.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-06.03`

**Statement to make true:** Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine (Phase 11 will write TeleRecording into ConsentRecord)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Reuse existing `AudioCaseConsentLog` pattern. Do not fork a second consent model for telemedicine (Phase 11 writes TeleRecording into ConsentRecord).
**Already done:** Audio case-taking APIs already exist in `realbackend_helper.js`. Consent unification is backend.
**Your web work:** Do not add a parallel “tele-consent” localStorage flag.
**Plan:** Keep using the shared consent API when Phase 11 starts.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 12. `SEC-07` — OTP verification infrastructure — applied to sensitive actions including payouts and pharmacy acceptance

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** OTP verification
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Generic OTP engine for sensitive actions (payouts, caregiver grant). SMS vendor comes from PRE-03.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-07.01` [Web] — DB: OtpChallenge, OtpAuditLog (Action, EntityType, EntityId, ToMasked, Success, At) — **Not Started**
- `SEC-07.02` [Web] — API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS provider adapter stub until PRE-03 vendor is live — **Not Started**
- `SEC-07.03` [Web] — GET /api/Otp/Audit for Account and Admin (masked destination) — **Not Started**

### Subtask `SEC-07.01`

**Statement to make true:** DB: OtpChallenge, OtpAuditLog (Action, EntityType, EntityId, ToMasked, Success, At)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** DB `OtpChallenge` + `OtpAuditLog` (Action, EntityType, EntityId, ToMasked, Success, At).
**Already done:** Not started.
**Your web work:** None. OTP UI comes when SEC-07.02 is live (payouts, caregiver grant).
**Plan:** Blocked on DB.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-07.02`

**Statement to make true:** API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS provider adapter stub until PRE-03 vendor is live

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = **Not Started**
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** APIs RequestOtp / VerifyOtp (generic), rate-limit, lockout, SMS adapter stub until PRE-03 vendor is chosen.
**Already done:** Not started. Depends on PRE-03.02 for real SMS.
**Your web work:** A reusable OTP modal could be planned later (Account payouts, CON-02 grant). Not a standalone S1 UI ticket.
**Plan:** After API, one shared OTP component — do not copy-paste per screen.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-07.03`

**Statement to make true:** GET /api/Otp/Audit for Account and Admin (masked destination)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** `GET /api/Otp/Audit` for Account and Admin (masked destination).
**Already done:** Not started.
**Your web work:** Optional later Admin/Account audit table. Not Week-1 frontend in the tracker.
**Plan:** Skip UI until API exists.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 13. `SEC-08` — Complete audit trail — who did what and when across payments, prescriptions and approvals

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Complete audit trail
- **Subtasks in Week 1 (web/UI):** 2 (Not Started: 2)

### Why this main task exists

Who did what, when, on money and prescriptions — server-side audit, not a UI log.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-08.01` [Web] — DB: AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId) — **Not Started**
- `SEC-08.02` [Web] — API middleware: write audit on mutating money/Rx/approval endpoints (start with a helper used by later phases) — **Not Started**

### Subtask `SEC-08.01`

**Statement to make true:** DB: AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** DB `AuditEvent` (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId).
**Already done:** Not started.
**Your web work:** None.
**Plan:** Later Admin audit viewer is out of S1 Week 1 UI list.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-08.02`

**Statement to make true:** API middleware: write audit on mutating money/Rx/approval endpoints (start with a helper used by later phases)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** API middleware writes audit on mutating money / Rx / approval endpoints. Start with a helper used by later phases.
**Already done:** Not started.
**Your web work:** None. Do not build a fake client-side audit log.
**Plan:** Backend only.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 14. `SEC-09` — Secure documents — prescriptions, reports and uploads protected from unauthorised access

- **Module:** M01 — Foundation & Security
- **Phase:** Phase 0 — Foundation: one ecosystem, identity, security (PDF §1 + §17)
- **Day focus:** Day 2–6
- **Priority:** P0 Critical path
- **PDF feature:** Secure documents
- **Subtasks in Week 1 (web/UI):** 2 (Not Started: 2)

### Why this main task exists

Prescriptions/reports/uploads stored as authorised blobs, not public folders.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `SEC-09.01` [Web] — DB: SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy) — **Not Started**
- `SEC-09.02` [Web] — API: upload (multipart) + authorised GET; no public folder listing — **Not Started**

### Subtask `SEC-09.01`

**Statement to make true:** DB: SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy)

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** DB `SecureDocument` (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy).
**Already done:** Not started.
**Your web work:** None this week.
**Plan:** Future upload widgets must use this API, not public `/Blogs` folders.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `SEC-09.02`

**Statement to make true:** API: upload (multipart) + authorised GET; no public folder listing

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M01_Foundation_Security`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Upload (multipart) + authorised GET; no public folder listing.
**Already done:** Not started.
**Your web work:** None until API. Existing blog/news uploads may still use old paths — do not expand that pattern.
**Plan:** New uploads wait for this API.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---


# Module M02 — Admin clinical / business masters

_Admin clinical masters_

## 15. `ADM-3D1` — Keep and harden Admin 3D mesh key master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** 3D mesh key master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

3D mesh key master already exists. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-3D1.02` [Web] — ACL: only Admin (and permitted roles) can mutate 3D mesh key master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-3D1.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D mesh key master; do not silently switch — **Done**

### Subtask `ADM-3D1.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate 3D mesh key master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **3D mesh key master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-3D1.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D mesh key master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **3D mesh key master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** 3D Mesh Key → **New-API** (`nigahomeoAPI`). Confirmed in `realbackend_helper.js` W6 comment.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 16. `ADM-3D2` — Keep and harden Admin 3D section master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** 3D section master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

3D anatomy section master already exists. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-3D2.02` [Web] — ACL: only Admin (and permitted roles) can mutate 3D section master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-3D2.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D section master; do not silently switch — **Done**

### Subtask `ADM-3D2.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate 3D section master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **3D section master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-3D2.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D section master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **3D section master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** 3D Section Master → **New-API**. Same W6 block as mesh/hotspots.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 17. `ADM-3D3` — Keep and harden Admin 3D hotspots (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** 3D hotspots
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

3D hotspots already exist. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-3D3.02` [Web] — ACL: only Admin (and permitted roles) can mutate 3D hotspots; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-3D3.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D hotspots; do not silently switch — **Done**

### Subtask `ADM-3D3.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate 3D hotspots; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **3D hotspots** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-3D3.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D hotspots; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **3D hotspots**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** 3D Hotspots → **New-API**. Same W6 block.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 18. `ADM-A01` — Keep and harden Admin Drug system (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Drug system
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Drug system master already exists. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-A01.02` [Web] — ACL: only Admin (and permitted roles) can mutate Drug system; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-A01.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug system; do not silently switch — **Done**

### Subtask `ADM-A01.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Drug system; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Drug system** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-A01.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug system; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Drug system**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Drug system admin CRUD → **Old-API** (`api`). Board dropdown may use New-API (`getAllopathicDrugForDropdown`). W4 comment.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 19. `ADM-A02` — Keep and harden Admin Drug group (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Drug group
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Drug group master already exists. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-A02.02` [Web] — ACL: only Admin (and permitted roles) can mutate Drug group; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-A02.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug group; do not silently switch — **Done**

### Subtask `ADM-A02.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Drug group; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Drug group** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-A02.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug group; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Drug group**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Drug group admin → **Old-API**. W4.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 20. `ADM-A03` — Keep and harden Admin Allopathic drug & side effects (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Allopathic drug & side effects
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Allopathic drug + side effects already exists. Keep it; lock mutate to Admin.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-A03.02` [Web] — ACL: only Admin (and permitted roles) can mutate Allopathic drug & side effects; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-A03.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Allopathic drug & side effects; do not silently switch — **Done**

### Subtask `ADM-A03.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Allopathic drug & side effects; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Allopathic drug & side effects** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-A03.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Allopathic drug & side effects; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Allopathic drug & side effects**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Allopathic drug & side effects admin → **Old-API**. Patient Board dropdown → New-API. W4.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 21. `ADM-B01` — Business Management — Doctor qualifications (existing, used later by credentialing)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Doctor qualifications
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Doctor qualifications catalog — used later by credentialing. Keep; ACL on mutate.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-B01.02` [Web] — ACL on qualification APIs — **Done**
- `ADM-B01.03` [Web] — Confirm UI uses newer API (not classic) for qualifications — **Done**

### Subtask `ADM-B01.02`

**Statement to make true:** ACL on qualification APIs

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Doctor qualifications** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-B01.03`

**Statement to make true:** Confirm UI uses newer API (not classic) for qualifications

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Confirm UI uses newer API (not classic) for qualifications
**Already done:** Tracker overall = Done.
**Plan:** Follow the tracker statement; do not start neighbour subtasks.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 22. `ADM-B02` — Business Management — Lab & imaging test catalog (existing, used by eRx lab orders)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Lab & imaging test catalog
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Lab & imaging catalog — used by eRx lab orders. Keep; ACL on mutate.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-B02.02` [Web] — ACL on catalog mutate — **Done**
- `ADM-B02.03` [Web] — Confirm classic PatientLab APIs still read this catalogue — **Done**

### Subtask `ADM-B02.02`

**Statement to make true:** ACL on catalog mutate

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Lab & imaging test catalog** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-B02.03`

**Statement to make true:** Confirm classic PatientLab APIs still read this catalogue

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Confirm classic PatientLab APIs still read this catalogue
**Already done:** Tracker overall = Done.
**Plan:** Follow the tracker statement; do not start neighbour subtasks.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 23. `ADM-B03` — Business Management — Subscription packages (existing S1 SaaS; later tied to Account ledger)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Subscription packages
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Subscription packages are S1 SaaS billing, not consult fees or medicine orders. Keep; ACL; do not reuse PackageEntryDetail for S2/S5.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-B03.02` [Web] — ACL on package mutate — **Done**
- `ADM-B03.03` [Web] — Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine — **Done**

### Subtask `ADM-B03.02`

**Statement to make true:** ACL on package mutate

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Subscription packages** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-B03.03`

**Statement to make true:** Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine
**Already done:** Tracker overall = Done.
**Plan:** Follow the tracker statement; do not start neighbour subtasks.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 24. `ADM-B04` — Business Management — Roles & menu permissions (existing DB, runtime ACL leftover)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Roles & menu permissions
- **Subtasks in Week 1 (web/UI):** 3 (In Progress: 2, Not Started: 1)

### Why this main task exists

Roles & menus exist in DB. Runtime ACL leftover: UI still hard-codes LayoutMenuData. Finish seed + GetMenuByRole + UI consume.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-B04.01` [Web] — No schema change unless Account/Pharmacy/Patient roles need new MenuMaster rows — seed those menus — **In Progress**
- `ADM-B04.02` [Web] — Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy — **In Progress**
- `ADM-B04.03` [UI] — Admin role pages remain; frontend consumes menu API instead of hard-coded LayoutMenuData for domain items — **Not Started**

### Subtask `ADM-B04.01`

**Statement to make true:** No schema change unless Account/Pharmacy/Patient roles need new MenuMaster rows — seed those menus

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = **In Progress**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** In Progress
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** MenuMaster — no schema change unless Account / Pharmacy / Patient roles need new menu rows. Seed those menus.
**Tracker:** Backend Done, Database **In Progress**.
**Already done:** Role/Menu admin pages exist (`admin/listrole`). Seeding Account/Pharmacy menus is DB work.
**Your web work:** Blocked until seed exists; then ADM-B04.03 reads it.
**Plan:** Confirm with backend which MenuMaster rows will appear for Account.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-B04.02`

**Statement to make true:** Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = **In Progress**; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** In Progress
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Restore `GetMenuByRole` on .NET 8; seed menus for Account and (later) Pharmacy.
**Tracker:** Backend Done, API Done, Database **In Progress**.
**Already done in UI:** `getMenuByRole(userId)` in `realbackend_helper.js` → `/mastersAPI/GetMenuByRole`. **Not called** from Layout yet.
**Plan:** Backend finishes seed; you implement ADM-B04.03.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-B04.03`

**Statement to make true:** Admin role pages remain; frontend consumes menu API instead of hard-coded LayoutMenuData for domain items

- **Track:** UI  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.
- **UI files:** `src/Layouts/LayoutMenuData.js`, `src/Layouts/LayoutMenuContext.js`, `getMenuByRole` in `realbackend_helper.js`

**What this is:** Admin role pages stay. Frontend must consume **menu API** instead of hard-coded `LayoutMenuData` for **domain** items.
**Tracker:** Frontend Not Started, API Not Started (row says API Yes / Not Started — slightly inconsistent with B04.02 API Done).
**Already done:**
- `LayoutMenuData.js` is a large hard-coded Velzon + Admin tree.
- `getMenuByRole` helper exists but unused.
- Role CRUD pages remain (`ListRole` / `AddRole` / `EditRole`).
**Plan (after approval, after B04.01/02 seed):**
1. On login / layout mount, call `getMenuByRole`.
2. Render Admin/Doctor domain nav from API.
3. Keep Role Master screens working.
4. Fallback: if API fails, show a safe minimal menu (not the full Velzon demo).
5. Do not delete Role pages.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 25. `ADM-D01` — Keep and harden Admin Diagnosis system (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Diagnosis system
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Diagnosis system master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-D01.02` [Web] — ACL: only Admin (and permitted roles) can mutate Diagnosis system; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-D01.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis system; do not silently switch — **Done**

### Subtask `ADM-D01.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Diagnosis system; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Diagnosis system** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-D01.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis system; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Diagnosis system**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Diagnosis system admin + board keyword tabs → **Old-API only**. W3.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 26. `ADM-D02` — Keep and harden Admin Diagnosis therapeutics (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Diagnosis therapeutics
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Diagnosis therapeutics already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-D02.02` [Web] — ACL: only Admin (and permitted roles) can mutate Diagnosis therapeutics; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-D02.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis therapeutics; do not silently switch — **Done**

### Subtask `ADM-D02.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Diagnosis therapeutics; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Diagnosis therapeutics** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-D02.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis therapeutics; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Diagnosis therapeutics**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Diagnosis therapeutics → **Old-API**. W3.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 27. `ADM-D03` — Keep and harden Admin Diagnosis conditions (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Diagnosis conditions
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Diagnosis conditions already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-D03.02` [Web] — ACL: only Admin (and permitted roles) can mutate Diagnosis conditions; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-D03.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis conditions; do not silently switch — **Done**

### Subtask `ADM-D03.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Diagnosis conditions; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Diagnosis conditions** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-D03.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis conditions; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Diagnosis conditions**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Diagnosis conditions → **Old-API**. W3.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 28. `ADM-M01` — Keep and harden Admin Author master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Author master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Author master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-M01.02` [Web] — ACL: only Admin (and permitted roles) can mutate Author master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-M01.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Author master; do not silently switch — **Done**

### Subtask `ADM-M01.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Author master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Author master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-M01.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Author master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Author master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Author master → **Old-API**. W2.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 29. `ADM-M02` — Keep and harden Admin Materia medica master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Materia medica master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Materia medica master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-M02.02` [Web] — ACL: only Admin (and permitted roles) can mutate Materia medica master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-M02.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica master; do not silently switch — **Done**

### Subtask `ADM-M02.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Materia medica master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Materia medica master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-M02.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Materia medica master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Materia medica master → **Old-API**. W2.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 30. `ADM-M03` — Keep and harden Admin Materia medica heads (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Materia medica heads
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Materia medica heads already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-M03.02` [Web] — ACL: only Admin (and permitted roles) can mutate Materia medica heads; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-M03.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica heads; do not silently switch — **Done**

### Subtask `ADM-M03.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Materia medica heads; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Materia medica heads** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-M03.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica heads; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Materia medica heads**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Materia medica heads → **Old-API**. W2.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 31. `ADM-M04` — Keep and harden Admin Materia medica remedies (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Materia medica remedies
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Materia medica remedies already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-M04.02` [Web] — ACL: only Admin (and permitted roles) can mutate Materia medica remedies; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-M04.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica remedies; do not silently switch — **Done**

### Subtask `ADM-M04.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Materia medica remedies; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Materia medica remedies** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-M04.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica remedies; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Materia medica remedies**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Materia medica remedies details → **Old-API**. W2.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 32. `ADM-Q01` — Keep and harden Admin Question section, group & sub-group (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Question section, group & sub-group
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Question section/group/sub-group already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-Q01.02` [Web] — ACL: only Admin (and permitted roles) can mutate Question section, group & sub-group; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-Q01.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Question section, group & sub-group; do not silently switch — **Done**

### Subtask `ADM-Q01.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Question section, group & sub-group; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Question section, group & sub-group** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-Q01.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Question section, group & sub-group; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Question section, group & sub-group**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Question section/group/sub-group → **Old-API** (New-API has locked parity). W5.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 33. `ADM-Q02` — Keep and harden Admin Clinical question mapping (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Clinical question mapping
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Clinical question mapping already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-Q02.02` [Web] — ACL: only Admin (and permitted roles) can mutate Clinical question mapping; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-Q02.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Clinical question mapping; do not silently switch — **Done**

### Subtask `ADM-Q02.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Clinical question mapping; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Clinical question mapping** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-Q02.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Clinical question mapping; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Clinical question mapping**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Clinical question mapping → **Old-API**. W5.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 34. `ADM-R01` — Keep and harden Admin Repertory sections (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Repertory sections
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Repertory sections already exist. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R01.02` [Web] — ACL: only Admin (and permitted roles) can mutate Repertory sections; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R01.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Repertory sections; do not silently switch — **Done**

### Subtask `ADM-R01.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Repertory sections; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Repertory sections** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R01.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Repertory sections; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Repertory sections**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Repertory Section CRUD → **Old-API**. W1. (Rubric–remedy save/Excel is New-API — that is ADM-R03.)
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 35. `ADM-R02` — Keep and harden Admin Subsection & rubric tree (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Subsection & rubric tree
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Subsection & rubric tree already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R02.02` [Web] — ACL: only Admin (and permitted roles) can mutate Subsection & rubric tree; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R02.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Subsection & rubric tree; do not silently switch — **Done**

### Subtask `ADM-R02.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Subsection & rubric tree; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Subsection & rubric tree** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R02.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Subsection & rubric tree; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Subsection & rubric tree**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Subsection tree admin → **Old-API**. Some Excel/search endpoints are New-API. Do not switch the main CRUD host.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 36. `ADM-R03` — Keep and harden Admin Rubric–remedy mapping (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Rubric–remedy mapping
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Rubric–remedy mapping already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R03.02` [Web] — ACL: only Admin (and permitted roles) can mutate Rubric–remedy mapping; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R03.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Rubric–remedy mapping; do not silently switch — **Done**

### Subtask `ADM-R03.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Rubric–remedy mapping; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Rubric–remedy mapping** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R03.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Rubric–remedy mapping; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Rubric–remedy mapping**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Rubric–remedy **save** + Excel import/status/export → **New-API**. Other rubric reads may still be Old-API. W1 comment.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 37. `ADM-R04` — Keep and harden Admin Remedy-linked rubrics (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Remedy-linked rubrics
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Remedy-linked rubrics already exist. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R04.02` [Web] — ACL: only Admin (and permitted roles) can mutate Remedy-linked rubrics; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R04.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy-linked rubrics; do not silently switch — **Done**

### Subtask `ADM-R04.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Remedy-linked rubrics; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Remedy-linked rubrics** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R04.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy-linked rubrics; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Remedy-linked rubrics**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Remedy-linked rubrics reads → mixed; keep current helper hosts. Do not silently switch.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 38. `ADM-R05` — Keep and harden Admin Language master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Language master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Language master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R05.02` [Web] — ACL: only Admin (and permitted roles) can mutate Language master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R05.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Language master; do not silently switch — **Done**

### Subtask `ADM-R05.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Language master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Language master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R05.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Language master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Language master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Language master admin → **Old-API**.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 39. `ADM-R06` — Keep and harden Admin Body part master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Body part master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Body part master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R06.02` [Web] — ACL: only Admin (and permitted roles) can mutate Body part master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R06.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Body part master; do not silently switch — **Done**

### Subtask `ADM-R06.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Body part master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Body part master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R06.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Body part master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Body part master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Body part master admin → **Old-API**.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 40. `ADM-R07` — Keep and harden Admin Intensity master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Intensity master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Intensity master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R07.02` [Web] — ACL: only Admin (and permitted roles) can mutate Intensity master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R07.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Intensity master; do not silently switch — **Done**

### Subtask `ADM-R07.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Intensity master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Intensity master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R07.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Intensity master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Intensity master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Intensity master admin → **Old-API**.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 41. `ADM-R08` — Keep and harden Admin Remedy master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Remedy master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Remedy master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R08.02` [Web] — ACL: only Admin (and permitted roles) can mutate Remedy master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R08.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy master; do not silently switch — **Done**

### Subtask `ADM-R08.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Remedy master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Remedy master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R08.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Remedy master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Remedy master admin → **Old-API**.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 42. `ADM-R09` — Keep and harden Admin Remedy grade master (do not rebuild)

- **Module:** M02 — Admin clinical masters
- **Phase:** Phase 1 — Admin clinical knowledge masters (PDF §7.1) — keep live, do not rebuild
- **Day focus:** Day 3–7
- **Priority:** P0 Critical path
- **PDF feature:** Remedy grade master
- **Subtasks in Week 1 (web/UI):** 2 (Done: 2)

### Why this main task exists

Remedy grade master already exists. Keep; Admin mutate only.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `ADM-R09.02` [Web] — ACL: only Admin (and permitted roles) can mutate Remedy grade master; Doctor is read-only consumer on Patient Board — **Done**
- `ADM-R09.03` [Web] — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy grade master; do not silently switch — **Done**

### Subtask `ADM-R09.02`

**Statement to make true:** ACL: only Admin (and permitted roles) can mutate Remedy grade master; Doctor is read-only consumer on Patient Board

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing Improvement
- **Work bifurcation:** Security
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = **Done**; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** Harden the existing Admin **Remedy grade master** master. Do **not** rebuild the screens. Only Admin (and permitted portal roles) may Create/Update/Delete. Doctor/Reception remain **read-only consumers** on Patient Board.
**Already done (tracker = Done):**
- Admin List/Add/Edit pages exist under `src/pages/Admin/...`.
- All `admin/*` routes go through `AdminProtected` (`src/Routes/AdminProtected.js` + `isAdminRoutePath` in `roles.js`). Doctor hitting `/admin/...` is redirected to doctor dashboard.
- Backend ACL probe helpers: `getAdminAclMe`, `pingAdminAcl` (New-API).
**What you must not do:** Rewrite the module, change table UX, or open mutate buttons to Doctor.
**Plan:** No further UI implementation unless a hole is found in UAT (Doctor can still mutate). Then fix the specific page — do not start a rebuild.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `ADM-R09.03`

**Statement to make true:** Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy grade master; do not silently switch

- **Track:** Web  |  **Stream:** A-ClinicWeb  |  **Work type:** Existing
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Gourav Nikam
- **Layers:** Frontend = N/A; Backend = **Done**; Database = N/A; API = **Done**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Done
- **Module sheet:** `M02_Admin_Clinical`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** Dual-API hygiene for **Remedy grade master**. Confirm the UI still calls the **correct host** (classic Old-API vs New-API .NET 8). Never silently switch.
**Already done (tracker = Done):** Helpers are annotated in `src/helpers/realbackend_helper.js`.
**Host to keep:** Remedy grade master admin → **Old-API**.
**Plan:** No code change unless a call was moved by mistake. If you add a new endpoint for this master, follow the same host.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---


# Module M16 — Patient continuity APIs (web contract + later UI)

_Patient continuity APIs_

## 43. `CON-01` — Family members — add family members under one account

- **Module:** M16 — Patient continuity APIs
- **Phase:** Phase 15 — Patient continuity APIs (PDF §2.5–2.8) — build before mobile UI
- **Day focus:** Day 5–7
- **Priority:** P1 Parallel must finish
- **PDF feature:** Family members
- **Subtasks in Week 1 (web/UI):** 3 (Not Started: 3)

### Why this main task exists

Patients need family members under one account (book for child/spouse). APIs in M16; UI in Phase 16.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `CON-01.01` [Web] — DB: FamilyMember — **Not Started**
- `CON-01.02` [Web] — API: CRUD family; book-as-member — **Not Started**
- `CON-01.03` [UI] — Consumed in Phase 16 — **Not Started**

### Subtask `CON-01.01`

**Statement to make true:** DB: FamilyMember

- **Track:** Web  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** New table `FamilyMember` (patient continuity, PDF family members).
**Already done:** Not started. P1, Day 5–7.
**Your web work:** None. UI is CON-01.03 in Phase 16.
**Plan:** Backend first.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `CON-01.02`

**Statement to make true:** API: CRUD family; book-as-member

- **Track:** Web  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** API CRUD family members + book-as-member.
**Already done:** Not started.
**Your web work:** Phase 16 Patient Website / app. Not S1 clinic-admin screens.
**Plan:** Wait.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `CON-01.03`

**Statement to make true:** Consumed in Phase 16

- **Track:** UI  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** UI “Consumed in Phase 16” — Patient Website/app uses family APIs. Tracker lists it on S1 Week 1 as UI / Not Started so the contract exists early.
**Already done:** No family-member pages in this web app.
**Plan for S1 Week 1:** **Do not build Patient Website family UI now** unless lead explicitly wants a hidden stub. Mark as planned for Phase 16. Optional: empty route placeholder only if FND-02 portal shells are in scope.
**Depends on:** CON-01.01 + CON-01.02.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

## 44. `CON-02` — Caregiver authorization — let a family member book and manage on their behalf

- **Module:** M16 — Patient continuity APIs
- **Phase:** Phase 15 — Patient continuity APIs (PDF §2.5–2.8) — build before mobile UI
- **Day focus:** Day 5–7
- **Priority:** P1 Parallel must finish
- **PDF feature:** Caregiver authorization
- **Subtasks in Week 1 (web/UI):** 4 (Not Started: 4)

### Why this main task exists

A caregiver can book/manage on the patient’s behalf, with OTP on grant. APIs in M16; UI in Phase 16.

### When the whole main task is done

Every sibling subtask below is Done (or formally Deferred). Then this feature is true on UAT.

### Sibling subtasks

- `CON-02.01` [Web] — DB: CaregiverAuth — **Not Started**
- `CON-02.02` [Web] — API: grant/revoke/list; booking authorisation check — **Not Started**
- `CON-02.03` [UI] — Consumed in Phase 16 — **Not Started**
- `CON-02.04` [Web] — OTP on grant — **Not Started**

### Subtask `CON-02.01`

**Statement to make true:** DB: CaregiverAuth

- **Track:** Web  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** Database
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = N/A; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** New table `CaregiverAuth`.
**Already done:** Not started.
**Your web work:** None.
**Plan:** Backend first.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `CON-02.02`

**Statement to make true:** API: grant/revoke/list; booking authorisation check

- **Track:** Web  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** API (Web & Mobile)
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** API grant / revoke / list caregiver auth; booking must check authorisation.
**Already done:** Not started.
**Your web work:** Phase 16.
**Plan:** Wait.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `CON-02.03`

**Statement to make true:** Consumed in Phase 16

- **Track:** UI  |  **Stream:** B-PatientEco  |  **Work type:** New
- **Work bifurcation:** UI / Web UI
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = **Not Started**; Backend = N/A; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = N/A
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row includes **Frontend (web UI)** work in `UI/NIGAHomeopathy_UI`.

**What this is:** UI consumed in Phase 16 (caregiver grant/revoke screens on Patient Website/app).
**Already done:** No caregiver pages.
**Plan for S1 Week 1:** Same as CON-01.03 — do **not** implement Patient Website caregiver UI now. Document the future screens only.
**Depends on:** CON-02.01/02 and CON-02.04 OTP.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---

### Subtask `CON-02.04`

**Statement to make true:** OTP on grant

- **Track:** Web  |  **Stream:** B-PatientEco  |  **Work type:** New Integration
- **Work bifurcation:** Integration
- **Assigned lead (tracker):** Unassigned
- **Layers:** Frontend = N/A; Backend = **Not Started**; Database = N/A; API = **Not Started**; Mobile = N/A; Integration = **Not Started**
- **Overall (derived from layers):** Not Started
- **Module sheet:** `M16_Patient_APIs`
- This row is **not** a UI-repo implementation ticket (backend / DB / API / client decision). Included because it is on the **Web** track.

**What this is:** OTP required when granting caregiver access (uses SEC-07 OTP infrastructure + PRE-03 SMS vendor).
**Already done:** Not started.
**Your web work:** Phase 16 grant flow will show OTP modal.
**Plan:** Blocked on SEC-07 + PRE-03.

**Out of scope:** Do not implement sibling subtasks “while you are here”. Do not commit secrets. Do not mark Done without a demo of the statement above.

---


# Approval checklist

Reply with what to implement first. Recommended first PR after approval:

1. SEC-01.03 (remove fakeBackend) — small, high safety
2. FND-01.02 + FND-02.01 + FND-02.02 (role shells + ACL skeleton) — one foundation PR
3. SEC-04.02 (strip Velzon demo menus)
4. SEC-03.02 (logout API) when backend confirms `/Account/Logout`
5. SEC-02.03 (reset password) when Forgot/Reset APIs work
6. ADM-B04.03 (menu API) when MenuMaster seed is ready

I will not start coding until you approve a wave or a specific Sub Task ID.

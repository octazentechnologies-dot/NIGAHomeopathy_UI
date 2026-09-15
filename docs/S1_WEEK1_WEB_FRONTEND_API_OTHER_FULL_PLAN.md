# S1 Week 1 — Web Frontend / Web API / Web Other

**Full explanation + implementation plan. Do not implement until this document is approved.**

| Field | Value |
|---|---|
| Source tracker | `UI/NIGAHomeopathy_UI/NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx` |
| Sheet analysed | `S1_Week1` (Sprint Day 1–7 — Foundation, Admin closeout, mobile bootstrap) |
| Cross-checked sheets | `M01_Foundation_Security`, `M02_Admin_Clinical`, `M16_Patient_APIs` |
| Analysis date | 11 Sep 2026 |
| Filter | **Work Bifurcation = Web Frontend, Web API, Web Other only** |
| Excluded by instruction | UI track, Web UI, **M00 PRE Client Gates**, QA, Mobile, Database-only, Security-track ACL (`.02`), Integration |
| Status of this file | **Approved 11 Sep 2026 — Waves 0–5 implemented.** Re-verify on UAT; run SQL seeds before Family/Caregiver/menu APIs. |

This is the single reference file for S1 Week 1 **web** work. Earlier draft files in the same folder are superseded by this one.

---

## How to use this document

1. Read **Section 1** — what is in scope and what was skipped.
2. Read **Section 2** — two APIs + one SPA (the dual-API rule).
3. Read **Section 3** — **what M01 and M02 already built in code** (Excel statuses are often stale).
4. Read **Section 4** — 30-second scorecard of remaining work.
5. Read **Section 5** — week execution waves **after you approve**.
6. Use **Section 6** as the encyclopaedia: **every included sub-task, one by one**, with meaning, code truth, remaining work, mobile reuse, Definition of Done, and verification.

Words used everywhere:

| Term | Meaning |
|---|---|
| **Old-API / classic** | `Old-API/NIGA_OldAPI` — live clinic login, most Admin CRUD, Rx-write, Razorpay |
| **New-API / .NET 8** | `New-API/NIGA_NewAPI/Niga-Web` — new modules, M01 security tables, 3D, GetMenuByRole, OTP, consent, secure docs |
| **Web SPA** | `UI/NIGAHomeopathy_UI` — one React (Velzon) app for Doctor / Reception / Admin today |
| **AdminPortal policy** | JWT RoleId **1** or role name **Admin** / **Management**. Applied on mutate APIs |
| **Dual-API freeze** | Keep the HTTP host the existing Admin screen already uses. Do **not** switch Old ↔ New silently |
| **PBKDF2** | Password hash format `PBKDF2$v1$…` used on both APIs |
| **Shared keys** | IDs that must be the same on web and mobile: `DoctorId`, `PatientId`, `PatientAppId`, `CaseId`, `ErxId`, `LedgerTxnId`, `MedicineOrderId` |
| **Do not rebuild** | M02 screens already work. Week 1 only leftover seed + host freeze confirmation |
| **Code status DONE** | Behaviour exists in the repo even if Excel still says Not Started |
| **Code status PARTIAL** | Skeleton / helper / one side exists; remaining work listed |
| **Code status NOT STARTED** | No product artefact yet |
| **CONFIRM-ONLY** | M02 dual-API freeze — confirm host, do not recode |

Hard rules from the tracker and from you:

- **Do not create a third API.**
- **New HTTP this week → New-API only.** Classic stays only for Login / Rx-write / Razorpay until a formal cut-over.
- **Every Web API must be reusable by mobile.** Same URL, same JSON, same JWT claims. No `/api/mobile/*` duplicates.
- **Do not implement until this plan is approved.**
- After implementation: prove **new** behaviour **and** that existing Admin / Doctor / Reception flows still work.

---

## 1. Scope of this plan

S1_Week1 has **178** non-empty rows. This document keeps **53** of them.

### Included (53)

| Work Bifurcation | Count | Meaning |
|---|---:|---|
| **Web API** | 43 | HTTP/backend on New-API and/or dual-API freeze on Old-API. Must be reusable by mobile. |
| **Web Frontend** | 6 | React SPA: layouts, ACL, login/logout/reset wiring |
| **Web Other** | 4 | Architecture docs / seed design (M01 only — M00 PRE is excluded) |

Modules in this document:

| Module | Web sub-tasks | Stream | Day | Priority |
|---|---:|---|---|---|
| **M01 Foundation + Security** | 23 | A-ClinicWeb | Day 2–6 | P0 |
| **M02 Admin Clinical** | 28 | A-ClinicWeb | Day 3–7 | P0 |
| **M16 Patient APIs** | 2 | B-PatientEco | Day 5–7 | P1 Parallel must finish |

### Deliberately excluded (125 rows)

| Bucket | Count | Why excluded |
|---|---:|---|
| **M00 PRE — Client gates** (`PRE-01`…`PRE-04`) | 11 Web Other | You asked not to include M00 PRE (workshops, vendor choice, cash/GST decisions) |
| **UI** (`ADM-B04.03`) | 1 | You asked not to include UI. That ticket is “SPA consumes GetMenuByRole instead of hard-coded `LayoutMenuData`” |
| **Web UI** (`CON-01.03`, `CON-02.03`) | 2 | Family/caregiver screens — consumed in Phase 16 |
| **Security** (M02 `.02` ACL rows) | 27 | Security track, not Web Frontend / Web API / Web Other. **Code is already Done** (AdminPortal on mutate) |
| **Database** (schema-only siblings) | 10 | Mentioned as dependencies only; not our tickets |
| **QA** | 48 | Out of web filter |
| **Mobile Frontend / Mobile UI / API Mobile** | 25 | Out of web filter (M17/M18 bootstrap) |
| **Integration** | 1 | OTP-on-caregiver-grant (`CON-02.04`) — later |

Database siblings are noted as **dependencies** where a Web API cannot ship without them. They are not our tickets.

---

## 2. Codebase landscape

### Two APIs, one SPA

| Repo | Role today |
|---|---|
| `New-API/NIGA_NewAPI` | NigaHomeopathy-API (.NET 8). **All new HTTP.** Login exists here too, but UI still logs in on classic. |
| `Old-API/NIGA_OldAPI` | Classic API. **Login, Rx-write, Razorpay** until formal cut-over. Most Admin masters still live here. |
| `UI/NIGAHomeopathy_UI` | One React SPA. Doctor / Reception / Admin work. Account + Pharmacy shells are missing. |

UI helper `src/helpers/realbackend_helper.js` already documents the placement rule (FND-01.03):

- New domain / new HTTP → New-API (`nigahomeoAPI` / `API_URL_NIGAHOMEOPATHY`).
- Do not create a third API.
- Keep on classic (`api` / `API_URL`) until explicit cut-over: **Login, Rx-write, Razorpay**.
- Do not silently switch hosts for an existing call.

So for M02, “Web API task Done” usually means: **host is frozen correctly + mutate is ACL-locked**, not “ported to .NET 8”.

### Excel vs code (important)

The Excel **S1_Week1 layer statuses are often stale**:

- Almost every **M01** Web row still says `Not Started`.
- Almost every **M02** Web API `.03` row says Backend/API `Done`.

Code review shows:

- **M01 backend security is largely built** (login hash, JWT claims, forgot/reset/change password, logout write, consent, OTP, secure docs, audit helper, AdminPortal, GetMenuByRole).
- **M01 frontend wiring and architecture docs are not** (fakeBackend still on, logout never calls API, no reset-password page, no Account/Pharmacy shells, no shared-key / five-portals docs).
- **M02 Admin masters are already built and ACL-locked.** Week 1 must **not rebuild** them.

This document uses **code truth**, not Excel layer cells.

---

## 3. What is already done (deep analysis)

This is the answer to: “M01 Foundation_Security and M02 Admin_Clinical are already done — what exactly exists?”

### 3.1 M02 Admin Clinical — keep and harden (do not rebuild)

**Intent of every M02 Web API `.03` row:** confirm the UI still talks to the **correct host** (classic vs .NET 8) and **do not silently switch**. The sibling Security-track `.02` ACL tickets (excluded from this plan) are already Done in code.

What was actually built:

1. **Admin mutate lock on New-API:** `[Authorize(Policy = AdminPortal)]` on add/update/delete for Admin masters. Policy = RoleId 1 or Admin/Management. Doctor is a read-only consumer on Patient Board.
2. **SPA lock:** `AdminProtected.js` + `canAccessAdminPortal` / `canMutateAdminMasters` in `roles.js`. Doctor/Reception hitting `/admin/*` or `/dashboard` are redirected to `/doctordashboard`.
3. **Host freeze comments** in `realbackend_helper.js` (W1–W7). Admin CRUD for most repertory/diagnosis/MM/drug masters stays on **Old-API**. A few surfaces were born on **New-API**.
4. **Probe endpoints:** `GET /api/AdminAcl/me|ping|coverage` on New-API — returns the W0–W7 coverage map.

**Policy implementation (New-API):**

| File | What it does |
|---|---|
| `Niga-Domain/Authorization/AdminAuthorizationPolicies.cs` | `AdminPortal` policy: RoleId 1 **or** role name Admin/Management |
| `Niga-Web/Program.cs` | Registers the policy |
| `Niga-Domain/Services/TokenService.cs` | JWT claims: `RoleId`, `RoleName`, `ClaimTypes.Role`, `DoctorID`, `jti` |
| `Niga-Web/Controllers/AdminAclController.cs` | `me` / `ping` / `coverage` probes |
| `UI/.../src/Routes/AdminProtected.js` | Redirects non-Admin away from `/admin/*` and `/dashboard` |
| `UI/.../src/Components/constants/roles.js` | `canAccessAdminPortal`, `ADMIN_PORTAL_ROLES` |

**Frozen on New-API (`nigahomeoAPI`):**

- 3D mesh key, 3D section, 3D hotspots (full CRUD + AdminPortal on mutate)
- Doctor qualifications admin (Add/Update/Delete)
- Rubric–remedy **save + Excel** (New-API)
- `GET /api/mastersAPI/GetMenuByRole`
- Doctor Widgets package **reads** (`/mastersAPI/GetPackages`)
- Allopathic **dropdown** for the board (`GetAllopathicDrugfordropdown`)

**Frozen on Old-API (`api`):**

- Drug system / drug group
- Allopathic **admin CRUD** + side-effect deletes
- Diagnosis system / therapeutics / conditions
- Author, Materia medica master/heads/remedies admin
- Question section / group / subgroup / clinical questions admin
- Repertory section / subsection / rubric / language / body part / intensity / remedy / remedy grade admin
- Lab catalog admin (`PatientLabTest`) — board/eRx still reads classic `PatientLab`
- Package **admin CRUD** (Old), with New-API parity locked
- Roles / RoleDetails / MenuMaster admin CRUD (Old)

**M02 leftover (not fully done):** `ADM-B04.02` — `GetMenuByRole` is restored on New-API, but Account/Pharmacy **menu seed is only a commented SQL template**, not applied.

Do **not** rebuild M02 screens. After approval we only finish the leftover seed and confirm hosts.

### 3.2 M01 Foundation + Security — largely built on API, not wired in UI

| Capability | What exists in code | Gap |
|---|---|---|
| Password hashing | PBKDF2 on **both** Old-API and New-API login. Lazy plaintext → hash. Script `M01_Foundation_Security_Server.sql` widens `UserPassword` to NVARCHAR(500). | Tracker still Not Started. Confirm SQL ran on the **shared** DB. |
| JWT claims | `RoleId`, `RoleName`, `ClaimTypes.Role`, `DoctorID`, `jti` on both TokenServices | Login URL still classic (correct until cut-over) |
| Forgot / Reset / Change password | New-API `POST /api/Account/ForgotPassword`, `ResetPassword`, `ChangePassword`. UsersController no longer emails plaintext. | UI forgetpwd thunk still fake/Firebase. No `/reset-password` route matching the email link. |
| Logout API | New-API `POST /api/Account/Logout` writes `UserLoginStatus.OutTime` + in-memory jti denylist. Old-API also has Logout. | Denylist is **not checked** on incoming JWT (`Program.cs` has no `OnTokenValidated`). UI logout **never calls** `logoutApi()`. |
| GetMenuByRole | Restored on New-API with IDOR harden (non-admin forced to own userId) | SPA still uses hard-coded `LayoutMenuData` (UI ticket ADM-B04.03, out of this plan) |
| Consent | `ConsentController` Grant / Withdraw / ListMine / AdminAudit. Types: Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver | UI not consuming. Fine for this week. |
| OTP | `OtpController` RequestOtp / VerifyOtp / Audit. Rate-limit 3/min, 5 attempts, 15 min lockout, SMS stub, masked destination | SMS vendor is M00 PRE-03 (excluded). Stub is enough. |
| Secure documents | `SecureDocumentController` multipart upload + authorised GET | Directory browsing on `/attachments` and `/Blogs` is **still enabled** in `Program.cs` |
| Audit helper | `IAuditEventWriter` used on Login/Logout/Reset/ChangePassword | **Not** wired as middleware on money/Rx/approval endpoints |
| Doctor ownership helper | `DoctorOwnership.EnsureDoctorOwns` exists | **Not applied** on Patient / Appointment / Case / Rx / labs controllers. Board backup is JWT-bound by `GetUserId()` only |
| Role constants | `roles.js` has Patient, Account, PharmacyPartner. SQL seeds those RoleMaster names. | No Account/Pharmacy layouts. `getHomeDashboardPath` sends everyone else to `/dashboard`. `AuthProtected` is login-only, not per-route ACL |
| fakeBackend | Still called from `App.js` line 19 | Must remove for production path |
| Shared-key design doc | Missing | FND-01.01 |
| Five-portals doc | Missing | FND-02.04 |
| Account vs Admin seed | Role names exist in SQL; money APIs not built yet; menu split is a commented template | SEC-04.03 + ADM-B04.02 |

**M01 SQL already in repo** (`New-API/NIGA_NewAPI/Database/Scripts/M01_Foundation_Security_Server.sql`):

- `UserPassword` NVARCHAR(500)
- Tables: `PasswordResetToken`, `ConsentType`, `ConsentRecord`, `OtpChallenge`, `OtpAuditLog`, `AuditEvent`, `SecureDocument`
- RoleMaster seeds: Patient, Account, PharmacyPartner
- ConsentType seeds including Caregiver and TeleRecording

### 3.3 M16 Patient APIs — not started

No `Family` / `Caregiver` controller, table, or DTO in New-API. Consent type `Caregiver` is seeded, which is a prerequisite, not the feature.

---

## 4. Executive scorecard (this filter)

| Module | Included | Code DONE | PARTIAL | NOT STARTED | After approval |
|---|---:|---:|---:|---:|---|
| M01 Foundation (FND) | 5 | 1 (FND-01.03 dual-API rule) | 1 (FND-02.02 roles exist) | 3 | Docs + Account/Pharmacy shells + deny-by-default ACL |
| M01 Security (SEC) | 18 | 8 API cores | 5 | 5 FE + remaining API gaps | Wire UI; ownership; directory browsing; audit helper usage; denylist check; Account seed |
| M02 Admin Clinical | 28 | 27 CONFIRM-ONLY | 1 (ADM-B04.02) | 0 | Finish Account/Pharmacy menu seed; do not rebuild masters |
| M16 Patient APIs | 2 | 0 | 0 | 2 | Family CRUD + Caregiver grant/revoke/list on New-API (mobile-reusable) |
| **Total** | **53** | **36** | **7** | **10** | See Section 5 |

**Recommended remaining engineering after you approve** (ignore Excel “Not Started” when code already exists):

1. Close M02 leftover: live Account/Pharmacy **menu seed** (`ADM-B04.02`).
2. Close M01 frontend gaps (fakeBackend, reset page, logout New-API, role ACL, Account/Pharmacy stubs).
3. Close M01 API gaps (DoctorId ownership on clinical APIs, disable directory browsing, JWT denylist check, audit helper usage, Account vs Admin seed).
4. Publish two docs: shared-key design + five portals.
5. Start M16 family/caregiver APIs (Day 5–7 P1) on New-API so mobile can reuse the same contracts.

---

## 5. Week execution plan (only after approval)

Do **not** start coding until you say so. Suggested order so S1 Week 1 can actually close:

### Wave 0 — Confirm, do not recode (Day 3–7, M02)

Walk `GET /api/AdminAcl/coverage` + `realbackend_helper.js` comments. Spot-check one mutate per wave (Doctor → 403, Admin → not 403). Mark 27 dual-API tickets Done in the tracker if UAT already matches. **Do not port masters. Do not rewrite Admin screens.**

### Wave 1 — M02 leftover (ADM-B04.02)

Fill and apply `M02_W7_MenuMaster_Account_Pharmacy_Seed.sql` once Account/Pharmacy `RoleId` / `ModuleId` are known. Verify `GET /api/mastersAPI/GetMenuByRole`. Do **not** switch the SPA off `LayoutMenuData` (that is UI ticket ADM-B04.03).

### Wave 2 — M01 docs (Web Other)

- `FND-01.01` shared-key design
- `FND-02.04` five portals
- `SEC-03.03` mobile Logout contract note (same New-API endpoint)
- Confirm `FND-01.03` in the same shared-key / dual-API doc

### Wave 3 — M01 API close-out (Web API, New-API only for new work)

| Order | ID | Work |
|---|---|---|
| 1 | SEC-03.01 | Hook JWT denylist into bearer `OnTokenValidated` so Logout actually revokes |
| 2 | SEC-05.02 | Remove `UseDirectoryBrowser` for `/attachments` and `/Blogs` |
| 3 | SEC-05.01 | Apply `DoctorOwnership` on Patient, Appointment, Case, Rx, notes, labs, board backup |
| 4 | SEC-08.02 | Call `IAuditEventWriter` from mutating money/Rx/approval endpoints (helper already exists) |
| 5 | SEC-04.03 | Seed RoleDetails so Account cannot see clinical menus and Admin cannot see money menus |
| 6 | SEC-01.02 / 02.02 / 04.01 / 06.* / 07.* / 09.02 | Demo + mark tracker (code already there) |

### Wave 4 — M01 Web Frontend

| Order | ID | Work |
|---|---|---|
| 1 | SEC-01.03 | Remove `fakeBackend()` from `App.js` production path |
| 2 | SEC-03.02 | `Logout.js` / `logoutWithBackupPrompt` must call New-API `POST /Account/Logout` then clear session |
| 3 | SEC-02.03 | Wire forgetpwd + add `/reset-password` (query or path token) success/expiry screens |
| 4 | FND-02.01 | Account layout stubs + Pharmacy layout stub + home redirect |
| 5 | FND-02.02 | Per-route `allowedRoles`, deny-by-default for **new** routes |
| 6 | SEC-04.02 | Hide routes the role cannot view; keep Velzon demo routes out of production menus |

### Wave 5 — M16 P1 (Day 5–7, New-API, mobile-reusable)

- `CON-01.02` Family CRUD + book-as-member
- `CON-02.02` Caregiver grant/revoke/list + booking authorisation check

OTP infra already exists (`SEC-07.02`). Caregiver OTP-on-grant is an **Integration** row (out of this plan). Family/caregiver **UI** is out of this plan.

### Mandatory verification after each wave (your instruction)

When a ticket is implemented:

1. Prove the **new** behaviour (happy path + 401/403/validation).
2. Prove **existing** Admin / Doctor / Reception flows still work (login, dashboard, Patient Board, one Admin master mutate, logout prompt).
3. For any new API: Swagger/Postman sample JSON that **mobile can copy unchanged**.
4. Browser-verify every Web Frontend change (not screenshot-only).

### What we will not do even after approval (unless you expand scope)

- Rebuild any M02 Admin master screen
- Port Login / Rx-write / Razorpay off classic
- Create a third API or put **new** endpoints on Old-API
- Implement M00 PRE workshops
- Build Account/Pharmacy **real** screens (M08 / HomeoMeds)
- Build Patient/Doctor mobile apps
- Consume menu API in SPA (`ADM-B04.03` is UI track)
- Wire a real SMS vendor (PRE-03)

---

## 6. Every included task, one by one

For each sub-task:

- **What the main task is** — why the feature exists
- **What this sub-task is** — plain English of YOUR ticket
- **Code truth** — DONE / PARTIAL / NOT STARTED / CONFIRM-ONLY
- **What already exists** — files and behaviour
- **Plan if approved** — remaining work
- **Mobile reuse** — how web and mobile share the contract
- **DoD + verification**

Status key: tracker cells are quoted only when useful. **Code truth is the source of truth.**

---

# MODULE M01 — Foundation + Security (23 web tickets)

Day 2–6 · P0 · Stream A-ClinicWeb

M01 is the security and identity foundation of the whole product: one identity system, hashed passwords, roles, menus, consent, OTP, audit. Everything later (money, eRx, mobile, pharmacy) depends on it.

---

## Main task FND-01 — One connected ecosystem (shared keys)

**Why this main task exists**

A patient, appointment, prescription or payment created on web must be the **same record** on mobile (and later Account / Pharmacy). If IDs diverge, the six user types cannot see one ecosystem.

**Sibling web tickets in this plan:** `FND-01.01`, `FND-01.03`  
(`FND-01.02` role enum is Database/Frontend on the module sheet — not Web Frontend/API/Other in this S1 filter.)

---

### FND-01.01 — Publish shared-key design

| | |
|---|---|
| Bifurcation | Web Other |
| Work type | New |
| Layers | Backend Yes / Not Started · Database Yes / Not Started |
| Surface | Shared |
| Code truth | **NOT STARTED** |

**What this sub-task is**

Write an architecture document that lists the **canonical IDs** every API (web + mobile) must return and accept:

- `DoctorId`
- `PatientId`
- `PatientAppId`
- `CaseId`
- `ErxId`
- `LedgerTxnId`
- `MedicineOrderId`

Plus the **event list** other modules will emit: created / rescheduled / cancelled / paid / signed / accepted.

This is **not** a new table sprint. It is the contract so later money, eRx, and mobile work do not invent parallel keys.

**What is already done**

Clinic tables already have `DoctorId` / `PatientId` in Old-API and New-API. JWT already carries `DoctorID`. There is **no published design doc** under `UI/.../docs/` that names all seven keys and the event list together.

**Plan after approval**

1. Create `UI/NIGAHomeopathy_UI/docs/SHARED_KEY_AND_EVENT_CONTRACT.md`.
2. For each key: owning table, which API creates it, JSON field name (PascalCase vs camelCase), and “never mint a second id on mobile”.
3. For each event: producer module (M05/M07/M11/…), payload must include the shared keys.
4. Lead review. Link path in sprint Notes.

**Mobile reuse**

Mobile must **not** generate its own Patient/Case/Erx ids. This doc is the contract both clients follow.

**DoD:** Doc exists, Lead thumbs-up, tracker Backend+Database marked Done, module sheet synced.

**Verification:** A mobile engineer can implement booking using only this doc + existing appointment JSON, without inventing a new id field.

---

### FND-01.03 — Dual-API placement rule (no third API)

| | |
|---|---|
| Bifurcation | Web Other |
| Work type | Existing Modification |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Shared |
| Code truth | **DONE in comments + helper; tracker stale** |

**What this sub-task is**

Make this operating rule true and documented:

- All **new** domain HTTP → New-API (.NET 8)
- **Do not** create a third API
- Classic API stays only where **Login, Rx-write, Razorpay** already live, until a formal cut-over

**What is already done**

`UI/.../src/helpers/realbackend_helper.js` lines 9–15 state the rule. `api_helper.js` has two clients: `default` (classic) and `nigahomeo` (New-API). New controllers (OTP, Consent, SecureDocument, AdminAcl, 3D, GetMenuByRole) live only on New-API. UI login still posts to classic (`login = api.post(url.LOGIN)`), which is **correct** until cut-over.

**Plan after approval**

1. Fold the same rule into the shared-key doc (or a short `DUAL_API_PLACEMENT.md`).
2. Demo: one new endpoint on New-API, login still on classic.
3. Mark tracker Done. No host switches.

**Mobile reuse**

Mobile apps must use the **same two hosts** with the same freeze list. New patient/family/caregiver APIs go to New-API only.

**DoD:** Rule is written + demonstrated. Tracker Backend+API Done.

**Verification:** Network tab on login → classic host. Network tab on ForgotPassword or GetMenuByRole → New-API host. No third base URL in `config.js`.

---

## Main task FND-02 — Delivery footprint (5 web portals + 2 mobile apps)

**Why this main task exists**

The PDF promises five web portals (Patient Website, Doctor Web, Reception, Admin, Account) plus Pharmacy as HomeoMeds (not a 6th portal in the PDF count). Week 1 only **skeleton**, not screens.

**Sibling web tickets:** `FND-02.01`, `FND-02.02`, `FND-02.04`

---

### FND-02.01 — Account layout + Pharmacy stub (no screens)

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | New |
| Layers | Frontend Yes / Not Started |
| Surface | Shared |
| Code truth | **NOT STARTED** |

**What this sub-task is**

Add **shells only**:

**Account layout**

- Routes: `/account`, `/account/home`, `/account/ledger`, `/account/earnings`, `/account/payouts`, `/account/invoices`, `/account/reports`
- Sidebar labels: Home, Ledger, Doctor Earnings, Payouts, Invoices, Reports
- Each menu opens a **placeholder**: title = menu name, body = “Account module screens will be built in M08. Do not add tables yet.”
- After login, Account role lands on `/account/home` (update `getHomeDashboardPath` / `RoleBasedHomeRedirect`)

**Pharmacy layout stub**

- One layout + home placeholder only. No HomeoMeds screens.

**Do not** build CRUD, tables, or API calls.

**What is already done**

`UserRole.ACCOUNT` and `UserRole.PHARMACY_PARTNER` exist in `roles.js`. `getHomeDashboardPath` only special-cases Doctor/Reception → `/doctordashboard` and Admin → `/dashboard`. Everyone else, including Account, would land on Admin `/dashboard` (wrong). No `/account/*` or `/pharmacy/*` app routes (landing `/account` in `landingRoutes.js` is unrelated marketing).

**Plan after approval**

1. Copy existing layout pattern (Header + Sidebar + `<Outlet/>`).
2. Placeholder pages only.
3. Login thunk: if role is Account → `/account/home`; PharmacyPartner → pharmacy stub home.
4. Guard with AuthProtected + role check (depends on FND-02.02).

**Mobile reuse**

None for layouts. Account/Pharmacy **APIs** come later (M08 / HomeoMeds) on New-API.

**DoD:** Login as Account sees stub portal, not Admin clinical. Pharmacy stub opens. No tables. Frontend Done.

**Verification (browser):** Login as Account → `/account/home` placeholder. Type `/dashboard` → redirected away from Admin. Login as Doctor → still `/doctordashboard`. Login as Admin → still `/dashboard`. Existing Patient Board unchanged.

---

### FND-02.02 — Per-route ACL skeleton (deny-by-default for new routes)

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Improvement |
| Layers | Frontend Yes / Not Started |
| Surface | Shared |
| Code truth | **PARTIAL** |

**What this sub-task is**

Extend `roles.js` and `AuthProtected` so **every NEW route lists `allowedRoles`**. Default = deny. Existing Admin/Doctor/Reception routes stay as they are (AdminProtected already wraps admin). Test matrix: Account cannot open Admin clinical pages; Doctor cannot open `/account/*`.

**What is already done**

- Role constants include Patient, Account, PharmacyPartner.
- `AdminProtected` blocks non-Admin from `/admin/*` and `/dashboard`.
- `AuthProtected` only checks “is logged in”, **not** role.
- `Routes/index.js` wraps admin paths with `AdminProtected`; doctor routes are login-only.

**What is missing**

No `allowedRoles` on route objects. No deny-by-default wrapper for new portals. Account user with a valid JWT could still hit doctor routes by URL if those routes are only `AuthProtected`.

**Plan after approval**

1. Add `RouteGuard` (or extend `AuthProtected`) that reads `allowedRoles` from the route definition.
2. If `allowedRoles` is missing on a **new** route → deny (redirect home).
3. Attach roles to Account/Pharmacy stubs from FND-02.01.
4. Do not rip out Velzon demo routes in this ticket (that is SEC-04.02), but new domain routes must be explicit.

**Mobile reuse**

API must still enforce role (never trust the SPA). This ticket is UI-only.

**DoD:** Test matrix passes. Frontend Done.

**Verification (browser):** Account JWT + URL `/doctordashboard` → redirect. Doctor JWT + URL `/account/home` → redirect. Admin JWT + `/admin/...` still works. Reception still reaches Patient Board.

---

### FND-02.04 — Document the five portals

| | |
|---|---|
| Bifurcation | Web Other |
| Work type | New |
| Layers | none (documentation) |
| Surface | Shared |
| Code truth | **NOT STARTED** |

**What this sub-task is**

Write a short product map:

1. Patient Website  
2. Doctor Web Portal  
3. Reception Portal  
4. Admin Portal  
5. Account Department  

Pharmacy console = **HomeoMeds**, **not** a 6th portal in the PDF count.

**What is already done**

Doctor + Reception share `/doctordashboard`. Admin uses `/dashboard` + `/admin/*`. Patient website and Account portal do not exist as products yet.

**Plan after approval**

Create `UI/.../docs/FIVE_PORTALS_MAP.md`: who uses each, home URL, which API host, which later module owns screens. Lead review.

**Mobile reuse**

Doc must state Patient App and Doctor App are **not** extra web portals; they consume the same New-API shared keys.

**DoD:** Doc exists, Lead thumbs-up.

**Verification:** Lead can answer “where does Account log in?” from the doc alone.

---

## Main task SEC-01 — Secure login

**Why this main task exists**

Every user type (Admin, Doctor, Reception, later Account/Pharmacy/Patient/mobile) must authenticate with hashed passwords and a JWT that carries Role + DoctorId.

---

### SEC-01.02 — Login verifies hash; JWT Role + DoctorId; keep classic login URL

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Modification |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | All web + later mobile |
| Code truth | **DONE** (tracker stale) |

**What this sub-task is**

Login must:

1. Verify PBKDF2 hash **or** legacy plaintext then lazy-migrate to hash.
2. Embed **Role** and **DoctorId** claims in JWT.
3. Keep the **classic login URL** until a formal .NET 8 cut-over.

**What is already done**

- Old-API `AccountController.Login` — `UserPasswordHasher.Verify`, lazy migrate, `CreateToken(..., roleName, doctorId)`.
- New-API `AccountController.Login` — same hasher, RoleMaster lookup, DoctorId from `Doctors` table, JWT claims `RoleId` / `RoleName` / `ClaimTypes.Role` / `DoctorID` / `jti`.
- UI `login = api.post(url.LOGIN)` → **classic**. Correct.
- Prerequisite: `UserPassword` NVARCHAR(500) via `M01_Foundation_Security_Server.sql`.

**Plan after approval**

Demo only: login with plaintext once (hash written), login again with hash, decode JWT, show Role + DoctorID. Do **not** point the SPA at New-API Login this week. Mark tracker Done.

**Mobile reuse**

When mobile login is built (Phases 16–17), use the **same** classic Login until cut-over, then the **same** New-API Login. Same JSON (`token`, `role`, `roleId`, `doctorId`). Do not invent a mobile-only auth.

**DoD:** Hash verify + claims proven on classic Login. API Done.

**Verification:** After first login, `UserPassword` starts with `PBKDF2$v1$`. JWT decode shows Role + DoctorID. Existing Doctor/Admin/Reception login still lands on the correct dashboard.

---

### SEC-01.03 — Remove fakeBackend() from App.js; keep Formik/Yup login

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Modification |
| Layers | Frontend Yes / Not Started |
| Surface | All web + later mobile |
| Code truth | **NOT STARTED** (login Formik exists; fakeBackend still on) |

**What this sub-task is**

`App.js` currently:

```js
import fakeBackend from "./helpers/AuthType/fakeBackend";
fakeBackend();
```

This intercepts axios in the browser with Velzon dummy users. Production must **not** call `fakeBackend()`. Login page stays Formik/Yup and continues to call real `loginApi`.

**What is already done**

`pages/Authentication/Login.js` uses Formik/Yup. `loginUser` thunk calls `realbackend_helper.login`. Fake path in the thunk is commented out — but `fakeBackend()` still runs globally.

**Plan after approval**

1. Remove the import and `fakeBackend()` call from `App.js` (or gate behind an explicit local-only env flag that is off in production).
2. Smoke-test login as Admin, Doctor, Reception.
3. Confirm no axios mock interceptors remain.

**Mobile reuse**

N/A (SPA only).

**DoD:** Production bundle has no fake backend. Real login still works.

**Verification (browser):** Login as Admin/Doctor/Reception against live classic API. Dummy Velzon users must fail. Patient Board and Admin dashboard still load.

---

## Main task SEC-02 — Secure password reset

**Why this main task exists**

Stop emailing plaintext passwords. Use a time-limited token link.

---

### SEC-02.02 — ForgotPassword / ResetPassword / ChangePassword APIs

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Modification |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Admin / Doctor / Reception web (same APIs for mobile later) |
| Code truth | **DONE** (tracker stale) |

**What this sub-task is**

- `ForgotPassword` emails a **reset link**, never the password.
- `ResetPassword` consumes a hashed token.
- `ChangePassword` for an authenticated user.

**What is already done (New-API `AccountController`)**

| Endpoint | Auth | Behaviour |
|---|---|---|
| `POST /api/Account/ForgotPassword` | Anonymous | Generic success message. Stores SHA256 token, 2h expiry, emails `{SiteUrl}/reset-password?token=` |
| `POST /api/Account/ResetPassword` | Anonymous | Hash lookup, write PBKDF2 password, mark token used, audit |
| `POST /api/Account/ChangePassword` | JWT | Verifies current password, hashes new one, audit |
| UsersController send-password | — | Deprecated; tells client to use ForgotPassword |

UI helpers already exist: `forgotPasswordSecure`, `resetPasswordSecure`, `changePasswordSecure` → `nigahomeoAPI`.

**Plan after approval**

Postman/Swagger demo. Confirm SMTP config. Mark tracker Done. Frontend wiring is SEC-02.03.

**Mobile reuse**

Same three endpoints. Mobile “forgot password” must call New-API, not a second mailer. Token is in the email link (web page); mobile can open the same URL or a deep link that posts `ResetPassword` with the token.

**DoD:** No plaintext password in email. Token expiry works. API Done.

**Verification:** Email body has a link, not a password. Expired token → 400. Wrong current password on ChangePassword → 400. Login still works after reset.

---

### SEC-02.03 — UI: real forgetpwd APIs + reset-password success/expiry

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Improvement |
| Layers | Frontend Yes / Not Started · API Yes / Not Started (API actually Done) |
| Surface | Admin / Doctor / Reception web |
| Code truth | **NOT STARTED** |

**What this sub-task is**

Replace `slices/auth/forgetpwd` fake/Firebase with `forgotPasswordSecure`. Add `/reset-password` (email currently uses `?token=`; tracker text says `/reset-password/:token` — implement **both** or match the email query string and document it). Show success and expired-token states.

**What is already done**

- `/forgot-password` page exists; thunk still uses `postFakeForgetPwd` / Firebase.
- Velzon demo routes `/auth-pass-reset-basic` and `/auth-pass-reset-cover` exist — **not** the real flow.
- **No** `/reset-password` product route.

**Plan after approval**

1. Point forgetpwd thunk at `forgotPasswordSecure`.
2. New page: token from query or path → form new password → `resetPasswordSecure`.
3. States: loading, success, invalid/expired (API 400).
4. Align email URL in New-API with the route you register.

**Mobile reuse**

Web owns the reset **page**. Mobile can reuse the APIs. Prefer keeping query `?token=` so one email works for both.

**DoD:** Fake thunk gone. Happy path + expired token demoed.

**Verification (browser):** Submit forgot-password with a real email → network tab hits New-API. Open reset link → set password → login works. Open expired link → expiry message. Existing `/login` unchanged.

---

## Main task SEC-03 — Session control (web and mobile)

**Why this main task exists**

Sign-out must invalidate server session (and optionally JWT) so a stolen token cannot live until natural expiry. Mobile **must** use the same Logout endpoint.

---

### SEC-03.01 — POST /Account/Logout; UserLoginStatus; optional denylist

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Improvement |
| Layers | Backend / Database / API all Yes · tracker Not Started |
| Surface | All |
| Code truth | **PARTIAL** |

**What this sub-task is**

Authenticated `POST /Account/Logout` must:

1. Persist `UserLoginStatus` out-time.
2. Optionally denylist JWT `jti` until expiry.

**What is already done**

New-API Logout: denylist `jti` in memory, close open `UserLoginStatus`, audit “Logout”. Old-API Logout records `UserLoginStatus` (comment says prefer New-API denylist after cut-over). `JwtDenylistService` is a singleton registered in DI.

**What is missing**

`Program.cs` JWT bearer **never calls** `IJwtDenylistService.IsDenied`. After Logout the same JWT still authenticates until it expires. That is the remaining work.

**Plan after approval**

Add `OnTokenValidated` (or middleware) that rejects denied `jti` with 401. Keep in-memory denylist for v1 (comment already says no JwtDenylist table). Document that recycle of the API process clears the list (acceptable for Week 1 “optional”).

**Mobile reuse**

**This is the mobile Logout contract.** Patient and Doctor apps in Phases 16–17 must `POST /api/Account/Logout` with the same Bearer token. Do not add `/mobile/logout`.

**DoD:** After Logout, reuse of the same JWT returns 401 on New-API. UserLoginStatus.OutTime set.

**Verification:** Call a protected New-API endpoint with the old token after Logout → 401. Login still issues a fresh token. Existing classic login/session for SPA still works (classic host until cut-over).

---

### SEC-03.02 — Web Logout.js calls API then clears session

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Improvement |
| Layers | Frontend Yes / Not Started · API Yes / Not Started |
| Surface | All |
| Code truth | **PARTIAL** (local clear exists; API not called) |

**What this sub-task is**

`Logout.js` must **call the Logout API**, then clear `authUser` and patient-board session (keep existing backup prompt).

**What is already done**

- Route `/logout` → `Logout.js` → `logoutWithBackupPrompt`.
- Prompt saves board backup for Doctor/Reception, then `sessionStorage.removeItem('authUser')` + `logoutUserSuccess`.
- `logoutApi()` exists in `realbackend_helper.js` but **is not used**.
- `logoutUser` thunk also does not call the API (only local clear + optional Firebase).

**Plan after approval**

1. After backup prompt (or skip), `await logoutApi()` — prefer **New-API** (`nigahomeoAPI.post("/Account/Logout")`) so denylist runs. Today `logoutApi` posts to **classic**. Change helper to New-API as part of this ticket (classic login token may not validate on New-API if signing keys differ — **confirm TokenKey vs JWT:Secret** during implementation). If tokens are not interchangeable, call **classic** Logout for v1 and document New-API denylist as post-cut-over.
2. Clear board session regardless of API failure (best-effort server revoke).
3. Keep backup prompt behaviour.

**Mobile reuse**

SPA change only. Contract is SEC-03.03.

**DoD:** Network tab shows Logout POST. Session cleared. Board backup prompt unchanged.

**Verification (browser):** Doctor with unsaved board → logout prompt still appears. After confirm, Logout POST is visible. Next page is `/login`. Re-login and Patient Board still work.

---

### SEC-03.03 — Contract: mobile apps MUST use the same Logout endpoint

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | API Yes / Not Started · Mobile Yes / Not Started |
| Surface | All |
| Code truth | **NOT STARTED as a published contract** (endpoint exists) |

**What this sub-task is**

Not a new URL. A **written contract** that Patient App (M17) and Doctor App (M18) will call `POST /api/Account/Logout` (New-API after cut-over; same path on classic until then). Implemented in Phases 16–17.

**Plan after approval**

Add a subsection to the shared-key or dual-API doc:

```
POST /api/Account/Logout
Authorization: Bearer <jwt>
Response: { success, message }
Mobile MUST NOT only delete local token.
```

Do not build mobile screens this week. Mobile layer in Excel can stay Not Started until apps exist (or mark N/A with Lead note).

**Mobile reuse**

This ticket **is** the mobile reuse rule.

**DoD:** Contract documented. API layer marked Done for the web slice.

**Verification:** Lead + mobile engineer agree the URL is the one they will call. No `/api/mobile/logout` appears in New-API.

---

## Main task SEC-04 — Role-based access

**Why this main task exists**

Each role sees only its menus and APIs. Account controls money; Admin controls platform/clinical; neither does the other’s job (PDF §8).

---

### SEC-04.01 — Restore GetMenuByRole; role attributes on new money/PII APIs

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Improvement |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Admin / All web |
| Code truth | **PARTIAL** |

**What this sub-task is**

1. Restore `GetMenuByRole` on .NET 8.
2. Put **role attributes / policies** on new money and PII APIs.

**What is already done**

- `GET /api/mastersAPI/GetMenuByRole?userId=` on New-API (`MastersAPIController` + `MastersAPIService`).
- Non-AdminPortal callers are forced to their own JWT userId (IDOR harden).
- AdminPortal policy on Admin mutate APIs (M02).
- Helper `getMenuByRole` in SPA — **not consumed** (UI ticket ADM-B04.03, out of plan).

**What is missing**

Money APIs (ledger, payouts, invoices) **do not exist yet** (M08). There is nothing to hang `[Authorize(Roles = "Account")]` on. PII-ish clinical APIs exist but use AdminPortal or open JWT, not Account-vs-Admin split.

**Plan after approval**

1. Demo GetMenuByRole for Admin vs Doctor.
2. Document the **policy names** to use when M08 lands: `AccountPortal` vs `AdminPortal`. Optionally add empty `AccountPortal` policy in `Program.cs` now so later money controllers reuse it.
3. Do not invent money endpoints this week.

**Mobile reuse**

GetMenuByRole is web-menu oriented. Mobile should not duplicate MenuMaster; it uses role claims. Same JWT RoleName.

**DoD:** GetMenuByRole 200 for self; Admin can query others. Policy convention written. Tracker can stay Partial on “money APIs” until M08 if Lead agrees — otherwise add AccountPortal stub policy and mark Done.

**Verification:** Doctor calling GetMenuByRole with another userId still gets **own** menus. Admin can query another userId. Existing Admin sidebar (hard-coded) still works.

---

### SEC-04.02 — Hide routes the role cannot view; Velzon demo out of production menus

| | |
|---|---|
| Bifurcation | Web Frontend |
| Work type | Existing Improvement |
| Layers | Frontend Yes / Not Started |
| Surface | Admin / All web |
| Code truth | **PARTIAL** (Admin portal locked; demo menus still in LayoutMenuData) |

**What this sub-task is**

Hide routes the logged-in role cannot view. Keep Velzon **demo** routes (email templates, charts, etc.) **out of production menus**.

**What is already done**

Admin routes wrapped in `AdminProtected`. Doctor layout hides admin sidebar via `usesDoctorDashboardLayout`. `LayoutMenuData.js` still contains large Velzon demo trees.

**Plan after approval**

1. Split or flag production vs demo menu items.
2. Production menus: Admin clinical + Doctor/Reception board only (plus Account stubs from FND-02.01).
3. Combine with FND-02.02 so URL typing also fails.

**Mobile reuse**

N/A.

**DoD:** Doctor does not see Admin masters or Velzon demo in the menu. Account does not see clinical.

**Verification (browser):** Doctor sidebar has no “Charts / Email templates / Admin masters”. Admin still has clinical masters. Direct URL to a Velzon demo page is either hidden or not in the production menu. Patient Board still has all existing tabs.

---

### SEC-04.03 — Separation of duties seed (Account vs Admin)

| | |
|---|---|
| Bifurcation | Web Other |
| Work type | New |
| Layers | Backend Yes / Not Started · Database Yes / Not Started |
| Surface | Admin / All web |
| Code truth | **NOT STARTED** (roles exist; menu split does not) |

**What this sub-task is**

Seed so **Account role controls money** and **Admin controls platform + clinical**. Neither can perform the other’s role.

**What is already done**

`M01_Foundation_Security_Server.sql` seeds role **names** (including Account). AdminPortal policy is Admin/Management only — Account cannot mutate clinical masters on New-API. Account **menus** are not seeded (`M02_W7_MenuMaster_Account_Pharmacy_Seed.sql` is commented). No money APIs yet.

**Plan after approval**

1. Coordinate with ADM-B04.02: Account RoleDetails = money stub menus only; Admin RoleDetails = clinical, **no** money menus.
2. Confirm Account JWT fails AdminPortal ping (`GET /api/AdminAcl/ping` → 403).
3. Write one paragraph in FIVE_PORTALS_MAP.md.

**Mobile reuse**

Same RoleName in JWT. Mobile Account (if any) would use money APIs only.

**DoD:** Seed applied on UAT. Account 403 on clinical mutate. Admin has no Account money menus.

**Verification:** Account user GetMenuByRole returns only `/account/*` stubs. Admin GetMenuByRole has no ledger/payout menus. Doctor mutate still 403; Admin mutate still 200.

---

## Main task SEC-05 — Patient data protection

**Why this main task exists**

Health records belong to the treating doctor (and later the patient). Another doctor must not open them by guessing ids. Files must not be listable on the public web.

---

### SEC-05.01 — Enforce DoctorId ownership on clinical APIs

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Improvement |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | API |
| Code truth | **PARTIAL** (helper exists; not applied) |

**What this sub-task is**

On Patient, Appointment, Case, Rx, notes, labs, board backup: **do not trust client `DoctorId`**. Compare resource owner to JWT `DoctorID`. AdminPortal may bypass.

**What is already done**

- `DoctorOwnership.EnsureDoctorOwns` / `ForbidIfNotOwner` in `Niga-Domain/Security/DoctorOwnership.cs`.
- JWT `DoctorID` on both APIs.
- `PatientBoardBackupController` binds to `GetUserId()` (DoctorUserId), mentions the helper but does not call `ForbidIfNotOwner` on a resource DoctorId.
- `PatientAppointmentController` still validates `request.DoctorId <= 0` from the **client body**.

**Plan after approval**

1. New-API first: Patient, PatientAppointment, Prescription, PatientLab (clinical, not catalog), board backup — after load, `ForbidIfNotOwner(User, entity.DoctorId)`.
2. Prefer ignoring client DoctorId and using JWT.
3. Old-API Rx-write is frozen on classic — apply the same helper there **if** those endpoints are still the live path; do not port Rx this week.
4. Reception tokens already include DoctorID of the parent doctor — they should pass ownership for that doctor’s patients.

**Mobile reuse**

Same enforcement. Mobile must send JWT; must **not** send another doctor’s id to “switch clinic”. Shared `PatientId` still scoped by DoctorId.

**DoD:** Doctor A 403 on Doctor B’s patient. Admin still 200. API Done.

**Verification:** Doctor A GET/PUT Doctor B’s `PatientId` → 403. Doctor A own patients still 200. Reception of Doctor A still 200. Admin still 200. Existing Patient Board load for own patient still works. Appointment create for own doctor still works.

---

### SEC-05.02 — Disable directory browsing on /attachments and /Blogs

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Modification |
| Layers | Backend Yes / Not Started |
| Surface | API |
| Code truth | **NOT STARTED** (browsing still on) |

**What this sub-task is**

`GET /attachments` and `GET /Blogs` must **not** list files. Downloads must be authorised (signed URL or JWT GET).

**What is already done**

`New-API/Niga-Web/Program.cs` **enables** directory browsing for both paths (`UseDirectoryBrowser` around lines 157–176). `SecureDocumentController` is the authorised alternative (SEC-09.02) but old static folders remain open.

**Plan after approval**

1. Remove both `UseDirectoryBrowser` blocks on New-API (and Old-API if present).
2. Keep `UseStaticFiles` only if files must stay public; otherwise force SecureDocument.
3. Verify `/attachments` returns 404 or 401 listing, not an HTML file index.

**Mobile reuse**

Mobile should download via `GET /api/SecureDocument/{id}` with JWT, not raw `/attachments/filename`.

**DoD:** Directory listing gone. Authorised download still works.

**Verification:** Browser GET `/attachments` is not a file index. Existing blog images / known static URLs: confirm with Lead whether they must stay public (static file) or move to SecureDocument. Do not break production blog pages without a replacement.

---

## Main task SEC-06 — Consent records infrastructure

**Why this main task exists**

Privacy, booking, tele-recording, pharmacy share, marketing, caregiver — every consent stored and reviewable, **without** dumping clinical notes in the API.

---

### SEC-06.02 — Grant / Withdraw / List-mine / Admin-audit APIs

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Shared |
| Code truth | **DONE** (tracker stale) |

**What this sub-task is**

Four operations. Response may contain type + time, **not** clinical content.

**What is already done (`ConsentController`)**

| Method | Route | Notes |
|---|---|---|
| POST | `/api/Consent/Grant` | ConsentTypeCode required; non-admin cannot grant for another User |
| POST | `/api/Consent/Withdraw` | Owner or Admin |
| GET | `/api/Consent/ListMine` | Current user |
| GET | `/api/Consent/AdminAudit` | AdminPortal; no clinical payload |

Tables `ConsentType` + `ConsentRecord` in M01 SQL. Types include Caregiver and TeleRecording.

**Plan after approval**

Swagger demo. Mark tracker Done. No UI this week.

**Mobile reuse**

Patient app later calls the **same** Grant/Withdraw/ListMine. Caregiver grant (CON-02) should record ConsentType `Caregiver` via this API or internally — do not fork a second consent store.

**DoD:** Four endpoints proven. No case notes in JSON.

**Verification:** Grant Privacy → ListMine shows type+time only. Doctor cannot AdminAudit. Admin AdminAudit has no case-note fields. Existing audio case-taking consent (`AudioCaseConsentLog`) still writes independently.

---

### SEC-06.03 — Reuse AudioCaseConsentLog; do not fork telemedicine consent

| | |
|---|---|
| Bifurcation | Web API |
| Work type | Existing Improvement |
| Layers | Backend Yes / Not Started |
| Surface | Shared |
| Code truth | **DONE as a design lock** |

**What this sub-task is**

Keep `AudioCaseConsentLog` for audio case-taking. Phase 11 telemedicine recording must write `ConsentType.TeleRecording` into **ConsentRecord**, not a third table.

**What is already done**

`AudioCaseConsentLog` table + service writes. ConsentType seed: `TeleRecording — Phase 11; do not fork AudioCaseConsentLog`. No telemedicine consent table exists (good).

**Plan after approval**

Code comment / architecture note in the shared-key or consent section of the doc. Do not add a TeleConsent table. Mark Done.

**Mobile reuse**

Telemedicine (later) uses ConsentRecord. Audio case stays AudioCaseConsentLog.

**DoD:** Written lock + no extra table in schema.

**Verification:** Search New-API for a third consent table → none. Audio case-taking still records `AudioCaseConsentLog`.

---

## Main task SEC-07 — OTP infrastructure

**Why this main task exists**

Sensitive actions (payouts, pharmacy acceptance, later caregiver grant) need a generic OTP, not a one-off per feature.

---

### SEC-07.02 — RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS stub

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend / API / Integration Yes · tracker Not Started |
| Surface | Shared |
| Code truth | **DONE** (SMS stub by design; PRE-03 vendor excluded) |

**What this sub-task is**

Generic OTP: Action + EntityType + EntityId + Destination. Rate-limit, lockout, SMS adapter stub until PRE-03 vendor is live.

**What is already done (`OtpController`)**

- Max 3 requests / minute / entity+action
- 6-digit code, SHA256 stored, 10 min TTL
- 5 failed attempts → 15 min lock
- Destination masked in DB
- SMS stub message; `devCode` only in Development
- Audit rows on request/verify

**Plan after approval**

Postman: success, 429, lockout, expired. Do **not** wire a real SMS vendor (M00 PRE-03 is out of scope). Mark Integration as “stub Done” with Lead.

**Mobile reuse**

Same `POST /api/Otp/RequestOtp` and `VerifyOtp`. Mobile payouts/pharmacy/caregiver all pass different `Action` strings. Never return raw OTP in production JSON.

**DoD:** Rate-limit + verify + stub message demonstrated.

**Verification:** 4th request in a minute → 429. 6th bad verify → lock. Production JSON has no `devCode`. Existing login is unaffected (login is password, not OTP).

---

### SEC-07.03 — GET /api/Otp/Audit for Account and Admin (masked)

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Shared |
| Code truth | **DONE** (tracker stale) |

**What this sub-task is**

Account and Admin can list OTP audit with **masked** destination. Doctor must not.

**What is already done**

`GET /api/Otp/Audit?take=` — allows Account role **or** AdminPortal; others 403. Returns masked `ToMasked`.

**Plan after approval**

Demo Admin 200, Doctor 403. Mark Done.

**Mobile reuse**

Audit is a web Account/Admin screen later. Same API if a mobile ops app ever needs it.

**DoD:** Masked fields only. Role gate works.

**Verification:** Doctor → 403. Admin → 200 with `ToMasked` like `98****3210`, never full number. OTP hash not in response.

---

## Main task SEC-08 — Complete audit trail

**Why this main task exists**

Payments, prescriptions, approvals must leave “who / what / when”.

---

### SEC-08.02 — Audit helper on mutating money/Rx/approval endpoints

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend Yes / Not Started |
| Surface | Shared |
| Code truth | **PARTIAL** |

**What this sub-task is**

Start with a **helper** used by later phases. Write audit on mutating money / Rx / approval endpoints. Tracker wording also says “middleware”.

**What is already done**

`IAuditEventWriter.WriteAsync` → table `AuditEvent`. Used from AccountController (Logout, ResetPassword, ChangePassword). **Not** used from Prescription, Package, payment, or as global middleware.

**Plan after approval (Week 1 = helper + first call sites, not full money spine)**

1. Keep the helper (already exists).
2. Call it from New-API prescription save/update if that path is live; otherwise from the live Old-API Rx-write **or** document “Rx audit on classic in M11” and wire 1–2 existing mutate endpoints (e.g. Package Save on New-API, already AdminPortal).
3. Full automatic middleware can wait if Lead prefers explicit calls (easier to exclude GET). Recommend **explicit helper calls**, not a blanket middleware that audits every POST.

**Mobile reuse**

Server-side only. Mobile mutations are audited the same way because they hit the same APIs.

**DoD:** Helper exists; at least one clinical/money mutate writes AuditEvent; later phases reuse the same interface.

**Verification:** After a mutate, `AuditEvent` has ActorUserId, Action, Entity, At. Existing Package Save / Rx still 200. GET endpoints do not spam audit rows.

---

## Main task SEC-09 — Secure documents

**Why this main task exists**

Prescriptions, reports, uploads must not be world-readable folder listings.

---

### SEC-09.02 — Multipart upload + authorised GET; no public listing

| | |
|---|---|
| Bifurcation | Web API |
| Work type | New |
| Layers | Backend Yes / Not Started · API Yes / Not Started |
| Surface | Shared |
| Code truth | **DONE** for the new API; listing of old folders is SEC-05.02 |

**What this sub-task is**

Upload multipart; GET only if owner/admin/doctor-owner. No public folder listing of the **secure** store.

**What is already done (`SecureDocumentController`)**

- `POST /api/SecureDocument/Upload` — JWT, SHA256 hash, files under `Data/SecureDocuments` (not a static request path)
- `GET /api/SecureDocument/{id}` — Admin, creator, owner User, or matching DoctorId

**Plan after approval**

Demo upload + unauthorised GET 403. Pair with SEC-05.02 for old `/attachments` listing. Mark this ticket Done independently if secure store itself is not listable.

**Mobile reuse**

Same multipart + GET. Return `secureDocumentId` as the shared handle (add to shared-key doc if Lead wants). Do not return filesystem paths.

**DoD:** Unauthenticated GET 401; other user 403; owner 200.

**Verification:** Upload as Doctor A. GET as Doctor B → 403. GET as Admin → 200. Response has no `C:\` or `/Data/SecureDocuments` path. Existing Patient Board attachments that still use classic `/attachments` are unchanged until SEC-05.02.

---

# MODULE M02 — Admin Clinical (28 Web API tickets)

Day 3–7 · P0 · Stream A-ClinicWeb

**Read this once for all `.03` tickets — then read every ID below. None are skipped.**

### What M02 already is (do not rebuild)

M02 is the Admin Portal catalogue: repertory, materia medica, diagnosis, drugs, questions, 3D body, qualifications, lab catalog, packages, menus.

Week 1 Web API work is **not a rebuild**. For each master:

1. ACL already done on Security track (`.02`, excluded here) — AdminPortal on mutate, Doctor reads on board.
2. This Web API ticket (`.03`) = **freeze the HTTP host** the existing Admin screen already uses.

**Proof common to all:** `realbackend_helper.js` W1–W7 comments, `AdminAclController.Coverage()`, `[Authorize(Policy = AdminPortal)]` on New-API mutate actions, UI `AdminProtected`.

**After approval:** confirm on UAT, update tracker if needed, **do not recode**. Remaining product work is only `ADM-B04.02` seed.

**Mobile reuse (all M02 `.03`):** Admin masters are **web Admin Portal**. Mobile/Doctor board already consumes **read** APIs (rubric search, diagnosis tabs, allopathic dropdown, 3D GET). Do not add mobile admin CRUD. Shared IDs (RemedyId, SubSectionId, etc.) stay as they are.

**Common verification for every `.03`:** Network tab on the Admin screen → expected host. Doctor mutate → 403 (New-API) or existing classic ACL. Doctor board **read** still 200. Admin list/save/delete still works.

---

## 3D Body (New-API)

### ADM-3D1.03 — 3D mesh key master host freeze

| | |
|---|---|
| Bifurcation | Web API · Existing · Day 3–7 |
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Keep mesh-key Admin CRUD on the host it already uses (New-API).

**What was done:** UI `getMeshKeyMasterList` / create / update / delete → `nigahomeoAPI`. Controller: `ThreeDBodyPartMeshKeyMasterController` mutate methods have AdminPortal. No Old-API 3D controllers.

**Plan:** Confirm Network tab → New-API. Do not switch to classic. Do not rebuild the list UI.

**DoD:** Admin mutate 200; Doctor mutate 403; GET lists still work for anatomy viewer.

---

### ADM-3D2.03 — 3D section master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Dual-API confirm for 3D section master. Do not silently switch.

**What was done:** UI anatomy section APIs → `nigahomeoAPI`. `ThreeDBodyPartSectionMasterController` AdminPortal on mutate.

**Plan:** Confirm-only. Do not rebuild.

**DoD:** Same as 3D1. Existing anatomy viewer still loads sections.

---

### ADM-3D3.03 — 3D hotspots host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Dual-API confirm for 3D hotspots. Do not silently switch.

**What was done:** Hotspot CRUD → New-API. `ThreeDBodyPartSectionHotspotController` AdminPortal on mutate. Doctor/board may GET hotspots.

**Plan:** Confirm-only.

**DoD:** Admin CRUD on New-API. Doctor GET for viewer still 200.

---

## Adverse-effect / drug masters (mostly Old-API)

### ADM-A01.03 — Drug system host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm UI still hits the correct host for Drug system. Do not silently switch.

**What was done:** Admin Drug system CRUD frozen on **Old-API** (`realbackend_helper.js` W4). Do not port to New-API this week.

**Plan:** Confirm UI still hits classic. Doctor board does not need Drug system mutate.

**DoD:** Admin Drug system still classic. Existing list/save works.

---

### ADM-A02.03 — Drug group host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Same as A01 for Drug group.

**What was done:** **Old-API**. Confirm-only.

**Plan:** Confirm UI still classic. Do not port.

**DoD:** Admin Drug group still classic.

---

### ADM-A03.03 — Allopathic drug & side effects host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** (split host is intentional) |

**What it is:** Confirm hosts for Allopathic drug & side effects. Do not silently switch.

**Split host (intentional):**

- Admin CRUD + side-effect deletes → **Old-API**
- Patient Board dropdown → **New-API** `GetAllopathicDrugfordropdown`
- New-API `AllopathicDrugController` Save/Delete and `SeriousSideEffect` Delete are AdminPortal-locked **parity**, not the SPA’s primary admin path

**Plan:** Confirm admin screens still classic; dropdown still New-API. Do not “unify” hosts.

**DoD:** Admin allopathic save still classic. Board dropdown still New-API. Doctor cannot Save on New-API (403).

---

## Business management

### ADM-B01.03 — Qualifications use newer API

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Qualifications admin must use **New-API**, not classic.

**What was done:** `getQualificationList` / create / update / delete → `nigahomeoAPI`. `QualificationController` AdminPortal on Add/Update/Delete. Registration public dropdown also New-API.

**Plan:** Confirm Network tab → New-API. Needed later for credentialing; do not rebuild the list UI.

**DoD:** Admin qualifications CRUD on New-API. Doctor mutate 403. Doctor registration still lists qualifications.

---

### ADM-B02.03 — Classic PatientLab still reads lab catalog

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Lab & imaging **catalog** admin stays classic; **board/eRx** still reads classic `PatientLab` APIs.

**What was done:** Helper comment: catalog admin → Old `PatientLabTest`; board reads classic `PatientLab`. Coverage notes: `PatientLab SaveOrder/Entry` is **not** AdminPortal (doctor clinical).

**Plan:** Confirm a board lab-order still hits classic PatientLab. Do not move catalog to New-API this week.

**DoD:** Admin catalog classic. Board lab-order classic. Doctor can still order labs.

---

### ADM-B03.03 — PackageEntryDetail is S1 SaaS only

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **DONE** (code comment) |

**What it is:** Subscription packages exist. `PackageEntryDetail` = doctor **SaaS subscription**, never reuse for S2 consult billing or S5 medicine orders.

**What was done:** Comment on `PackageService`: “PackageMaster + PackageEntryDetail are S1 SaaS subscription only — never reuse for S2 consult or S5 medicine billing.” Helper: Package admin CRUD → Old-API; doctor GetPackages → New-API. Coverage repeats the note.

**Plan:** Do not introduce consult/medicine rows into `PackageEntryDetail`. Future ledgers get new tables. Mark confirmed.

**Mobile reuse:** Doctor app upgrade-plans read `GetPackages` (New-API). Do not overload this table for medicine cart.

**DoD:** Comment + dual-API freeze remain. Widgets upgrade plans still load.

---

### ADM-B04.02 — Restore GetMenuByRole; seed Account + Pharmacy menus

| | |
|---|---|
| Bifurcation | Web API · Existing Improvement |
| Tracker | Backend Done · API Done · **Database In Progress** |
| Code truth | **PARTIAL** |

**What this sub-task is**

1. Restore `GetMenuByRole` on .NET 8 — **done**.
2. Seed menus for **Account** and later **Pharmacy** — **not applied**.

This is the **only M02 Web API leftover** that needs code/SQL after approval.

**What is already done**

`MastersAPIController.GetMenuByRole` + `MastersAPIService.GetMenuByRole` (RoleDetails.IsView → MenuMaster). IDOR harden. SPA helper exists but LayoutMenuData still hard-coded (UI ticket, skipped).

**What is missing**

`Database/Scripts/M02_W7_MenuMaster_Account_Pharmacy_Seed.sql` is a **commented template** with `TODO` ModuleId/RoleId. Running it blindly is forbidden by the file header.

**Plan after approval**

1. Resolve Account/Pharmacy RoleId from RoleMaster (M01 seed).
2. Insert MenuMaster stub URLs matching FND-02.01 (`/account/home`, …).
3. RoleDetails IsView for Account / Pharmacy only.
4. `GET /api/mastersAPI/GetMenuByRole` returns those rows.
5. Do **not** switch SPA off LayoutMenuData this week (that is ADM-B04.03 UI).

**Mobile reuse**

MenuMaster is web. Mobile uses role claims. Seed still matters so Account JWT does not inherit clinical menus if a future web shell consumes the API.

**DoD:** Database layer Done. Account user gets account stub menus only.

**Verification:** Account GetMenuByRole → account URLs only. Admin GetMenuByRole still has clinical menus. Existing Admin sidebar (hard-coded) unchanged. Doctor GetMenuByRole does not gain Account menus.

---

## Diagnosis (Old-API)

### ADM-D01.03 — Diagnosis system host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm UI still hits the correct host for Diagnosis system. Do not silently switch.

**What was done:** Admin diagnosis system → **Old-API**. Coverage: no Diagnosis controllers on New-API. Doctor reads: `DiagnosisSearch`, keyword tabs on Old.

**Plan:** Confirm-only. Do not port.

**DoD:** Admin diagnosis system classic. Doctor keyword tabs still 200.

---

### ADM-D02.03 — Diagnosis therapeutics host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Diagnosis therapeutics. Do not silently switch.

**What was done:** Admin therapeutics details → **Old-API**. Confirm-only.

**Plan:** Confirm-only. Do not port.

**DoD:** Admin therapeutics classic. Board therapeutics-by-diagnosis still works.

---

### ADM-D03.03 — Diagnosis conditions host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Diagnosis conditions. Do not silently switch.

**What was done:** Admin diagnosis Save/Delete / groups → **Old-API**. Doctor board keyword/rubric tabs stay classic.

**Plan:** Confirm-only.

**DoD:** Admin conditions classic. Board diagnosis tabs unchanged.

---

## Materia medica (Old-API)

### ADM-M01.03 — Author master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Author master. Do not silently switch.

**What was done:** Author admin CRUD → **Old-API** (`getAuthorsList` / create / delete on `api`). Confirm-only.

**Plan:** Confirm-only. Do not port.

**DoD:** Author admin still classic.

---

### ADM-M02.03 — Materia medica master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Materia medica master. Do not silently switch.

**What was done:** MM master admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** MM master admin still classic.

---

### ADM-M03.03 — Materia medica heads host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Materia medica heads. Do not silently switch.

**What was done:** Heads admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Heads admin still classic.

---

### ADM-M04.03 — Materia medica remedies admin host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Materia medica remedies. Do not silently switch.

**What was done:** Remedies/details admin → **Old-API**. New-API MM remedies details is GET-only. Confirm-only; do not switch admin save to New-API.

**Plan:** Confirm-only.

**DoD:** Remedies admin still classic. Any New-API GET-only details still work for readers.

---

## Questions (Old-API primary)

### ADM-Q01.03 — Question section / group / subgroup host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Question section, group & sub-group. Do not silently switch.

**What was done:** Admin question taxonomy → **Old-API**. New-API `QuestionSection/Group/SubGroup` controllers exist as **locked parity** (AdminPortal), not the SPA primary host (`realbackend_helper.js` W5).

**Plan:** Confirm admin UI still classic. Do not silently point SPA at New-API.

**DoD:** Admin taxonomy classic. New-API parity stays locked (Doctor 403 on mutate). Existing question tree on Admin still loads.

---

### ADM-Q02.03 — Clinical questions host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Clinical question mapping. Do not silently switch.

**What was done:** Clinical questions + keywords admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Clinical questions admin still classic. Board question usage unchanged.

---

## Repertory (Old-API admin; some New-API parity / Excel)

### ADM-R01.03 — Repertory section host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Repertory sections. Do not silently switch.

**What was done:** Section admin → **Old-API** (`getSectionList` / create / delete on `api`). New-API `SectionController` mutate is AdminPortal parity. SPA uses classic.

**Plan:** Confirm-only. Do not port SPA.

**DoD:** Section admin classic. Doctor 403 on New-API AddSection.

---

### ADM-R02.03 — Subsection & rubrics host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Subsection & rubric tree. Do not silently switch.

**What was done:** Subsection/rubric admin → **Old-API**. Doctor search `SearchRubricsByKeyword` is New-API (read). Do not switch admin host.

**Plan:** Confirm-only.

**DoD:** Admin tree classic. Board rubric search still New-API 200.

---

### ADM-R03.03 — Rubric–remedy mapping host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** (split host is intentional) |

**What it is:** Confirm hosts for Rubric–remedy mapping. Do not silently switch.

**Split:** save + Excel on **New-API** (`saveUpdateRubricRemedy` → `nigahomeoAPI`); other repertory admin stays classic. Coverage lists RubricRemedy on both with Excel on New.

**Plan:** Confirm save/Excel still New-API. Do not move the rest.

**DoD:** Save/Excel New-API. Other repertory admin classic. Doctor Excel mutate 403. Board rubric search unchanged.

---

### ADM-R04.03 — Remedy-linked rubrics host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Remedy-linked rubrics. Do not silently switch.

**What was done:** Remedial-rubrics admin/view stays on the **already used** host (classic list UI; do not switch). Confirm-only.

**Plan:** Confirm-only.

**DoD:** Screen still hits the frozen host. Existing list works.

---

### ADM-R05.03 — Language master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Language master. Do not silently switch.

**What was done:** Language admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Language admin classic.

---

### ADM-R06.03 — Body part master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Body part master. Do not silently switch.

**What was done:** Body part admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Body part admin classic.

---

### ADM-R07.03 — Intensity master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Intensity master. Do not silently switch.

**What was done:** Intensity admin → **Old-API**. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Intensity admin classic.

---

### ADM-R08.03 — Remedy master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Remedy master. Do not silently switch.

**What was done:** Remedy admin → **Old-API**. New-API `RemedyController` mutate is locked parity. Confirm SPA still classic.

**Plan:** Confirm-only.

**DoD:** Remedy admin classic. Doctor 403 on New-API mutate. Board remedy reads unchanged.

---

### ADM-R09.03 — Remedy grade master host freeze

| | |
|---|---|
| Tracker | Backend Done · API Done |
| Code truth | **CONFIRM-ONLY DONE** |

**What it is:** Confirm host for Remedy grade master. Do not silently switch.

**What was done:** Remedy grade admin → **Old-API**. Same parity pattern. Confirm-only.

**Plan:** Confirm-only.

**DoD:** Grade admin classic. Existing grade dropdowns still work.

---

# MODULE M16 — Patient APIs (2 Web API tickets)

Day 5–7 · **P1 Parallel must finish** · Stream B-PatientEco  
Surface: Patient App (API now) — **build on New-API so mobile can call them unchanged.**

Web UI for these (`CON-01.03`, `CON-02.03`) is **out of this plan**.

---

## Main task CON-01 — Family members under one account

**Why this main task exists**

One Patient login can manage spouse/child records and book as that member. Shared keys: `PatientId` / `PatientAppId` of the member must be real patients, not a parallel “family row only” that appointments cannot see.

---

### CON-01.02 — API: CRUD family; book-as-member

| | |
|---|---|
| Bifurcation | Web API · New |
| Layers | Backend / Database / API all Yes · Not Started |
| Code truth | **NOT STARTED** |

**What this sub-task is**

New-API endpoints (suggested shape — confirm in implementation):

- `GET /api/Family` — list members for the logged-in patient
- `POST /api/Family` — add member (creates/links Patient with shared `PatientId`)
- `PUT /api/Family/{id}` — update
- `DELETE /api/Family/{id}` — soft delete
- Booking APIs accept `patientId` of a member **only if** caller owns that family link

**What is already done**

Nothing for Family. Patient CRUD exists for **doctors**. Consent types exist. No Family table. No Family controller.

**Plan after approval**

1. New tables on the **shared** DB (Database sibling is out of this filter but required): e.g. `PatientFamilyMember` (`OwnerPatientId`, `MemberPatientId`, `Relation`, `DeleteStatus`).
2. Controller + DTOs on **New-API only**. Do not add this to Old-API.
3. JWT: Patient role (and later caregiver). Never trust client `OwnerPatientId`.
4. Book-as-member: appointment create checks membership before using member `PatientId`.
5. Return shared keys in JSON (`patientId`, `patientAppId` if used).
6. Swagger + sample JSON for mobile.

**Mobile reuse**

**Primary consumer is Patient mobile (M17).** Web Patient Website (later) uses the same URLs. Do not add `/api/mobile/Family`.

**Depends on:** M01 OTP optional; Patient identity model; FND-01.01 keys.

**DoD:** CRUD works; booking as member works; booking as a non-member PatientId returns 403.

**Verification:** Add child → list includes child with real `patientId`. Book as child → 200. Book as a random PatientId → 403. Doctor Patient Board for that child still works (same PatientId). Existing doctor-created patients unaffected.

---

## Main task CON-02 — Caregiver authorization

**Why this main task exists**

A family member (or other adult) may book and manage **on the patient’s behalf**, with grant/revoke and an authorisation check on booking.

---

### CON-02.02 — API: grant / revoke / list; booking authorisation check

| | |
|---|---|
| Bifurcation | Web API · New |
| Layers | Backend / Database / API all Yes · Not Started |
| Code truth | **NOT STARTED** |

**What this sub-task is**

- Grant caregiver access (patient → caregiver user)
- Revoke
- List grants for me (as patient or as caregiver)
- Booking APIs must check an **active grant** before a caregiver acts as the patient

**What is already done**

`ConsentType.Caregiver` seeded. `ConsentController` can store a Caregiver consent **type**, but that is not grant/revoke with booking rights. No CaregiverGrant table. OTP exists for a later Integration ticket (`CON-02.04`, excluded) to OTP-on-grant.

**Plan after approval**

1. Table e.g. `CaregiverAuthorization` (`PatientId`, `CaregiverUserId`, `GrantedAt`, `RevokedAt`, `Scope`).
2. On Grant: also `Consent/Grant` with type Caregiver (reuse SEC-06, do not fork).
3. New-API controller only: Grant, Revoke, ListMine (as patient), ListActingFor (as caregiver).
4. Hook the same check into appointment create (and later prescription pickup).
5. Do **not** wait for SMS vendor to ship the API; OTP-on-grant is a separate Integration row.

**Mobile reuse**

Same endpoints for Patient app. Doctor app does not grant caregivers. Shared `PatientId` + `UserId` of caregiver.

**DoD:** Caregiver can book only while grant is active; after revoke, 403. List matches grants. Consent audit does not contain clinical notes.

**Verification:** Grant → caregiver books → 200. Revoke → same book → 403. ListMine matches. ConsentRecord has Caregiver type+time only. Existing doctor booking path still works without caregiver checks for Doctor/Reception JWTs.

---

## 7. Cross-cutting API rules (web + mobile)

When any approved Web API is built:

1. **Host:** New-API except Login / Rx-write / Razorpay until cut-over.
2. **Auth:** JWT Bearer. Role from claims, not from the body.
3. **Ownership:** JWT `DoctorID` / user id; never trust client ids.
4. **JSON:** Include shared keys from FND-01.01. Prefer one field name and document camelCase vs PascalCase once.
5. **Errors:** 401 unauthenticated, 403 wrong role/owner, 400 validation, 429 OTP rate-limit. No stack traces.
6. **No third API. No `/api/mobile/*` duplicates.**
7. **Do not email plaintext passwords. Do not return OTP codes in production.**
8. **Do not list static folders.**
9. **Regression:** after each ticket, Admin / Doctor / Reception login + one Patient Board action + one Admin master still work.

---

## 8. Suggested tracker updates (no code)

Excel Overall Status is empty; layer dropdowns drive dashboards. After Lead agrees with **code truth**, update yellow cells:

| IDs | Suggested layer update |
|---|---|
| FND-01.03 | Backend Done, API Done (rule already in helper) |
| SEC-01.02, SEC-02.02, SEC-06.02, SEC-06.03, SEC-07.02, SEC-07.03, SEC-09.02 | Backend/API Done |
| SEC-04.01 | Backend/API Done for GetMenuByRole; note money APIs deferred |
| ADM-*.03 (except B04.02) | already Done — leave, or confirm UAT then leave |
| ADM-B04.02 | keep Database In Progress until seed applied |
| All Web Frontend in this doc | remain Not Started until Wave 4 |
| CON-01.02, CON-02.02 | remain Not Started |

---

## 9. Approval checkpoint

This document is **plan only**. Nothing has been implemented from this pass.

Please approve one of:

1. **Full remaining queue** — Waves 0–5 as in Section 5 (recommended to complete S1 Week 1).
2. **API-only first** — Waves 0–3 + 5 (no Web Frontend shells).
3. **Frontend-only first** — Wave 4 (needs Logout/reset APIs, which already exist).
4. **Single ticket** — reply with a Sub Task ID (example: `SEC-01.03`).

When you approve, implementation starts **one ticket at a time** in that order. M02 masters will not be rebuilt. New APIs will be added **only** in New-API. After each ticket we will verify new behaviour **and** existing Admin / Doctor / Reception flows.

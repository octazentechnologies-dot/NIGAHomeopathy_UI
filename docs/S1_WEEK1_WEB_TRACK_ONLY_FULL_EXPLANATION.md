# S1 Week 1 — Web track only: full explanation and plan

_Reference document. **No implementation until you approve.**_

| Field | Value |
|---|---|
| Source | `NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx` → sheet **S1_Week1** |
| Sprint | S1 · Day 1–7 · Foundation, Admin closeout, mobile bootstrap |
| Filter | **Track = Web only** |
| Excluded | UI track, Mobile track, QA track, Work Bifurcation **UI / Other / Mobile\*** |
| Repos this plan uses | **New-API** (`NIGA_NewAPI`), **Old-API** (`NIGA_OldAPI`). SPA evidence is cited only to prove dual-API/ACL already done. |
| Streams | A-ClinicWeb (91) + B-PatientEco (5) |

---

## How to read this document

1. A **Main Task** is one product capability (example: Secure login).
2. A **Sub Task** is one ticket (example: hash UserMaster passwords).
3. **Tracker layer status** is what the Excel yellow dropdowns currently say (Frontend / Backend / Database / API / Integration).
4. **Code reality** is what is actually in New-API / Old-API **today** after a full pass of controllers, SQL scripts, and auth middleware. Tracker still says Not Started for most of M01 even when the code exists — that mismatch is called out on every ticket.
5. **Your Web implementation queue** = subtasks whose code reality is Not Started or Partial. Done M02 harden tickets stay in this doc so you can see *exactly* what “done” means and **not redo them**.
6. After you approve, we implement **one Web ticket at a time** in the wave order below. We will not start UI-track work (Account layout, fakeBackend removal, menu SPA wiring, reset-password page) unless you explicitly expand scope.

### Words used everywhere

| Term | Meaning |
|---|---|
| **Old-API / classic** | `Old-API/NIGA_OldAPI` — live clinic login, most admin CRUD, Rx-write, Razorpay |
| **New-API / .NET 8** | `New-API/NIGA_NewAPI/Niga-Web` — new modules, M01 security tables, 3D, GetMenuByRole, OTP, consent |
| **AdminPortal policy** | JWT RoleId **1** or role name **Admin** / **Management**. Applied on mutate APIs. |
| **Dual-API freeze** | Keep the HTTP host the existing admin screen already uses. Do not switch Old ↔ New silently. |
| **PBKDF2** | Password hash format `PBKDF2$v1$…` used on both APIs (not bcrypt). |
| **Do not rebuild** | M02 screens already work. Week 1 only ACL + host freeze. |

---

## 1. Scope included vs skipped

S1_Week1 has **178** rows. This document keeps **96 Web** rows and drops the rest.

| Track | Rows on S1_Week1 | In this doc? |
|---|---:|---|
| Web | 96 | **Yes — every row, one by one** |
| UI | 9 | **No** (Account/Pharmacy shells, fakeBackend, reset page, menu SPA, family UI) |
| Mobile | 25 | **No** |
| QA | 48 | **No** |

Web Work Bifurcation inside this doc:

| Lane | Count | Typical work |
|---|---:|---|
| Web API | 43 | Controllers, contracts, dual-API freeze |
| Security | 27 | AdminPortal ACL on M02 mutates |
| Web Other | 15 | Client decisions, config, architecture rules |
| Database | 10 | New tables / seeds |
| Integration | 1 | OTP on caregiver grant |

Modules: **M00** (11) · **M01** (24) · **M02** (56) · **M16** (5). Main tasks: **44**.

---

## 2. Status snapshot

### Tracker layers (Excel)

Overall Status column on S1_Week1 is empty; status lives on the yellow layer dropdowns.

| Layer | Yes | Done | In Progress | Not Started |
|---|---:|---:|---:|---:|
| Frontend | 28 | 27 | 0 | 1 (`FND-01.02`) |
| Backend | 85 | 56 | 0 | 29 |
| Database | 16 | 0 | 2 (`ADM-B04.*`) | 14 |
| API | 69 | 55 | 0 | 14 |
| Integration | 5 | 0 | 0 | 5 |

Almost every **Done** layer is an M02 ACL (`.02`) or dual-API (`.03`) ticket. Almost every **Not Started** layer is M00 / M01 / M16 — but **code already covers a large part of M01**.

### Code reality (this audit)

| Code reality | Subtasks | What it means |
|---|---:|---|
| Done / standing rule | **64** | Do not rebuild. Verify SQL applied, then update tracker. |
| Partial / in progress / mostly done | **13** | Finish the gap listed on the ticket. |
| Not started | **19** | Real remaining Web work (mostly M00 decisions + M16 + a few M01 gaps). |

The important mismatch: **Excel still says M01 Not Started; New-API already contains Account login/password/OTP/consent/SecureDocument/Audit tables and controllers, plus `M01_Foundation_Security_Server.sql`.** Treating M01 as a green-field rebuild would duplicate working code.

---

## 3. What is already done (read this before planning)

### 3.1 M01 Foundation & Security — largely built, tracker stale

New-API script: `NIGA_NewAPI/Database/Scripts/M01_Foundation_Security_Server.sql`  
Auth host: `Niga-Web/Program.cs` (JWT Bearer + AdminPortal policy)  
Account surface: `Niga-Web/Controllers/AccountController.cs`

| Area | What exists in code | Gap vs ticket |
|---|---|---|
| Password hashing | PBKDF2 + lazy migrate + column NVARCHAR(500) + bulk migrate endpoint | Confirm ALTER on shared DB; leftover plaintext until login |
| Login JWT | Old-API live `POST /api/Account/Login`; Role + DoctorID claims | Do not cut over UI to New-API yet |
| Password reset | New-API Forgot/Reset/Change + PasswordResetToken | Email config; UI page is UI-track |
| Logout | Both APIs write UserLoginStatus; New-API denylist **write** | Denylist **not enforced** on next request |
| GetMenuByRole | Restored on New-API mastersAPI | Account/Pharmacy seed incomplete |
| Consent | ConsentType/ConsentRecord + Grant/Withdraw/List/Audit | AudioCaseConsentLog still a fork |
| OTP | Request/Verify/Audit + tables | SMS stub until PRE-03.02 |
| AuditEvent | Table + writer | Writer not on money/Rx yet (those APIs not in Week 1) |
| SecureDocument | Table + upload/authorised GET | `/attachments` directory browser still ON |
| Doctor ownership | Helper `DoctorOwnership` | **Not called** from Patient/Appointment/Case/Rx |
| Roles | SQL seed Patient/Account/PharmacyPartner; UI enums | No C# enum; unused roles stay unused |
| Settlement/GST | — | Missing (M00) |

Old-API still owns **live login**. New-API AccountController is the future cut-over + the only full Forgot/Reset/Change.

### 3.2 M02 Admin clinical — keep and harden (do not rebuild)

Week 1 did **not** ask for new admin screens. For each master it asked two things:

1. **`.02` ACL** — only Admin Portal may mutate; Doctor is read-only on Patient Board.
2. **`.03` Dual-API** — freeze Old vs New host; do not silently switch.

**How ACL works today (this is the “exactly what was done”):**

**API (the real lock)**  
`AdminAuthorizationPolicies.AdminPortal` = RoleId `1` or role name Admin/Management. Mutate methods on New-API 3D / repertory / questions / qualifications / packages / allopathic use `[Authorize(Policy = AdminPortal)]`. Matching mutate methods on Old-API clinical masters use the same policy (with a few known GET-anonymous gaps on Package/Lab class-level auth).

**SPA (route lock, not per-button)**  
`AdminProtected` + `canAccessAdminPortal()` wrap `admin/*` and `/dashboard`. Doctor/Reception go to `/doctordashboard`. `canMutateAdminMasters` is exported but **unused** on list pages. That is acceptable for “do not rebuild”.

**Dual-API freeze (this is what `.03` Done means):**

| Frozen on New-API (`nigahomeoAPI`) | Frozen on Old-API (`api`) | Split |
|---|---|---|
| 3D mesh, 3D section, 3D hotspot | Drug system, Drug group | Allopathic admin list Old; extra Save on New |
| Qualifications | Lab catalog admin, Packages admin | Rubric–remedy **save + Excel** on New |
| GetMenuByRole | Diagnosis trio, Author, Materia medica, Language, Body part, Intensity, Remedy, Remedy grade, Roles CRUD, Question admin UI | Repertory section/subsection: both APIs have CRUD; **UI host must stay as-is** |

**Exception still open:** **ADM-B04** Roles & menus (GetMenuByRole restored; Account/Pharmacy **seed** not live).

### 3.3 What we will not do in this Web plan

These are **UI-track** siblings on the same sprint (excluded on purpose):

- FND-02.01 Account layout + Pharmacy stub  
- FND-02.02 per-route ACL skeleton  
- SEC-01.03 remove `fakeBackend()` from `App.js`  
- SEC-02.03 reset-password page  
- SEC-03.02 call `logoutApi()` from Logout.js  
- SEC-04.02 hide Velzon demo routes  
- ADM-B04.03 consume menu API in LayoutMenuData  
- CON-01.03 / CON-02.03 family UI (Phase 16)

---

## 4. Plan for remaining Web work (implementation order — wait for approval)

Nothing below will be coded until you say so.

### Wave 0 — Client / documentation (Days 1–2)
M00 PRE-01, PRE-02, PRE-03 plus FND-01.01 shared-key note and FND-02.04 portal map. Engineering only records `SettlementModel` (PRE-01.03) after finance signs. These block later money, SMS, video, GST.

### Wave 1 — Real remaining M01 code (New-API, Days 2–6)
1. Confirm M01 SQL applied on the **shared** HomeoCentrum DB (SEC-01.01 / all SEC-*.01 tables).  
2. Hook JWT denylist on `OnTokenValidated` (SEC-03.01).  
3. Remove `UseDirectoryBrowser` for `/attachments` and `/Blogs` (SEC-05.02).  
4. Call `DoctorOwnership` from Patient, Appointment, Case, Rx, notes, labs, board backup (SEC-05.01).  
5. Add `AccountPortal` policy + seed so Admin cannot do Account money and Account cannot mutate masters (SEC-04.03) — policy can exist before M08 screens.  
6. Leave OTP SMS as stub until PRE-03.02; do not fake a vendor.  
7. Treat AuditEvent helper as DoD for SEC-08.02 unless you want middleware now.

### Wave 2 — Mark tracker Done after verification (no rebuild)
Login JWT, password reset APIs, consent APIs, OTP verify/audit, SecureDocument, GetMenuByRole. **Verify on UAT**, then flip Excel layers from Not Started → Done so M01 stops looking untouched.

### Wave 3 — M02 leftover
ADM-B04.01 seed Account/Pharmacy MenuMaster rows.  
ADM-B04.02 confirm GetMenuByRole returns them. (SPA consume = UI-track, later.)

### Wave 4 — M16 New-API (Days 5–7)
FamilyMember table + CRUD + book-as-member.  
CaregiverAuth table + grant/revoke/list + booking check.  
OTP on grant (uses SEC-07; SMS may still be stub).

### Wave 5 — Do not touch
All M02 `.02` ACL and `.03` dual-API tickets already Done, except ADM-B04.

### Standing rule on every wave
**FND-01.03** — new APIs on New-API only; never a third host; never silently switch an existing admin master.

---

## 5. Dual-API host cheat sheet (keep forever)

| Call | Host |
|---|---|
| Login, Logout (live SPA), Rx-write, Razorpay | Old-API |
| Forgot / Reset / Change password | New-API |
| GetMenuByRole, AdminAcl probes | New-API |
| 3D mesh / section / hotspot | New-API |
| Qualifications admin | New-API |
| Rubric–remedy save + Excel import/export | New-API |
| OTP, Consent, SecureDocument, AuditEvent | New-API |
| Drug system/group, Diagnosis, Author, MM, Language, Body part, Intensity, Remedy, Remedy grade, Roles CRUD, Lab catalog admin, Package admin, Question admin UI | Old-API |
| Family / Caregiver (when built) | New-API |

---

## 6. Main tasks and subtasks — complete, one by one

Each subtask below has: tracker text, layers, **plain-English explanation**, **code reality**, **plan**, **definition of done**.


# Module M00 — PRE Client gates


**When:** Day 1–2. **Work type:** mostly Client Decision + Configuration.  
**Owner:** Product/finance/legal with a tech lead taking notes. Developers do not invent Razorpay splits or GST rates.

If Wave 0 is skipped, M07 Payments / M08 Account / M12 Telemedicine / M13 SMS will be built on guesses and rewritten.

Web subtasks in this module: **11**.


---

## PRE-01 — Decide settlement model — Homeocentrum holds all money (food-delivery / quick-commerce pattern)

- Module: `M00` PRE — Client gates
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 1–2
- PDF feature: Every transaction passes through Homeocentrum
- Sibling subtasks: `PRE-01.01`, `PRE-01.02`, `PRE-01.03`

### Why this main task exists

Homeocentrum is supposed to work like Swiggy/Zomato for clinic money: **the platform is the merchant of record**. Every consult fee, medicine order, and subscription should hit Homeocentrum first; clinics/doctors get a payout later. If this is not decided, later Payment (M07) and Account (M08) screens will guess a split model and you will have to rewrite them.


### Subtask `PRE-01.01` — Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** A finance workshop, not a pull request. Confirm in writing that Homeocentrum (not the individual clinic) is the merchant of record for (1) consult, (2) medicine, (3) subscription.

**Why it matters:** Razorpay account, invoices, refunds, and GSTIN all hang off this. If clinics are their own merchants, the whole ledger design changes.

**Done looks like:** A signed/noted decision (email, Notion, or tracker comment) that finance agrees. No API.

**You must not:** Start coding payouts or hardcoding clinic-split Razorpay accounts.


#### Code reality (detail)

Client workshop. No SettlementModel in either API.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Workshop with finance: confirm Homeocentrum is single merchant of record for consult + medicine + subscription | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-01.02` — Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = **Not Started**; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts | Integration Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Choose v1 payout mechanic:
- **A)** Homeocentrum holds funds, then pays clinics by NEFT/IMPS on a schedule, or
- **B)** Razorpay Route / linked accounts (auto-split at capture).

**Why it matters:** Option A is simpler to build (ledger + bank file). Option B needs Razorpay Route onboarding and different webhooks.

**Done looks like:** One option written as v1. Integration layer on the tracker can then be planned.

**Blocked by:** PRE-01.01.


#### Code reality (detail)

Payout mechanic not chosen. No Razorpay Route / linked-account code.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Choose v1 payout mechanic: Homeocentrum-held + NEFT/IMPS vs Razorpay Route / linked accounts | Integration Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-01.03` — Record decision in config (SettlementModel) — engineering must not hardcode a split model

| | |
|---|---|
| Work type | Configuration |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Record decision in config (SettlementModel) — engineering must not hardcode a split model | Backend Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do (after the decision):** Store the choice as configuration, e.g. `SettlementModel = PlatformHeld` vs `RazorpayRoute`, in appsettings or a small config table on **New-API**. Every later money API reads this flag.

**Why it matters:** If a developer hardcodes “always split to clinic”, you cannot change business policy without a code release.

**Code today:** No SettlementModel anywhere.

**Done looks like:** Config key exists; default matches the signed decision; no hardcoded split in payment code (payment code itself is later sprints).


#### Code reality (detail)

No SettlementModel config table/appsetting. Do not hardcode a split model later.


#### Plan (do not implement until approved)

1. Wait for the sibling decision.
2. Add config on New-API (appsettings or small table).
3. Read the value from later money/SMS code — do not hardcode.


#### Definition of done

- Demo proves: Record decision in config (SettlementModel) — engineering must not hardcode a split model | Backend Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## PRE-02 — Decide reception cash policy — clinic retains vs remits to Homeocentrum

- Module: `M00` PRE — Client gates
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 1–2
- PDF feature: Reception payment collection
- Sibling subtasks: `PRE-02.01`, `PRE-02.02`, `PRE-02.03`

### Why this main task exists

Reception can collect cash in the clinic. The PDF asks whether that cash **stays with the clinic** or is **remitted to Homeocentrum**, plus GST and commission. Wrong answer here breaks Account portal reports.


### Subtask `PRE-02.01` — OQ: cash collected at reception retained by clinic or remitted to Homeocentrum?

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: OQ: cash collected at reception retained by clinic or remitted to Homeocentrum? | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Answer the open question: cash at reception — clinic retains vs remits to Homeocentrum.

**Done looks like:** Written policy. If retain: reception receipts are clinic-local. If remit: reception must record a payable to Homeocentrum.

**You must not:** Build the reception cash screen in Week 1 (that is M06/M07).


#### Code reality (detail)

Open question. Reception cash flow not modelled.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: OQ: cash collected at reception retained by clinic or remitted to Homeocentrum? | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-02.02` — Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN)

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN) | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Document GST: on consult fee, platform fee, medicine — **which amount** is taxable and **which GSTIN** (platform vs clinic vs pharmacy).

**Done looks like:** A one-pager finance can sign. Engineering later puts GST % and GSTIN in config (M08).


#### Code reality (detail)

GST treatment not documented. No GSTIN config.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Document GST treatment on consult fee, platform fee, and medicine (on which amount, which GSTIN) | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-02.03` — Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code

| | |
|---|---|
| Work type | Configuration |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code | Backend Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Confirm three numbers as configuration, not code:
1. Commission % Homeocentrum keeps
2. Settlement hold **T+N** days
3. Invoice numbering series (who issues which invoice)

**Code today:** None of these exist.

**Done looks like:** Values written; later M08 reads them from config.


#### Code reality (detail)

No commission %, T+N hold, or invoice-series config.


#### Plan (do not implement until approved)

1. Wait for the sibling decision.
2. Add config on New-API (appsettings or small table).
3. Read the value from later money/SMS code — do not hardcode.


#### Definition of done

- Demo proves: Confirm commission %, settlement hold T+N days, invoice numbering series — configuration not code | Backend Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## PRE-03 — Vendor and legal gates — video SDK, SMS, WhatsApp, push, DPDP copy

- Module: `M00` PRE — Client gates
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 1–2
- PDF feature: Telemedicine + notifications + consent
- Sibling subtasks: `PRE-03.01`, `PRE-03.02`, `PRE-03.03`, `PRE-03.04`, `PRE-03.05`

### Why this main task exists

Before telemedicine, OTP, WhatsApp, and legal pages can be built, the **client** must pick vendors and lawyers must draft copy. Engineering only stubs adapters until then.


### Subtask `PRE-03.01` — Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host) — required for §10

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = **Not Started**; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host) — required for §10 | Integration Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Pick one video vendor for **browser + mobile**: Agora, Twilio, Daily, or self-hosted WebRTC. Required for PDF §10 (telemedicine).

**Done looks like:** Vendor name + whether in-browser SDK is licensed.

**You must not:** Integrate the SDK in Week 1.


#### Code reality (detail)

No video SDK integration. Required before Phase 11 telemedicine.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Select in-browser + mobile video vendor (Agora / Twilio / Daily / WebRTC self-host) — required for §10 | Integration Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-03.02` — Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment/OTP/cancel

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = **Not Started**; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment/OTP/cancel | Integration Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Pick SMS provider (MSG91 / Twilio / …) and confirm **DLT templates** for appointment, OTP, cancel (India DLT is mandatory for bulk SMS).

**Code today:** New-API OTP returns `SMS stub — provider not configured`.

**Done looks like:** Vendor + DLT template IDs listed. Then SEC-07.02 adapter can be filled (still a later small task).


#### Code reality (detail)

OTP SMS is a stub in New-API. No MSG91/Twilio/DLT templates.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Select SMS provider (MSG91 / Twilio / etc.) and confirm DLT templates for appointment/OTP/cancel | Integration Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-03.03` — Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) drafted for §4 + §17

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) drafted for §4 + §17 | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Legal drafts — privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) for PDF §4 and §17.

**Done looks like:** Draft documents. Feeds SEC-06 consent types and patient-website copy (M10). Not code.


#### Code reality (detail)

Privacy/terms drafts are a legal deliverable, not code.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: Legal: privacy (data protection, recording, pharmacy consent) and terms (payments, refunds, telemedicine, medicine orders) drafted for §4 + §17 | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-03.04` — OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Open question — if a patient starts booking but does not pay, how long is the slot **held** vs released immediately?

**Done looks like:** A duration (e.g. 10 minutes) or “release immediately”. Appointment APIs in M05 will use this.


#### Code reality (detail)

Unpaid booking hold duration not decided.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: OQ: unpaid-booking slot hold duration vs release immediately if patient does not pay | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `PRE-03.05` — OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic?

| | |
|---|---|
| Work type | Client Decision |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M00_PRE_Client_Gates for PDF refs / source area. |
| Tracker DoD | Demo proves: OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic? | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Open question for live doctors already in the DB: auto-Approve them, or keep unverified doctors visible only inside their own clinic?

**Done looks like:** Backfill rule written. Affects doctor directory on Patient Website (M10), not Week 1 code.


#### Code reality (detail)

Doctor credentialing backfill policy not decided.


#### Plan (do not implement until approved)

1. Schedule the decision owner (finance / legal / product).
2. Write the answer in the tracker / a signed note.
3. Only then open a New-API config ticket if the sibling `.03` needs a flag.


#### Definition of done

- Demo proves: OQ: live-doctor credentialing backfill — auto-Approve existing doctors? Unverified doctors visible only to own clinic? | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.

# Module M01 — Foundation & Security


**When:** Day 2–6. **Work type:** New security tables + harden login/session/ACL.  
**Owner:** New-API backend. Old-API login URL stays live.

Read §3.1 first. Many tickets are already in `AccountController`, `OtpController`, `ConsentController`, `SecureDocumentController`, and `M01_Foundation_Security_Server.sql`. The plan is **gap-close + verify**, not a second implementation.

Web subtasks in this module: **24**.


---

## FND-01 — One connected ecosystem — shared keys so a patient, appointment, prescription and payment created anywhere are visible everywhere

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: One connected ecosystem serving six types of users
- Sibling subtasks: `FND-01.01`, `FND-01.02`, `FND-01.03`

### Why this main task exists

The product is one ecosystem: a patient created in clinic web, an appointment from mobile, a prescription, and a payment must all share **stable IDs** so reports and the patient app can join them. Week 1 is the design + role seeds, not building every module.


### Subtask `FND-01.01` — Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list (created/rescheduled/cancelled/paid/signed/accepted)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list (created/rescheduled/cancelled/paid/signed/accepted) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Publish a short design note (markdown in New-API/docs is enough) listing shared keys and domain events.

**Shared keys the tracker names:**
| Key | Meaning | In code today |
|---|---|---|
| DoctorId | Treating doctor | JWT claim `DoctorID`; Doctor table |
| PatientId | Clinic patient | Patient table |
| PatientAppId | Appointment id (name is legacy) | `PatientAppointment.PatientAppId` |
| CaseId | Case-taking record | `CaseEntryDetail.CaseId` |
| ErxId | Digital prescription | **Missing as a named id** |
| LedgerTxnId | Money ledger row | **Missing** |
| MedicineOrderId | Pharmacy order | **Missing** |

**Events to list:** created / rescheduled / cancelled / paid / signed / accepted.

**Done looks like:** A design page teammates can link from later modules. Not a new microservice.


#### Code reality (detail)

DoctorId/PatientId/CaseId/PatientAppId exist as FKs and JWT claims. ErxId, LedgerTxnId, MedicineOrderId and a published event catalogue are missing.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Publish shared-key design (DoctorId, PatientId, PatientAppId, CaseId, ErxId, LedgerTxnId, MedicineOrderId) and event list (created/rescheduled/cancelled/paid/signed/accepted) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `FND-01.02` — Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = **Not Started**; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **MOSTLY DONE IN CODE (tracker still Not Started)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused) | Frontend Done | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Ensure RoleMaster (DB) and any server/UI enums know: **Patient, Account, PharmacyPartner** in addition to Admin / Doctor / Reception. Keep Management / Supervisor / Inspector in the list but **unused**.

**Already in code:**
- SQL `M01_Foundation_Security_Server.sql` inserts the three new roles if missing.
- UI `src/Components/constants/roles.js` already has all 9 names.
- Login still only routes Admin vs Doctor/Reception.

**Still missing:** a single C# role enum (optional); confirming the SQL ran on the shared HomeoCentrum DB; home-paths for the new roles (those home-paths are **UI-track**, excluded here).

**Frontend=Yes on this Web row** only means the enum must exist in the SPA constants — that part is already done. Do not rebuild login screens here.


#### Code reality (detail)

SQL seeds Patient/Account/PharmacyPartner in RoleMaster. UI `roles.js` already lists all 9 names. No shared C# enum. Management/Supervisor/Inspector stay unused as required.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Add role enum values Patient, Account, PharmacyPartner alongside existing Admin/Doctor/Reception (keep unused Management/Supervisor/Inspector unused) | Frontend Done | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `FND-01.03` — All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic API only where login/Rx-write/Razorpay already live until ported

| | |
|---|---|
| Work type | Existing Modification |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE AS STANDING RULE** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic API only where login/Rx-write/Razorpay already live until ported | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Treat this as a **permanent placement rule**, not a feature:

1. New domain HTTP APIs → **New-API** (`Niga-Web`, .NET 8) only.
2. Do **not** create a third API.
3. Keep on **Old-API** until an explicit cut-over: Login, Rx-write, Razorpay.

**Already in code:** Comment at the top of `realbackend_helper.js`. Dual-API is how the UI already works.

**Done looks like:** Every new Week 1+ controller lands in New-API. Code review rejects a third host.


#### Code reality (detail)

UI helper comments + practice: new modules on New-API; Login/Rx-write/Razorpay stay on Old-API. Discipline must continue — not a one-time ticket.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: All new domain modules on NigaHomeopathy-API (.NET 8); do not create a third API; classic API only where login/Rx-write/Razorpay already live until ported | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## FND-02 — Delivery footprint — 2 mobile apps · 5 web portals · payment · telemedicine · digital prescription · HomeoMeds (programme skeleton)

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Delivery covers
- Sibling subtasks: `FND-02.04`

### Why this main task exists

The PDF delivery footprint is 2 mobile apps + 5 web portals + payment + telemedicine + eRx + HomeoMeds. Week 1 Web only asks for a **written map** of the five portals (FND-02.01/02 are UI-track shells — excluded).


### Subtask `FND-02.04` — Document the five portals: Patient Website, Doctor Web Portal, Reception Portal, Admin Portal, Account Department (Pharmacy console is HomeoMeds, not a 6th portal in the PDF count)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | N/A (decision / docs — no code layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Document the five portals: Patient Website, Doctor Web Portal, Reception Portal, Admin Portal, Account Department (Pharmacy console is HomeoMeds, not a 6th portal in the PDF count) | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Write the five-portal map so nobody invents a sixth “Pharmacy portal” inside clinic web.

| Portal | Who | What |
|---|---|---|
| Patient Website | Patients | Book, pay, reports (M10) |
| Doctor Web Portal | Doctors | Patient Board, cases, Rx |
| Reception Portal | Reception | Appointments, cash, check-in (M06) |
| Admin Portal | Admin/Management | Clinical masters (M02) |
| Account Department | Account role | Money, GST, settlements (M08) |

**Pharmacy console = HomeoMeds (M15), not portal #6.**

**Done looks like:** This table in an internal doc. No new screens in Week 1.


#### Code reality (detail)

Five-portal map is not written as an engineering doc. Pharmacy is HomeoMeds, not a 6th portal.


#### Plan (do not implement until approved)

1. Implement on New-API only (FND-01.03).
2. Follow the subtask text exactly.
3. Swagger/Postman: success, 401, validation fail.


#### Definition of done

- Demo proves: Document the five portals: Patient Website, Doctor Web Portal, Reception Portal, Admin Portal, Account Department (Pharmacy console is HomeoMeds, not a 6th portal in the PDF count) | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-01 — Secure login — protected credentials for every user type

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Secure login
- Sibling subtasks: `SEC-01.01`, `SEC-01.02`

### Why this main task exists

Every user type must log in with protected credentials. Live clinic login is still **Old-API** `POST /api/Account/Login`. New-API has a parallel AccountController for future cut-over.


### Subtask `SEC-01.01` — DB/Migration: hash existing UserMaster passwords (bcrypt/PBKDF2); never store new plaintext

| | |
|---|---|
| Work type | Data Migration |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **MOSTLY DONE** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB/Migration: hash existing UserMaster passwords (bcrypt/PBKDF2); never store new plaintext | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Stop storing plaintext `UserMaster.UserPassword`. Hash with PBKDF2 (bcrypt was allowed; the team implemented PBKDF2).

**Already done:**
- Column `NVARCHAR(500)` so `PBKDF2$v1$…` fits (old NVARCHAR(50) truncated hashes and caused login 500s).
- `UserPasswordHasher` on both APIs: verify hash or legacy plaintext, then lazy-rewrite hash on successful login.
- Admin `POST /api/Account/MigratePlaintextPasswords` on New-API.

**Remaining:** Confirm the ALTER ran on the **same DB Old-API uses**. Do not manually overwrite passwords in SQL. Reception staff passwords still use a Base64 helper — out of this ticket’s UserMaster scope but worth knowing.


#### Code reality (detail)

UserPassword widened to NVARCHAR(500). PBKDF2 hasher + lazy migrate on login + Admin `MigratePlaintextPasswords`. Remaining: run SQL on shared DB if not applied; leftover plaintext until each user logs in.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: DB/Migration: hash existing UserMaster passwords (bcrypt/PBKDF2); never store new plaintext | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-01.02` — API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over

| | |
|---|---|
| Work type | Existing Modification |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Login API must (1) verify the hash, (2) put Role + DoctorId in the JWT, (3) keep the classic URL until New-API login is formally cut over.

**Already done:**
- Old-API `POST /api/Account/Login` — this is what the SPA `login()` calls.
- JWT claims: `RoleId`, `RoleName` / `ClaimTypes.Role`, optional `DoctorID`, `jti`.
- Reception fallback token via `CreateReceptionStaffToken`.

**Do not:** Change the UI login host to New-API in Week 1. That is the cut-over the ticket says to postpone.


#### Code reality (detail)

Old-API `POST /api/Account/Login` is the live clinic login. Verifies PBKDF2/plaintext, JWT carries RoleId, RoleName, DoctorID. New-API has the same AccountController for cut-over later. UI still calls Old-API.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: API: Login verifies hash; embed Role + DoctorId claims; keep classic login URL until .NET 8 login is cut over | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-02 — Secure password reset — time-limited reset links (stop plaintext email + fake thunk)

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Secure password reset
- Sibling subtasks: `SEC-02.01`, `SEC-02.02`

### Why this main task exists

Password reset must use a **time-limited token**, not email the plaintext password (the old behaviour) and not the Velzon fake/Firebase thunk.


### Subtask `SEC-02.01` — DB: PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API (if SQL applied)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Table `PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt)`.

**Already in New-API SQL + entity.** Old-API has no table.

**Done looks like:** Script applied on shared DB; unique index on TokenHash.


#### Code reality (detail)

`PasswordResetToken` table/entity in M01 script + New-API DbSet. Old-API has no token table.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: DB: PasswordResetToken (UserId, TokenHash, ExpiresAt, UsedAt) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-02.02` — API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user

| | |
|---|---|
| Work type | Existing Modification |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API; UI NOT WIRED (UI track excluded)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** New-API endpoints:
- `POST /api/Account/ForgotPassword` — email a reset **link** (not the password).
- `POST /api/Account/ResetPassword` — consume token, set new hash, mark UsedAt.
- `POST /api/Account/ChangePassword` — authenticated user.

**Already in New-API AccountController.** Old `users/ForgetPassword` is deprecated stub.

**UI wiring** (forgot page, `/reset-password/:token`) is **UI-track SEC-02.03 — excluded**. Web API work is the endpoints themselves.

**Watch:** email sending must be configured or ForgotPassword is a silent no-op in some environments.


#### Code reality (detail)

New-API: ForgotPassword / ResetPassword / ChangePassword. Old ForgetPassword is a stub. UI helpers exist (`forgotPasswordSecure`) but forget thunk is still fake — that is UI-track, not this doc.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: API: ForgotPassword sends reset link; ResetPassword consumes token; stop emailing plaintext; ChangePassword for authenticated user | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-03 — Session control — proper sign-out across web and mobile

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Session control
- Sibling subtasks: `SEC-03.01`, `SEC-03.03`

### Why this main task exists

Sign-out must be a real API so web and later mobile share one session story.


### Subtask `SEC-03.01` — API: POST /Account/Logout; persist UserLoginStatus; optional denylist until token expiry

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: POST /Account/Logout; persist UserLoginStatus; optional denylist until token expiry | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** `POST /Account/Logout` (JWT required): write `UserLoginStatus.OutTime`; optionally denylist the token `jti` until expiry.

**Already done:** Both APIs persist OutTime. New-API also calls `IJwtDenylistService.Deny(jti)`.

**Gap:** denylist is **in-memory** and **never checked** in JWT `OnTokenValidated`. A stolen token still works until it expires. Completing this ticket = hook `IsDenied` in `Program.cs`.

**UI calling logoutApi()** is UI-track SEC-03.02 — excluded. Web still needs the API to be correct.


#### Code reality (detail)

Both APIs have `POST /Account/Logout` + UserLoginStatus OutTime. New-API writes in-memory JWT denylist but Program.cs never checks `IsDenied` on incoming tokens — logout does not actually kill the JWT.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: API: POST /Account/Logout; persist UserLoginStatus; optional denylist until token expiry | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-03.03` — Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = No; Database = No; API = **Not Started**; Integration = No; Mobile = **Not Started** |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **CONTRACT ONLY** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17) | API Done | Mobile Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Document the contract: Patient mobile (M17) and Doctor mobile (M18) **must** call the same `POST /api/Account/Logout`. Do not invent a second logout.

**Done looks like:** A one-line API contract in this doc / OpenAPI remark. Mobile implementation is Phases 16–17, not Week 1.


#### Code reality (detail)

Write/keep the contract: mobile Phases 16–17 MUST call the same Logout URL. Do not build mobile here.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Contract: mobile apps MUST use the same Logout endpoint (implemented in Phases 16–17) | API Done | Mobile Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-04 — Role-based access — each role sees only what it is permitted to see

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Role-based access
- Sibling subtasks: `SEC-04.01`, `SEC-04.03`

### Why this main task exists

Each role sees only its menus and APIs. Admin ≠ Account. Doctor does not mutate admin masters (that ACL is M02).


### Subtask `SEC-04.01` — Backend: restore GetMenuByRole; add role attributes on new money and PII APIs

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Backend: restore GetMenuByRole; add role attributes on new money and PII APIs | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Restore `GetMenuByRole` on New-API; put `[Authorize(Roles=…)]` / policies on **new** money and PII APIs.

**Already done:** `GET /api/mastersAPI/GetMenuByRole` (non-admin forced to own userId). `AdminPortal` policy on M02 mutates.

**Still open:** Account-only money APIs do not exist yet (M07/M08). When they are built they must use a **different** policy than AdminPortal (see SEC-04.03). PII list endpoints should not be world-readable.


#### Code reality (detail)

GetMenuByRole restored on New-API `mastersAPI/GetMenuByRole`. Money/PII role attributes for Account vs Admin are not applied yet (money APIs not in Week 1).


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Backend: restore GetMenuByRole; add role attributes on new money and PII APIs | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-04.03` — Separation of duties seed: Account role controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web Other |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Separation of duties seed: Account role controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Seed **separation of duties** (PDF §8):
- **Account** role: money (receipts, settlements, GST) — cannot mutate clinical masters.
- **Admin** role: platform + clinical masters — cannot run Account money actions.

**Code today:** `AdminPortal` = RoleId 1 or role name Admin/Management. There is no Account policy and no seed that blocks Admin from money (because money APIs are later).

**Done looks like:** RoleDetails/MenuMaster rows + a named authorization policy `AccountPortal` ready for M08. Do not give Account the AdminPortal policy.


#### Code reality (detail)

No seed that Account can only do money and Admin cannot. AdminPortal policy today is Admin+Management only.


#### Plan (do not implement until approved)

1. Implement on New-API only (FND-01.03).
2. Follow the subtask text exactly.
3. Swagger/Postman: success, 401, validation fail.


#### Definition of done

- Demo proves: Separation of duties seed: Account role controls money; Admin controls platform and clinical data — neither can perform the other’s role (PDF §8) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-05 — Patient data protection — health records restricted to the treating doctor and the patient

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Patient data protection
- Sibling subtasks: `SEC-05.01`, `SEC-05.02`

### Why this main task exists

Health records belong to the treating doctor (and the patient). APIs must not return another doctor’s patients just because the caller is logged in.


### Subtask `SEC-05.01` — API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL — helper unused** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** On Patient, Appointment, Case, Rx, notes, labs, board backup: compare JWT `DoctorID` to the row’s DoctorId. AdminPortal may bypass. Never trust a DoctorId the client sends in the body.

**Already done:** `DoctorOwnership.EnsureDoctorOwns` / `ForbidIfNotOwner` helper.

**Not done:** Almost no controller calls it. Patient/Appointment/Prescription are `[Authorize]` only.

**This is one of the highest-value remaining Week 1 Web API tickets.** Plan: wire the helper onto each listed controller, add a negative test (Doctor B gets 403 on Doctor A’s patient).


#### Code reality (detail)

`DoctorOwnership` helper exists in New-API. Only PatientBoardBackup references it, and even that does not call ForbidIfNotOwner. Patient/Appointment/Case/Rx controllers are [Authorize] but not ownership-scoped.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: API: enforce DoctorId ownership on Patient, Appointment, Case, Rx, notes, labs, board backup | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-05.02` — Disable directory browsing on /attachments and /Blogs; signed-URL or authorised download for documents

| | |
|---|---|
| Work type | Existing Modification |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT DONE (gap)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Disable directory browsing on /attachments and /Blogs; signed-URL or authorised download for documents | Backend Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Turn **off** directory browsing on `/attachments` and `/Blogs`. Documents should download via authorised GET or short-lived signed URL.

**Code today (gap):** New-API `Program.cs` still has `UseDirectoryBrowser` for both paths, plus public `UseStaticFiles`. Anyone who knows the URL can list files.

**Related:** SEC-09 SecureDocument is the authorised store. This ticket is specifically the **legacy public folders**.

**Done looks like:** Remove both `UseDirectoryBrowser` blocks; keep static files only if each file is non-PII, otherwise route downloads through SecureDocument.


#### Code reality (detail)

New-API Program.cs still has UseDirectoryBrowser on `/attachments` and `/Blogs`. SecureDocument authorised GET exists as the replacement path, but browsing is still on. No signed URLs.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: Disable directory browsing on /attachments and /Blogs; signed-URL or authorised download for documents | Backend Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-06 — Consent records infrastructure — every consent captured, stored and reviewable

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Consent records
- Sibling subtasks: `SEC-06.01`, `SEC-06.02`, `SEC-06.03`

### Why this main task exists

Consent is a first-class record (privacy, booking, tele-recording, pharmacy share, marketing, caregiver). Telemedicine in Phase 11 must reuse this, not invent a second log.


### Subtask `SEC-06.01` — DB: ConsentRecord + ConsentType master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API (if SQL applied)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: ConsentRecord + ConsentType master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** DB ConsentType + ConsentRecord.

**Already in M01 SQL** with the six type codes. Confirm script applied.


#### Code reality (detail)

ConsentType + ConsentRecord tables; seeds Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: DB: ConsentRecord + ConsentType master (Privacy, Booking, TeleRecording, PharmacyShare, Marketing, Caregiver) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-06.02` — API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the API response beyond type+time)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the API response beyond type+time) | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** APIs Grant / Withdraw / List-mine / Admin-audit. Response = type + timestamps only — **no clinical notes**.

**Already:** `ConsentController` on New-API. Admin-audit uses AdminPortal policy.


#### Code reality (detail)

ConsentController: Grant / Withdraw / ListMine / AdminAudit. Response is type+time, not clinical content.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: API: Grant / Withdraw / List-mine / Admin-audit (no clinical content in the API response beyond type+time) | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-06.03` — Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine (Phase 11 will write TeleRecording into ConsentRecord)

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine (Phase 11 will write TeleRecording into ConsentRecord) | Backend Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Reuse the **pattern** of AudioCaseConsentLog (who/when/what type) but persist **into ConsentRecord**. Phase 11 writes `TeleRecording`. Do not create `TeleConsentLog`.

**Gap:** Audio case-taking still inserts `AudioCaseConsentLog`. Week 1 accept: document the rule + keep ConsentRecord as the system of record. Optional small follow-up: adapter from audio log → ConsentRecord.


#### Code reality (detail)

ConsentRecord is the target model. Audio case-taking still writes AudioCaseConsentLog. Phase 11 must write TeleRecording into ConsentRecord — do not create a third model.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Reuse AudioCaseConsentLog pattern; do not fork a second consent model for telemedicine (Phase 11 will write TeleRecording into ConsentRecord) | Backend Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-07 — OTP verification infrastructure — applied to sensitive actions including payouts and pharmacy acceptance

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: OTP verification
- Sibling subtasks: `SEC-07.01`, `SEC-07.02`, `SEC-07.03`

### Why this main task exists

OTP is shared infrastructure for payouts, pharmacy accept, caregiver grant, etc. Week 1 builds generic Request/Verify + audit, with SMS stubbed until PRE-03.02.


### Subtask `SEC-07.01` — DB: OtpChallenge, OtpAuditLog (Action, EntityType, EntityId, ToMasked, Success, At)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API (if SQL applied)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: OtpChallenge, OtpAuditLog (Action, EntityType, EntityId, ToMasked, Success, At) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Tables OtpChallenge and OtpAuditLog.

**Already in M01 SQL** (hash, expiry, AttemptCount, LockedUntil, masked destination).


#### Code reality (detail)

OtpChallenge + OtpAuditLog tables/entities.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: DB: OtpChallenge, OtpAuditLog (Action, EntityType, EntityId, ToMasked, Success, At) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-07.02` — API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS provider adapter stub until PRE-03 vendor is live

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = **Not Started**; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS provider adapter stub until PRE-03 vendor is live | Backend Done | API Done | Integration Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** `RequestOtp` / `VerifyOtp` generic (Action, EntityType, EntityId). Rate-limit + lockout. SMS adapter **stub** until vendor selected.

**Already:** `OtpController`. Dev environment may return `devCode`.

**Remaining:** bind a real `ISmsSender` after PRE-03.02; confirm rate-limit is not only in-memory if you run multiple API instances.


#### Code reality (detail)

OtpController RequestOtp / VerifyOtp with attempt lockout. SMS is a stub (`SMS stub — provider not configured`). Blocked on PRE-03.02 vendor.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: API: RequestOtp / VerifyOtp (generic); rate-limit; lockout; SMS provider adapter stub until PRE-03 vendor is live | Backend Done | API Done | Integration Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-07.03` — GET /api/Otp/Audit for Account and Admin (masked destination)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: GET /api/Otp/Audit for Account and Admin (masked destination) | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** `GET /api/Otp/Audit` for Account and Admin; destination masked (`98****21`).

**Already in New-API.** Restrict to Account/Admin (not Doctor).


#### Code reality (detail)

GET /api/Otp/Audit for Account/Admin with masked destination.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: GET /api/Otp/Audit for Account and Admin (masked destination) | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-08 — Complete audit trail — who did what and when across payments, prescriptions and approvals

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Complete audit trail
- Sibling subtasks: `SEC-08.01`, `SEC-08.02`

### Why this main task exists

Money, Rx, and approvals need an audit trail: who, what, old/new JSON, correlation id. Week 1 is table + helper; later phases call the helper.


### Subtask `SEC-08.01` — DB: AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API (if SQL applied)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Table AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId).

**Already in M01 SQL + entity.**


#### Code reality (detail)

AuditEvent table/entity.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: DB: AuditEvent (ActorUserId, Role, Action, Entity, OldJson, NewJson, At, CorrelationId) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-08.02` — API middleware: write audit on mutating money/Rx/approval endpoints (start with a helper used by later phases)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **PARTIAL** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API middleware: write audit on mutating money/Rx/approval endpoints (start with a helper used by later phases) | Backend Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** A **helper** (not necessarily full middleware) that later money/Rx/approval endpoints call.

**Already:** `IAuditEventWriter` used on Account password/logout.

**Remaining:** either (a) ASP.NET middleware on selected routes, or (b) document + keep helper and call it from the first money endpoint in M07. Tracker says “start with a helper used by later phases” — (b) matches if you explicitly list the helper as the DoD.


#### Code reality (detail)

IAuditEventWriter exists; used only on Account password/logout. No middleware on money/Rx/approval mutates (those endpoints come in later phases — helper is the Week-1 deliverable).


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: API middleware: write audit on mutating money/Rx/approval endpoints (start with a helper used by later phases) | Backend Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## SEC-09 — Secure documents — prescriptions, reports and uploads protected from unauthorised access

- Module: `M01` Foundation & Security
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 2–6
- PDF feature: Secure documents
- Sibling subtasks: `SEC-09.01`, `SEC-09.02`

### Why this main task exists

Prescriptions, lab PDFs, uploads must not live in a public folder listing. SecureDocument is owner-scoped blob metadata + authorised download.


### Subtask `SEC-09.01` — DB: SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy)

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **DONE IN NEW-API (if SQL applied)** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Table SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy).

**Already in M01 SQL.**


#### Code reality (detail)

SecureDocument table/entity.


#### Plan (do not implement until approved)

1. **Do not rebuild.**
2. Verify on UAT (SQL applied / endpoint returns expected).
3. Flip Excel layer dropdowns to Done so tracking matches code.


#### Definition of done

- Demo proves: DB: SecureDocument (OwnerType, OwnerId, BlobPath, Mime, Hash, CreatedBy) | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `SEC-09.02` — API: upload (multipart) + authorised GET; no public folder listing

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **MOSTLY DONE** |
| Depends / notes | See module sheet M01_Foundation_Security for PDF refs / source area. |
| Tracker DoD | Demo proves: API: upload (multipart) + authorised GET; no public folder listing | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Multipart upload + authorised GET; no public listing of this store.

**Already:** `SecureDocumentController` — owner / creator / AdminPortal. Files under `Data/SecureDocuments`.

**Not signed URLs** (tracker allowed signed-URL **or** authorised GET). Authorised GET is enough.

**Do not confuse with SEC-05.02** (`/attachments` browsing is still on).


#### Code reality (detail)

SecureDocumentController upload + authorised GET by owner/creator/AdminPortal. Files under Data/SecureDocuments. Public folder listing of that store is off; `/attachments` browsing is a separate SEC-05.02 gap.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: API: upload (multipart) + authorised GET; no public folder listing | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.

# Module M02 — Admin Clinical masters (keep and harden)


**When:** Day 3–7. **Work type:** Existing Improvement (ACL) + Existing (dual-API freeze).  
**Rule:** Keep the screens. Harden who can Save/Delete. Freeze the HTTP host.

Pattern for almost every master:
- Subtask `.02` = ACL (Security lane)
- Subtask `.03` = Dual-API freeze (Web API lane)

Both are **Done in code** except **ADM-B04**. Each master is still listed in full so you can see the exact host and controller.

Web subtasks in this module: **56**.


---

## ADM-3D1 — Keep and harden Admin 3D mesh key master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: 3D mesh key master
- Sibling subtasks: `ADM-3D1.02`, `ADM-3D1.03`

### Why this main task exists

3D body-part **mesh key** master — the 3D model keys used on Patient Board anatomy.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-3D1.02` — ACL: only Admin (and permitted roles) can mutate 3D mesh key master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate 3D mesh key master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `3D body-part **mesh key** master — the 3D model keys used on Patient Board anatomy.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE on New-API mutate + UI AdminProtected on admin/*`
- New-API mutate: ThreeDBodyPartMeshKeyMasterController — Add/Update/Delete with [Authorize(Policy=AdminPortal)]
- Old-API mutate: None
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate 3D mesh key master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-3D1.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D mesh key master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D mesh key master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **New-API only**
- UI route / helper: admin/listmeshkeymaster (nigahomeoAPI)
- Status: DONE — keep New-API. Do not move to Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D mesh key master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-3D2 — Keep and harden Admin 3D section master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: 3D section master
- Sibling subtasks: `ADM-3D2.02`, `ADM-3D2.03`

### Why this main task exists

3D **section** master — regions on the 3D body.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-3D2.02` — ACL: only Admin (and permitted roles) can mutate 3D section master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate 3D section master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `3D **section** master — regions on the 3D body.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: ThreeDBodyPartSectionMasterController — AdminPortal on mutate
- Old-API mutate: None
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate 3D section master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-3D2.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D section master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D section master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **New-API only**
- UI route / helper: admin/list3dsectionmaster (nigahomeoAPI)
- Status: DONE — keep New-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D section master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-3D3 — Keep and harden Admin 3D hotspots (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: 3D hotspots
- Sibling subtasks: `ADM-3D3.02`, `ADM-3D3.03`

### Why this main task exists

3D **hotspots** — clickable points on a section.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-3D3.02` — ACL: only Admin (and permitted roles) can mutate 3D hotspots; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate 3D hotspots; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `3D **hotspots** — clickable points on a section.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: ThreeDBodyPartSectionHotspotController — AdminPortal on mutate
- Old-API mutate: None
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate 3D hotspots; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-3D3.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D hotspots; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D hotspots; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **New-API only**
- UI route / helper: admin/list3dhotspots (nigahomeoAPI)
- Status: DONE — keep New-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for 3D hotspots; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-A01 — Keep and harden Admin Drug system (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Drug system
- Sibling subtasks: `ADM-A01.02`, `ADM-A01.03`

### Why this main task exists

Homeopathic **drug system** master (e.g. how drugs are classified).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-A01.02` — ACL: only Admin (and permitted roles) can mutate Drug system; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Drug system; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Homeopathic **drug system** master (e.g. how drugs are classified).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE on Old-API mutate + UI portal guard`
- New-API mutate: DrugSystemMaster entity only — no mutate controller
- Old-API mutate: DrugSystemController Save/Delete with AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Drug system; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-A01.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug system; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug system; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API (UI `api`)**
- UI route / helper: admin/listdrugsystem
- Status: DONE — freeze Old-API. Do not silently switch to New-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug system; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-A02 — Keep and harden Admin Drug group (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Drug group
- Sibling subtasks: `ADM-A02.02`, `ADM-A02.03`

### Why this main task exists

**Drug group** master.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-A02.02` — ACL: only Admin (and permitted roles) can mutate Drug group; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Drug group; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Drug group** master.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: No controller
- Old-API mutate: DrugGroupController AdminPortal on mutate
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Drug group; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-A02.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug group; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug group; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listdruggroup
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Drug group; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-A03 — Keep and harden Admin Allopathic drug & side effects (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Allopathic drug & side effects
- Sibling subtasks: `ADM-A03.02`, `ADM-A03.03`

### Why this main task exists

**Allopathic drug & side effects** master (cross-reference for doctors).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-A03.02` — ACL: only Admin (and permitted roles) can mutate Allopathic drug & side effects; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Allopathic drug & side effects; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Allopathic drug & side effects** master (cross-reference for doctors).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE on both mutate surfaces`
- New-API mutate: AllopathicDrugController Save/Delete AdminPortal; SeriousSideEffectController Delete
- Old-API mutate: AllopathicDrugController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Allopathic drug & side effects; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-A03.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Allopathic drug & side effects; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Allopathic drug & side effects; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API for admin CRUD; New-API has Save/Delete + dropdown GET**
- UI route / helper: admin/listallopathicdrug (Old). Board dropdown: New getAllopathicDrugForDropdown
- Status: DONE — admin list stays Old; do not switch the admin screen host.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Allopathic drug & side effects; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-B01 — Business Management — Doctor qualifications (existing, used later by credentialing)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Doctor qualifications
- Sibling subtasks: `ADM-B01.02`, `ADM-B01.03`

### Why this main task exists

Doctor **qualification** master (BHMS, MD, etc.).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-B01.02` — ACL on qualification APIs

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL on qualification APIs | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Doctor **qualification** master (BHMS, MD, etc.).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: QualificationController Add/Update/Delete AdminPortal
- Old-API mutate: QualificationController still exists — do not point UI back to it
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL on qualification APIs | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-B01.03` — Confirm UI uses newer API (not classic) for qualifications

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Confirm UI uses newer API (not classic) for qualifications | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **New-API (UI nigahomeoAPI)**
- UI route / helper: admin/listqualification
- Status: DONE — freeze New-API as primary.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Confirm UI uses newer API (not classic) for qualifications | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-B02 — Business Management — Lab & imaging test catalog (existing, used by eRx lab orders)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Lab & imaging test catalog
- Sibling subtasks: `ADM-B02.02`, `ADM-B02.03`

### Why this main task exists

**Lab / imaging catalog** used when ordering tests.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-B02.02` — ACL on catalog mutate

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL on catalog mutate | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Lab / imaging catalog** used when ordering tests.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `PARTIAL at catalog-admin depth; portal route is guarded. Lab class-level auth is a known gap — do not rebuild the screen.`
- New-API mutate: PatientLabController is clinical (orders/entries), class [Authorize] commented — not catalog admin
- Old-API mutate: PatientLab GetAllLabTests read; PatientLabTestController CRUD on PatientLabTestMaster. No full LabTestMaster Save/Delete admin
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL on catalog mutate | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-B02.03` — Confirm classic PatientLab APIs still read this catalogue

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Confirm classic PatientLab APIs still read this catalogue | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listlabsimaging
- Status: DONE as freeze: admin catalog stays Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Confirm classic PatientLab APIs still read this catalogue | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-B03 — Business Management — Subscription packages (existing S1 SaaS; later tied to Account ledger)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Subscription packages
- Sibling subtasks: `ADM-B03.02`, `ADM-B03.03`

### Why this main task exists

Clinic **packages** (consult packages / top-up). Not the SaaS subscription catalog.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-B03.02` — ACL on package mutate

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL on package mutate | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Clinic **packages** (consult packages / top-up). Not the SaaS subscription catalog.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE on mutate; GET anonymous gap is known — do not rebuild.`
- New-API mutate: PackageController Save/Delete/Topup AdminPortal
- Old-API mutate: PackageController mutate AdminPortal; class [Authorize] commented so GETs may be anonymous
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL on package mutate | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-B03.03` — Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API for admin CRUD; New-API also has PackageController (SaaS-ish)**
- UI route / helper: admin/listpackage → Old create/update/deletePackage. Separate New getPackages is non-admin SaaS.
- Status: DONE — admin screen stays Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Note in code: PackageEntryDetail is S1 only — never reuse for S2 consult or S5 medicine | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-B04 — Business Management — Roles & menu permissions (existing DB, runtime ACL leftover)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Roles & menu permissions
- Sibling subtasks: `ADM-B04.01`, `ADM-B04.02`

### Why this main task exists

Roles & menus already exist in the DB (RoleMaster, RoleDetails, MenuMaster). Week 1 is **not** a rebuild. It is: seed menus for new roles if needed, and restore GetMenuByRole on .NET 8 so Account/Pharmacy can get a menu later. UI consuming that API is a **UI-track** ticket (ADM-B04.03) — excluded from this plan.


### Subtask `ADM-B04.01` — No schema change unless Account/Pharmacy/Patient roles need new MenuMaster rows — seed those menus

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Done**; Database = **In Progress**; API = No; Integration = No; Mobile = No |
| Tracker derived status | In Progress (tracker layers) |
| **Code reality** | **IN PROGRESS** |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: No schema change unless Account/Pharmacy/Patient roles need new MenuMaster rows — seed those menus | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Do **not** change schema. If Account / PharmacyPartner / Patient need nav items, **seed MenuMaster + RoleDetails** rows.

**Already:** Commented template `M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`. Existing Admin/Doctor menus stay as they are.

**Done looks like:** Real seed script run on shared DB with the Account menu ids product agrees on. Until Account portal screens exist, seed can be a placeholder “Account Home” row.


#### Code reality (detail)

No schema change needed for existing roles. Account/Pharmacy/Patient MenuMaster seed is a commented SQL template (`M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`), not live rows.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: No schema change unless Account/Pharmacy/Patient roles need new MenuMaster rows — seed those menus | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-B04.02` — Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = **In Progress**; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | In Progress (tracker layers) |
| **Code reality** | **IN PROGRESS** |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Restore GetMenuByRole on New-API; seed Account (and later Pharmacy) menus.

**Already:** `GET /api/mastersAPI/GetMenuByRole` works. UI helper `getMenuByRole` exists but **LayoutMenuData is still hard-coded** (UI-track).

**Remaining Web:** execute Account/Pharmacy seed; confirm a JWT with Role=Account returns only those items.

**Old-API GetMenuByRole is commented out** — do not resurrect it; New-API is the host.


#### Code reality (detail)

GetMenuByRole is restored on New-API. Account and Pharmacy menu rows are not seeded. RoleMaster/MenuMaster mutate CRUD stays on Old-API.


#### Plan (do not implement until approved)

1. Keep existing code.
2. Close only the **gap** named in Code reality.
3. Add a negative test for the gap (403 / browsing disabled / denylist).
4. Then mark tracker Done.


#### Definition of done

- Demo proves: Restore GetMenuByRole on .NET 8; seed menus for Account and (later) Pharmacy | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-D01 — Keep and harden Admin Diagnosis system (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Diagnosis system
- Sibling subtasks: `ADM-D01.02`, `ADM-D01.03`

### Why this main task exists

**Diagnosis system** master.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-D01.02` — ACL: only Admin (and permitted roles) can mutate Diagnosis system; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis system; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Diagnosis system** master.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: mastersAPI GetDiagnosis* read-only
- Old-API mutate: DiagnosisSystemController AdminPortal on mutate
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis system; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-D01.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis system; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis system; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listdiagnosissystem
- Status: DONE — freeze Old-API for mutate.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis system; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-D02 — Keep and harden Admin Diagnosis therapeutics (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Diagnosis therapeutics
- Sibling subtasks: `ADM-D02.02`, `ADM-D02.03`

### Why this main task exists

**Diagnosis therapeutics** master.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-D02.02` — ACL: only Admin (and permitted roles) can mutate Diagnosis therapeutics; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis therapeutics; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Diagnosis therapeutics** master.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: read-only via mastersAPI
- Old-API mutate: DiagnosisTherapeuticsDetailController AdminPortal on mutate
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis therapeutics; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-D02.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis therapeutics; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis therapeutics; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listdiagnosistherapeuticsdetails
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis therapeutics; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-D03 — Keep and harden Admin Diagnosis conditions (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Diagnosis conditions
- Sibling subtasks: `ADM-D03.02`, `ADM-D03.03`

### Why this main task exists

**Diagnosis conditions** master.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-D03.02` — ACL: only Admin (and permitted roles) can mutate Diagnosis conditions; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis conditions; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Diagnosis conditions** master.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: read-only
- Old-API mutate: DiagnosisController AdminPortal on mutate
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Diagnosis conditions; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-D03.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis conditions; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis conditions; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listdiagnosisconditions
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Diagnosis conditions; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-M01 — Keep and harden Admin Author master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Author master
- Sibling subtasks: `ADM-M01.02`, `ADM-M01.03`

### Why this main task exists

Materia medica **author** master (Kent, Boericke, …).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-M01.02` — ACL: only Admin (and permitted roles) can mutate Author master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Author master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Materia medica **author** master (Kent, Boericke, …).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: No Author controller
- Old-API mutate: AuthorController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Author master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-M01.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Author master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Author master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listauthor
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Author master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-M02 — Keep and harden Admin Materia medica master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Materia medica master
- Sibling subtasks: `ADM-M02.02`, `ADM-M02.03`

### Why this main task exists

**Materia medica** book/master records.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-M02.02` — ACL: only Admin (and permitted roles) can mutate Materia medica master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Materia medica** book/master records.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: GET-only MateriaMedicaRemediesDetailsController
- Old-API mutate: MateriaMedicaMasterController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-M02.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listmateriamedica
- Status: DONE — freeze Old-API for admin CRUD.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-M03 — Keep and harden Admin Materia medica heads (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Materia medica heads
- Sibling subtasks: `ADM-M03.02`, `ADM-M03.03`

### Why this main task exists

Materia medica **heads** (chapter headings).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-M03.02` — ACL: only Admin (and permitted roles) can mutate Materia medica heads; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica heads; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Materia medica **heads** (chapter headings).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: No mutate
- Old-API mutate: MateriaMedicaHeadController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica heads; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-M03.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica heads; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica heads; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listhead
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica heads; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-M04 — Keep and harden Admin Materia medica remedies (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Materia medica remedies
- Sibling subtasks: `ADM-M04.02`, `ADM-M04.03`

### Why this main task exists

Materia medica **remedy details** under a head.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-M04.02` — ACL: only Admin (and permitted roles) can mutate Materia medica remedies; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica remedies; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Materia medica **remedy details** under a head.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: GET-only details
- Old-API mutate: MeteriaMedicaDetailsController; remedies details GET-only on some paths
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Materia medica remedies; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-M04.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica remedies; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica remedies; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listmateriamedicaremedies
- Status: DONE — freeze Old-API for admin.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Materia medica remedies; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-Q01 — Keep and harden Admin Question section, group & sub-group (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Question section, group & sub-group
- Sibling subtasks: `ADM-Q01.02`, `ADM-Q01.03`

### Why this main task exists

Case-taking **question section / group / sub-group** taxonomy.

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-Q01.02` — ACL: only Admin (and permitted roles) can mutate Question section, group & sub-group; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Question section, group & sub-group; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `Case-taking **question section / group / sub-group** taxonomy.` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE on both`
- New-API mutate: QuestionSectionController, QuestionGroupController, QuestionSubGroupController — AdminPortal
- Old-API mutate: Same trio with AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Question section, group & sub-group; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-Q01.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Question section, group & sub-group; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Question section, group & sub-group; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API for admin UI; New-API has full CRUD with AdminPortal (parity)**
- UI route / helper: admin existance / question group / sub-group (Old helpers)
- Status: DONE — UI still Old; do not silently switch the existing admin screens.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Question section, group & sub-group; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-Q02 — Keep and harden Admin Clinical question mapping (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Clinical question mapping
- Sibling subtasks: `ADM-Q02.02`, `ADM-Q02.03`

### Why this main task exists

**Clinical question mapping** (questions ↔ clinical use).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-Q02.02` — ACL: only Admin (and permitted roles) can mutate Clinical question mapping; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Clinical question mapping; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Clinical question mapping** (questions ↔ clinical use).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: No dedicated mapping mutate found
- Old-API mutate: ClinicalQuestionsController / ClinicalQueKeywordController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Clinical question mapping; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-Q02.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Clinical question mapping; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Clinical question mapping; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin clinical questions
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Clinical question mapping; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R01 — Keep and harden Admin Repertory sections (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Repertory sections
- Sibling subtasks: `ADM-R01.02`, `ADM-R01.03`

### Why this main task exists

**Repertory sections** (the top tree of the repertory).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R01.02` — ACL: only Admin (and permitted roles) can mutate Repertory sections; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Repertory sections; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Repertory sections** (the top tree of the repertory).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: SectionController AdminPortal
- Old-API mutate: SectionController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Repertory sections; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R01.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Repertory sections; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Repertory sections; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Split: UI section CRUD via Old; New has SectionController with AdminPortal**
- UI route / helper: admin repertory section
- Status: DONE — keep current UI host; New mutate exists for future cut-over only.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Repertory sections; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R02 — Keep and harden Admin Subsection & rubric tree (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Subsection & rubric tree
- Sibling subtasks: `ADM-R02.02`, `ADM-R02.03`

### Why this main task exists

**Subsection and rubric tree** (the repertory content tree).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R02.02` — ACL: only Admin (and permitted roles) can mutate Subsection & rubric tree; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Subsection & rubric tree; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Subsection and rubric tree** (the repertory content tree).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: SubSectionController AdminPortal + Excel import
- Old-API mutate: SubSectionController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Subsection & rubric tree; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R02.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Subsection & rubric tree; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Subsection & rubric tree; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old UI; New SubSectionController + Excel import**
- UI route / helper: admin subsection / rubrics
- Status: DONE — do not silently switch hosts.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Subsection & rubric tree; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R03 — Keep and harden Admin Rubric–remedy mapping (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Rubric–remedy mapping
- Sibling subtasks: `ADM-R03.02`, `ADM-R03.03`

### Why this main task exists

**Rubric–remedy mapping** (which remedies sit on a rubric, with grade).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R03.02` — ACL: only Admin (and permitted roles) can mutate Rubric–remedy mapping; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Rubric–remedy mapping; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Rubric–remedy mapping** (which remedies sit on a rubric, with grade).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: RubricRemedyController AdminPortal (save + Excel)
- Old-API mutate: RubricRemedyController still present
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Rubric–remedy mapping; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R03.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Rubric–remedy mapping; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Rubric–remedy mapping; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Split: save + Excel import/export on New-API; some reads Old**
- UI route / helper: admin remedial / rubric-remedy — New for save/import/export
- Status: DONE — keep New for save/Excel. Do not move those calls back to Old.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Rubric–remedy mapping; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R04 — Keep and harden Admin Remedy-linked rubrics (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Remedy-linked rubrics
- Sibling subtasks: `ADM-R04.02`, `ADM-R04.03`

### Why this main task exists

**Remedy-linked rubrics** (from a remedy, list linked rubrics).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R04.02` — ACL: only Admin (and permitted roles) can mutate Remedy-linked rubrics; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy-linked rubrics; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Remedy-linked rubrics** (from a remedy, list linked rubrics).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE at portal + AdminPortal on related mutates`
- New-API mutate: Related rubric-remedy reads/mutates on New
- Old-API mutate: Repertorization / rubric APIs
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy-linked rubrics; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R04.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy-linked rubrics; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy-linked rubrics; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API (admin); related New rubric APIs exist**
- UI route / helper: admin remedy-linked rubrics
- Status: DONE — freeze the host the UI already uses.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy-linked rubrics; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R05 — Keep and harden Admin Language master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Language master
- Sibling subtasks: `ADM-R05.02`, `ADM-R05.03`

### Why this main task exists

**Language** master (UI language / repertory language).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R05.02` — ACL: only Admin (and permitted roles) can mutate Language master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Language master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Language** master (UI language / repertory language).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: mastersAPI GetLanguages (read)
- Old-API mutate: LanguageMasterController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Language master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R05.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Language master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Language master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API admin CRUD; New GetLanguages read; WhatsApp language list is New**
- UI route / helper: admin/listlanguage → Old createUpdateLanguage
- Status: DONE — admin mutate stays Old.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Language master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R06 — Keep and harden Admin Body part master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Body part master
- Sibling subtasks: `ADM-R06.02`, `ADM-R06.03`

### Why this main task exists

**Body part** master (for case/repertory location).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R06.02` — ACL: only Admin (and permitted roles) can mutate Body part master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Body part master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Body part** master (for case/repertory location).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: mastersAPI GetBodyParts read
- Old-API mutate: BodyPartController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Body part master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R06.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Body part master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Body part master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listbodyparts
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Body part master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R07 — Keep and harden Admin Intensity master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Intensity master
- Sibling subtasks: `ADM-R07.02`, `ADM-R07.03`

### Why this main task exists

**Intensity** master (symptom intensity grades).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R07.02` — ACL: only Admin (and permitted roles) can mutate Intensity master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Intensity master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Intensity** master (symptom intensity grades).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: mastersAPI GetIntensities read
- Old-API mutate: IntensityController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Intensity master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R07.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Intensity master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Intensity master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API**
- UI route / helper: admin/listintensity
- Status: DONE — freeze Old-API.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Intensity master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R08 — Keep and harden Admin Remedy master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Remedy master
- Sibling subtasks: `ADM-R08.02`, `ADM-R08.03`

### Why this main task exists

**Remedy** master (the homeopathic remedies themselves).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R08.02` — ACL: only Admin (and permitted roles) can mutate Remedy master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Remedy** master (the homeopathic remedies themselves).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: RemedyController AdminPortal
- Old-API mutate: RemedyController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R08.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API admin UI; New RemedyController with AdminPortal also exists**
- UI route / helper: admin/listremedy → Old
- Status: DONE — keep current UI host (Old). Do not silently switch.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## ADM-R09 — Keep and harden Admin Remedy grade master (do not rebuild)

- Module: `M02` Admin clinical masters
- Stream: A-ClinicWeb · Priority: P0 Critical path · Days: Day 3–7
- PDF feature: Remedy grade master
- Sibling subtasks: `ADM-R09.02`, `ADM-R09.03`

### Why this main task exists

**Remedy grade** master (1, 2, 3 / + / ++ used on rubrics).

Week 1 does **not** rebuild this master. It keeps the existing Admin screen, locks mutate behind AdminPortal, and freezes the API host.

**Who uses it:** Admin maintains the list. Doctor consumes it read-only on Patient Board.


### Subtask `ADM-R09.02` — ACL: only Admin (and permitted roles) can mutate Remedy grade master; Doctor is read-only consumer on Patient Board

| | |
|---|---|
| Work type | Existing Improvement |
| Work bifurcation | Security |
| Tracker layers | Frontend = **Done**; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (ACL harden) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy grade master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Do **not** rebuild the `**Remedy grade** master (1, 2, 3 / + / ++ used on rubrics).` screens. Only **harden ACL**.

- **Mutate** (create/update/delete) = Admin Portal roles only (Admin, Management, RoleId 1).
- **Doctor** may **read** the data on Patient Board; Doctor JWT must get **403** on Save/Delete.

**How it is implemented today:**
- API: `DONE`
- New-API mutate: RemedyGradeController AdminPortal
- Old-API mutate: RemedyGradeController AdminPortal
- SPA: every `admin/*` route wrapped in `AdminProtected` (`canAccessAdminPortal`). Per-button `canMutateAdminMasters` is **not** used on list pages — the **route guard + API policy** are the lock. That matches “do not rebuild”.

**You must not:** Rewrite the React pages or change columns. If a Doctor can still POST mutate because a controller forgot AdminPortal, that is the only code fix (and for this master the tracker already marked Done).


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: ACL: only Admin (and permitted roles) can mutate Remedy grade master; Doctor is read-only consumer on Patient Board | Frontend Done | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `ADM-R09.03` — Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy grade master; do not silently switch

| | |
|---|---|
| Work type | Existing |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Done**; Database = No; API = **Done**; Integration = No; Mobile = No |
| Tracker derived status | Done (tracker layers) |
| **Code reality** | **DONE** (host frozen) |
| Depends / notes | See module sheet M02_Admin_Clinical for PDF refs / source area. |
| Tracker DoD | Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy grade master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What this subtask is:** Freeze **which HTTP host** the existing admin screen already uses. Dual-API means Old-API (classic, `api` / API_URL) and New-API (.NET 8, `nigahomeoAPI`). Switching a working screen to the other host without a cut-over plan **breaks production**.

**This master:**
- Frozen host: **Old-API admin UI; New RemedyGradeController exists**
- UI route / helper: admin/listremedygrade → Old
- Status: DONE — keep current UI host.

**Rule (FND-01.03):** new APIs go to New-API; do not create a third API; do not silently change this screen’s host.

**Done looks like:** A comment in `realbackend_helper.js` (already present for many masters) + this freeze. No new endpoints unless the host is already New and a bug exists.


#### Plan (do not implement until approved)

1. **Do not rebuild this master.**
2. Keep AdminPortal on mutate.
3. Keep the frozen host in the cheat sheet.
4. No Week 1 work unless a Doctor JWT can still mutate (regression).


#### Definition of done

- Demo proves: Dual-API: confirm UI still hits the correct host (classic vs .NET 8) for Remedy grade master; do not silently switch | Backend Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.

# Module M16 — Patient continuity APIs


**When:** Day 5–7. Stream **B-PatientEco**. **Work type:** New DB + New API on New-API.  
**Not in this plan:** family/caregiver **UI** (CON-01.03 / CON-02.03, Phase 16).

Web subtasks in this module: **5**.


---

## CON-01 — Family members — add family members under one account

- Module: `M16` Patient continuity APIs
- Stream: B-PatientEco · Priority: P1 Parallel must finish · Days: Day 5–7
- PDF feature: Family members
- Sibling subtasks: `CON-01.01`, `CON-01.02`

### Why this main task exists

A patient account can attach family members (spouse, child) so one login books for many people. This is M16 continuity, started in Week 1 as **API+DB only**. UI “consumed in Phase 16” is excluded.


### Subtask `CON-01.01` — DB: FamilyMember

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M16_Patient_APIs for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: FamilyMember | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** New table `FamilyMember` on the shared DB via New-API (new module → New-API). Typical columns: FamilyMemberId, OwnerPatientUserId, MemberPatientId or demographic fields, Relation, Active.

**Code today:** Missing.

**Depends:** FND-01.01 IDs (who is the owner key — PatientId vs user id).


#### Code reality (detail)

No FamilyMember table/entity in New-API or Old-API.


#### Plan (do not implement until approved)

1. Design table columns using FND-01.01 keys.
2. New-API entity + SQL script + controller.
3. JWT ownership checks.
4. Swagger demo + 401/403 cases.


#### Definition of done

- Demo proves: DB: FamilyMember | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `CON-01.02` — API: CRUD family; book-as-member

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M16_Patient_APIs for PDF refs / source area. |
| Tracker DoD | Demo proves: API: CRUD family; book-as-member | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** CRUD APIs + **book-as-member** (create appointment for a member using the owner’s token).

**Must:** JWT user must own the family row (reuse DoctorOwnership idea but for patient-owner). New-API only.

**Done looks like:** Swagger: add/list/update/remove member; book appointment with `familyMemberId` that 403s if not yours.


#### Code reality (detail)

No family CRUD or book-as-member API.


#### Plan (do not implement until approved)

1. Design table columns using FND-01.01 keys.
2. New-API entity + SQL script + controller.
3. JWT ownership checks.
4. Swagger demo + 401/403 cases.


#### Definition of done

- Demo proves: API: CRUD family; book-as-member | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


---

## CON-02 — Caregiver authorization — let a family member book and manage on their behalf

- Module: `M16` Patient continuity APIs
- Stream: B-PatientEco · Priority: P1 Parallel must finish · Days: Day 5–7
- PDF feature: Caregiver authorization
- Sibling subtasks: `CON-02.01`, `CON-02.02`, `CON-02.04`

### Why this main task exists

A caregiver (adult child, spouse) may book and manage **on behalf of** a patient after explicit authorisation. Stronger than family-member list: it is delegated access, OTP-gated.


### Subtask `CON-02.01` — DB: CaregiverAuth

| | |
|---|---|
| Work type | New |
| Work bifurcation | Database |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = No; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M16_Patient_APIs for PDF refs / source area. |
| Tracker DoD | Demo proves: DB: CaregiverAuth | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Table `CaregiverAuth`: grantor patient, grantee user, scope (book/view), granted/revoked timestamps.

**Code today:** ConsentType `Caregiver` seed exists; no CaregiverAuth table.


#### Code reality (detail)

No CaregiverAuth table. ConsentType Caregiver seed exists but is unused.


#### Plan (do not implement until approved)

1. Design table columns using FND-01.01 keys.
2. New-API entity + SQL script + controller.
3. JWT ownership checks.
4. Swagger demo + 401/403 cases.


#### Definition of done

- Demo proves: DB: CaregiverAuth | Backend Done | Database Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `CON-02.02` — API: grant/revoke/list; booking authorisation check

| | |
|---|---|
| Work type | New |
| Work bifurcation | Web API |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = **Not Started**; API = **Not Started**; Integration = No; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M16_Patient_APIs for PDF refs / source area. |
| Tracker DoD | Demo proves: API: grant/revoke/list; booking authorisation check | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** APIs grant / revoke / list; appointment APIs check authorisation before allowing book-as-caregiver.

**Depends:** CON-02.01, CON-01.02 pattern, SEC-04 policies (patient token, not AdminPortal).


#### Code reality (detail)

No grant/revoke/list caregiver API or booking authorisation check.


#### Plan (do not implement until approved)

1. Design table columns using FND-01.01 keys.
2. New-API entity + SQL script + controller.
3. JWT ownership checks.
4. Swagger demo + 401/403 cases.


#### Definition of done

- Demo proves: API: grant/revoke/list; booking authorisation check | Backend Done | Database Done | API Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.


### Subtask `CON-02.04` — OTP on grant

| | |
|---|---|
| Work type | New Integration |
| Work bifurcation | Integration |
| Tracker layers | Frontend = No; Backend = **Not Started**; Database = No; API = **Not Started**; Integration = **Not Started**; Mobile = No |
| Tracker derived status | Not Started (tracker layers) |
| **Code reality** | **NOT STARTED** |
| Depends / notes | See module sheet M16_Patient_APIs for PDF refs / source area. |
| Tracker DoD | Demo proves: OTP on grant | Backend Done | API Done | Integration Done | Module sheet synced | Mentor spot-check OK |

#### Full explanation

**What you do:** Sending a caregiver grant requires OTP verify (generic SEC-07) to the grantor’s phone.

**Depends:** SEC-07.02 + PRE-03.02 (real SMS) or accept stub OTP in UAT.

**Done looks like:** Grant endpoint returns 403 until VerifyOtp succeeds for Action=CaregiverGrant.


#### Code reality (detail)

OTP-on-grant not wired. Generic OTP API could be reused after SEC-07 + PRE-03.02.


#### Plan (do not implement until approved)

1. Design table columns using FND-01.01 keys.
2. New-API entity + SQL script + controller.
3. JWT ownership checks.
4. Swagger demo + 401/403 cases.


#### Definition of done

- Demo proves: OTP on grant | Backend Done | API Done | Integration Done | Module sheet synced | Mentor spot-check OK

- Mentor can demo the subtask text without extra work from you.

- No secrets committed. No third API. No neighbour tickets pulled in.

---

## 7. Excluded UI-track tickets (awareness only)

These sit on S1_Week1 but **Track = UI**. They are not in the Web implementation queue.

| ID | Subtask | Why excluded |
|---|---|---|
| FND-02.01 | Account layout + Pharmacy stub | UI shells |
| FND-02.02 | Per-route ACL skeleton | UI routing |
| SEC-01.03 | Remove `fakeBackend()` from App.js | SPA |
| SEC-02.03 | Real forgot/reset pages | SPA |
| SEC-03.02 | Logout.js calls logout API | SPA |
| SEC-04.02 | Hide Velzon demo routes | SPA |
| ADM-B04.03 | Consume GetMenuByRole in LayoutMenuData | SPA |
| CON-01.03 / CON-02.03 | Family/caregiver UI | Phase 16 SPA |

Related SPA facts (evidence only): `fakeBackend()` is still called in `App.js`; `logoutApi()` is defined but unused; `getMenuByRole` helper exists but nav is `LayoutMenuData`.

---

## 8. Suggested approval options

Reply with one of:

1. **Approve Wave 1 only** — close M01 security gaps in New-API (denylist, directory browser, DoctorOwnership, confirm SQL).  
2. **Approve Wave 0 + Wave 1** — also produce the decision/config notes (you or finance must answer PRE-* questions).  
3. **Approve Wave 1 + Wave 3** — M01 gaps + MenuMaster Account seed.  
4. **Approve Wave 4 as well** — start FamilyMember / CaregiverAuth on New-API.  
5. **Do not start M02 rebuilds** — recommended regardless of option.

I will not write application code until you pick an option (or a custom list of Sub Task IDs).

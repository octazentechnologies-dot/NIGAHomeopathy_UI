# NIGA Homeocentrum — Complete Ecosystem Development Plan

**Generated:** 28 August 2026  
**Scope:** Every item in the product draft — existing remaining / incomplete **and** new — plus Hello Homeo Doc patient modules, HomeoMeds, mobile apps, marketplace payments, and the Account department role.  
**Repos analyzed:**

| Repo | Path | Role in the ecosystem |
|------|------|------------------------|
| NigaHomeopathy-UI | `/Users/OctazenWork/NIGA Project/NigaHomeopathy-UI` | React 18 SPA — Admin, Doctor, Reception, marketing |
| NigaHomeopathy-API | `/Users/OctazenWork/NIGA Project/NigaHomeopathy-API` | .NET 8 API (`api1.homeocentrum.com`) — schedule, WhatsApp, 3D, audio AI, registration, board backup |
| NIGA_Latest_Code_API | `/Users/OctazenWork/NIGA Project/NIGA_Latest_Code_API` | .NET Core 2.2 API (`api.homeocentrum.com`) — login, masters, Razorpay subscription order, Rx write, notes |

**Companion docs:** [CODEBASE_DEEP_ANALYSIS.md](./CODEBASE_DEEP_ANALYSIS.md) (system map) · [NEW_FEATURES_DEVELOPMENT_PLAN.md](./NEW_FEATURES_DEVELOPMENT_PLAN.md) (new-only subset; this file supersedes it for planning).

**Type legend:** **UI** = layout/copy/screen · **Frontend** = React/Redux/helpers · **Backend** = API/DB · **Mobile** = Patient/Doctor native (or React Native) apps — **not in the current repos**.

---

## Table of contents

1. [How to read this plan](#1-how-to-read-this-plan)
2. [Codebase reality (what exists today)](#2-codebase-reality-what-exists-today)
3. [One ecosystem — roles, platforms, and how they interlink](#3-one-ecosystem--roles-platforms-and-how-they-interlink)
4. [Payment operating model (Homeocentrum as merchant of record)](#4-payment-operating-model-homeocentrum-as-merchant-of-record)
5. [Completeness audit of every draft item](#5-completeness-audit-of-every-draft-item)
6. [Master implementation table](#6-master-implementation-table)
7. [Required APIs](#7-required-apis)
8. [Role-wise screen maps](#8-role-wise-screen-maps)
9. [Hello Homeo Doc patient module map](#9-hello-homeo-doc-patient-module-map)
10. [HomeoMeds go-live module list](#10-homeomeds-go-live-module-list)
11. [Data model additions](#11-data-model-additions)
12. [Delivery phases](#12-delivery-phases)
13. [File touchpoints](#13-file-touchpoints)
14. [Acceptance criteria](#14-acceptance-criteria)
15. [Explicit non-goals / traps](#15-explicit-non-goals--traps)

---

## 1. How to read this plan

The product draft mixes three kinds of work:

| Kind | Meaning in this plan |
|------|----------------------|
| **Existing 100%** | Live in Admin/Doctor/Reception today. Listed so nothing is skipped. Remaining work = regression, ACL, dual-API hygiene — not a rebuild. |
| **Existing remaining / incomplete** | Screen or API exists but is stub, fake-wired, partial, or missing a role surface. Completion % from the draft is validated against code. |
| **New** | No product screen/API. Includes Admin ops, consult payments, telemedicine, patient web+mobile, HomeoMeds, Account role. |

**Implementation rule:** all new domain modules go on **NigaHomeopathy-API (.NET 8)** unless a classic-only surface must be extended in-place (login, `SavePrescriptionDetail`, `AppointmentHistoryNote`, Razorpay `Order/GenerateOrderId` until ported). Do not create a third API.

---

## 2. Codebase reality (what exists today)

### 2.1 Topology

```
Browser (NigaHomeopathy-UI)
  ├── axios default  →  api.homeocentrum.com     (classic .NET 2.2)
  └── axios nigahomeo →  api1.homeocentrum.com    (.NET 8)

Future (not in repo)
  ├── Patient mobile  →  same .NET 8 public/patient APIs
  ├── Doctor mobile   →  same .NET 8 doctor APIs (shared DoctorId)
  └── Pharmacy console →  same .NET 8 HomeoMeds APIs
```

Configured in `src/config.js`. Both APIs share the SQL Server family `HomeoCentrum_Production`.

### 2.2 Roles that actually run

`src/Components/constants/roles.js`: `Admin`, `Doctor`, `Reception`, plus unused `Management` / `Supervisor` / `Inspector`.

| Role today | Home route | Layout | Auth path |
|------------|------------|--------|-----------|
| Admin | `/dashboard` (Velzon ecommerce — **wrong landing**) | Sidebar shown | Classic `POST /Account/Login` |
| Doctor | `/doctordashboard` | Sidebar hidden | Same login; RoleId=3 + subscription flags |
| Reception | `/doctordashboard` | Same as Doctor; some clinical actions disabled | Same login via `DoctorReceptionStaff` |
| Guest | `/*` marketing (`HomeoJobLanding`) | No app shell | Unauthenticated |
| Patient | **Does not exist** | — | — |
| Account / Finance | **Does not exist** | — | — |
| Pharmacy partner | **Does not exist** | — | — |

There is **no per-route ACL**. Any authenticated user who knows a URL can open any protected page. Menu permissions exist in DB (`RoleMaster` + `RoleDetail` + `MenuMaster`) but `GetMenuByRole` is commented out on the newer API.

### 2.3 What money does today

Only **doctor SaaS package subscription** via Razorpay:

1. UI `Widgets.js` → classic `POST /Order/GenerateOrderId`
2. Razorpay Checkout (client)
3. classic `POST /Subscription/SaveUpdateSubscription` stores `OrderId` / `PaymentId` / `TransactionId` on `PackageEntryDetail`

There is **no webhook, no signature verify on server, no consult fee, no patient payment, no pharmacy ledger, no Account role, no invoice entity**. .NET 8 has package/subscription persistence but **no OrderController**.

### 2.4 Confirmed code vs draft percentages (incomplete items)

| Draft item | Draft % | Code finding |
|------------|---------|--------------|
| Admin password reset | 50% | `/forgot-password` UI exists; thunk uses **fake/Firebase**, not `POST /users/ForgetPassword` (which emails **plaintext** password) |
| Admin / Doctor / Reception profile | 50% / 20% / 0% | Shared `/profile` is Velzon `first_name` only — not doctor credentials, clinic, photo, or reception profile |
| Clear session | 50–80% | Client clears `sessionStorage`; no server logout / token revoke; `UserLoginStatus` unused |
| Admin home widgets | 0% | `pages/Admin/Dashboard` is Velzon ecommerce (Revenue, StoreVisits). Login also lands on `/dashboard` not `/admin/dashboard` |
| Platform users | 80% | List/Add/Edit live; **Import/Export buttons are dead**; no verification column; no credentialing |
| Daily schedule setup | 0% | **Partial code:** `DailyScheduleSetupModal` + `GetDailySchedule` / `SaveDailySchedule` exist; not a first-class doctor/reception schedule product |
| Manage reception staff | 50% | .NET 8 `api/ReceptionStaff` CRUD exists; **no UI helper / page** in the SPA |
| Save complaints & case details | 20% | Classic `SaveComplaints` / `SaveCaseDetails` APIs exist; **Patient Board does not call them** |
| Export case data | 0% | Newer `ExportCasesToExcel` exists; **no Patient Board export UI** |
| Appointment reschedule | New | Time can be edited via `UpdateAppointmentTime`; **no formal Reschedule** (audit, notify, old→new confirm) |
| Appointment cancel | New | Statuses: WAITING, WALK-IN, NOT ARRIVED, E-CONSULT, REMAINING, COMPLETED. **No CANCELLED** |
| Prescription Dose | — | Saved as empty free-text `dose: ''` — potency module not started |
| Telemedicine | New | `E-CONSULT` status + SweetAlert “WhatsApp video” stub only |
| WhatsApp | 50% | Meta Cloud send/templates/campaigns live; bulk/opt-in/analytics incomplete |
| Audio rubric accuracy | 50% | Engine + admin metaphors/aliases exist; accuracy rules still in progress |
| 3D anatomy viewer | 50% | Viewer + hotspot→search live; incomplete mesh coverage / UX |
| Subscription Razorpay | 70% | Checkout works; no webhook, refund, invoice, GST, Account ledger |
| Waiting queue (reception) | 60% | Status buckets on shared dashboard; no dedicated queue UX |
| Patient self-booking / consult pay / tickets / HomeoMeds / mobile | 0% | **Absent** from all three repos |

---

## 3. One ecosystem — roles, platforms, and how they interlink

Every new module must share **identity, appointment, prescription, and money** — not siloed apps.

```
                    ┌──────────────────────────────────────────┐
                    │         HOMEOCENTRUM PLATFORM            │
                    │  Identity · Appointments · eRx · Ledger  │
                    └──────────────────────────────────────────┘
         ┌──────────┼──────────┬──────────┬──────────┬─────────┤
         ▼          ▼          ▼          ▼          ▼         ▼
      Admin      Account    Doctor     Reception   Patient   Pharmacy
      Portal     (Finance)  Web+App    Web         Web+App   Console
         │          │          │          │          │         │
         │          │          ├──────────┤          │         │
         │          │          │  Clinic  │          │         │
         │          │          └────┬─────┘          │         │
         │          │               │                │         │
         │          │     Appointment + eRx + labs   │         │
         │          │               │                │         │
         │          │               ▼                ▼         ▼
         │          │         Teleconsult / in-clinic visit
         │          │               │
         │          └───────────────┴── Consult $ ───┘
         │                          └── Medicine $ ────────────┘
         └── Credentialing, tickets, exceptions, masters ───────┘
```

### Shared keys (must stay consistent)

| Key | Meaning | Used by |
|-----|---------|---------|
| `DoctorId` / `UserId` | Doctor identity (same on web + doctor mobile) | All clinical + payout |
| `PatientId` | Patient (clinic-created **or** self-registered) | Booking, records, HomeoMeds |
| `PatientAppId` | One visit / appointment | Queue, tele, payment, eRx, notes |
| `CaseId` | Clinical case | Patient Board, audio, export |
| `ErxId` / prescription snapshot | Signed remedies (codes vs names) | Patient view, pharmacy |
| `LedgerTxnId` | Every rupee movement | Account, OTP audit |
| `OrderId` (commerce) | Razorpay / COD order | Consult + HomeoMeds |

### Cross-role events (minimum)

| Event | Who produces | Who consumes |
|-------|--------------|--------------|
| Doctor registered | Guest web | Admin credentialing queue |
| Doctor verified | Admin | Doctor can practice; patient directory ranking |
| Slot saved | Doctor / Reception | Patient booking, doctor mobile queue |
| Appointment created | Patient / Reception / Doctor | SMS/WhatsApp, payment, queue, Account (if paid) |
| Reschedule / Cancel | Doctor / Reception / Patient | Slot free, notify, ledger refund rule |
| Consult paid | Patient / Reception | Queue unlock, doctor badge, Account |
| eRx signed | Doctor (web Patient Board) | Patient sees **codes**; pharmacy offer; Account later |
| Pharmacy accepts | Pharmacy console (OTP) | Patient sees remedy names + pay QR/link |
| Ticket opened | Patient / Doctor | Admin / Support queue |
| Doctor online | Doctor web/mobile | Patient instant consult / waiting room |

---

## 4. Payment operating model (Homeocentrum as merchant of record)

**Decision:** Homeocentrum is the **single merchant of record** (Zomato / Blinkit pattern). Patients, doctors, and pharmacies never settle money with each other for platform transactions. Every inbound rupee hits a Homeocentrum Razorpay (or successor) account; the **Account department** owns the ledger, GST, settlements, refunds, and exceptions.

### 4.1 Money streams

| Stream | Payer | Collects | Settles to | Existing code |
|--------|-------|----------|------------|---------------|
| **S1 SaaS subscription** | Doctor | Homeocentrum 100% | Platform revenue | Yes — `PackageEntryDetail` + Razorpay order (classic) |
| **S2 Consult fee (online)** | Patient | Homeocentrum | Doctor payout minus platform commission + GST | **New** |
| **S3 Consult fee (reception)** | Patient (cash / UPI / card / pay-link) | Recorded at clinic; **still ledgered** | Policy: clinic-retained **or** remitted — Account configures | **New** |
| **S4 Instant / teleconsult premium** | Patient | Homeocentrum | Same as S2 + optional surge | **New** |
| **S5 HomeoMeds medicines** | Patient (prepaid or COD) | Homeocentrum (prepaid) or collect-on-delivery logged | Pharmacy (seller) + platform + delivery — **separate from consult money** | **New** |
| **S6 Refunds / chargebacks / failed capture** | Platform | — | Reverse ledger; exception queue | **New** |
| **S7 Payouts** | Homeocentrum | — | Doctor / Pharmacy bank (NEFT/IMPS/Razorpay Route or X) | **New** |

Do **not** overload `PackageEntryDetail` for S2–S7. That table is SaaS subscription only.

### 4.2 Flow (consult — like a restaurant order)

```
Patient books slot
    → Appointment (UNPAID / PAY_AT_CLINIC / PAID)
    → If online pay: CreateOrder (Homeocentrum Razorpay)
    → Webhook payment.captured  (source of truth — not client callback alone)
    → Ledger: CREDIT consult, GST, commission pending
    → Appointment.PaymentStatus = PAID
    → Doctor/Reception see badge; tele queue may require PAID
    → After consult complete + T+N settlement window
    → Account approves payout (OTP)
    → Doctor receives net amount
```

### 4.3 Flow (HomeoMeds — like Blinkit, with clinical privacy)

```
Doctor signs eRx  →  immutable order draft (remedy CODES only to patient)
Pharmacy routing (licence, area, hours, capacity)  →  offers to sellers
Seller accepts (OTP)  →  patient UI switches CODES → names + quote
Patient pays Homeocentrum (or COD)  →  QR / payment link
Pharmacy marks ready / dispatched
Ledger split: seller / platform / delivery  (never mixed with S1/S2)
Stuck/rejected  →  Account + Ops exception queue (never silent)
```

### 4.4 OTP as control plane (Homeocentrum can monitor every sensitive step)

Every high-risk action issues an OTP and writes `OtpAuditLog`:

| Action | Who receives OTP | Why |
|--------|------------------|-----|
| Patient login / booking | Patient mobile | Identity |
| Pay / refund confirm | Patient | Transaction bind |
| Pharmacy accept prescription | Pharmacy registered mobile | Unlock names + quote |
| Account payout / manual reconcile | Account user | Dual control |
| Doctor payout KYC change | Doctor | Fraud |
| eRx share / download | Patient | Privacy |

Account and Admin can query the OTP audit (who, when, entity, success/fail) without seeing payment card data.

### 4.5 Account department role — job to be done

New role `Account` (also suggested menu name **Finance**). Not Admin (masters) and not Doctor.

| Capability | Screen |
|------------|--------|
| Unified ledger (all streams) | `/account/ledger` |
| Settlement runs (doctors, pharmacies) | `/account/settlements` |
| Payout approval (OTP) | `/account/payouts` |
| Consult reconciliation | shares Admin consult dashboard or `/account/consult-recon` |
| HomeoMeds medicine ledger (separate) | `/account/medicine-ledger` |
| Payment exceptions / failed / mismatch | `/account/exceptions` (same queue Admin sees) |
| Refunds | `/account/refunds` |
| GST / invoice export | `/account/tax` |
| Doctor / pharmacy KYC for payouts | `/account/payees` |
| Cash vs online mix (reception collections) | `/account/clinic-collections` |

Admin may **view** the same queues; Account **owns** money movement.

### 4.6 Suggested gateway & split tech

| Need | Recommendation |
|------|----------------|
| Collect from patients/doctors | **Razorpay** (already in classic `OrderService`) — port to .NET 8, **move keys to config**, add webhooks |
| Marketplace split to doctors/pharmacies | Razorpay **Route** / Linked Accounts **or** Homeocentrum-held + periodic NEFT payout (Account-operated). Route is closer to Zomato; NEFT+ledger is simpler for v1 |
| UPI at reception | Razorpay QR / payment link **or** mark CASH/UPI_OFFLINE with receipt (still a ledger row) |
| COD HomeoMeds | Status `COD_PENDING` until pharmacy confirms collection |
| Webhook | `POST /api/Payments/Webhook/Razorpay` anonymous + signature verify — **source of truth** |

**v1 (recommended):** Homeocentrum collects 100%; Account settles net to doctors/pharmacies on a cycle (T+2). No live Route split required to go live.  
**v2:** Razorpay Route for automatic doctor/pharmacy splits.

### 4.7 Commission & fee config (Account + Admin)

| Config | Example |
|--------|---------|
| `ConsultCommissionPercent` or flat | Platform cut on S2 |
| `TeleConsultSurcharge` | Instant consult |
| `MedicinePlatformFee` | S5 |
| `GstRate` | On platform fee / on consult as per CA |
| `SettlementHoldDays` | Chargeback window |
| `PayAtClinicEnabled` | Per doctor |

---

## 5. Completeness audit of every draft item

Status: **Done** · **Partial** · **Missing**.

### 5.1 Admin Portal — Internal Admin

| Main | Feature | Status | % | Remaining essence |
|------|---------|--------|---|-------------------|
| Authentication | Doctor / Admin / Reception login | Done | 100 | ACL, password hashing |
| Authentication | Password reset request | Partial | 50 | Wire real reset-token flow (stop plaintext email + fake thunk) |
| Authentication | View / edit logged-in user profile | Partial | 50 | Real profile (name, email, phone, photo, password change) |
| Authentication | Clear session | Partial | 50 | Server logout, revoke JWT, `UserLoginStatus` |
| Dashboard | Admin home / overview widgets | Missing | 0 | Replace Velzon ecommerce; KPIs: doctors, bookings, payments, tickets, exceptions |
| Repertory | All 9 list/add/edit items | Done | 100 | Dual-API hygiene only |
| Materia Medica | All 4 items | Done | 100 | — |
| Clinical Patterns | All 3 items | Done | 100 | — |
| Adverse Effect | All 3 items | Done | 100 | — |
| Existance Questions | All 4 items | Done | 100 | — |
| Business Management | Platform users | Partial | 80 | Wire Import/Export; verification badge; lock unverified doctors |
| Business Management | Roles & menu permissions | Done | 100 | Re-enable GetMenuByRole + frontend ACL |
| Business Management | Subscription packages | Done | 100 | Tie into Account ledger when SaaS pay is verified |
| Business Management | Doctor qualifications | Done | 100 | Used by credentialing |
| Business Management | Lab / imaging catalog | Done | 100 | — |
| Business Management | Doctor credentialing review | Missing | 0 | New queue |
| 3D Body Part | All 3 masters | Done | 100 | — |
| Consult Booking & Payments | Reconciliation dashboard | Missing | 0 | New |
| Consult Booking & Payments | Payment exception queue | Missing | 0 | New |
| Support | Patient & doctor issue queue | Missing | 0 | New (not Velzon tickets, not Enquiry) |
| **Account (new role)** | Ledger, settlements, payouts | Missing | 0 | New |
| **HomeoMeds ops** | Pharmacy onboarding, licence, exceptions | Missing | 0 | New |

### 5.2 Web Portal — Guest / Public

| Feature | Status | % | Remaining |
|---------|--------|---|-----------|
| Product home | Partial | 50 | CTAs to book, trust, verified doctors |
| Subscription / consult pricing display | Done (SaaS pricing) | 100 | Add **consult fee** display per doctor |
| Contact / enquiry | Partial | 50 | Admin inbox for EnquiryDetail; SLA |
| Privacy policy | Partial | 50 | DPDP, tele-recording, pharmacy consent, data rights |
| Terms of service | Partial | 50 | Payments, telemedicine, HomeoMeds, refunds |
| Doctor self-registration | Partial | 90 | Gate practice on credentialing; document upload |
| Activate from email | Partial | 90 | Align with verification; expiry; resend |
| Patient self-service booking | Missing | 0 | New |
| Patient-facing consult payment | Missing | 0 | New |

### 5.3 Web Portal — Doctor

| Feature | Status | % | Remaining |
|---------|--------|---|-----------|
| Doctor login | Done | 100 | Shared DoctorId for mobile |
| View / edit profile | Partial | 20 | Clinic, fees, KYC, photo, qualifications, hours |
| Clear session | Partial | 80 | Server revoke |
| Doctor home dashboard | Partial | 70 | Online toggle, payment badges, tele queue, follow-up |
| Counts, waiting, quick actions | Done | 100 | Extend with paid/unpaid |
| Patient search / list / open case | Partial | 90 | Filters, family, payment, last visit |
| New / import / export patients | Done | 100 | — |
| Appointment list / waiting | Partial | — | Formal cancel/reschedule; payment; tele |
| New appointment | Partial | 90 | Visit type, consult mode, fee |
| Status / time update | Done | 100 | — |
| Reschedule / Cancel | Missing | 0 | New |
| Daily schedule setup | Partial* | 0* | Promote modal to product + reception view |
| Appointment slot grid | Done | 100 | Public booking reuses this |
| Patient stats charts | Done | 100 | Foundation for clinic performance |
| Recent activity | Done | 100 | — |
| Manage reception staff | Partial | 50 | Build UI on existing API |
| Follow-up analysis | Missing | 0 | New |
| Clinic performance analysis | Missing | 0 | New |
| Buy / renew Razorpay package | Partial | 70 | Webhook, invoice, Account ledger |
| SMS outreach | Missing | 0 | New |
| WhatsApp outreach | Partial | 50 | Finish bulk, templates governance, logs |
| Open clinical workspace | Partial | 90 | Split notes/eRx; potency; COG |
| Manual case, body parts, questions, diagnosis, repertory, allopathic | Done | 100 | — |
| Audio case taking accuracy | Partial | 50 | Engine v-next rules (existing audio docs) |
| Browse materia medica | Partial | 90 | Polish during case |
| Repertorization & elimination | Partial | 90 | + Center of Gravity |
| Center of Gravity | Missing | 0 | New |
| Save prescription | Partial | 80 | Write path on classic; codes vs names; potency |
| Potency module | Missing | 0 | New |
| Lab orders & entries | Done | 100 | — |
| Appointment history notes | Done | 100 | Split from eRx |
| Save complaints & case details | Partial | 20 | Wire Patient Board to existing APIs |
| View patient back history | Partial | 70 | Timeline, eRx, payments |
| Export case data | Missing | 0 | UI on existing Excel API |
| Manage selected rubrics | Partial | 90 | — |
| Restore board session | Done | 100 | — |
| Visit notes ≠ eRx | Missing | 0 | New |
| 3D anatomy viewer | Partial | 50 | Completeness of models/hotspots |
| Telemedicine suite (5 items) | Missing | 0 | New |
| View consult payment status | Missing | 0 | New |

### 5.4 Web Portal — Reception

| Feature | Status | % | Remaining |
|---------|--------|---|-----------|
| Reception login | Done | 100 | — |
| Profile | Missing | 0 | Reception-specific profile |
| Clear session | Partial | 50 | Same as admin session work |
| Reception home | Partial | 90 | Dedicated reception chrome (not only hidden doctor actions) |
| Create patient / search / appointments / new appt | Done | 100 | — |
| Waiting queue | Partial | 60 | Dedicated queue; payment gate; tele vs walk-in |
| Status / time | Done | 100 | — |
| Reschedule / Cancel | Missing | 0 | Same APIs as doctor |
| View / support doctor schedule | Missing | 0 | Read-only schedule + slots |
| Log case paper / chief complaint | Missing | 0 | Restricted Patient Board or case-paper form |
| Collect per-consult payment | Missing | 0 | New |

### 5.5 Mobile — Patient (not in repo)

All **Missing**. Maps to Hello Homeo Doc modules in §9.

### 5.6 Mobile — Doctor (not in repo)

All **Missing**. Same `DoctorId` as web. No case-taking on mobile (refill approve only).

---

## 6. Master implementation table

Columns: **Role · Main · Features · Screens · Type · Tasks**

Work is listed for remaining + new. **100% existing masters** are summarized in §6.0 so they are not skipped.

### 6.0 Existing complete masters (keep; do not rebuild)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Repertory | Section, subsection/rubric tree, rubric-remedy, remedial rubrics, language, body part, intensity, remedy, remedy grade | `admin/list\|add\|edit*` under `pages/Admin/Repertory/**` | UI / Frontend / Backend | Regression only; keep Excel import/export; prefer classic Pagination + overlapping .NET 8 |
| Admin | Materia Medica | Author, MM master, head, MM remedies | `pages/Admin/MateriaMedica/**` | UI / Frontend / Backend | Regression only |
| Admin | Clinical Patterns | Diagnosis system, therapeutics, conditions | `pages/Admin/ClinicalPatterns/**` | UI / Frontend / Backend | Regression only |
| Admin | Adverse Effect | Drug system, group, allopathic + side effects | `pages/Admin/AdverseEffect/**` | UI / Frontend / Backend | Regression only |
| Admin | Existance Questions | Section, group, subgroup, clinical mapping | `pages/Admin/ExistanceQuestions/**` | UI / Frontend / Backend | Regression only |
| Admin | 3D Body Part | Mesh key, section, hotspots | `pages/Admin/3DBodyPartv/**` | UI / Frontend / Backend | Regression; feeds doctor anatomy |
| Admin | Business Management | Roles, packages, qualifications, lab catalog | `admin/list\|add\|editrole`, `package`, `qualification`, `labsimaging` | UI / Frontend / Backend | Re-enable menu-by-role for ACL; packages stay S1 SaaS |
| Doctor | Patient Board (core case taking) | Manual case, body parts, questions, diagnosis, repertory search, allopathic lookup, labs, history notes, board restore | `/doctor/patientboard` (`PatientBoard.js`) | UI / Frontend / Backend | Do not rebuild; extend with remaining rows below |
| Doctor | Dashboard ops | Counts, new patient, import/export patients, status/time, slot grid, stats charts, recent activity | `/doctordashboard` Widgets + BestSellingProducts | UI / Frontend / Backend | Extend, do not replace |
| Guest | Pricing display | SaaS package marketing | `/pricing` | UI | Add consult-fee story when S2 exists |
| All clinical roles | Authentication login | Login | `/login` | Frontend / Backend | Hash passwords; embed Role claim for doctors |

---

### 6.1 Admin — Authentication (remaining)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Authentication | Password reset request | `/forgot-password`; email link `/reset-password/:token` | UI | Real copy (not Velzon fake); success/expiry states |
| Admin | Authentication | Password reset | Same | Frontend | Replace `slices/auth/forgetpwd/thunk.js` fake/Firebase with `POST /users/ForgotPassword` + `ResetPassword`; stop `postFakeForgetPwd` |
| Admin | Authentication | Password reset | Same | Backend | Tokenized reset (hash, TTL); **stop emailing plaintext password**; `ChangePassword` for logged-in user |
| Admin | Authentication | View / edit profile | `/profile` (replace Velzon first_name) | UI | Fields: name, email, mobile, photo, password change |
| Admin | Authentication | Profile | Same | Frontend | Load `GET /users/{id}`; save via users update; photo multipart |
| Admin | Authentication | Profile | Same | Backend | Dedicated profile DTO; do not allow role escalation |
| Admin | Authentication | Clear session | Header logout (existing `Logout.js`) | Frontend | Call logout API; clear board session (already); drop token |
| Admin | Authentication | Clear session | Same | Backend | `POST /Account/Logout`; persist `UserLoginStatus`; optional token denylist |

### 6.2 Admin — Dashboard (remaining)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Dashboard | Admin home / overview widgets | `/admin/dashboard` as **true** home; redirect `/dashboard` away from Velzon ecommerce | UI | KPI cards: active doctors, pending credentialing, bookings today, consult GMV, failed payments, open tickets, HomeoMeds exceptions |
| Admin | Dashboard | Overview widgets | Same | Frontend | New widgets (do not reuse StoreVisits/Revenue demos); ApexCharts from real APIs; `getHomeDashboardPath` → `/admin/dashboard` |
| Admin | Dashboard | Overview widgets | Same | Backend | `GET /api/AdminDashboard/Overview` aggregating credentialing, payments, tickets, appointments |

### 6.3 Admin — Business Management (remaining + new)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Business Management | Platform users (remaining 20%) | `/admin/listusers`, add, edit | UI | Working Import/Export; Verification column; Activate/lock |
| Admin | Business Management | Platform users | Same | Frontend | Wire Import/Export buttons in `ListUser.js` (currently dead); link to credentialing |
| Admin | Business Management | Platform users | Same | Backend | User import/export APIs; `VerificationStatus` on Doctor/User |
| Admin | Business Management | Roles & menu (ACL leftover) | Existing role pages + runtime menu | Frontend | Hide routes user cannot view |
| Admin | Business Management | Roles & menu | Same | Backend | Restore `GetMenuByRole`; `[Authorize(Roles=)]` on new money APIs |
| Admin | Business Management | Doctor credentialing / verification | `/admin/doctor-credentialing`; `/admin/doctor-credentialing/:doctorId` | UI | Queue: Pending / Approved / Rejected / NeedsInfo; detail: qualification, university, cert, docs; actions |
| Admin | Business Management | Doctor credentialing | Same | Frontend | Routes + `LayoutMenuData.js`; list/detail pages; badge on user list |
| Admin | Business Management | Doctor credentialing | Same | Backend | `DoctorVerification`, `DoctorCredentialDocument`; APIs §7.1; gate practice until Approved |
| Admin | Business Management | Doctor credentialing | Doctor `/profile` credentials tab; Patient directory | Mobile | Patient app shows verified badge; doctor app shows status |

### 6.4 Admin — Consult payments, tickets, Account

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Consult Booking & Payments | Reconciliation dashboard | `/admin/consult-payments` | UI | KPIs collected / pending / failed / refunded; booking↔payment↔appointment grid; CSV |
| Admin | Consult Booking & Payments | Reconciliation | Same | Frontend | Filters date/doctor/status; drill to appointment |
| Admin | Consult Booking & Payments | Reconciliation | Same | Backend | Join `ConsultPayment` + `PatientAppointment`; admin aggregate APIs |
| Admin | Consult Booking & Payments | Payment exception queue | `/admin/payment-exceptions` | UI | Failed / Partial / Webhook-mismatch / Refund-pending; retry / resolve |
| Admin | Consult Booking & Payments | Exceptions | Same | Frontend | Drawer; Razorpay ids; OTP confirm on manual resolve |
| Admin | Consult Booking & Payments | Exceptions | Same | Backend | Webhook store; exception state machine; audit |
| Admin | Support Ticket | Patient & doctor issue queue | `/admin/support-tickets`; `/admin/support-tickets/:id` | UI | List + thread + assignee + SLA; **not** Velzon `/apps-tickets-*` |
| Admin | Support Ticket | Issue queue | Same | Frontend | Real module; filters by role/priority |
| Admin | Support Ticket | Issue queue | Same | Backend | `SupportTicket` + messages + attachments |
| Account | Finance | Unified ledger | `/account/ledger` | UI | All streams S1–S7; filters; OTP audit link |
| Account | Finance | Ledger | Same | Frontend | Account layout (sidebar Finance); export |
| Account | Finance | Ledger | Same | Backend | `LedgerEntry` immutable append-only |
| Account | Finance | Settlements & payouts | `/account/settlements`; `/account/payouts` | UI | Cycle, payee, net, hold; approve with OTP |
| Account | Finance | Settlements | Same | Frontend / Backend | Settlement run job; payout file / Razorpay; `OtpAuditLog` |
| Account | Finance | Medicine ledger | `/account/medicine-ledger` | UI | **Separate from consult**; seller/platform/delivery split |
| Account | Finance | Clinic cash collections | `/account/clinic-collections` | UI | Reception cash/UPI vs online |
| Account | Finance | Tax / GST export | `/account/tax` | UI / Backend | Invoice numbers; GST reports |
| Account | Finance | Payee KYC | `/account/payees` | UI | Doctor/pharmacy bank + PAN |

### 6.5 Guest / Public web (remaining + new)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Guest | Marketing | Product home | `/` `HomeLandingPage.js` | UI | Book CTA, verified doctors, consult+SaaS pricing teaser, app download |
| Guest | Marketing | Product home | Same | Frontend | Deep links `/book`, store badges |
| Guest | Marketing | Contact / enquiry | `/contact` | UI | Confirmation, ticket-id if converted |
| Guest | Marketing | Contact | Same | Frontend | Existing `EnquiryDetail`; optional create SupportTicket |
| Guest | Marketing | Contact | `/admin/enquiries` | Backend / UI | Admin list (API exists; inbox screen missing) |
| Guest | Marketing | Privacy | `/privacy` | UI | DPDP, recording, pharmacy, data-rights, family/caregiver |
| Guest | Marketing | Terms | `/terms` | UI | Payments, refunds, telemedicine, HomeoMeds, codes-before-names |
| Guest | Authentication | Doctor self-registration | `/register` | UI | Document upload; pending-verification message |
| Guest | Authentication | Doctor self-registration | Same | Frontend | Multipart docs; status page |
| Guest | Authentication | Doctor self-registration | Same | Backend | Do **not** auto-activate practice; `VerificationStatus=Pending` (today RegisterDoctor activates immediately) |
| Guest | Authentication | Activate email link | `/login?UserId=` | Frontend / Backend | Token expiry, resend, align with credentialing |
| Guest / Patient | Self-service booking | Doctor discovery + book | `/book`; `/book/:doctorId`; `/book/:doctorId/slots`; `/book/confirm` | UI | Public funnel; OTP; consent |
| Guest / Patient | Self-service booking | Same | Same | Frontend | NonAuthLayout wizard; reuse slot grid UX |
| Guest / Patient | Self-service booking | Same | Same | Backend | Public rate-limited APIs §7.4; create Patient + Appointment |
| Guest / Patient | Consult payment | Paywall | `/book/pay/:bookingId`; success/fail | UI | Amount, GST, Razorpay |
| Guest / Patient | Consult payment | Same | Same | Frontend | Checkout pattern from `Widgets.js` but **consult** order API |
| Guest / Patient | Consult payment | Same | Same | Backend | `CreateConsultOrder` + webhook; never trust client-only success |

### 6.6 Doctor web — dashboard, appointments, outreach, payments

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Doctor | Authentication | Profile | `/profile` or `/doctor/profile` | UI | Clinic, photo, qualifications, consult fee, hours, bank KYC, verification status |
| Doctor | Authentication | Profile | Same | Frontend / Backend | Doctor profile APIs; fee config for S2 |
| Doctor | Authentication | Clear session | Header | Frontend / Backend | Same logout API |
| Doctor | Doctor Dashboard | Home remaining 30% | `/doctordashboard` | UI | Online toggle, tele queue, payment badges, follow-up due, SMS/WhatsApp entry |
| Doctor | Doctor Dashboard | Patient search remaining 10% | Dashboard lists | UI / Frontend | Last visit, unpaid, family |
| Doctor | Doctor Dashboard | New appointment remaining 10% | New appt modal | UI | Visit type First/Follow-up; In-clinic vs E-Consult; fee |
| Doctor | Doctor Dashboard | Reschedule | Appointment row modal | UI | Old→new date/time; confirm |
| Doctor | Doctor Dashboard | Reschedule | Same | Frontend | `BestSellingProducts.js`; refresh; notify |
| Doctor | Doctor Dashboard | Reschedule | Same | Backend | `POST .../RescheduleAppointment`; conflict; `AppointmentChangeLog` |
| Doctor | Doctor Dashboard | Cancel | Cancel modal | UI | Reason codes; cancelled bucket |
| Doctor | Doctor Dashboard | Cancel | Same | Frontend / Backend | Status `CANCELLED`; free slot; refund rule hook |
| Doctor | Doctor Dashboard | Daily schedule | Dedicated `/doctor/schedule` + existing modal | UI | Week grid; copy day; reception-visible |
| Doctor | Doctor Dashboard | Daily schedule | Same | Frontend | Promote `DailyScheduleSetupModal` to always-reachable screen |
| Doctor | Doctor Dashboard | Daily schedule | Same | Backend | Existing Get/SaveDailySchedule; validate slot public booking |
| Doctor | Doctor Dashboard | Manage reception staff | `/doctor/reception-staff` | UI | List/add/edit/disable reception users |
| Doctor | Doctor Dashboard | Manage reception | Same | Frontend | New pages calling existing `api/ReceptionStaff` |
| Doctor | Doctor Dashboard | Manage reception | Same | Backend | Already exists — authorize doctor owns staff |
| Doctor | Doctor Dashboard | Follow-up analysis | `/doctor/follow-up-analysis` | UI | Due list, outcomes, conversion charts |
| Doctor | Doctor Dashboard | Follow-up | Same | Frontend / Backend | Persist `VisitType`; analytics APIs |
| Doctor | Doctor Dashboard | Clinic performance | `/doctor/clinic-performance` | UI | Appointments/day, no-show, wait, cancel, **revenue** |
| Doctor | Doctor Dashboard | Clinic performance | Same | Frontend / Backend | Extend `GetPatientStatsCharts`; include payment + tele duration |
| Doctor | Subscription | Buy / renew remaining 30% | Widgets package modal | Frontend | Handle failed pay; show invoice |
| Doctor | Subscription | Buy / renew | Same | Backend | Port Razorpay order to .NET 8; webhook; write S1 ledger; invoice |
| Doctor | SMS Outreach | Confirm / registration / unavailable | `/doctor/sms` templates + auto hooks | UI | Template list; enable per event; preview |
| Doctor | SMS Outreach | SMS | Same | Frontend | Helper parallel to `whatsapp_helper.js`; hooks on appt/patient/offline |
| Doctor | SMS Outreach | SMS | Same | Backend | Provider (MSG91/etc.); `SmsTemplate`, `SmsMessageLog`; DND on Patient |
| Doctor | WhatsApp | Templates, offers, tips, bulk remaining 50% | Existing `WhatsAppModal` | UI | Campaign status, failures, opt-out |
| Doctor | WhatsApp | Remaining | Same | Frontend / Backend | Finish bulk queue UX; template approval states |
| Doctor | Consult payments | Payment status on appointment | Badges on lists | UI | Paid / Pending / Failed / Waived / Pay-at-clinic |
| Doctor | Consult payments | Badge | Same | Frontend / Backend | Payment fields on appointment DTOs |

### 6.7 Doctor web — Patient Board, anatomy, telemedicine

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Doctor | Patient Board | Open workspace remaining 10% | `/doctor/patientboard` | UI | Payment + tele + eRx status in header |
| Doctor | Patient Board | Audio accuracy remaining 50% | CaseTaking panels | Frontend / Backend | Follow existing `AUDIO_CASE_TAKING_*` docs; metaphor/alias QA |
| Doctor | Patient Board | MM remaining 10% | MM tab | UI | Faster head navigation during case |
| Doctor | Patient Board | Repertorization remaining 10% | Repertorize tab | UI | Stability; then COG |
| Doctor | Patient Board | Center of Gravity | Repertorize → COG sub-panel | UI | Gravity score visualization + explainability |
| Doctor | Patient Board | Center of Gravity | Same | Frontend | Component in `PatientBoard.js` (or extracted) |
| Doctor | Patient Board | Center of Gravity | Same | Backend | `POST /api/Repertorization/CenterOfGravity` |
| Doctor | Patient Board | Save Rx remaining 20% | Prescription modal | Frontend | Don’t save empty dose; potency required; signed eRx snapshot |
| Doctor | Patient Board | Save Rx | Same | Backend | Keep classic `SavePrescriptionDetail`; add snapshot + **remedy codes for patient** |
| Doctor | Patient Board | Potency module | Rx remedy row | UI | Master-driven 6C / 30C / 200C / 1M… |
| Doctor | Patient Board | Potency | Same | Frontend / Backend | `PotencyMaster`; `PotencyId` on `PrescriptionRemedyDetail` |
| Doctor | Patient Board | Save complaints remaining 80% | Case / complaints UI on board | Frontend | Call existing `SaveComplaints` / `SaveCaseDetails` |
| Doctor | Patient Board | Back history remaining 30% | History panel | UI | Timeline: visits, notes, eRx, labs, payments |
| Doctor | Patient Board | Export case | Board toolbar | UI / Frontend | Download Excel/PDF via `ExportCasesToExcel` + new PDF |
| Doctor | Patient Board | Manage rubrics remaining 10% | Clipboard | UI | Confirm delete; intensity edit |
| Doctor | Patient Board | Visit notes ≠ eRx | Visit Notes panel **outside** Rx modal; Rx = eRx only | UI | Note types: Chief complaint / Follow-up / General |
| Doctor | Patient Board | Visit notes ≠ eRx | Same | Frontend | Move History Notes out of Rx tabs |
| Doctor | Patient Board | Visit notes ≠ eRx | Same | Backend | `NoteType`, `IsErxExcluded`; `GET /api/Erx/ByAppointment/{id}` |
| Doctor | Anatomy | 3D viewer remaining 50% | `/doctor/anatomy` | UI | Completeness of GLB/hotspots; mobile fallback |
| Doctor | Telemedicine | Online / offline | Dashboard toggle | UI / Frontend / Backend | `TeleAvailability` + heartbeat |
| Doctor | Telemedicine | Waiting queue | Dashboard tele queue | UI / Frontend / Backend | Paid/confirmed E-CONSULT list; wait time |
| Doctor | Telemedicine | Join video in browser | `/teleconsult/:sessionId` | UI | In-browser video (WebRTC vendor) |
| Doctor | Telemedicine | Join | Same | Frontend | Replace WhatsApp SweetAlert stub |
| Doctor | Telemedicine | Join | Same | Backend | Room tokens linked to `PatientAppId` |
| Doctor | Telemedicine | Rejoin dropped call | Same URL + dashboard Rejoin | UI / Frontend / Backend | Session Active until End |
| Doctor | Telemedicine | Recording consent | Pre-join modal | UI / Frontend / Backend | Extend `AudioCaseConsentLog` pattern; block record if declined |

### 6.8 Reception web

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Reception | Authentication | Profile | `/profile` reception variant | UI / Frontend / Backend | Name, mobile, attached doctor; **0% today** |
| Reception | Authentication | Clear session | Header | Frontend / Backend | Logout API |
| Reception | Dashboard | Home remaining 10% | `/doctordashboard` or `/reception` | UI | Reception-first chrome: queue, collect pay, no clinical tabs |
| Reception | Dashboard | Waiting queue remaining 40% | Queue panel | UI | Walk-in vs tele; payment state; call next |
| Reception | Dashboard | Reschedule / Cancel | Same modals as doctor | UI / Frontend / Backend | Enable for reception (`isReceptionUser` must not block) |
| Reception | Dashboard | Doctor schedule | `/reception/schedule` | UI | Read-only daily slots; help book |
| Reception | Dashboard | Doctor schedule | Same | Frontend / Backend | `GetDailySchedule` by DoctorId from JWT |
| Reception | Patient Board | Log case paper / chief complaint | `/reception/case-paper` or limited board | UI | Chief complaint only; **no repertory/Rx** |
| Reception | Patient Board | Case paper | Same | Frontend / Backend | `SaveComplaints` subset; audit reception author |
| Reception | Payments | Collect per-consult payment | Collect modal on appointment | UI | Amount, Cash/UPI/Card/Pay-link, receipt |
| Reception | Payments | Collect | Same | Frontend / Backend | `CollectAtReception`; ledger S3; print receipt |

### 6.9 Mobile — Patient

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Patient | Onboarding & identity | Language, welcome, OTP, profile, privacy consent, family, caregiver | App: Language → Welcome → OTP → Profile → Consents → Family | Mobile | New app; OTP login (no password); DPDP consents |
| Patient | Onboarding | Same | Same | Backend | `POST /api/PatientAuth/RequestOtp` · `VerifyOtp`; Patient profile; family members; caregiver auth |
| Patient | Discovery | Home, search, categories, filters, doctor profile, credentials, ranking, articles | Home · Search · Filters · DoctorProfile · RankingExplain · Articles | Mobile | Directory of **verified** doctors only |
| Patient | Discovery | Same | Same | Backend | Public doctor search; credentialing badge; blog reuse |
| Patient | Booking & payment | Slots, review, checkout, payment status, detail, reschedule/cancel, waitlist, instant consult, queue | SlotPicker · BookingReview · Checkout · PaymentStatus · AppointmentDetail · Waitlist · InstantConsult · Queue | Mobile | Same booking+pay APIs as web guest |
| Patient | Consultation | Device check, waiting room, video, recording consent, fallback, chat, summary | DeviceCheck · WaitingRoom · Video · Consent · Chat · Summary | Mobile | Same tele sessions as doctor web |
| Patient | Records | Timeline, consult note, **signed eRx as codes until pharmacy accept**, uploads | Records · Note · eRxCodes · Documents | Mobile | Codes-only until `PharmacyAccepted`; then names |
| Patient | Follow-up | Plan, tasks, symptom diary, CliniSight | FollowUp · Diary · Progress | Mobile | VisitType + tasks APIs |
| Patient | HomeoMeds | Medicines tab, order, pharmacy pick, quote, consent, pay/COD, track, refill | Medicines · PharmacyPick · Quote · Consent · Pay · Track · Refill | Mobile | See §10; QR/link after accept |
| Patient | Trust & account | Review, appeal, payments/refunds, profile, consent centre, notifications | Reviews · Payments · Settings · Consents · Notifications | Mobile | Ledger read models; consent APIs |
| Patient | Support | Help, tickets, clinic appt, assisted booking, low-data | Help · TicketCreate · ClinicBook · LowData | Mobile | Same SupportTicket APIs |
| Patient | Push | Notifications | OS permission + in-app list | Mobile | FCM/APNs; backend `DeviceToken` |

### 6.10 Mobile — Doctor

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Doctor | Auth | Login shared DoctorId | Login (password or OTP-to-registered mobile) | Mobile | Same Account login; bind device |
| Doctor | Onboarding | First-run confirm number, permissions | Onboarding · Permission primer | Mobile | Mic, camera, push |
| Doctor | Queue | Today’s schedule / queue | TodayQueue | Mobile | Appointment list APIs; payment + tele flags |
| Doctor | Availability | Online/offline, working hours | Availability | Mobile | Same TeleAvailability + schedule |
| Doctor | Push | Waiting, booking, reschedule/cancel, refill, payment | OS push | Mobile | Notification service |
| Doctor | Context | Read-only patient card | PatientCard | Mobile | Name, age, CC, last visit — **no case-taking** |
| Doctor | Consult | Join video/audio | VideoRoom | Mobile | Same session tokens as web |
| Doctor | Refill | Approve/reject repeat Rx | RefillInbox · RefillDetail | Mobile | Approve only; Patient Board remains web |
| Doctor | Earnings | Today/week/month, payout status | Earnings | Mobile | Account ledger read for this DoctorId |
| Doctor | Resilience | Offline, failed action, expired session | Error/Offline screens | Mobile | Token refresh/logout |
| Doctor | Monitoring | Crash/error | (invisible) | Mobile | Sentry/Crashlytics |

### 6.11 Pharmacy partner (HomeoMeds console — web)

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Pharmacy | Onboarding | Licensed premises, licences, checklist | `/pharmacy/onboard` | UI / Frontend / Backend | Licence records; Admin activation |
| Pharmacy | Licence gating | Auto-block expired/suspended | Status banner | Backend | Scheduler; routing skip |
| Pharmacy | Orders | Accept/reject (OTP), quote, ready, dispatch | `/pharmacy/orders`; detail | UI / Frontend / Backend | OTP accept unlocks names for patient + pay link |
| Pharmacy | Exceptions | Escalate stuck | Flag on order | Backend | Ops + Account queue |

---

## 7. Required APIs

Prefer **NigaHomeopathy-API**. Port Razorpay off classic `OrderController`. Paths are target contracts.

### 7.1 Identity, session, profile, OTP

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Account/Login` | Existing — add Role claim for doctors |
| POST | `/api/Account/Logout` | Revoke / login status |
| POST | `/api/users/ForgotPassword` | Send **reset token** (not plaintext) |
| POST | `/api/users/ResetPassword` | Token + new password |
| POST | `/api/users/ChangePassword` | Logged-in |
| GET/PUT | `/api/Profile/Me` | Admin/Doctor/Reception profile |
| POST | `/api/Profile/Photo` | Multipart |
| POST | `/api/PatientAuth/RequestOtp` | Patient mobile OTP |
| POST | `/api/PatientAuth/VerifyOtp` | Patient JWT |
| POST | `/api/Otp/Verify` | Generic high-risk OTP (payout, pharmacy accept) |
| GET | `/api/Otp/Audit` | Account/Admin monitor |

**Aligns with:** classic Login, `ForgetPassword` (replace behavior), unused `UserLoginStatus`.

### 7.2 Doctor credentialing

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/DoctorCredentialing/Queue` | Admin list |
| GET | `/api/DoctorCredentialing/{doctorId}` | Detail + docs |
| POST | `/api/DoctorCredentialing/{doctorId}/Approve` | Unlock practice |
| POST | `/api/DoctorCredentialing/{doctorId}/Reject` | Reason |
| POST | `/api/DoctorCredentialing/{doctorId}/RequestInfo` | Needs info |
| POST | `/api/DoctorCredentialing/{doctorId}/Documents` | Upload |
| GET | `/api/DoctorCredentialing/MyStatus` | Doctor self |

**Aligns with:** `RegisterDoctor`, `Doctor` cert fields, qualifications master. Change RegisterDoctor so practice is **not** live until Approved.

### 7.3 Platform payments (all streams)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Payments/Orders` | Create Razorpay order (`stream`: Subscription \| Consult \| Medicine) |
| POST | `/api/Payments/Webhook/Razorpay` | Signature verify; ledger write |
| POST | `/api/Payments/Verify` | Client assist only; webhook remains source of truth |
| POST | `/api/ConsultPayment/CollectAtReception` | S3 cash/UPI/card/link |
| GET | `/api/ConsultPayment/ByAppointment/{patientAppId}` | Badge |
| GET | `/api/Payments/Admin/Reconciliation` | Consult recon |
| GET | `/api/Payments/Exceptions` | Failed/mismatch |
| POST | `/api/Payments/Exceptions/{id}/Resolve` | Manual + OTP |
| GET | `/api/Ledger` | Account unified ledger |
| GET | `/api/Ledger/Medicine` | S5 only |
| GET | `/api/Settlements` | Runs |
| POST | `/api/Settlements/{id}/ApprovePayout` | OTP |
| GET/PUT | `/api/ConsultFee/Config` | Per doctor |
| GET | `/api/Earnings/Summary` | Doctor web+mobile |
| POST | `/api/Refunds` | Account |

**Aligns with:** classic `Order/GenerateOrderId`, `SaveUpdateSubscription` — keep S1 compatible; add ledger rows.

### 7.4 Public booking

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/PublicBooking/Doctors` | Verified + bookable |
| GET | `/api/PublicBooking/Doctors/{id}/Profile` | Credentials, fee, ranking explain |
| GET | `/api/PublicBooking/Doctors/{id}/Slots` | Wraps `GetAppointmentSlots` |
| POST | `/api/PublicBooking/Create` | Patient + appointment |
| GET | `/api/PublicBooking/{bookingToken}` | Summary |
| POST | `/api/PublicBooking/Waitlist` | Waitlist offer |
| POST | `/api/PublicBooking/InstantConsult` | Instant request |

**Aligns with:** `GetDailySchedule`, `GetAppointmentSlots`, `SavePatientApp`.

### 7.5 Appointments: reschedule, cancel, visit type

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/PatientAppointment/RescheduleAppointment` | Date+time+slot; audit; notify |
| POST | `/api/PatientAppointment/CancelAppointment` | `CANCELLED` + reason |
| GET | `/api/PatientAppointment/ChangeLog/{id}` | Audit |
| PATCH | `/api/PatientAppointment/{id}/VisitType` | First / Follow-up |

**Extend:** `UpdateAppointmentTime`, `UpdateAppointmentStatus`, list DTOs.

### 7.6 Analytics

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/AdminDashboard/Overview` | Admin widgets |
| GET | `/api/Analytics/FollowUpDue` | Doctor |
| GET | `/api/Analytics/FollowUpSummary` | Doctor |
| GET | `/api/Analytics/ClinicPerformance` | Utilization, no-show, revenue, wait |

**Aligns with:** `GetPatientStats`, `GetPatientStatsCharts`.

### 7.7 SMS (WhatsApp already exists)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/Sms/Templates` | CRUD |
| POST | `/api/Sms/Send` | Ad-hoc |
| GET | `/api/Sms/History` | Logs |
| POST | `/api/Sms/Events/{eventKey}/Test` | Confirm / registration / unavailable |

**Aligns with:** `WhatsAppController` shape. Events also fire on reschedule/cancel.

### 7.8 Clinical remaining

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Repertorization/CenterOfGravity` | COG from selected rubrics |
| GET/POST | `/api/PotencyMaster` | DDL + admin CRUD |
| — | Extend `SavePrescriptionDetail` | `potencyId`; create `ErxSnapshot` (codes) |
| GET | `/api/Erx/ByAppointment/{id}` | eRx; **codes for patient until pharmacy accept** |
| GET | `/api/Erx/Export/{id}` | PDF |
| — | Wire UI to existing `SaveComplaints` / `SaveCaseDetails` | |
| GET | `/api/patient/ExportCasesToExcel` | Already on .NET 8 — add PDF + Patient Board button |
| — | Extend `AppointmentHistoryNote` | `NoteType`, `IsErxExcluded` |
| GET | `/api/Erx/RefillInbox` | Doctor mobile |
| POST | `/api/Erx/Refill/{id}/Approve` · `/Reject` | Mobile only |

### 7.9 Telemedicine

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Telemedicine/Availability` | Online/Offline |
| GET | `/api/Telemedicine/Availability/{doctorId}` | Public |
| GET | `/api/Telemedicine/Queue` | Doctor |
| POST | `/api/Telemedicine/Sessions` | Create |
| GET | `/api/Telemedicine/Sessions/{id}` | Join tokens |
| POST | `/api/Telemedicine/Sessions/{id}/End` | End |
| POST | `/api/Telemedicine/Sessions/{id}/Rejoin` | Re-issue if Active |
| POST | `/api/Telemedicine/Consent` | Recording consent |

**Aligns with:** `E-CONSULT`, `AudioCaseConsentLog`.

### 7.10 Support tickets

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/SupportTicket` | List/create |
| GET | `/api/SupportTicket/{id}` | Thread |
| POST | `/api/SupportTicket/{id}/Messages` | Reply |
| POST | `/api/SupportTicket/{id}/Status` | Workflow |
| POST | `/api/SupportTicket/{id}/Assign` | Admin |

**Do not use:** Velzon tickets or marketing `EnquiryDetail` as the ticket system (enquiry can *spawn* a ticket).

### 7.11 Reception staff (UI missing)

Existing .NET 8: `AddReceptionStaff`, `Update`, `Delete`, `GetById`, `GetList`. **No new API required** — add Doctor UI.

### 7.12 Notifications

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Devices/Register` | FCM/APNs token |
| POST | `/api/Notifications/Send` | Internal |
| GET | `/api/Notifications` | In-app list |

### 7.13 HomeoMeds

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Pharmacy/Onboard` | Partner apply |
| GET/PUT | `/api/Pharmacy/Licence` | Licence records |
| POST | `/api/Admin/Pharmacy/{id}/Activate` | Checklist |
| GET | `/api/HomeoMeds/Sellers` | Patient pick (eligible) |
| POST | `/api/HomeoMeds/Orders` | From signed eRx (immutable draft, codes) |
| POST | `/api/HomeoMeds/Orders/{id}/Accept` | Pharmacy OTP |
| POST | `/api/HomeoMeds/Orders/{id}/Reject` | Reason |
| POST | `/api/HomeoMeds/Orders/{id}/Quote` | Manual price |
| POST | `/api/HomeoMeds/Orders/{id}/Pay` | Create S5 payment / COD |
| POST | `/api/HomeoMeds/Orders/{id}/Status` | Ready / dispatched |
| GET | `/api/HomeoMeds/Orders/{id}` | Track |
| GET | `/api/HomeoMeds/Exceptions` | Ops/Account |
| POST | `/api/HomeoMeds/RefillRequest` | Patient → doctor inbox |

### 7.14 Existing APIs to reuse (do not duplicate)

Login, Patient CRUD, PatientApp save, UpdateAppointmentStatus/Time, GetDailySchedule/Slots, doctorDashBoard counts/stats/export, clipboard/repertorize/elimination, Prescription GET+classic Save, labs, WhatsApp, 3D, audio, PatientBoardBackup, packages/subscription, masters CRUD, EnquiryDetail, blogs/news.

---

## 8. Role-wise screen maps

### 8.1 Admin

| Screen | Route | Features |
|--------|-------|----------|
| Login / Forgot / Reset / Profile / Logout | `/login`, `/forgot-password`, `/reset-password/:token`, `/profile`, `/logout` | Auth remaining |
| Admin home | `/admin/dashboard` | Overview widgets |
| All existing masters | current `admin/list\|add\|edit*` | 100% modules |
| Users | `/admin/listusers` + add/edit | Remaining import/export + verification |
| Credentialing queue / detail | `/admin/doctor-credentialing` | New |
| Consult recon | `/admin/consult-payments` | New |
| Payment exceptions | `/admin/payment-exceptions` | New |
| Support tickets | `/admin/support-tickets/:id?` | New |
| Enquiries inbox | `/admin/enquiries` | Remaining contact |
| Pharmacy activation | `/admin/pharmacies` | HomeoMeds |
| Rubric intelligence (existing) | metaphors/aliases/benchmark | Audio remaining |

### 8.2 Account

| Screen | Route | Features |
|--------|-------|----------|
| Ledger | `/account/ledger` | All streams |
| Consult recon | `/account/consult-recon` | S2/S3 |
| Medicine ledger | `/account/medicine-ledger` | S5 |
| Exceptions | `/account/exceptions` | Failed/stuck |
| Settlements / payouts | `/account/settlements`, `/account/payouts` | OTP |
| Refunds | `/account/refunds` | S6 |
| Tax | `/account/tax` | GST |
| Payees | `/account/payees` | KYC |
| Clinic collections | `/account/clinic-collections` | Reception cash |

### 8.3 Guest / Patient web

| Screen | Route | Features |
|--------|-------|----------|
| Marketing | `/`, `/pricing`, `/contact`, `/privacy`, `/terms` | Remaining legal/CTA |
| Register / activate | `/register`, `/login?UserId=` | Doctor onboarding |
| Book | `/book`, `/book/:id`, `/book/:id/slots`, `/book/confirm` | Self-service |
| Pay | `/book/pay/:bookingId` | Consult pay |
| Optional patient web portal | `/me/*` | Later parity with mobile |

### 8.4 Doctor web

| Screen | Location |
|--------|----------|
| Dashboard, lists, WhatsApp, subscription | `/doctordashboard` |
| Schedule | `/doctor/schedule` |
| Reception staff | `/doctor/reception-staff` |
| Follow-up / clinic performance | `/doctor/follow-up-analysis`, `/doctor/clinic-performance` |
| SMS | `/doctor/sms` |
| Patient Board (+ COG, potency, notes, export, complaints) | `/doctor/patientboard` |
| Anatomy | `/doctor/anatomy` |
| Teleconsult room | `/teleconsult/:sessionId` |
| Profile | `/profile` |

### 8.5 Reception web

| Screen | Location |
|--------|----------|
| Home / queue / collect pay | `/doctordashboard` or `/reception` |
| Schedule (read-only) | `/reception/schedule` |
| Case paper | `/reception/case-paper` |
| Profile | `/profile` |

### 8.6 Patient mobile (Hello Homeo Doc)

See §9 for screen-by-screen.

### 8.7 Doctor mobile

Login · Onboarding/permissions · Today queue · Availability · Patient card · Video · Refill inbox · Earnings · Notifications · Errors.

### 8.8 Pharmacy

Onboard · Licence · Order inbox · Order detail (OTP accept, quote, dispatch) · History.

---

## 9. Hello Homeo Doc patient module map

Map each requested patient module to screens, types, and APIs. **None of this exists in the current SPA** (marketing-only guest).

### 1. Onboarding & Identity

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Language select, Welcome, Mobile+OTP, Profile setup, Privacy consent, Family members, Caregiver authorization | Mobile (primary) + optional Web `/me/onboard` | OTP identity; store consents; family `PatientId` links; caregiver token | PatientAuth OTP; Profile; Consent; Family; Caregiver |

### 2. Discovery & Doctor Directory

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Home dashboard, Search & care categories, Results, Filters, Doctor profile, Credentials & verification, Ranking explanation, Health articles | Mobile + Web `/book` | Only **verified** doctors; ranking rules documented; reuse blogs as articles | PublicBooking Doctors/Profile; Credentialing badge; Blog list |

### 3. Booking, Queue & Payment

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Slot picker, Booking review & consent, Checkout, Payment status, Appointment detail, Reschedule/cancel, Waitlist, Instant consult, Queue & doctor offer | Mobile + Web book/pay | Same appointment + S2 payment as reception/doctor; Homeocentrum collects | PublicBooking; Payments Orders/Webhook; Reschedule/Cancel; Waitlist; InstantConsult; Queue |

### 4. Consultation (first-party telemedicine)

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Device check, Waiting room, Live video, Recording consent, Fallback & join failure, Case-linked chat, Consultation summary | Mobile + Doctor web room | Same `TeleSession` as doctor; consent before record | Telemedicine Sessions/Consent/Rejoin |

### 5. Clinical Records & Prescription

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Records timeline, Consultation note, Signed eRx, Document upload | Mobile | **Patient sees remedy codes until pharmacy accept**; then names | Erx ByAppointment (code vs name flag); notes; document upload |

### 6. Follow-up & Continuity

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Follow-up plan & tasks, Symptom diary, CliniSight progress | Mobile | Driven by VisitType + doctor plan | Follow-up APIs; diary; progress metrics |

### 8. HomeoMeds Bridge

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Medicines tab, Order start, Pharmacy & quote, Review & consent, Tracking, Order detail & refill | Mobile | Codes until accept; then pay QR/link; OTP trail | HomeoMeds Orders* |

### 9. Trust, Money & Account

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Write review, My reviews & appeal, Payments & refunds, Profile & settings, Consent centre & data rights, Notifications | Mobile | Payments list from ledger (patient view); refund request → Account | Reviews; Ledger patient view; Consent; Notifications |

### 10. Support & Access

| Screens | Type | Tasks | APIs |
|---------|------|-------|------|
| Help centre & tickets, Physical clinic appointment, Assisted booking, Low-data mode | Mobile | Tickets = Admin queue; clinic book = same PublicBooking in-clinic | SupportTicket; PublicBooking |

---

## 10. HomeoMeds go-live module list

| # | Module | Screens | Type | Tasks | APIs |
|---|--------|---------|------|-------|------|
| 1 | Pharmacy partner onboarding | `/pharmacy/onboard`; Admin `/admin/pharmacies` | UI, Frontend, Backend | Licensed premises, licence files, activation checklist | Pharmacy Onboard / Licence / Activate |
| 2 | Licence gating | Admin + pharmacy banner | Backend | Cron: expired/suspended excluded from routing | Licence status on routing |
| 3 | Fulfilment consent & pharmacy selection | Patient Medicines → seller pick | Mobile, Backend | Patient picks seller; consent before transmission | Sellers; Orders create |
| 4 | Prescription handoff | System | Backend | Signed eRx → immutable draft; **no re-entry** | Orders from ErxSnapshot |
| 5 | Rule-based seller routing | Ops config | Backend | Licence, service area, hours, capacity; **manual stock** (no live inventory) | Routing service |
| 6 | Pharmacy console | Order inbox/detail | UI, Frontend, Backend | Accept/reject (OTP), manual quote, ready/dispatched | Accept/Reject/Quote/Status |
| 7 | Order confirmation & payment | Quote → Pay or COD → track | Mobile, Backend | Quote **before** pay; S5 ledger; QR/link after accept | Pay; webhook; track |
| 8 | Medicine ledger | `/account/medicine-ledger` | UI, Backend | Seller/platform/delivery split; **never mix with consult** | Ledger/Medicine |
| 9 | Order exception queue | `/admin/homeomeds-exceptions` + Account | UI, Backend | Stuck/rejected/failed — never silent | Exceptions |
| 10 | Codes vs names + OTP monitor | Patient eRx + Account OTP audit | Mobile, Backend | Names+QR only after OTP accept; Homeocentrum can trace every step | Erx visibility flag; Otp Audit |

---

## 11. Data model additions

| Entity | Key fields | Used by |
|--------|------------|---------|
| `DoctorVerification` | DoctorId, Status, ReviewedBy, Reason | Credentialing |
| `DoctorCredentialDocument` | DoctorId, DocType, FileUrl | Credentialing |
| `ConsultFeeConfig` | DoctorId, Amount, Currency, PayAtClinicEnabled | Booking |
| `PaymentOrder` | Stream, Amount, RazorpayOrderId, Status | All money |
| `LedgerEntry` | Stream, Debit/Credit, Party, Gst, Commission, RefEntity | Account |
| `ConsultPayment` | PatientAppId, Method, CollectedBy, ReceiptNo | S2/S3 |
| `PaymentException` | OrderId, Kind, Status | Exceptions |
| `SettlementRun` / `Payout` | Payee, Net, OtpRef | Account |
| `SupportTicket` + Message + Attachment | ReporterRole, Status, Priority | Support |
| `AppointmentChangeLog` | Old/New, Action, By | Reschedule/Cancel |
| `SmsTemplate` / `SmsMessageLog` | EventKey | SMS |
| `PotencyMaster` | Code, Label | Rx |
| `ErxSnapshot` | PatientAppId, SignedAt, Items(code,name,potency) | Patient + pharmacy |
| `TeleAvailability` / `TeleSession` / `TeleConsentLog` | Doctor, Room, Consent | Tele |
| `OtpChallenge` / `OtpAuditLog` | Purpose, Entity, Success | Monitor |
| `PatientAuth` / `FamilyMember` / `CaregiverAuth` / `ConsentRecord` | Patient ecosystem | Mobile |
| `DeviceToken` / `AppNotification` | Push | Both apps |
| `PharmacyPartner` / `PharmacyLicence` | Onboarding | HomeoMeds |
| `MedicineOrder` / `MedicineOrderItem` / `MedicineQuote` | S5 | HomeoMeds |
| `Review` / `SymptomDiary` / `FollowUpTask` | Continuity | Patient |
| `RefillRequest` | ErxId, Status | Doctor mobile |

**Extend existing**

| Entity | Change |
|--------|--------|
| `UserMaster` | Hash passwords; VerificationStatus |
| `Doctor` | PracticeLocked until verified; ConsultFee; Bank KYC |
| `PatientAppointment` | `CANCELLED`; VisitType; ConsultMode; PaymentStatus |
| `Patient` | SMS opt-in; self-registered flag |
| `AppointmentHistoryNote` | NoteType; IsErxExcluded |
| `PrescriptionRemedyDetail` | PotencyId |
| `PackageEntryDetail` | Link `LedgerEntry` for S1 only |
| `RoleMaster` | Add `Account`, `Patient`, `Pharmacy` |
| `DoctorReceptionStaff` | Unchanged — add UI |
| `EnquiryDetail` | Optional TicketId |

---

## 12. Delivery phases

Build **money + appointments** before marketplace extras. Mobile consumes the same APIs as web.

```
Phase 0 — Platform hygiene (unblocks everything)
  Password hashing + reset-token
  Logout / session
  Real profiles (Admin/Doctor/Reception)
  Admin home redirect + KPI widgets
  Role claim + menu ACL on new modules
  Port Razorpay order to .NET 8 + webhook + S1 ledger

Phase 1 — Appointment product completeness
  Formal Reschedule + Cancel (Doctor + Reception + later Patient)
  Daily schedule as first-class screen (reception read-only)
  Reception staff UI
  VisitType
  Waiting queue UX
  Wire SaveComplaints / case paper for reception
  Export case UI

Phase 2 — Homeocentrum money spine (Account role)
  Ledger + PaymentOrder
  ConsultFeeConfig
  Reception collect (S3)
  Patient/web consult pay (S2)
  Doctor payment badges
  Admin recon + exception queue
  Account payouts (T+2, OTP)
  SaaS subscription writes S1 ledger

Phase 3 — Patient access
  Public booking + OTP
  Credentialing (Admin) so directory is trustworthy
  Legal pages (privacy/terms) for tele + pay + pharmacy
  SMS events + finish WhatsApp bulk
  Support tickets

Phase 4 — Clinical differentiation
  Potency + visit notes vs eRx + codes snapshot
  Center of Gravity
  Audio accuracy (existing AI docs)
  Anatomy remaining
  Follow-up + clinic performance

Phase 5 — Telemedicine
  Availability, queue, vendor video, rejoin, consent
  Doctor + Patient join same room

Phase 6 — Mobile apps
  Patient app (Hello Homeo Doc 1–6, 9–10 without HomeoMeds)
  Doctor app (queue, join, refill, earnings, push)

Phase 7 — HomeoMeds
  Pharmacy onboarding + licence gate
  eRx handoff codes→names on OTP accept
  Quote, pay/COD, track, medicine ledger, exceptions
  Patient module 8 + refill on doctor mobile

Phase 8 — Continuity & trust
  Symptom diary, CliniSight, reviews, consent centre, ranking explain
```

### Suggested delivery order (value)

1. Phase 1 reschedule/cancel + reception staff + schedule  
2. Phase 2 money spine + Account role (without this, booking/tele/HomeoMeds cannot settle)  
3. Phase 3 booking + credentialing + tickets + SMS  
4. Phase 4 eRx/potency/notes (needed for HomeoMeds codes)  
5. Phase 5 telemedicine  
6. Phase 6 patient then doctor mobile  
7. Phase 7 HomeoMeds  
8. Phase 8 extras  

---

## 13. File touchpoints

| Area | Where to extend |
|------|-----------------|
| Admin routes/menu | `src/Routes/allRoutes.js`, `src/Layouts/LayoutMenuData.js` |
| Admin dashboard | Replace `pages/Admin/Dashboard/*` Velzon widgets; fix `dashboard_helper.getHomeDashboardPath` |
| Users remaining | `pages/Admin/BusinessManagement/Users/ListUser.js` (dead Import/Export) |
| Auth reset | `slices/auth/forgetpwd/thunk.js`, `ForgetPassword.js` |
| Profile | `pages/Authentication/user-profile.js` |
| Doctor appointments | `pages/Doctor/Dashboard/BestSellingProducts.js`, `Widgets.js` |
| Schedule modal | `Components/Common/DailyScheduleSetupModal.js` |
| Patient Board | `pages/Doctor/PatientBoard/PatientBoard.js` (~13.5k — extract COG/notes/potency if possible) |
| WhatsApp | `Components/WhatsAppModal/*`, `helpers/whatsapp_helper.js` |
| Razorpay UI | `Widgets.js` pattern → new consult/medicine checkout helpers |
| API URLs | `helpers/url_helper.js`, `realbackend_helper.js` |
| Roles | `Components/constants/roles.js` — add Account, Patient, Pharmacy |
| Appointment API | NigaHomeopathy-API `PatientAppointmentController` |
| WhatsApp pattern | `WhatsAppController` |
| Notes / Rx write | Classic `AppointmentHistoryNoteController`, `PrescriptionController` |
| Razorpay | Classic `OrderController` / `OrderService` — **port + remove hardcoded keys** |
| Reception API | `ReceptionStaffController` (UI only missing) |
| Consent pattern | `AudioCaseConsentLog` |
| Stats | `DoctorDashBoardController` GetPatientStats* |
| New modules | New controllers on Niga-Web: Payments, Ledger, Credentialing, SupportTicket, Telemedicine, PublicBooking, Sms, HomeoMeds, PatientAuth, Notifications |

**Do not implement product features on Velzon demo routes** (`/apps-tickets-*`, `/apps-crypto-kyc`, ecommerce dashboards).

---

## 14. Acceptance criteria

| Feature | Done when |
|---------|-----------|
| Password reset | User resets via token; password never emailed plaintext; fake thunk gone |
| Profiles | Each role edits real fields; reception has a profile |
| Session | Logout invalidates server-side session/token |
| Admin dashboard | Admin lands on KPI home, not Velzon ecommerce |
| Users 100% | Import/Export work; verification visible |
| Credentialing | Unverified doctors cannot appear in patient directory or take paid consults |
| Reschedule/Cancel | All three roles (Doctor, Reception, Patient) with audit + notify + slot free |
| Daily schedule | Doctor sets hours; reception views; public slots respect it |
| Reception staff | Doctor can add/disable staff from UI |
| Complaints / case paper | Doctor board + reception case paper persist via existing APIs |
| Export case | Doctor downloads case from board |
| Consult pay | Patient Razorpay **and** reception collect both appear in Account ledger |
| Webhook | Captured/failed payments true even if client closes browser |
| Exceptions | Failed pays never silent |
| Account role | Can settle doctor/pharmacy; cannot edit repertory masters |
| OTP audit | Account can list OTP challenges for a payment/order/accept |
| eRx codes | Patient app shows codes until pharmacy OTP-accept; then names + pay link |
| COG / Potency / Visit notes | Dedicated UX; eRx print has no free-text visit notes |
| Telemedicine | Online, queue, in-browser/app join, rejoin, consent stored |
| SMS | Three events actually send with logs |
| WhatsApp | Bulk campaign completable with failure list |
| Tickets | Doctor/patient issues in Admin queue (not enquiry-only) |
| Patient booking | Guest books without staff login |
| Doctor mobile | Same DoctorId; join + refill; no Patient Board |
| HomeoMeds | Licence gate, immutable eRx draft, quote-before-pay, separate medicine ledger |
| Legal | Privacy/terms cover DPDP, recording, payments, pharmacy |

---

## 15. Explicit non-goals / traps

| Trap | Correct approach |
|------|------------------|
| Velzon tickets / KYC / ecommerce dashboard | Build real Support, Credentialing, Admin KPIs |
| `PackageEntryDetail` for consult or medicines | New `PaymentOrder` + `LedgerEntry` by stream |
| Client Razorpay success as source of truth | Webhook + signature |
| `UpdateAppointmentTime` = Reschedule product | Dedicated API + audit + notify |
| WhatsApp = SMS done | Separate SMS provider |
| History notes inside Rx = visit notes/eRx split | Split UX + snapshot |
| Empty `Dose` = potency | Master + required picker |
| E-CONSULT + WhatsApp alert = telemedicine | Real sessions + vendor |
| Enquiry form = support tickets | Tickets have workflow |
| Patient sees remedy names immediately | Codes until pharmacy accept |
| Mixing medicine money with consult GMV | Separate medicine ledger |
| Doctor mobile case-taking | Web Patient Board only |
| Third backend | Extend .NET 8; thin-port Razorpay from classic |
| Account = Admin | Separate role; money vs masters |

---

*This plan is the implementation backlog for remaining existing work and all new ecosystem modules. Update API paths when contracts are frozen in Swagger. Audio engine internals remain in `docs/AUDIO_CASE_TAKING_*.md`.*

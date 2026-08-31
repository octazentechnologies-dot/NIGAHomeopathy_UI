# NIGA Homeocentrum — New Features Development Plan

**Generated:** 28 August 2026  
**Scope:** Only features marked **[New]** in the product draft  
**Repos:** `NigaHomeopathy-UI`, `NigaHomeopathy-API` (.NET 8), `NIGA_Latest_Code_API` (.NET Core 2.2)  
**Companion doc:** [CODEBASE_DEEP_ANALYSIS.md](./CODEBASE_DEEP_ANALYSIS.md)

---

## 1. Purpose

This document is the **implementation backlog for new product capabilities only**. Existing features (repertory masters, patient board case-taking, subscription Razorpay, WhatsApp outreach, appointment create/status/time, etc.) are treated as **foundations to extend**, not as work to re-build.

### New feature inventory (18 capability areas)

| # | Platform | Role | Feature |
|---|----------|------|---------|
| 1 | Admin | Internal Admin | Doctor credentialing / verification review |
| 2 | Admin | Internal Admin | Consult booking & payment reconciliation dashboard |
| 3 | Admin | Internal Admin | Payment exception / failed payment queue |
| 4 | Admin | Internal Admin | Patient & doctor reported issue queue |
| 5 | Web | Guest / Public | Patient-facing self-service booking |
| 6 | Web | Guest / Public | Patient-facing consult payment |
| 7 | Web | Doctor | Reschedule appointment |
| 8 | Web | Doctor | Cancel appointment |
| 9 | Web | Doctor | Follow-up analysis |
| 10 | Web | Doctor | Clinic performance analysis |
| 11 | Web | Doctor | SMS outreach (confirm / registration / doctor unavailable) |
| 12 | Web | Doctor | Repertorization → Center of Gravity module |
| 13 | Web | Doctor | Prescription → Potency module |
| 14 | Web | Doctor | Visit notes distinct from prescription (eRx) |
| 15 | Web | Doctor | Telemedicine suite (availability, queue, join, rejoin, consent) |
| 16 | Web | Doctor | View consult payment status on appointment |
| 17 | Web | Reception | Reschedule / Cancel appointment |
| 18 | Web | Reception | Collect per-consult payment at reception |

**Out of scope for this plan:** Partially complete *Existing* items (password reset, admin dashboard widgets, daily schedule setup, WhatsApp bulk polish, audio rubric accuracy, etc.) unless a new feature depends on them.

---

## 2. Alignment with what already exists

Build new work on these **proven patterns** so UI, API split, and auth stay consistent.

| Existing foundation | Location | Reuse for |
|---------------------|----------|-----------|
| Dual API (`api` + `api1`) | `src/config.js`, helpers | Prefer **NigaHomeopathy-API (.NET 8)** for all new domain modules; keep classic API only where payment/subscription patterns already live |
| Roles `Admin` / `Doctor` / `Reception` | `src/Components/constants/roles.js` | Extend for Patient/Guest booking flows; reception shares doctor dashboard today |
| `PatientAppointment` + status buckets | Both APIs; UI `BestSellingProducts.js`, `Widgets.js` | Reschedule, cancel, telemedicine queue, payment status badge |
| `UpdateAppointmentTime` + slots | Newer: `PatientAppointmentController` | Formal Reschedule flow (audit + notify) |
| `DeleteStatus` on appointment | Entity only | Soft-cancel; add explicit `CANCELLED` status + reason |
| Razorpay order + subscription save | Classic: `Order/GenerateOrderId`, `Subscription/SaveUpdateSubscription`; UI `Widgets.js` | Pattern for **consult** payments (new entities) |
| WhatsApp Meta Cloud | Newer: `WhatsAppController`; UI `WhatsAppModal` | Parallel **SMS** provider + template pattern |
| `AppointmentHistoryNote` vs `PrescriptionRemedyDetail` | Classic notes API; Rx save classic / read newer | Visit notes / eRx separation (UX + typed note kinds) |
| Free-text `Dose` on Rx remedy | `PrescriptionRemedyDetail.Dose` | Potency master + picker writing into Dose (or new columns) |
| Repertorize scoring / elimination | `PatientBoard.js` + clipboard/repertorization APIs | Center of Gravity as new panel/algorithm on same rubrics |
| Doctor registration credentials | `RegisterDoctor`, `Doctor.PassingUniversity`, `PassingCertNo`, `QualificationId` | Credentialing review queue |
| `AudioCaseConsentLog` | Newer API | Pattern for **telemedicine recording consent** |
| `E-CONSULT` status + stub WhatsApp video buttons | Dashboard / Patient Board | Telemedicine waiting room + real video join |
| Patient stats charts | `GetPatientStats`, `GetPatientStatsCharts` | Clinic performance KPIs extend same dashboard analytics style |
| Marketing enquiry | Classic `EnquiryDetail` | Do **not** reuse as support tickets; tickets need workflow |
| Velzon demo Tickets / KYC | `/apps-tickets-*`, `/apps-crypto-kyc` | **Ignore** — demo only |

### API placement recommendation

| New domain | Target API | Why |
|------------|------------|-----|
| Credentialing, tickets, consult payments, telemedicine, SMS, COG, potency, analytics | **NigaHomeopathy-API** | Active development surface; schedule/slots/WhatsApp already here |
| Razorpay order generation (consult) | Prefer newer, **or** thin reuse of classic `Order/GenerateOrderId` initially | Classic already has Razorpay secrets wiring |
| Visit notes CRUD enhancements | Classic notes endpoints **or** port to newer | Notes already on classic; avoid dual-write |

---

## 3. Master implementation table

Columns: **Role · Main · Features · Screens · Type · Tasks**

Type legend: **UI** = screen/layout/copy · **Frontend** = React/Redux/helpers · **Backend** = API/DB · **Mobile** = not in current stack (flagged N/A unless future app)

---

### 3.1 Admin Portal — Internal Admin

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Admin | Business Management | Doctor credentialing / verification review | `/admin/doctor-credentialing` (list queue); `/admin/doctor-credentialing/:doctorId` (review detail) | UI | Design queue table (pending / approved / rejected / more-info); detail layout for qualification, university, cert no, uploaded docs; approve/reject/request-info actions; status badges in user list |
| Admin | Business Management | Doctor credentialing / verification review | Same | Frontend | Routes in `allRoutes.js`; menu entry in `LayoutMenuData.js` under Business Management; list/detail pages under `pages/Admin/BusinessManagement/DoctorCredentialing/`; Redux slice + helpers; wire to users list “Verification” column |
| Admin | Business Management | Doctor credentialing / verification review | Same | Backend | Tables: `DoctorCredentialDocument`, `DoctorVerificationStatus` (Pending/Approved/Rejected/NeedsInfo) on Doctor or UserMaster; APIs: list pending, get detail, approve, reject, request-info, upload document; gate `IsUserActivated` / practice access on Approved; email notify doctor |
| Admin | Consult Booking & Payments | Consult booking & payment reconciliation dashboard | `/admin/consult-payments` (dashboard); filters by date/doctor/status | UI | KPI cards (collected, pending, failed, refunded); reconciliation grid (booking ↔ payment ↔ appointment); export CSV |
| Admin | Consult Booking & Payments | Consult booking & payment reconciliation dashboard | Same | Frontend | Admin pages + charts (reuse ApexCharts pattern from doctor stats); date filters; drill-down to appointment |
| Admin | Consult Booking & Payments | Consult booking & payment reconciliation dashboard | Same | Backend | Entities: `ConsultFeeConfig`, `ConsultPayment`, `ConsultPaymentEvent`; reconciliation query joining `PatientAppointment`; admin aggregate APIs; webhook event store |
| Admin | Consult Booking & Payments | Payment exception / failed payment queue | `/admin/payment-exceptions` (queue); detail drawer | UI | Queue of Failed / Partial / Webhook-mismatch / Refund-pending; retry / mark resolved / manual reconcile actions |
| Admin | Consult Booking & Payments | Payment exception / failed payment queue | Same | Frontend | Exception list page; action modals; link to Razorpay payment id |
| Admin | Consult Booking & Payments | Payment exception / failed payment queue | Same | Backend | Exception status machine; Razorpay webhook handler (`payment.failed`, `payment.captured`); retry-capture / mark-manual APIs; audit log |
| Admin | Support Ticket / Issue Queue | Patient & doctor reported issue queue | `/admin/support-tickets` (list); `/admin/support-tickets/:id` (detail) | UI | Ticket list (priority, reporter role, status); detail with thread, assignee, SLA timestamps; do not use Velzon demo tickets |
| Admin | Support Ticket / Issue Queue | Patient & doctor reported issue queue | Same | Frontend | Real ticket module pages; create-from-admin; status transitions; filters |
| Admin | Support Ticket / Issue Queue | Patient & doctor reported issue queue | Same | Backend | Entities: `SupportTicket`, `SupportTicketMessage`, `SupportTicketAttachment`; CRUD + assign + status; reporter = Doctor/Patient/Guest; optional link to appointment |

---

### 3.2 Web Portal — Guest / Public

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Guest / Patient | Patient Self-Service Booking | Patient-facing self-service booking | `/book` (doctor search / profile); `/book/:doctorSlug/slots`; `/book/confirm`; booking success | UI | Public booking funnel (no clinic staff login); doctor card, date/slot picker, patient details OTP or magic link; confirmation page |
| Guest / Patient | Patient Self-Service Booking | Patient-facing self-service booking | Same | Frontend | Public routes (NonAuthLayout); booking wizard components; reuse `GetAppointmentSlots` UX; landing CTA to `/book` |
| Guest / Patient | Patient Self-Service Booking | Patient-facing self-service booking | Same | Backend | Public (rate-limited) APIs: list bookable doctors, get slots, create patient+appointment as `E-CONSULT` or `NOT ARRIVED`; OTP verify; booking token; respect doctor schedule + consult fee flags |
| Guest / Patient | Patient Self-Service Booking | Patient-facing consult payment | `/book/pay/:bookingId`; payment success/failure | UI | Paywall before confirm (or pay-later at clinic); amount, GST if any, Razorpay checkout |
| Guest / Patient | Patient Self-Service Booking | Patient-facing consult payment | Same | Frontend | Razorpay checkout adapted from doctor subscription `Widgets.js`; success/fail handlers writing consult payment status |
| Guest / Patient | Patient Self-Service Booking | Patient-facing consult payment | Same | Backend | `CreateConsultOrder`, verify signature, attach `ConsultPayment` to appointment; idempotent capture; failure → exception queue |

---

### 3.3 Web Portal — Doctor

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Doctor | Doctor Dashboard | Reschedule appointment | Dashboard appointment row / modal: **Reschedule**; optional `/doctordashboard` slot picker reuse | UI | Dedicated Reschedule action (not only inline time edit); show old→new date/time; confirm dialog |
| Doctor | Doctor Dashboard | Reschedule appointment | Same | Frontend | Extend `BestSellingProducts.js` / Widgets; call enhanced reschedule API; refresh lists; toast + optional SMS/WhatsApp notify |
| Doctor | Doctor Dashboard | Reschedule appointment | Same | Backend | `POST .../RescheduleAppointment` (date+time+slot validation, conflict check, audit `AppointmentChangeLog`, notify); wrap/extend `UpdateAppointmentTime` |
| Doctor | Doctor Dashboard | Cancel appointment | Same appointment UI: **Cancel** with reason | UI | Cancel modal (reason codes); remove from active buckets; show in Cancelled filter |
| Doctor | Doctor Dashboard | Cancel appointment | Same | Frontend | Cancel action gated by role; update local lists; notify patient |
| Doctor | Doctor Dashboard | Cancel appointment | Same | Backend | Add status `CANCELLED` (keep `DeleteStatus` for hard soft-delete); `POST .../CancelAppointment`; reason + cancelledBy + cancelledAt; free slot |
| Doctor | Doctor Dashboard | Follow-up analysis | `/doctordashboard` panel or `/doctor/follow-up-analysis` | UI | Follow-up due list; outcome tags; conversion of first-visit → follow-up; charts |
| Doctor | Doctor Dashboard | Follow-up analysis | Same | Frontend | Charts + table; persist visit type (replace stub “Follow-up” option in case notes that currently does not save) |
| Doctor | Doctor Dashboard | Follow-up analysis | Same | Backend | Visit type / follow-up flags on appointment or notes; APIs: due follow-ups, adherence rates, by period |
| Doctor | Doctor Dashboard | Clinic performance analysis | `/doctor/clinic-performance` | UI | KPIs: appointments/day, no-show %, wait time, completed vs cancelled, revenue (if consult pay live), reception load |
| Doctor | Doctor Dashboard | Clinic performance analysis | Same | Frontend | New page extending `patientStatsChartsHelper` patterns; date range + compare |
| Doctor | Doctor Dashboard | Clinic performance analysis | Same | Backend | Aggregate APIs beyond `GetPatientStatsCharts` (utilization, cancellations, payment collected, avg consult duration if telemedicine timed) |
| Doctor | SMS Outreach | SMS: appointment confirmation, registration, doctor unavailable | Settings / templates under outreach; auto-send hooks | UI | SMS template list; enable/disable per event; preview |
| Doctor | SMS Outreach | SMS templates & send | Same + WhatsApp-adjacent entry | Frontend | SMS helper parallel to `whatsapp_helper.js`; hooks on create appointment, register patient, doctor offline |
| Doctor | SMS Outreach | SMS templates & send | Same | Backend | `SmsProvider` (MSG91/Twilio/etc.); `SmsTemplate`, `SmsMessageLog`; endpoints Send/Template CRUD; event triggers; DND/opt-out on Patient |
| Doctor | Patient Board | Center of Gravity (repertorization) | Patient Board → Repertorize tab → **Center of Gravity** sub-panel | UI | COG visualization (core remedy set / gravity score); explainability of why remedy is central |
| Doctor | Patient Board | Center of Gravity | Same | Frontend | New COG component in `PatientBoard.js` using selected rubrics; toggle vs classic elimination |
| Doctor | Patient Board | Center of Gravity | Same | Backend | `POST /api/Repertorization/CenterOfGravity` input = selected rubric ids + intensities; algorithm service returning ranked COG remedies + contributions |
| Doctor | Patient Board | Potency module | Prescription modal → remedy row potency picker | UI | Structured potency selector (e.g. 6C, 30C, 200C, 1M…); frequency/duration optional |
| Doctor | Patient Board | Potency module | Same | Frontend | Potency dropdown/master-driven; stop saving empty `Dose`; validate before save |
| Doctor | Patient Board | Potency module | Same | Backend | `PotencyMaster` CRUD (admin optional); extend Rx save to store PotencyId / Dose structured; get potencies DDL |
| Doctor | Patient Board | Visit notes distinct from prescription (eRx) | Patient Board: standalone **Visit Notes** panel; Prescription modal keeps **eRx only** (remedies + labs) | UI | Split UX: Visit Notes entry/list outside Rx modal; eRx print/export layout without mixing free-text clinical notes |
| Doctor | Patient Board | Visit notes / eRx | Same | Frontend | Move History Notes out of Rx modal tabs; note types (Chief complaint / Follow-up / General); eRx print view |
| Doctor | Patient Board | Visit notes / eRx | Same | Backend | Extend `AppointmentHistoryNote` with `NoteType`, `IsErxExcluded`; optional eRx snapshot table; keep existing save/get APIs compatible |
| Doctor | Telemedicine | Doctor online / offline availability | Dashboard toggle **Online for teleconsult** | UI | Availability switch + last-seen indicator |
| Doctor | Telemedicine | Doctor online / offline | Same | Frontend | Persist availability; disable join when offline |
| Doctor | Telemedicine | Doctor online / offline | Same | Backend | `DoctorTeleAvailability` (Online/Offline, channel); heartbeat / set status API |
| Doctor | Telemedicine | Telemedicine waiting queue | Dedicated **Tele queue** on dashboard (beyond E-CONSULT list) | UI | Waiting room list: patient, wait time, payment status, Join |
| Doctor | Telemedicine | Telemedicine waiting queue | Same | Frontend | Poll or SignalR queue; start session |
| Doctor | Telemedicine | Telemedicine waiting queue | Same | Backend | Queue by doctor + Online + paid/confirmed; session create |
| Doctor | Telemedicine | Join video consultation in browser | `/teleconsult/:sessionId` in-browser video | UI | Full-page video room (local/remote), mute, end call |
| Doctor | Telemedicine | Join video | Same | Frontend | WebRTC or Twilio/Daily/Agora SDK wrapper; replace SweetAlert WhatsApp stub |
| Doctor | Telemedicine | Join video | Same | Backend | Session tokens; room create/end; link to `PatientAppId` |
| Doctor | Telemedicine | Rejoin after dropped call | Same room URL + Rejoin CTA on dashboard | UI | Rejoin button while session Active |
| Doctor | Telemedicine | Rejoin | Same | Frontend | Resume with same session token if within TTL |
| Doctor | Telemedicine | Rejoin | Same | Backend | Session state Active/Ended; allow rejoin until Ended; reconnect audit |
| Doctor | Telemedicine | Capture telemedicine recording consent | Pre-join consent modal | UI | Consent text + accept/decline; block recording if declined |
| Doctor | Telemedicine | Recording consent | Same | Frontend | Mirror audio consent UX; store before join |
| Doctor | Telemedicine | Recording consent | Same | Backend | Extend consent log (`ConsentType = TelemedicineRecording`); require before record start |
| Doctor | Consult Booking & Payments | View consult payment status on appointment | Appointment cards / lists: Paid / Pending / Failed / Waived badge | UI | Badge + tooltip (amount, method, txn id) |
| Doctor | Consult Booking & Payments | View consult payment status | Same | Frontend | Map payment DTO onto appointment list responses |
| Doctor | Consult Booking & Payments | View consult payment status | Same | Backend | Include `PaymentStatus` on appointment list DTOs; get-by-appointment payment API |

---

### 3.4 Web Portal — Reception

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| Reception | Doctor Dashboard (shared) | Reschedule appointment | Same dashboard Reschedule as doctor | UI | Enable Reschedule for reception (already shares UI; ensure not disabled by `isReceptionUser`) |
| Reception | Doctor Dashboard (shared) | Reschedule appointment | Same | Frontend | Role permission: reception can reschedule; cannot open clinical board actions |
| Reception | Doctor Dashboard (shared) | Reschedule appointment | Same | Backend | Same Reschedule API; authorize Doctor **or** Reception for that doctor’s `DoctorId` |
| Reception | Doctor Dashboard (shared) | Cancel appointment | Same Cancel modal | UI / Frontend / Backend | Same cancel feature as doctor; reception-allowed |
| Reception | Consult Booking & Payments | Collect per-consult payment at reception | Payment collect modal on appointment; receipt print | UI | Amount due, method (Cash/UPI/Card/Razorpay link), mark paid, print/share receipt |
| Reception | Consult Booking & Payments | Collect per-consult payment | Same | Frontend | Collect payment form; offline cash path + online link; refresh payment badge |
| Reception | Consult Booking & Payments | Collect per-consult payment | Same | Backend | `POST /ConsultPayment/CollectAtReception`; methods; receipt number; ties into admin reconciliation |

---

### 3.5 Mobile

| Role | Main | Features | Screens | Type | Tasks |
|------|------|----------|---------|------|-------|
| — | — | All new features above | — | Mobile | **N/A in current codebase** (React web SPA only). Future patient booking / teleconsult apps would consume the same new Backend APIs. No native modules planned in this phase. |

---

## 4. New / extended APIs required

Prefer **NigaHomeopathy-API** unless noted. Paths are proposed contracts.

### 4.1 Doctor credentialing

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/DoctorCredentialing/Queue` | Paginated pending/approved/rejected |
| GET | `/api/DoctorCredentialing/{doctorId}` | Detail + documents + history |
| POST | `/api/DoctorCredentialing/{doctorId}/Approve` | Approve & unlock practice |
| POST | `/api/DoctorCredentialing/{doctorId}/Reject` | Reject with reason |
| POST | `/api/DoctorCredentialing/{doctorId}/RequestInfo` | Needs more info |
| POST | `/api/DoctorCredentialing/{doctorId}/Documents` | Upload cert/ID (multipart) |
| GET | `/api/DoctorCredentialing/MyStatus` | Doctor self-view of verification |

**Aligns with:** `POST /users/RegisterDoctor`, `Doctor` credential fields, `/admin/listusers`, qualifications master.

### 4.2 Consult payments & reconciliation

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/ConsultFee/Config` | Doctor/clinic consult fee CRUD |
| POST | `/api/ConsultPayment/CreateOrder` | Razorpay order for consult (patient or reception link) |
| POST | `/api/ConsultPayment/Verify` | Signature verify + mark Paid |
| POST | `/api/ConsultPayment/CollectAtReception` | Cash/UPI/card offline collection |
| GET | `/api/ConsultPayment/ByAppointment/{patientAppId}` | Status for badge |
| GET | `/api/ConsultPayment/Admin/Reconciliation` | Admin dashboard aggregates + rows |
| GET | `/api/ConsultPayment/Admin/Exceptions` | Failed/mismatch queue |
| POST | `/api/ConsultPayment/Admin/Exceptions/{id}/Resolve` | Manual resolve / retry |
| POST | `/api/ConsultPayment/Webhook/Razorpay` | Server webhook (no JWT) |

**Aligns with:** Classic `Order/GenerateOrderId` + `PackageEntryDetail` payment fields pattern — **new tables**, do not overload subscription package entries.

### 4.3 Support tickets

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/SupportTicket` | Admin/doctor list (role-filtered) |
| POST | `/api/SupportTicket` | Create (doctor / patient public / guest booking) |
| GET | `/api/SupportTicket/{id}` | Detail + messages |
| POST | `/api/SupportTicket/{id}/Messages` | Reply thread |
| POST | `/api/SupportTicket/{id}/Status` | Open → InProgress → Resolved → Closed |
| POST | `/api/SupportTicket/{id}/Assign` | Admin assignee |

**Do not use:** Velzon fake ticket APIs. Marketing `EnquiryDetail` stays separate.

### 4.4 Patient self-service booking

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/PublicBooking/Doctors` | Discover bookable doctors |
| GET | `/api/PublicBooking/Doctors/{id}/Profile` | Public profile + fee |
| GET | `/api/PublicBooking/Doctors/{id}/Slots` | Wraps schedule/slot logic |
| POST | `/api/PublicBooking/RequestOtp` | Patient mobile/email OTP |
| POST | `/api/PublicBooking/VerifyOtp` | Session token for booking |
| POST | `/api/PublicBooking/Create` | Create patient + appointment |
| GET | `/api/PublicBooking/{bookingToken}` | Booking summary |

**Aligns with:** `GetDailySchedule`, `GetAppointmentSlots`, `SavePatientApp`.

### 4.5 Appointment reschedule / cancel

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/PatientAppointment/RescheduleAppointment` | Date+time+slot; audit; notify |
| POST | `/api/PatientAppointment/CancelAppointment` | Status CANCELLED + reason |
| GET | `/api/PatientAppointment/ChangeLog/{patientAppId}` | Audit trail |

**Extend existing:** `UpdateAppointmentTime`, `UpdateAppointmentStatus`, appointment list DTOs (include Cancelled bucket / filter).

### 4.6 Follow-up & clinic performance

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/Analytics/FollowUpDue` | Follow-ups due in range |
| GET | `/api/Analytics/FollowUpSummary` | Rates / outcomes |
| GET | `/api/Analytics/ClinicPerformance` | Utilization, no-show, cancel, revenue, wait |
| PATCH | `/api/PatientAppointment/{id}/VisitType` | First / Follow-up / etc. |

**Aligns with:** `GetPatientStats`, `GetPatientStatsCharts` — extend, do not replace.

### 4.7 SMS

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/Sms/Templates` | Template CRUD |
| POST | `/api/Sms/Send` | Ad-hoc send |
| GET | `/api/Sms/History` | Logs |
| POST | `/api/Sms/Events/{eventKey}/Test` | Test confirm / registration / unavailable |

**Event keys:** `AppointmentConfirmation`, `PatientRegistration`, `DoctorUnavailable`.  
**Aligns with:** WhatsApp controller shape (`Send*`, templates, history, dashboard).

### 4.8 Center of Gravity & Potency

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Repertorization/CenterOfGravity` | COG compute from selected rubrics |
| GET | `/api/PotencyMaster` | Potency DDL |
| POST | `/api/PotencyMaster` | Admin CRUD (optional) |
| — | Extend `SavePrescriptionDetail` payload | Accept `potencyId` / structured dose |

**Aligns with:** Existing repertorization/elimination endpoints; `PrescriptionRemedyDetail.Dose`.

### 4.9 Visit notes / eRx

| Method | Path | Purpose |
|--------|------|---------|
| — | Extend classic `SaveUpdateAppointmentHistoryNote` | `noteType`, visibility flags |
| GET | `/api/Erx/ByAppointment/{patientAppId}` | eRx-only payload (remedies + labs, no visit notes) |
| GET | `/api/Erx/Export/{patientAppId}` | Printable/PDF eRx (future) |

### 4.10 Telemedicine

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/Telemedicine/Availability` | Set Online/Offline |
| GET | `/api/Telemedicine/Availability/{doctorId}` | Public/doctor status |
| GET | `/api/Telemedicine/Queue` | Waiting patients for doctor |
| POST | `/api/Telemedicine/Sessions` | Create session for appointment |
| GET | `/api/Telemedicine/Sessions/{id}` | Session + join tokens |
| POST | `/api/Telemedicine/Sessions/{id}/End` | End call |
| POST | `/api/Telemedicine/Sessions/{id}/Rejoin` | Re-issue token if Active |
| POST | `/api/Telemedicine/Consent` | Recording consent (pattern: AudioCaseConsentLog) |

**Aligns with:** `E-CONSULT` status, audio consent logging, replace UI video stubs.

---

## 5. Role-wise screen map (new only)

### Admin

| Screen | Route (proposed) | Features served |
|--------|------------------|-----------------|
| Credentialing queue | `/admin/doctor-credentialing` | #1 |
| Credentialing detail | `/admin/doctor-credentialing/:doctorId` | #1 |
| Consult payment reconciliation | `/admin/consult-payments` | #2 |
| Payment exceptions | `/admin/payment-exceptions` | #3 |
| Support tickets list | `/admin/support-tickets` | #4 |
| Support ticket detail | `/admin/support-tickets/:id` | #4 |

Menu: add under **Business Management** (credentialing) and new top-level **Payments** / **Support** (or Business Management children). Register in `LayoutMenuData.js` + `allRoutes.js` like existing admin CRUD pages.

### Guest / Patient (public)

| Screen | Route (proposed) | Features served |
|--------|------------------|-----------------|
| Doctor discovery / book entry | `/book` | #5 |
| Slot selection | `/book/:doctorId/slots` | #5 |
| Patient details + OTP | `/book/:doctorId/details` | #5 |
| Pay consult | `/book/pay/:bookingId` | #6 |
| Booking confirmation | `/book/success` | #5, #6 |

Entry from marketing landing CTAs (`HomeoJobLanding`).

### Doctor

| Screen / surface | Location | Features served |
|------------------|----------|-----------------|
| Reschedule / Cancel modals | Doctor dashboard appointment lists | #7, #8 |
| Follow-up analysis | New dashboard section or page | #9 |
| Clinic performance | New page | #10 |
| SMS templates / settings | Outreach area (near WhatsApp) | #11 |
| Center of Gravity panel | Patient Board → Repertorize | #12 |
| Potency picker | Prescription modal | #13 |
| Visit Notes panel + eRx-only Rx modal | Patient Board | #14 |
| Online toggle + Tele queue | Dashboard | #15 |
| Video room | `/teleconsult/:sessionId` | #15 |
| Consent modal | Pre-join | #15 |
| Payment status badge | Appointment cards | #16 |

### Reception

| Screen / surface | Location | Features served |
|------------------|----------|-----------------|
| Reschedule / Cancel | Shared doctor dashboard (enabled for reception) | #17 |
| Collect payment modal | Appointment row action | #18 |
| Payment badge (read) | Appointment lists | #16 (view) |

---

## 6. Data model additions (summary)

| Entity (new) | Key fields | Used by |
|--------------|------------|---------|
| `DoctorVerification` | DoctorId, Status, ReviewedBy, Reason, ReviewedAt | Credentialing |
| `DoctorCredentialDocument` | DoctorId, FileUrl, DocType | Credentialing |
| `ConsultFeeConfig` | DoctorId, Amount, Currency, IsEnabled | Booking + reception |
| `ConsultPayment` | PatientAppId, Amount, Status, Gateway, OrderId, PaymentId, Method, CollectedBy | Payments all roles |
| `ConsultPaymentEvent` | PaymentId, EventType, Payload, CreatedAt | Webhooks / exceptions |
| `SupportTicket` (+ Message, Attachment) | ReporterRole, Status, Priority, AssigneeId | Admin support |
| `AppointmentChangeLog` | PatientAppId, Action, Old/New values, ByUserId | Reschedule/Cancel |
| `SmsTemplate` / `SmsMessageLog` | EventKey, Body, ProviderId | SMS |
| `PotencyMaster` | Code, Label, SortOrder | Potency |
| `TeleAvailability` | DoctorId, Status, UpdatedAt | Telemedicine |
| `TeleSession` | PatientAppId, RoomId, Status, StartedAt, EndedAt | Telemedicine |
| `TeleConsentLog` | SessionId, ConsentType, Accepted | Telemedicine |

**Extend existing**

| Entity | Change |
|--------|--------|
| `PatientAppointment` | Status `CANCELLED`; optional `VisitType`; payment nav |
| `AppointmentHistoryNote` | `NoteType` |
| `PrescriptionRemedyDetail` | `PotencyId` (keep `Dose` for display/compat) |
| `Patient` | SMS opt-in (mirror WhatsApp opt-in) |
| `Doctor` / `UserMaster` | VerificationStatus / practice lock |

---

## 7. Dependency graph & suggested phases

```
Phase A — Appointments hygiene (enables booking + tele + payments)
  ├─ Cancel appointment (+ CANCELLED status)
  ├─ Formal Reschedule (+ audit + notify hooks)
  └─ VisitType for Follow-up (foundation)

Phase B — Consult payments spine
  ├─ ConsultFeeConfig + ConsultPayment
  ├─ Reception collect
  ├─ Doctor payment badge
  ├─ Patient pay (with booking)
  └─ Admin reconciliation + exception queue

Phase C — Patient self-service booking
  ├─ Public slots + OTP + Create booking
  └─ Depends on Phase A slots + Phase B pay (or pay-at-clinic flag)

Phase D — Messaging
  ├─ SMS provider + 3 event templates
  └─ Wire to create/reschedule/cancel/registration/unavailable

Phase E — Clinical board enhancements
  ├─ Potency module
  ├─ Visit notes / eRx split
  └─ Center of Gravity

Phase F — Telemedicine
  ├─ Availability + queue
  ├─ Video join/rejoin
  └─ Recording consent
  (Depends on A; stronger with B payment gate)

Phase G — Admin trust & support
  ├─ Doctor credentialing review
  └─ Support ticket queue

Phase H — Analytics
  ├─ Follow-up analysis
  └─ Clinic performance
  (Depends on A visit types; richer with B revenue + F session duration)
```

### Suggested priority for delivery

1. **Reschedule + Cancel** (Doctor + Reception) — small, high clinic value, unblocks notifications  
2. **Consult payment spine + reception collect + badges** — monetization  
3. **Patient self-service booking + pay** — growth  
4. **SMS events** — operational reliability  
5. **Potency + Visit notes/eRx + COG** — clinical differentiation  
6. **Telemedicine suite** — largest engineering effort  
7. **Credentialing + Support tickets** — admin ops  
8. **Follow-up + Clinic performance** — insights once data quality exists  

---

## 8. File touchpoints (implementation anchors)

| Area | Primary files / folders to extend |
|------|-----------------------------------|
| Admin routes/menu | `src/Routes/allRoutes.js`, `src/Layouts/LayoutMenuData.js` |
| Doctor dashboard appointments | `src/pages/Doctor/Dashboard/BestSellingProducts.js`, `Widgets.js` |
| Patient board / Rx / repertorize | `src/pages/Doctor/PatientBoard/PatientBoard.js` |
| Auth roles | `src/Components/constants/roles.js` |
| API URLs / helpers | `src/helpers/url_helper.js`, `realbackend_helper.js` |
| Appointment API | `NigaHomeopathy-API/.../PatientAppointmentController.cs` |
| WhatsApp pattern for SMS | `NigaHomeopathy-API/.../WhatsAppController.cs` |
| Notes | Classic `AppointmentHistoryNoteController` |
| Rx / Dose | Classic Prescription save; `PrescriptionRemedyDetail` |
| Registration credentials | Newer RegisterDoctor; `Doctor.cs` |
| Consent pattern | Audio case consent entities/services |
| Razorpay pattern | Classic Order/Subscription; UI `Widgets.js` |
| Stats pattern | `DoctorDashBoardController` GetPatientStats* |

---

## 9. Explicit non-goals / traps

| Trap | Correct approach |
|------|------------------|
| Velzon `/apps-tickets-*` | Build real SupportTicket module |
| Velzon KYC crypto pages | Build DoctorCredentialing under Admin Business Management |
| Overloading `PackageEntryDetail` for consult fees | New `ConsultPayment` entity |
| Treating `UpdateAppointmentTime` as full Reschedule product | Add dedicated API + audit + notifications |
| Treating WhatsApp as SMS done | Separate SMS provider + templates |
| COG = rename Repertorize | New algorithm/API + UI panel |
| Dose free-text = Potency module | Master + structured picker |
| History Notes inside Rx modal = “distinct visit notes” | UX split + note types + eRx export |
| E-CONSULT + WhatsApp alert = telemedicine | Real availability, session, WebRTC/vendor, consent |
| Mobile Type in table | Web-only unless a native app is green-lit later |

---

## 10. Acceptance criteria checklist (per feature)

| Feature | Done when |
|---------|-----------|
| Credentialing | Admin can approve/reject with docs; unapproved doctors cannot practice |
| Reconciliation | Admin sees booking↔payment match and export |
| Payment exceptions | Failed webhooks appear in queue and can be resolved |
| Support tickets | Doctor/patient issues tracked with status thread (not enquiry form) |
| Self-service booking | Guest books slot without staff login |
| Patient consult pay | Razorpay (or clinic pay-later) updates appointment payment status |
| Reschedule | Date/time change with conflict check + audit (+ notify if SMS live) |
| Cancel | CANCELLED status, reason, slot freed, lists updated |
| Follow-up analysis | Due list + metrics from persisted visit types |
| Clinic performance | KPI page beyond existing patient-stats charts |
| SMS | Three event types send via provider with logs |
| Center of Gravity | Dedicated compute + UI on selected rubrics |
| Potency | Rx save stores structured potency from master |
| Visit notes / eRx | Notes editable outside Rx; eRx view omits visit notes |
| Telemedicine | Online toggle, queue, browser join, rejoin, recording consent persisted |
| Payment badge | Doctor/reception see Paid/Pending/Failed on appointment |
| Reception collect | Cash/UPI/card recorded and visible in admin reconciliation |

---

## 11. Effort sketch (relative)

| Band | Features |
|------|----------|
| S (days) | Cancel; Reschedule formalization; Payment badge (once payments exist); Potency UI on existing Dose |
| M (1–2 sprints) | Reception collect; Visit notes/eRx split; SMS 3 events; Follow-up analysis; Credentialing queue; Support tickets MVP |
| L (multi-sprint) | Consult payment + webhooks + admin reconciliation/exceptions; Patient self-service booking; Clinic performance; Center of Gravity |
| XL | Full telemedicine (vendor, queue, rejoin, consent, recording policy) |

---

*End of New Features Development Plan. Update this file when APIs are finalized or phases are re-ordered after product prioritization.*

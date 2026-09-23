"""Phase 1–8, existing 100% catalogue, QA, NFR, integrations — sequential sub-tasks."""

Y, N, P = "Yes", "No", "Partial"


def add_all(T):
    add_phase1(T)
    add_phase2(T)
    add_phase3(T)
    add_phase4(T)
    add_phase5(T)
    add_phase6(T)
    add_phase7(T)
    add_phase8(T)
    add_existing_100(T)
    add_qa_nfr_int(T)


def add_phase1(T):
    ph, pn = "1", "Phase 1 — Appointment product completeness"

    # DOC-01 Reschedule
    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.01",
      "DB: AppointmentChangeLog (PatientAppId, Action, OldValue, NewValue, ByUserId, ByRole, At) + indexes",
      "New", "NEW", "Appointments", "DOC-01, F-06",
      "DB", N, Y, Y, N, N, "P1", "S", "PLT-10.01",
      "§12.6, §16.2",
      "UpdateAppointmentTime exists — changes a time only",
      "Dedicated change log; old slot released",
      "Every reschedule is retrievable from the change log", "")

    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.02",
      "API: POST /api/PatientAppointment/RescheduleAppointment — validate against daily schedule, existing bookings, not in the past; 409 with alternatives; wrap UpdateAppointmentTime",
      "New", "NEW", "Appointments", "DOC-01, F-06",
      ".NET 8 API", N, Y, Y, Y, N, "P1", "M", "DOC-01.01, DOC-17",
      "§12.6, §15.2",
      "UpdateAppointmentTime has no audit, notify, conflict handling or old→new confirmation",
      "Dedicated API with conflict check, slot release, notify",
      "Slot no longer free → 409 with alternatives; notification failure does not roll back", "")

    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.03",
      "API: GET /api/PatientAppointment/ChangeLog/{id} audit trail",
      "New", "NEW", "Appointments", "DOC-01",
      ".NET 8 API", Y, Y, Y, Y, N, "P1", "S", "DOC-01.01",
      "§12.6",
      "No change log",
      "Admin/Doctor/Reception can read audit",
      "Every change retrievable", "")

    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.04",
      "UI: RescheduleModal shared by Doctor and Reception — show old date/time and new slot picker; reason optional",
      "New", "NEW", "Appointments", "DOC-01, REC-01, §13.3",
      "Web SPA", Y, N, N, Y, N, "P1", "S", "DOC-01.02",
      "§13.1 BestSellingProducts.js, §13.3",
      "Time edit only",
      "Old→new UX",
      "Doctor and Reception can reschedule through the same API with correct authorisation", "")

    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.05",
      "Notifications: SMS + WhatsApp + (later) push — reschedule confirmation with old→new; must not block the transaction if notify fails",
      "New Integration", "NEW-INT", "Outreach", "DOC-01, DOC-05, §10.3",
      "Notification worker", N, Y, Y, Y, Y, "P1", "S", "DOC-01.02, DOC-05 (SMS can queue until provider live)",
      "§11.2, §10.3",
      "No notification on time change",
      "Fan-out on Reschedule event",
      "Patient notified; doctor/reception dashboards refresh", "")

    T(ph, pn, "1.1", "DOC-01",
      "Formal reschedule appointment (audited, notified, conflict-checked) — not a rename of UpdateAppointmentTime",
      "DOC-01.06",
      "Edge cases: reschedule into a slot the patient already booked elsewhere; across a schedule change; bulk day-block; patient cancel while doctor joining video (later)",
      "New", "NEW", "Appointments", "DOC-01, §12.6 Edge Cases",
      ".NET 8 + UI", Y, Y, Y, Y, N, "P2", "S", "DOC-01.02",
      "§12.6",
      "None handled",
      "Specified edge cases",
      "QA covers listed edge cases", "")

    # DOC-02 Cancel
    T(ph, pn, "1.2", "DOC-02",
      "Cancel appointment — new CANCELLED status, reason, slot release, refund hook (do NOT reuse DeleteStatus)",
      "DOC-02.01",
      "DB: add CANCELLED to appointment status set; CancelReasonCode, CancelReasonText, CancelledBy, CancelledAt; VisitType default First on existing rows (MIG — additive, no backfill of cancelled)",
      "New", "NEW", "Appointments", "DOC-02, F-06, §16.5",
      "DB", N, Y, Y, N, N, "P1", "S", "—",
      "§12.6, §16.1, §5.3",
      "Status set is WAITING, WALK-IN, NOT ARRIVED, E-CONSULT, REMAINING, COMPLETED — no CANCELLED; DeleteStatus is soft-delete only",
      "New status + reason fields; DeleteStatus remains administrative and is not cancellation",
      "Cancelled appointments leave active buckets and appear in a Cancelled filter", "")

    T(ph, pn, "1.2", "DOC-02",
      "Cancel appointment — new CANCELLED status, reason, slot release, refund hook (do NOT reuse DeleteStatus)",
      "DOC-02.02",
      "API: POST /api/PatientAppointment/CancelAppointment — reason required (enum; text if Other); free slot; offer to waitlist; if PAID evaluate refund policy (FIN-07 / OQ-A6)",
      "New", "NEW", "Appointments", "DOC-02, FIN-07, OQ-A6",
      ".NET 8 API", N, Y, Y, Y, Y, "P1", "M", "DOC-02.01, PRE-01.06",
      "§12.6, §11.2",
      "No cancel product",
      "Refund path triggered rather than silently keeping money",
      "Freed slot immediately bookable including by public booking (once Phase 3 exists)", "")

    T(ph, pn, "1.2", "DOC-02",
      "Cancel appointment — new CANCELLED status, reason, slot release, refund hook (do NOT reuse DeleteStatus)",
      "DOC-02.03",
      "UI: CancelAppointmentModal — reason code required; shared by Doctor and Reception; dashboard Cancelled filter",
      "New", "NEW", "Appointments", "DOC-02, REC-02",
      "Web SPA", Y, N, N, Y, N, "P1", "S", "DOC-02.02",
      "§13.3",
      "No cancel UX",
      "Reason mandatory",
      "All three roles (later Patient) can cancel with correct authorisation", "")

    T(ph, pn, "1.2", "DOC-02",
      "Cancel appointment — new CANCELLED status, reason, slot release, refund hook (do NOT reuse DeleteStatus)",
      "DOC-02.04",
      "Waitlist worker stub: on cancel, offer freed slot (full waitlist capture is GST-01 / Phase 3)",
      "New", "NEW", "Appointments", "DOC-02, GST-01, §14.3",
      ".NET 8 worker", N, Y, Y, Y, Y, "P2", "S", "DOC-02.02",
      "§14.3 Waitlist offer",
      "No waitlist",
      "Hook ready for Phase 3 waitlist records",
      "Cancellation can notify waitlist when waitlist exists", "")

    # REC-01/02
    T(ph, pn, "1.3", "REC-01",
      "Reception reschedule and cancel — same APIs, authorised for JWT DoctorId; isReceptionUser must not block these actions",
      "REC-01.01",
      "Authorise Reception for RescheduleAppointment and CancelAppointment for its own doctor's appointments only",
      "New", "NEW", "Reception", "REC-01, REC-02, DOC-01, DOC-02",
      ".NET 8 + SPA", Y, Y, N, Y, N, "P1", "S", "DOC-01.02, DOC-02.02, PLT-05.05",
      "§7.6, §9.2, §12.6",
      "Reception shares doctor dashboard; actions absent; gating unclear",
      "Same APIs; ownership by DoctorId from JWT",
      "Reception acts only for its doctor; permission tests pass", "")

    # DOC-30 VisitType ConsultMode
    T(ph, pn, "1.4", "DOC-30",
      "New appointment form — persist VisitType (First/Follow-up), ConsultMode (In-clinic / E-Consult), and fee display",
      "DOC-30.01",
      "DB: PatientAppointment.VisitType, ConsultMode (PaymentStatus added in Phase 2); PATCH VisitType API; migrate existing rows default VisitType=First (do not infer retrospectively unless client asks)",
      "Existing Improvement", "P-ENH", "Appointments", "DOC-30, F-06, DOC-03",
      "DB + API + SPA", Y, Y, Y, Y, N, "P1", "M", "DOC-02.01",
      "§7.5, §12.6, §16.5",
      "Formik modal exists; no visit type, consult mode or fee",
      "Extend entity + modal; feeds follow-up analytics",
      "New fields persist; filters/analytics can use them", "")

    T(ph, pn, "1.4", "DOC-30",
      "New appointment form — persist VisitType (First/Follow-up), ConsultMode (In-clinic / E-Consult), and fee display",
      "DOC-30.02",
      "Extend doctor/reception new-appointment modal with visit type, consult mode and fee (fee from ConsultFeeConfig once Phase 2 exists — show placeholder until then)",
      "Existing Improvement", "P-ENH", "Appointments", "DOC-30, GST-09",
      "Web SPA", Y, N, N, Y, N, "P1", "S", "DOC-30.01",
      "§13.1, §7.5",
      "Appointment create 90%",
      "Fields on the modal",
      "Staff-created appointments carry the same fields as public booking will", "")

    # DOC-17 Daily schedule
    T(ph, pn, "1.5", "DOC-17",
      "Promote daily schedule from modal to first-class screen /doctor/schedule (client marked 0%; code already has Get/Save APIs)",
      "DOC-17.01",
      "Promote DailyScheduleSetupModal to /doctor/schedule with week grid and copy-day; reuse GetDailySchedule / SaveDailySchedule (existing — do not rebuild)",
      "Existing Improvement", "P-ENH", "Scheduling", "DOC-17, C-4",
      "Web SPA", Y, N, N, Y, N, "P1", "M", "—",
      "§5.3, §12.15, §13.1",
      "DailyScheduleSetupModal + GetDailySchedule / SaveDailySchedule exist; not a first-class screen",
      "Promotion, not construction",
      "Public booking slots (Phase 3) respect the saved schedule", "")

    T(ph, pn, "1.5", "DOC-17",
      "Promote daily schedule from modal to first-class screen /doctor/schedule (client marked 0%; code already has Get/Save APIs)",
      "DOC-17.02",
      "Reception read-only schedule at /reception/schedule using DoctorID from JWT (REC-05) — frontend only over existing API",
      "New", "NEW (FE)", "Reception", "REC-05, DOC-17",
      "Web SPA — Reception", Y, N, N, N, N, "P2", "S", "DOC-17.01",
      "§7.6, §12.15",
      "GetDailySchedule exists; no reception view",
      "Read-only screen",
      "Reception views hours; cannot edit clinical schedule unless authorised", "")

    # DOC-18 Reception staff UI
    T(ph, pn, "1.6", "DOC-18",
      "Manage reception staff UI over existing .NET 8 api/ReceptionStaff CRUD (backend done, frontend absent)",
      "DOC-18.01",
      "Build list / add / edit / disable pages at /doctor/reception-staff; authorise that the doctor owns the staff record",
      "Existing Improvement", "P-ENH (FE only)", "Staff", "DOC-18, C-5",
      "Web SPA", Y, N, N, Y, N, "P2", "M", "PLT-05.05",
      "§5.3, §12.15, §13.2",
      "Full CRUD API on .NET 8; no UI page at all",
      "Frontend over existing API; DoctorReceptionStaff table unchanged",
      "Doctor manages own staff without developer intervention", "")

    # DOC-23 Complaints
    T(ph, pn, "1.7", "DOC-23",
      "Wire Patient Board to existing SaveComplaints / SaveCaseDetails (classic APIs exist; board never calls them)",
      "DOC-23.01",
      "Wire Patient Board complaints & case-detail capture to existing classic SaveComplaints / SaveCaseDetails — wiring, not new backend",
      "Existing Improvement", "P-ENH (FE only)", "Patient Board", "DOC-23, C-6",
      "Web SPA", Y, N, N, Y, N, "P1", "S", "PLT-13.02 (prefer after extract, can be thin wiring first)",
      "§5.3, §12.15",
      "Classic SaveComplaints / SaveCaseDetails exist; Patient Board does not call them",
      "Client 20% is wiring, not new backend",
      "Complaints entered on the board persist and reload", "")

    # REC-06 Case paper
    T(ph, pn, "1.8", "REC-06",
      "Reception case paper / chief complaint form (restricted; no repertory or Rx) over existing SaveComplaints",
      "REC-06.01",
      "Reception case-paper screen — chief complaint form; audit reception as author; no clinical tools exposed",
      "New", "NEW (FE + authz)", "Reception", "REC-06",
      "Web SPA", Y, Y, N, Y, N, "P2", "S", "DOC-23.01, PLT-05.05",
      "§7.6, §12.15",
      "SaveComplaints exists; no reception surface",
      "Restricted form",
      "Reception operates without seeing clinical tools it must not use", "")

    # DOC-25 Export
    T(ph, pn, "1.9", "DOC-25",
      "Export case data from Patient Board (ExportCasesToExcel exists on .NET 8; no board button; add PDF)",
      "DOC-25.01",
      "Board toolbar action calling existing ExportCasesToExcel; add PDF renderer /api/Erx/Export (PDF completeness continues in Phase 4 with eRx snapshot)",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-25, C-6",
      "Web SPA + .NET 8", Y, Y, N, Y, N, "P2", "S", "—",
      "§5.3, §12.15",
      "ExportCasesToExcel exists; no Patient Board button; no PDF",
      "UI + PDF variant",
      "Doctor downloads a case from the board", "")

    # REC-07 Waiting queue
    T(ph, pn, "1.10", "REC-07",
      "Waiting queue management — dedicated UX, payment gate, tele vs walk-in, call-next (60% → 100%)",
      "REC-07.01",
      "Reception queue panel: dedicated UX, call-next, tele vs walk-in split; payment gate wired when Phase 2 payment status exists (badge stub until then)",
      "Existing Improvement", "P-ENH", "Reception", "REC-07",
      "Web SPA", Y, Y, N, Y, N, "P1", "M", "DOC-02.01, DOC-30.01",
      "§7.6, §12.15",
      "Status buckets on shared doctor dashboard; no dedicated queue UX or payment gate",
      "Queue panel, call-next, tele vs walk-in",
      "Reception can run the floor without the doctor dashboard chrome", "")

    T(ph, pn, "1.10", "REC-08",
      "Reception home dashboard — reception-first chrome (90% → 100%)",
      "REC-08.01",
      "Reception-first home chrome (not just doctor dashboard with actions hidden)",
      "Existing Improvement", "P-ENH", "Reception", "REC-08",
      "Web SPA", Y, N, N, N, N, "P2", "S", "REC-07.01",
      "§7.6, §12.15",
      "Doctor dashboard with some clinical actions disabled",
      "Reception-first chrome",
      "Reception home is purpose-built", "")

    # DOC-29 patient list filters (can start in P1, unpaid filter needs P2)
    T(ph, pn, "1.11", "DOC-29",
      "Patient search / list / open case — filters for last visit, unpaid, family (90% → 100%)",
      "DOC-29.01",
      "Extend list DTOs and filters: last visit, family; unpaid filter completes when PaymentStatus exists (Phase 2)",
      "Existing Improvement", "P-ENH", "Dashboard", "DOC-29",
      "Web SPA + API", Y, Y, N, Y, N, "P2", "S", "DOC-30.01",
      "§7.5, §12.15",
      "Search/list/open case exist",
      "Filters for last visit, unpaid, family",
      "Filters return correct sets", "")


def add_phase2(T):
    ph, pn = "2", "Phase 2 — Money spine and Account role (programme keystone)"

    T(ph, pn, "2.1", "FIN-01",
      "Unified append-only ledger across money streams S1–S7 (do NOT overload PackageEntryDetail)",
      "FIN-01.01",
      "DB: PaymentOrder (all streams), LedgerEntry (immutable append-only), unique GatewayPaymentId, indexes Stream/CreatedAt and Payee/SettlementRunId",
      "New", "NEW", "Finance", "FIN-01, F-02, AD-4, SC-02, SC-03",
      "DB", N, Y, Y, N, N, "P0", "L", "PRE-01.01, PRE-01.03, PLT-10.03, PLT-12.03",
      "§12.2, §16.2, §16.4",
      "No ledger or invoice entity; only PackageEntryDetail for S1",
      "PackageEntryDetail remains subscription-only and must not be reused for S2–S7",
      "Every ledger row traces to RefEntityType + RefEntityId; rows never deleted", "")

    T(ph, pn, "2.1", "FIN-01",
      "Unified append-only ledger across money streams S1–S7 (do NOT overload PackageEntryDetail)",
      "FIN-01.02",
      "Ledger service: webhook-authoritative capture (AD-3); commission and GST computed at capture from config effective that date and stored; corrections = reversing entries never updates",
      "New", "NEW", "Finance", "FIN-01, AD-3, AD-4, SC-02",
      ".NET 8", N, Y, Y, Y, Y, "P0", "L", "FIN-01.01, PRE-01.03",
      "§12.2 Business Logic",
      "Client-side Razorpay callback is source of truth today",
      "Webhook is source of truth; client verify is advisory only",
      "Capture while browser closed is still ledgered; replayed webhook does not double-write", "")

    T(ph, pn, "2.1", "FIN-01",
      "Unified append-only ledger across money streams S1–S7 (do NOT overload PackageEntryDetail)",
      "FIN-01.03",
      "GET /api/Ledger — unified ledger UI at /account/ledger with stream filters, export, OTP-audit links",
      "New", "NEW", "Finance", "FIN-01, F-04, SC-04",
      "Account console", Y, Y, Y, Y, N, "P0", "M", "FIN-01.02, PLT-09.02",
      "§12.4, §13.2",
      "No finance role or screens",
      "Account owns money; Admin read-only",
      "Account can list all streams; medicine filterable separately even before S5 volume", "")

    T(ph, pn, "2.1", "FIN-01",
      "Unified append-only ledger across money streams S1–S7 (do NOT overload PackageEntryDetail)",
      "FIN-01.04",
      "Optional idempotent back-populate of historical S1 subscription payments into ledger for reporting continuity",
      "Data Migration", "MIG", "Finance", "§16.5",
      "DB", N, Y, Y, N, N, "P2", "S", "FIN-01.02, DOC-19",
      "§16.5",
      "S1 exists in PackageEntryDetail only",
      "Must be idempotent to avoid double counting",
      "Historical S1 reportable without double count", "")

    # Consult fee
    T(ph, pn, "2.2", "GST-09",
      "ConsultFeeConfig per doctor (amount, currency, PayAtClinicEnabled) — drives booking amounts; never accept amount from client",
      "GST-09.01",
      "DB + GET/PUT /api/ConsultFee/Config; public display of consult fee on pricing/directory; doctor can edit own fee; Admin can edit",
      "Existing Improvement", "P-ENH", "Payments / Marketing", "GST-09, F-02, DOC-15",
      "SPA + API + public web", Y, Y, Y, Y, N, "P1", "M", "FIN-01.01",
      "§7.4, §12.2, §12.5",
      "SaaS pricing page only; consult fee not modelled",
      "Server-derived amounts only",
      "Fee change between booking and payment does not change the booked amount", "")

    # GST-02 patient pay
    T(ph, pn, "2.3", "GST-02",
      "Patient consult payment (S2) — order, webhook, appointment PaymentStatus (public funnel UI is Phase 3; spine here)",
      "GST-02.01",
      "POST /api/Payments/Orders — create gateway order for stream; amount derived server-side; PaymentOrder=CREATED",
      "New", "NEW", "Payments", "GST-02, F-02, AD-3",
      ".NET 8", N, Y, Y, Y, Y, "P0", "M", "FIN-01.02, GST-09.01, PRE-04.01",
      "§12.2, §15.2, C-2",
      "Razorpay pattern exists for subscription only",
      "Unified /api/Payments/* namespace (C-2); ConsultPayment is appointment-scoped sub-surface",
      "No orphan order on gateway timeout (503, client retry)", "")

    T(ph, pn, "2.3", "GST-02",
      "Patient consult payment (S2) — order, webhook, appointment PaymentStatus (public funnel UI is Phase 3; spine here)",
      "GST-02.02",
      "POST /api/Payments/Webhook/Razorpay — anonymous + signature verify; payment.captured / failed; idempotent on GatewayPaymentId; write ledger; set Appointment.PaymentStatus",
      "New Integration", "NEW-INT", "Payments", "GST-02, ADM-03, F-02",
      ".NET 8 webhook", N, Y, Y, Y, Y, "P0", "L", "GST-02.01, PLT-08.01, PLT-12.03",
      "§12.2, §17, §11.1",
      "No server webhook; no signature verification",
      "Signature mismatch → 400, no ledger write, security alert",
      "Failed payment creates PaymentException; never silent", "")

    T(ph, pn, "2.3", "GST-02",
      "Patient consult payment (S2) — order, webhook, appointment PaymentStatus (public funnel UI is Phase 3; spine here)",
      "GST-02.03",
      "POST /api/Payments/Verify — client-assist only, never sole basis for Paid; GET /api/ConsultPayment/ByAppointment/{patientAppId} for badges",
      "New", "NEW", "Payments", "GST-02, DOC-14",
      ".NET 8 + SPA", Y, Y, N, Y, N, "P1", "S", "GST-02.02",
      "§12.2",
      "Client callback trusted today",
      "Advisory verify + badge DTO",
      "PaymentStatus correct across appointment lists", "")

    T(ph, pn, "2.3", "GST-02",
      "Patient consult payment (S2) — order, webhook, appointment PaymentStatus (public funnel UI is Phase 3; spine here)",
      "GST-02.04",
      "PatientAppointment.PaymentStatus field; PaymentStatusBadge component on appointment lists, board header, queue",
      "New", "NEW", "Payments", "DOC-14, DOC-16, REC-07",
      "Web SPA", Y, Y, Y, Y, N, "P1", "S", "GST-02.03",
      "§13.3, §7.5 DOC-14",
      "No payment fields on appointment DTOs",
      "Badge on all lists",
      "Status correct across all lists; colour never sole carrier (a11y)", "")

    T(ph, pn, "2.3", "GST-02",
      "Patient consult payment (S2) — order, webhook, appointment PaymentStatus (public funnel UI is Phase 3; spine here)",
      "GST-02.05",
      "S4 Instant/tele premium stream hook in PaymentOrder (surge config) — used by instant consult in Phase 3/5",
      "New", "NEW", "Payments", "S4, F-02",
      ".NET 8", N, Y, Y, Y, Y, "P2", "S", "GST-02.01, PRE-01.03",
      "§12.2 money streams",
      "No streams besides S1",
      "S4 modelled even if product launches later",
      "S4 rows distinguishable in ledger", "")

    # REC-03
    T(ph, pn, "2.4", "REC-03",
      "Collect per-consult payment at reception (S3) — cash/UPI/card/pay-link; still ledgered (SC-03)",
      "REC-03.01",
      "DB ConsultPayment (method, collectedBy, receiptNo unique per clinic); POST /api/ConsultPayment/CollectAtReception",
      "New", "NEW", "Payments", "REC-03, FIN-10, SC-03",
      ".NET 8", Y, Y, Y, Y, N, "P0", "M", "FIN-01.02, GST-09.01, PRE-01.02",
      "§11.3, §12.2",
      "Cash collected at clinic is invisible to the platform",
      "Every inflow produces a ledger row including reception cash",
      "Cash appears in unified ledger with collector and receipt number", "")

    T(ph, pn, "2.4", "REC-03",
      "Collect per-consult payment at reception (S3) — cash/UPI/card/pay-link; still ledgered (SC-03)",
      "REC-03.02",
      "UI: CollectPaymentModal + receipt print/share; Razorpay payment link/QR path for reception channel (webhook → S2 or tagged S3-online per policy)",
      "New", "NEW", "Reception", "REC-03",
      "Web SPA", Y, N, N, Y, Y, "P0", "M", "REC-03.01, GST-02.02",
      "§13.3",
      "None",
      "Reception collection under 30 seconds (NFR recommended)",
      "Receipt issued; Account sees row in clinic collections", "")

    T(ph, pn, "2.4", "REC-03",
      "Collect per-consult payment at reception (S3) — cash/UPI/card/pay-link; still ledgered (SC-03)",
      "REC-03.03",
      "Edge: reception marks cash paid while online payment in flight; amount at booking prevails if fee changed",
      "New", "NEW", "Payments", "REC-03, §12.2 Edge Cases",
      ".NET 8", N, Y, Y, Y, Y, "P1", "S", "REC-03.01, GST-02.02",
      "§12.2 Edge Cases",
      "None",
      "Concurrency and amount-mismatch → exception, never auto-accept",
      "Amount-mismatch and double-pay raise exceptions", "")

    # DOC-19 subscription complete
    T(ph, pn, "2.5", "DOC-19",
      "Doctor buy/renew package 70% → 100% — webhook, failure UX, invoice, S1 ledger (do not use as consult money)",
      "DOC-19.01",
      "Extend SaveUpdateSubscription to write S1 LedgerEntry; failure handling UX in Widgets.js; separate consult checkout from subscription checkout",
      "Existing Improvement", "P-ENH", "Payments", "DOC-19, F-02, C-3",
      "SPA + .NET 8", Y, Y, Y, Y, Y, "P0", "M", "PLT-10.03, GST-02.02, FIN-01.02",
      "§5.3, §7.5, §13.1 Widgets.js",
      "Checkout works; no webhook, signature, refund, invoice, GST, ledger",
      "Port complete; S1 ledger; invoice",
      "PackageEntryDetail contains no consult or medicine rows", "")

    # ADM-02 / FIN-04 recon
    T(ph, pn, "2.6", "ADM-02",
      "Consult booking & payment reconciliation dashboard (Admin + Account mirror)",
      "ADM-02.01",
      "GET /api/Payments/Admin/Reconciliation — join booking ↔ payment ↔ appointment; KPI cards; CSV export (async if large)",
      "New", "NEW", "Payments", "ADM-02, FIN-04, F-03",
      "Admin + Account", Y, Y, Y, Y, Y, "P0", "M", "GST-02.02, FIN-01.03",
      "§12.3, §13.2",
      "None",
      "Three independent facts compared; disagreement → exception automatically",
      "Reconciliation totals match the ledger for any selected period; CSV matches on-screen grid", "")

    T(ph, pn, "2.6", "ADM-02",
      "Consult booking & payment reconciliation dashboard (Admin + Account mirror)",
      "ADM-02.02",
      "Screens: /admin/consult-payments and /account/consult-recon (same data; Account has money-movement actions)",
      "New", "NEW", "Payments", "ADM-02, FIN-04",
      "Web SPA", Y, N, N, Y, N, "P0", "M", "ADM-02.01, PLT-05",
      "§12.3, §12.4",
      "None",
      "Separation of duties",
      "Admin can investigate; cannot approve payouts", "")

    # ADM-03 exceptions
    T(ph, pn, "2.7", "ADM-03",
      "Payment exception / failed payment queue — never silent (shared Admin + Account)",
      "ADM-03.01",
      "DB PaymentException state machine Open → Investigating → Resolved | WrittenOff; kinds: Failed, Partial, Webhook-mismatch, Orphan-payment, Amount-mismatch, Refund-pending, COD-unremitted",
      "New", "NEW", "Payments", "ADM-03, FIN-06, F-03, SC-03",
      "DB + API", N, Y, Y, Y, Y, "P0", "M", "GST-02.02",
      "§12.2, §12.3",
      "Failures invisible",
      "Mandatory resolution note; OTP for financial impact; no bulk-close without reasons",
      "Every failed gateway event appears automatically; cannot close without note; financial closure needs OTP", "")

    T(ph, pn, "2.7", "ADM-03",
      "Payment exception / failed payment queue — never silent (shared Admin + Account)",
      "ADM-03.02",
      "UI /admin/payment-exceptions and /account/exceptions — detail drawer, Resolve/Retry; GET/POST Exceptions APIs",
      "New", "NEW", "Payments", "ADM-03, FIN-06",
      "Web SPA", Y, Y, Y, Y, N, "P0", "M", "ADM-03.01, PLT-11.02",
      "§12.3, §13.2",
      "None",
      "Account resolves with financial effect; Admin retry/investigate",
      "No failed payment is silent", "")

    T(ph, pn, "2.7", "ADM-03",
      "Payment exception / failed payment queue — never silent (shared Admin + Account)",
      "ADM-03.03",
      "Background worker: payment reconciliation sweep — poll PaymentOrder stuck in Created; gateway payments with no local order → Webhook-mismatch / Orphan-payment",
      "New", "NEW", "Payments", "F-02, §14.3",
      ".NET 8 worker", N, Y, Y, Y, Y, "P0", "M", "GST-02.02",
      "§11.1, §14.3",
      "If browser closes between pay and callback, no independent record",
      "Reconciliation job is the safety net",
      "Stuck Created orders surface within polling interval", "")

    # FIN-02 settlements
    T(ph, pn, "2.8", "FIN-02",
      "Settlement runs for doctors and pharmacies (T+N hold; config not code)",
      "FIN-02.01",
      "DB SettlementRun + Payout; job aggregates eligible paid entries older than SettlementHoldDays, nets commission and GST, produces payout instructions",
      "New", "NEW", "Finance", "FIN-02, F-02, S7",
      ".NET 8 worker + DB", N, Y, Y, Y, Y, "P0", "L", "FIN-01.02, PRE-01.01, PRE-01.03, FIN-09",
      "§12.2, §14.3",
      "Doctors/pharmacies cannot be paid out by the platform",
      "Hold window; excludes unsettled exceptions",
      "Settlement run spanning GST rate change uses captured (stored) tax, not current config", "")

    T(ph, pn, "2.8", "FIN-02",
      "Settlement runs for doctors and pharmacies (T+N hold; config not code)",
      "FIN-02.02",
      "UI /account/settlements — cycles, payees, gross, commission, GST, hold, net",
      "New", "NEW", "Finance", "FIN-02, F-04",
      "Account console", Y, Y, Y, Y, N, "P0", "M", "FIN-02.01",
      "§12.4",
      "None",
      "Account operating screen",
      "Account can prepare a settlement cycle", "")

    # FIN-03 payout OTP
    T(ph, pn, "2.9", "FIN-03",
      "Payout approval under OTP dual control — Admin cannot approve (SC-04)",
      "FIN-03.01",
      "POST /api/Settlements/{id}/ApprovePayout — OTP to Account user's registered number; OtpAuditLog; payout dispatch worker; failed bank file → exception, ledger unchanged",
      "New", "NEW", "Finance", "FIN-03, AD-6, SC-04, S7",
      "Account + worker + bank rail", Y, Y, Y, Y, Y, "P0", "L", "FIN-02.01, PLT-11.02, PRE-04.01, FIN-09",
      "§12.2, §12.4, §17 Bank/payout",
      "None",
      "No payout leaves without OTP-approved settlement and complete payee KYC",
      "Every payout carries an OTP audit reference; Admin cannot approve", "")

    T(ph, pn, "2.9", "FIN-03",
      "Payout approval under OTP dual control — Admin cannot approve (SC-04)",
      "FIN-03.02",
      "UI /account/payouts + OtpConfirmDialog component",
      "New", "NEW", "Finance", "FIN-03, §13.3",
      "Account console", Y, N, N, Y, N, "P0", "S", "FIN-03.01",
      "§13.2, §13.3",
      "None",
      "Dual control UX",
      "Payout status tracking visible", "")

    # FIN-07 refunds
    T(ph, pn, "2.10", "FIN-07",
      "Refund processing — reversing ledger entries + gateway refund; never edit financial rows",
      "FIN-07.01",
      "POST /api/Refunds; Refund entity; refund ≤ captured minus prior refunds; Refund-pending exception if gateway fails; worker retry; chargeback path",
      "New", "NEW", "Finance", "FIN-07, S6, OQ-A6",
      ".NET 8 + gateway", Y, Y, Y, Y, Y, "P1", "M", "GST-02.02, PRE-01.06, ADM-03.01",
      "§12.2, §17",
      "No refund path anywhere",
      "Reversing entries only; adjust pending settlement",
      "Cancelling a paid consult triggers configured refund path", "")

    T(ph, pn, "2.10", "FIN-07",
      "Refund processing — reversing ledger entries + gateway refund; never edit financial rows",
      "FIN-07.02",
      "UI /account/refunds; patient payment-failure and refund notifications",
      "New", "NEW", "Finance", "FIN-07, PAT-M9",
      "Account + later patient app", Y, Y, Y, Y, Y, "P1", "S", "FIN-07.01",
      "§12.4, §12.2 Notifications",
      "None",
      "Patient notified of refund",
      "Refunds visible to Account and patient (when app exists)", "")

    # FIN-08 GST
    T(ph, pn, "2.11", "FIN-08",
      "GST / invoice export — new Invoice entity and numbering series (Proposed; needs OQ-A3)",
      "FIN-08.01",
      "Invoice numbering + GST config + export at /account/tax; SMTP invoices without passwords",
      "New", "NEW, CLR", "Finance", "FIN-08, OQ-A3",
      "Account console", Y, Y, Y, Y, Y, "P1", "M", "FIN-01.02, PRE-01.03",
      "§12.2, §12.4, §7.3",
      "No invoice entity exists",
      "Tax artefacts for CA/GST",
      "GST report exportable; invoice numbers unique", "")

    # FIN-09 KYC
    T(ph, pn, "2.12", "FIN-09",
      "Doctor and pharmacy payee KYC (bank/PAN) — payout eligibility",
      "FIN-09.01",
      "Payee KYC fields on Doctor (and later PharmacyPartner); /account/payees; doctor may practise if approved but cannot be paid out until KYC complete",
      "New", "NEW", "Finance", "FIN-09, ADM-01, F-02",
      "Account + Doctor profile", Y, Y, Y, Y, N, "P1", "M", "PLT-04.03, PLT-09.01",
      "§12.1, §12.4",
      "Doctor has some registration data; no bank/PAN capture",
      "KYC required before payout",
      "Incomplete KYC blocks payout not clinic-facing practice (per OQ-A5 split)", "")

    # FIN-10 clinic collections
    T(ph, pn, "2.13", "FIN-10",
      "Clinic cash/UPI collection view (reception mix vs online)",
      "FIN-10.01",
      "UI /account/clinic-collections over S3 ledger rows vs online mix",
      "New", "NEW", "Finance", "FIN-10, REC-03",
      "Account console", Y, Y, N, Y, N, "P1", "S", "REC-03.01, FIN-01.03",
      "§7.3, §12.4",
      "Reception cash invisible",
      "View over S3",
      "Cash vs online mix visible for any period", "")

    # FIN-05 placeholder view (medicine volume in Phase 7)
    T(ph, pn, "2.14", "FIN-05",
      "Medicine ledger view skeleton (S5 partition) — full volume in Phase 7; must stay separate from consult GMV",
      "FIN-05.01",
      "GET /api/Ledger/Medicine and /account/medicine-ledger empty-capable view (AD-5) so consult and medicine are never mixed in totals",
      "New", "NEW, DEP(PHR)", "Finance", "FIN-05, AD-5, PHR-08",
      "Account console", Y, Y, Y, Y, N, "P3", "S", "FIN-01.03",
      "§7.3, §12.4, §26 trap",
      "None",
      "Separate ledger view for S5 even before HomeoMeds orders exist",
      "Medicine money reportable without consult money in the same total", "")

    # Doctor dashboard payment bits
    T(ph, pn, "2.15", "DOC-16",
      "Doctor home dashboard 70% → 100% — payment badges and follow-up due (online toggle/tele queue are Phase 5)",
      "DOC-16.01",
      "Extend Widgets.js (~3.5k) with payment badges and follow-up-due; keep online toggle/tele queue for Phase 5; do not mix subscription checkout with consult checkout",
      "Existing Improvement", "P-ENH", "Dashboard", "DOC-16, DOC-14, DOC-03",
      "Web SPA", Y, Y, N, Y, N, "P1", "M", "GST-02.04, DOC-30.01",
      "§7.5, §13.1, §12.15",
      "Counts, lists, charts, WhatsApp, subscription days exist",
      "Payment badges + follow-up due now; tele later",
      "Doctor sees payment state without leaving the dashboard", "")

    # Earnings API for later mobile
    T(ph, pn, "2.16", "DOCM-10",
      "GET /api/Earnings/Summary — doctor earnings today/week/month and payout status (web now; mobile Phase 6)",
      "DOCM-10.01",
      "Earnings summary API used by web (and later doctor app)",
      "New", "NEW", "Finance", "DOCM-10, F-02",
      ".NET 8", Y, Y, Y, Y, N, "P2", "S", "FIN-01.02, FIN-02.01",
      "§12.2 API list, §7.8",
      "None",
      "Doctor sees own earnings only",
      "Doctor cannot see another doctor's earnings", "")

    # Permissions matrix money
    T(ph, pn, "2.17", "SC-04",
      "Enforce Account vs Admin separation of duties on all money APIs (permission matrix tests)",
      "SC-04.01",
      "Account: full money ops; Admin: read + operational retry, NO payout approval; Doctor: own earnings; Reception: collect for own doctor; Patient: own payments — encode in tests",
      "New", "NEW", "Finance / QA", "SC-04, F-04, §20.1",
      "QA + API", Y, Y, N, Y, N, "P0", "M", "PLT-05.05, FIN-03.01",
      "§12.4 Permissions Matrix, §28 SC-04",
      "No finance role",
      "Account settles; Admin cannot; Account cannot edit repertory",
      "Matrix fully passed for money endpoints", "")

    # Notifications money
    T(ph, pn, "2.18", "FIN-N1",
      "Money event notifications — patient success/failure/refund; doctor payment received & payout; Account exception & settlement ready; Admin daily recon summary (Proposed)",
      "FIN-N1.01",
      "Wire notification dispatcher to payment events (SMS when DOC-05 live; email/WhatsApp meanwhile)",
      "New", "NEW", "Notifications", "F-02 Notifications, §10.3",
      "Worker", N, Y, Y, Y, Y, "P1", "S", "GST-02.02, ADM-03.01",
      "§12.2, §10.3",
      "No consult money events",
      "Fan-out table contract",
      "Failed payments alert Account; patients get receipts", "")


def add_phase3(T):
    ph, pn = "3", "Phase 3 — Patient access (booking, credentialing, legal, SMS, tickets)"

    # ADM-01 credentialing
    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.01",
      "DB: DoctorVerification, DoctorCredentialDocument; Doctor.PracticeLocked + denormalised VerificationStatus; indexes Status,SubmittedAt",
      "New", "NEW", "Business Mgmt", "ADM-01, F-01",
      "DB", N, Y, Y, N, N, "P1", "M", "PLT-08.02, PRE-01.05",
      "§12.1, §16.2",
      "Registration captures university, cert, qualification; auto-activates",
      "Approval is the only transition that unlocks practice",
      "Unverified doctor cannot appear in public directory or take paid consults", "")

    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.02",
      "APIs: Queue, Detail, Approve, Reject (reason required), RequestInfo, Documents multipart, MyStatus; modify RegisterDoctor to NOT auto-activate",
      "Existing Modification", "E-MOD", "Auth / Business Mgmt", "ADM-01, GST-07",
      ".NET 8", Y, Y, Y, Y, Y, "P1", "M", "ADM-01.01, PLT-05.03",
      "§12.1, §15.2",
      "POST /users/RegisterDoctor activates immediately",
      "VerificationStatus=Pending; PracticeLocked=true; optimistic concurrency on Version",
      "Rejection without reason refused by API; documents never on guessable URL", "")

    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.03",
      "Admin UI: /admin/doctor-credentialing queue (Pending/Approved/Rejected/Needs Info, SLA flag) + detail (identity, credentials, signed-URL document viewer, history, actions)",
      "New", "NEW", "Admin", "ADM-01, §13.2",
      "Web SPA", Y, N, N, Y, N, "P1", "M", "ADM-01.02, PLT-09.02",
      "§12.1 UI Changes",
      "None",
      "New screens under Business Management menu",
      "Admin can approve/reject/request-info each producing notification + audit", "")

    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.04",
      "Modify /register for document upload + pending-verification message; doctor profile Credentials tab; users list Verification column + link (overlaps ADM-06)",
      "Existing Modification", "E-MOD", "Auth", "GST-07, ADM-06, DOC-15",
      "Web SPA", Y, N, N, Y, N, "P1", "M", "ADM-01.02",
      "§12.1, §13.1 Register.js",
      "Self-registration 90%; no document upload; no gate",
      "Multipart docs; practice lock",
      "Users list shows verification without opening detail", "")

    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.05",
      "MIG: backfill existing active doctors per OQ-A5; scheduled re-verification prompt for expiring registration documents (Proposed); notify doctor on Approve/Reject/NeedsInfo",
      "Data Migration", "MIG", "Credentialing", "ADM-01, OQ-A5, R-9",
      "DB + notify", N, Y, Y, Y, Y, "P1", "S", "PRE-01.05, ADM-01.02, DOC-05",
      "§12.1, §16.5",
      "Live paying doctors would be locked out if defaulted to Pending",
      "Client-confirmed backfill",
      "Live practices not accidentally locked; SLA digest for Pending (Proposed)", "")

    T(ph, pn, "3.1", "ADM-01",
      "Doctor credentialing / verification review queue — practice lock until Approved",
      "ADM-01.06",
      "Edge cases: mid-review account delete; duplicate certificate number; document expires after approval; approved but incomplete bank KYC; rejected doctor re-registers with different email",
      "New", "NEW", "Credentialing", "ADM-01 Edge Cases",
      ".NET 8", N, Y, Y, Y, N, "P2", "S", "ADM-01.02",
      "§12.1 Edge Cases",
      "None",
      "Specified edges",
      "QA covers listed edges", "")

    # GST-08 activation
    T(ph, pn, "3.2", "GST-08",
      "Activation link — expiry, resend, aligned with credentialing (90% → modification)",
      "GST-08.01",
      "Token expiry + resend + status page; do not treat email activation as practice approval",
      "Existing Modification", "E-MOD", "Auth", "GST-08, ADM-01",
      "SPA + API", Y, Y, Y, Y, Y, "P2", "S", "ADM-01.02, PLT-02",
      "§7.4, §12.1",
      "ActivateUser exists; no expiry/resend; not aligned to credentialing",
      "Activation ≠ verification approve",
      "Expired links can be resent; practice still Pending until Admin approve", "")

    # GST-01 booking
    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.01",
      "Patient identity: PatientAuth RequestOtp/VerifyOtp; PatientAuthOtp or shared OtpChallenge; throttle + lockout; Patient self-registered + mobile-verified flags",
      "New", "NEW", "Booking / Identity", "GST-01, PAT-M1, PLT-11.02",
      "Public web + API", Y, Y, Y, Y, Y, "P1", "M", "PLT-11.02, PRE-04.02, PLT-12.02, ADM-01.02",
      "§12.5, §11.1",
      "Staff-only appointment creation; slot APIs exist",
      "Mobile number is identity key; existing Patient linked not duplicated",
      "OTP brute force throttled and locked out", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.02",
      "Public directory: GET /api/PublicBooking/Doctors and /Doctors/{id}/Profile — verified + bookable only; fee, badge, ranking explanation (OQ-B4)",
      "New", "NEW", "Booking", "GST-01, PAT-M2, ADM-01, OQ-B4",
      "Public web", Y, Y, Y, Y, N, "P1", "M", "ADM-01.01, GST-09.01, PRE-02.04",
      "§12.5, §15.2",
      "No public funnel",
      "Rate-limited anonymous; cannot enumerate patients",
      "Only Approved doctors returned", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.03",
      "Slots: GET /api/PublicBooking/Doctors/{id}/Slots wraps existing GetDailySchedule + GetAppointmentSlots — booked/cancelled/blocked excluded; do not reimplement slot math",
      "New", "NEW", "Booking", "GST-01, DOC-17",
      ".NET 8", Y, Y, N, Y, N, "P1", "S", "DOC-17.01, DOC-02.01",
      "§12.5, §11.1",
      "Slot grid exists for staff",
      "Reuse existing logic",
      "Public slots respect saved schedule; cancelled slots freed", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.04",
      "POST /api/PublicBooking/Create — upsert Patient, create PatientAppointment with PaymentStatus, ConsultMode, VisitType, channel; concurrency check; idempotency key; family member optional",
      "New", "NEW", "Booking", "GST-01, PRE-01.04, SC-01",
      ".NET 8", Y, Y, Y, Y, Y, "P1", "L", "GST-01.01, GST-01.03, GST-02.01, DOC-30.01",
      "§12.5, §11.1",
      "SavePatientApp exists for staff",
      "PAY_AT_CLINIC vs hold UNPAID until capture per OQ-A4",
      "Guest completes booking with no staff login; appointment indistinguishable apart from channel/payment fields", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.05",
      "UI BookingWizard: /book, /book/:id, /book/:id/slots, /book/confirm, /book/pay/:bookingId, success/failure — mobile-first; consent; 409 alternatives",
      "New", "NEW", "Public web", "GST-01, GST-02, §13.2, §13.4",
      "Web SPA public", Y, N, N, Y, Y, "P1", "L", "GST-01.04, GST-02.02",
      "§13.2, §13.4, §19.2 Usability",
      "Marketing landing 50%",
      "Public booking completable in under two minutes (recommended NFR)",
      "End-to-end guest booking; payment failures never generic errors", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.06",
      "Waitlist POST /api/PublicBooking/Waitlist + worker offers freed slots on cancellation; InstantConsult API stub routing to online doctors (full tele in Phase 5)",
      "New", "NEW", "Booking", "GST-01, PAT-M3, DOC-09",
      ".NET 8", Y, Y, Y, Y, Y, "P2", "M", "GST-01.04, DOC-02.04",
      "§11.1 alternatives, §14.3",
      "None",
      "Waitlist + instant consult request",
      "Double-booking fails cleanly for second patient", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.07",
      "FamilyMember + CaregiverAuth + ConsentRecord entities; booking for dependant; consent text version + timestamp audited",
      "New", "NEW", "Patient ecosystem", "GST-01, PAT-M1, §16.2",
      "DB + API + UI", Y, Y, Y, Y, N, "P2", "M", "GST-01.01",
      "§12.5 Fields, §16.2",
      "No family/caregiver model",
      "Optional FamilyMemberId must belong to account",
      "Consent captured; no duplicate patients via mobile merge key (merge tool Proposed)", "")

    T(ph, pn, "3.3", "GST-01",
      "Patient-facing self-service booking funnel (web) — same appointment record the clinic already uses",
      "GST-01.08",
      "Patient-side reschedule/cancel on web (same APIs as DOC-01/02) subject to cancellation window",
      "New", "NEW", "Booking", "GST-01, DOC-01, DOC-02, PAT-M3",
      "Public/patient web", Y, Y, N, Y, Y, "P1", "S", "DOC-01.02, DOC-02.02, GST-01.04",
      "§12.6 Permissions",
      "Staff only",
      "Patient own appointments only",
      "All three roles can reschedule/cancel through the same API", "")

    # GST-03 home
    T(ph, pn, "3.4", "GST-03",
      "Product home 50% → 100% — booking CTAs, verified-doctor trust, app store links",
      "GST-03.01",
      "Landing content: booking CTAs, trust content, deep links, app badges (app may still be forthcoming)",
      "Existing Improvement", "P-ENH", "Marketing", "GST-03",
      "Public web", Y, N, N, N, N, "P2", "S", "GST-01.05, ADM-01",
      "§7.4, §12.15, §13.1",
      "Landing exists",
      "No booking CTA or trust content",
      "Home drives verified booking", "")

    # GST-04 contact
    T(ph, pn, "3.5", "GST-04",
      "Contact / enquiry 50% → 100% — confirmation, SLA; optional spawn ticket (enquiry is NOT the ticket system)",
      "GST-04.01",
      "Confirmation UX after contact form; optional ticket spawn; EnquiryDetail.TicketId later",
      "Existing Improvement", "P-ENH", "Marketing", "GST-04, ADM-04, C-7",
      "Public web + API", Y, Y, Y, Y, N, "P3", "S", "—",
      "§7.4, §12.12, C-7",
      "Form + EnquiryDetail API exist",
      "No confirmation/SLA/inbox",
      "User sees confirmation; enquiry may spawn ticket but is not a ticket", "")

    T(ph, pn, "3.6", "ADM-07",
      "Enquiry inbox screen for existing EnquiryDetail API (frontend only)",
      "ADM-07.01",
      "Admin list/detail page for enquiries (not Velzon tickets)",
      "New", "NEW (FE)", "CMS", "ADM-07, GST-04",
      "Web SPA Admin", Y, N, N, N, N, "P3", "S", "GST-04.01",
      "§7.2, §9.2",
      "EnquiryDetail API exists (classic); no admin screen",
      "Admin inbox",
      "Admin can read enquiries without using demo ticket pages", "")

    # Legal
    T(ph, pn, "3.7", "GST-05",
      "Privacy policy rewrite — DPDP, recording, pharmacy consent, data rights (counsel sign-off before patient go-live)",
      "GST-05.01",
      "Legal content rewrite on existing privacy page",
      "Existing Improvement", "P-ENH, DEP(legal)", "Legal", "GST-05, PAT-M9, OQ-C2",
      "Public web", Y, N, N, N, N, "P1", "S", "PRE-04.04",
      "§7.4, §12.15, §29",
      "Page exists at 50%",
      "Missing DPDP, recording, pharmacy, data rights",
      "Counsel-signed privacy before patient go-live", "")

    T(ph, pn, "3.8", "GST-06",
      "Terms of service rewrite — payments, telemedicine, HomeoMeds, refunds",
      "GST-06.01",
      "Legal content rewrite on existing terms page",
      "Existing Improvement", "P-ENH, DEP(legal)", "Legal", "GST-06",
      "Public web", Y, N, N, N, N, "P1", "S", "PRE-04.04, PRE-01.06",
      "§7.4, §12.15",
      "Page exists at 50%",
      "Missing payments, refunds, telemedicine, HomeoMeds",
      "Counsel-signed terms before patient go-live", "")

    # SMS
    T(ph, pn, "3.9", "DOC-05",
      "SMS outreach — Appointment confirmation, Registration SMS, Doctor Not available + proposed OTP/Reschedule/Cancel/PaymentReceipt/RefillApproved",
      "DOC-05.01",
      "DB SmsTemplate (versioned, DLT template id map) + SmsMessageLog; Patient SMS opt-in/DND; transactional OTP exempt from marketing opt-out",
      "New Integration", "NEW-INT", "Outreach", "DOC-05, F-11",
      ".NET 8", N, Y, Y, Y, Y, "P1", "M", "PRE-04.02, PLT-11.02",
      "§12.11, §16.2",
      "WhatsApp only (50%)",
      "SMS does not replace WhatsApp; parallel channel",
      "Three client-named events send with logs and delivery status", "")

    T(ph, pn, "3.9", "DOC-05",
      "SMS outreach — Appointment confirmation, Registration SMS, Doctor Not available + proposed OTP/Reschedule/Cancel/PaymentReceipt/RefillApproved",
      "DOC-05.02",
      "APIs: Templates CRUD, Send, History, Events/{eventKey}/Test; async queue with retry, DLR capture, dead-letter (mirror WhatsApp bulk-queue pattern)",
      "New Integration", "NEW-INT", "Outreach", "DOC-05, §14.3",
      ".NET 8 worker", Y, Y, Y, Y, Y, "P1", "M", "DOC-05.01",
      "§12.11, §17",
      "No SMS provider",
      "OTP failure rate alerting",
      "Every message traceable to a triggering entity; opt-out suppresses marketing not OTP", "")

    T(ph, pn, "3.9", "DOC-05",
      "SMS outreach — Appointment confirmation, Registration SMS, Doctor Not available + proposed OTP/Reschedule/Cancel/PaymentReceipt/RefillApproved",
      "DOC-05.03",
      "Doctor UI /doctor/sms — templates, test send, history; wire event hooks for booking/reschedule/cancel/registration/doctor-unavailable",
      "New Integration", "NEW-INT", "Outreach", "DOC-05, §13.2",
      "Web SPA", Y, N, N, Y, Y, "P1", "S", "DOC-05.02",
      "§13.2",
      "None",
      "Doctor can configure/test templates",
      "Named events send in UAT", "")

    # WhatsApp 50%
    T(ph, pn, "3.10", "DOC-20",
      "WhatsApp outreach 50% → 100% — bulk campaign UX, template governance, failure list, opt-out (do not treat as SMS done)",
      "DOC-20.01",
      "Finish bulk campaign UX, template approval states, downloadable failure list, opt-out flag; existing /WhatsApp/*",
      "Existing Improvement", "P-ENH", "Outreach", "DOC-20, §26 trap",
      "SPA + .NET 8", Y, Y, Y, Y, Y, "P2", "M", "—",
      "§7.5, §12.15, §13.1",
      "Send, templates, campaigns, bulk queue exist",
      "Bulk UX, governance, failure list, opt-out incomplete",
      "A bulk campaign completes with a downloadable failure list", "")

    # Support tickets
    T(ph, pn, "3.11", "ADM-04",
      "Support ticket / issue queue — do NOT use EnquiryDetail or Velzon demo tickets as the ticket system",
      "ADM-04.01",
      "DB SupportTicket, Message, Attachment; EnquiryDetail optional TicketId; statuses Open→InProgress→Resolved→Closed with reopen; SLA timestamps; optional link to appointment/payment/order",
      "New", "NEW", "Support", "ADM-04, PAT-M10, F-12, C-7",
      "DB", N, Y, Y, N, N, "P2", "M", "PLT-09.02",
      "§12.12, §16.2",
      "Marketing EnquiryDetail only; Velzon demo tickets",
      "Real workflow, thread, SLA, assignment",
      "No product ticket flow routes through Velzon demo pages", "")

    T(ph, pn, "3.11", "ADM-04",
      "Support ticket / issue queue — do NOT use EnquiryDetail or Velzon demo tickets as the ticket system",
      "ADM-04.02",
      "APIs SupportTicket list/create, thread, Messages, Status, Assign; role-filtered",
      "New", "NEW", "Support", "ADM-04",
      ".NET 8", Y, Y, Y, Y, N, "P2", "M", "ADM-04.01, PLT-05.03",
      "§12.12",
      "None",
      "Doctor or patient can raise; admin queue",
      "Reporter sees thread; SLA visible", "")

    T(ph, pn, "3.11", "ADM-04",
      "Support ticket / issue queue — do NOT use EnquiryDetail or Velzon demo tickets as the ticket system",
      "ADM-04.03",
      "Admin UI list+detail + TicketThread component; doctor/patient raise entry points (web; mobile in Phase 6)",
      "New", "NEW", "Support", "ADM-04, §13.3",
      "Web SPA", Y, N, N, Y, N, "P2", "M", "ADM-04.02",
      "§13.2",
      "None",
      "Tickets linkable to appointment/payment/order",
      "Doctor and patient issues reach admin queue with thread and SLA", "")

    # Cache proposed
    T(ph, pn, "3.12", "PLT-14",
      "Proposed cache for directory and slot reads before public launch (R-13)",
      "PLT-14.01",
      "Cache slots and directory; load-test booking slot computation under concurrency before launch",
      "New", "NEW", "Platform", "R-13, §10.1 CACHE, §19.2",
      ".NET 8", N, Y, N, Y, N, "P2", "M", "GST-01.03",
      "§19.2, §22 R-13, §14.5",
      "No public read paths",
      "Slots under 1s including schedule computation (recommended)",
      "Load test recorded; rate limit in place", "")


def add_phase4(T):
    ph, pn = "4", "Phase 4 — Clinical differentiation"

    T(ph, pn, "4.0", "PLT-13",
      "Confirm Patient Board sub-panels extracted before landing potency, notes split, COG, export polish",
      "PLT-13.04",
      "Gate Phase 4 clinical UI on completed PatientBoard.js extraction (Repertorize, Prescription, Notes, History)",
      "Existing Improvement", "P-ENH", "Patient Board", "R-5",
      "Web SPA", Y, N, N, N, N, "P1", "S", "PLT-13.02",
      "§13.3, §21.3",
      "13.5k-line file",
      "Four concurrent changes in one file is largest avoidable risk",
      "Features land in extracted components", "")

    # Potency
    T(ph, pn, "4.1", "DOC-07",
      "Potency module — structured master-driven potency; blank potency rejected by API",
      "DOC-07.01",
      "DB PotencyMaster (Code, Label, Scale, SortOrder, IsActive); PrescriptionRemedyDetail.PotencyId nullable historically, required for new writes; optional Frequency, Duration; no back-fill of PotencyId",
      "New", "NEW", "Patient Board", "DOC-07, F-07, OQ-B2",
      "DB", N, Y, Y, N, N, "P1", "S", "PLT-13.04, PRE-02.02",
      "§12.7, §16.5",
      "Dose saved as empty free-text",
      "Master-driven so scales extend without a release; Dose retained for display compatibility",
      "Historical prescriptions still render; reporting treats historical as unstructured", "")

    T(ph, pn, "4.1", "DOC-07",
      "Potency module — structured master-driven potency; blank potency rejected by API",
      "DOC-07.02",
      "Admin CRUD /api/PotencyMaster; GET list for doctor dropdown; extend classic SavePrescriptionDetail with potencyId (port Rx save to .NET 8 on dated plan — AD-2)",
      "New", "NEW", "Clinical master", "DOC-07, DOC-22, AD-2",
      "Admin + Doctor + classic/new API", Y, Y, Y, Y, N, "P1", "M", "DOC-07.01, PLT-10.01",
      "§12.7, §14.1",
      "SavePrescriptionDetail on classic",
      "API rejects missing potency, not only UI",
      "Prescription cannot be saved with blank potency via UI or API", "")

    T(ph, pn, "4.1", "DOC-07",
      "Potency module — structured master-driven potency; blank potency rejected by API",
      "DOC-07.03",
      "UI PotencySelect on prescription remedy rows; no duplicate remedy+identical potency in one Rx",
      "New", "NEW", "Patient Board", "DOC-07, §13.3",
      "Web SPA", Y, N, N, Y, N, "P1", "S", "DOC-07.02",
      "§13.3",
      "Empty Dose",
      "Required picker",
      "Saved potency identical on eRx, patient view (after disclosure) and pharmacy order", "")

    # Notes vs eRx
    T(ph, pn, "4.2", "DOC-08",
      "Visit notes distinct from prescription (eRx) + immutable signed snapshot; code-then-name at read time",
      "DOC-08.01",
      "DB: AppointmentHistoryNote.NoteType + IsErxExcluded; ErxSnapshot, ErxSnapshotItem; MIG existing notes General + IsErxExcluded=true so historical narrative never appears on new eRx",
      "New", "NEW", "Patient Board", "DOC-08, DOC-22, F-08, R-9",
      "DB", N, Y, Y, N, N, "P1", "M", "DOC-07.01",
      "§12.8, §16.5",
      "AppointmentHistoryNote inside Rx modal; notes and Rx conflated",
      "Snapshot never edited; correction = new version with supersede link",
      "Visit notes never appear on eRx print or pharmacy payload", "")

    T(ph, pn, "4.2", "DOC-08",
      "Visit notes distinct from prescription (eRx) + immutable signed snapshot; code-then-name at read time",
      "DOC-08.02",
      "Extend SaveUpdateAppointmentHistoryNote with noteType, isErxExcluded; GET /api/Erx/ByAppointment (codes only for patients until pharmacy acceptance); /api/Erx/Export PDF; attempt to modify signed snapshot → 409",
      "Existing Improvement", "P-ENH", "eRx", "DOC-08, DOC-22, PHR-10, PRE-02.01, PRE-02.05",
      ".NET 8 + classic notes API", Y, Y, Y, Y, N, "P1", "M", "DOC-08.01, PRE-02.01, PRE-02.05",
      "§12.8, §15.2",
      "SavePrescriptionDetail 80%; empty dose accepted; no snapshot",
      "Disclosure driven by one server-side flag, never client hiding",
      "Signed eRx immutable; patient requesting another's eRx → 403 + audit", "")

    T(ph, pn, "4.2", "DOC-08",
      "Visit notes distinct from prescription (eRx) + immutable signed snapshot; code-then-name at read time",
      "DOC-08.03",
      "UI: VisitNotesPanel extracted outside Rx modal (Chief complaint / Follow-up / General); Rx modal = eRx only (remedies+potency + labs); print/export excludes notes",
      "New", "NEW", "Patient Board", "DOC-08, §13.3",
      "Web SPA", Y, N, N, Y, N, "P1", "M", "DOC-08.02, PLT-13.04",
      "§12.8 UI, §26 trap",
      "Notes tab inside Rx modal",
      "Do not treat notes-in-modal as the split",
      "Notes editable outside Rx modal and never on eRx", "")

    T(ph, pn, "4.2", "DOC-08",
      "Visit notes distinct from prescription (eRx) + immutable signed snapshot; code-then-name at read time",
      "DOC-08.04",
      "Port prescription save and history notes writes to .NET 8 (dated plan) so classic is not on the eRx critical path",
      "Existing Modification", "E-MOD", "eRx", "AD-2, R-3, DOC-22",
      ".NET 8", N, Y, Y, Y, N, "P1", "L", "DOC-08.02, PLT-10.01",
      "§14.1, §2.4",
      "Classic write path for Rx and notes",
      "EOL API behind public/pharmacy perimeter is unacceptable long-term",
      "New eRx writes on .NET 8", "")

    # DOC-22 remaining validation
    T(ph, pn, "4.3", "DOC-22",
      "Save prescription remedies 80% → 100% — no empty dose, signed snapshot (completes with DOC-07/08)",
      "DOC-22.01",
      "Validation: at least one remedy before signing; potency present; labs remain on eRx; feature-flag each addition",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-22, DOC-07, DOC-08",
      "SPA + API", Y, Y, Y, Y, N, "P1", "S", "DOC-07.02, DOC-08.02",
      "§7.5, §12.8",
      "Classic SavePrescriptionDetail works",
      "Empty dose accepted today",
      "Signed snapshot immutable; labs still orderable", "")

    # COG
    T(ph, pn, "4.4", "DOC-06",
      "Repertorization → Center of Gravity module (additive, not a replacement) — GATED on OQ-B3",
      "DOC-06.01",
      "Implement COG only after client-signed algorithm; POST /api/Repertorization/CenterOfGravity; deterministic, explainable, does not mutate clipboard; reuse rubric-details cache",
      "New", "NEW, CLR", "Patient Board", "DOC-06, F-09, OQ-B3, A-5",
      ".NET 8 + SPA", Y, Y, N, Y, N, "P2", "L", "PRE-02.03, DOC-27.01, PLT-13.04",
      "§12.9, §21.4",
      "Common/uncommon + elimination + differential MM exist",
      "Algorithm not defined in any provided document — do not speculate",
      "COG reproducible; every ranked remedy exposes contributing rubrics; classic elimination unchanged", "")

    T(ph, pn, "4.4", "DOC-06",
      "Repertorization → Center of Gravity module (additive, not a replacement) — GATED on OQ-B3",
      "DOC-06.02",
      "UI CenterOfGravityPanel + explainability drawer consistent with audio-rubric explainability; toggle vs classic elimination",
      "New", "NEW", "Patient Board", "DOC-06, §13.3",
      "Web SPA", Y, N, N, Y, N, "P2", "M", "DOC-06.01",
      "§12.9 UI",
      "Repertorize tab exists",
      "Must not block the tab (NFR); no regression in interaction latency",
      "Matches client-signed definition", "")

    # DOC-27 stability before COG
    T(ph, pn, "4.5", "DOC-27",
      "Repertorization & elimination stability 90% → 100% — harden BEFORE COG",
      "DOC-27.01",
      "Hardening pass on common/uncommon, elimination, differential MM — regression locked",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-27",
      "Web SPA + API", Y, Y, N, N, N, "P2", "S", "PLT-13.01",
      "§7.5, §12.15",
      "Engines exist at 90%",
      "Stability polish before adding COG",
      "No regression; measurable interaction improvements", "")

    T(ph, pn, "4.6", "DOC-28",
      "Materia medica browsing during case 90% → 100% — faster MM head navigation",
      "DOC-28.01",
      "UX polish on MM tab + differential accordion during case",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-28",
      "Web SPA", Y, N, N, N, N, "P3", "S", "PLT-13.04",
      "§7.5, §12.15",
      "MM tab + differential accordion exist",
      "Navigation friction",
      "Faster MM head navigation; no regression", "")

    T(ph, pn, "4.7", "DOC-31",
      "Manage selected rubrics 90% → 100% — confirm delete, intensity edit",
      "DOC-31.01",
      "Clipboard UX: delete confirmation and intensity edit",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-31",
      "Web SPA", Y, N, N, N, N, "P3", "S", "—",
      "§7.5, §12.15",
      "Clipboard management exists",
      "Confirm delete, intensity edit",
      "No accidental rubric loss", "")

    T(ph, pn, "4.8", "DOC-32",
      "Open clinical workspace 90% → 100% — header status strip for payment / tele / eRx",
      "DOC-32.01",
      "Patient Board header status strip (payment, tele, eRx)",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-32, DOC-14",
      "Web SPA", Y, Y, N, Y, N, "P2", "S", "GST-02.04, DOC-08.02",
      "§7.5, §12.15, §13.3",
      "Board opens by patient/case/appointment",
      "No payment/tele/eRx status in header",
      "Doctor sees commercial/clinical status without leaving the board", "")

    # Audio accuracy
    T(ph, pn, "4.9", "DOC-21",
      "Audio case taking rubric-finding accuracy 50% → 100% — follow existing AUDIO_CASE_TAKING_* engine roadmap (docs not in this pack — A-11)",
      "DOC-21.01",
      "Continue multi-engine pipeline, metaphor/alias QA, benchmark-driven acceptance per AUDIO_CASE_TAKING_* documents; do not rebuild Whisper/GPT pipeline",
      "Existing Improvement", "P-ENH", "AI", "DOC-21, A-11",
      ".NET 8 + Admin intelligence", Y, Y, Y, Y, Y, "P2", "L", "—",
      "§7.5, §12.15, §8.3",
      "Record/upload, Whisper, GPT extract, multi-engine suggestions, metaphors/aliases, embeddings, KG, monitoring exist",
      "Accuracy rules in progress; engine docs not supplied with this pack",
      "Benchmark improvement demonstrated against current baseline; polling budget 2.5s / ~8 min retained", "")

    # 3D
    T(ph, pn, "4.10", "DOC-26",
      "3D anatomy viewer completeness 50% → 100% — mesh/hotspot coverage, UX, mobile fallback",
      "DOC-26.01",
      "Complete mesh and hotspot coverage; UX polish; mobile fallback; named body regions resolve to rubric searches",
      "Existing Improvement", "P-ENH", "Anatomy", "DOC-26",
      "SPA + 3D masters", Y, Y, Y, N, N, "P3", "M", "—",
      "§7.5, §12.15",
      "Interactive GLB viewer + hotspot → sub-section search exists",
      "Incomplete coverage",
      "Named body regions resolve to rubric searches", "")

    # Analytics
    T(ph, pn, "4.11", "DOC-03",
      "Follow-up analysis — due/overdue, first→follow-up conversion, adherence; derived from persisted VisitType not inferred at render",
      "DOC-03.01",
      "APIs Analytics/FollowUpDue + FollowUpSummary; page /doctor/follow-up-analysis; reuse ApexCharts / patientStatsChartsHelper; cache if slow",
      "New", "NEW, DEP(DOC-30)", "Analytics", "DOC-03, F-13",
      "Doctor web", Y, Y, Y, Y, N, "P2", "M", "DOC-30.01, DOC-02.01",
      "§12.13, §13.2",
      "Patient stats charts exist; no persisted visit type metrics",
      "Follow-ups due, overdue, conversion, adherence, outcome tags",
      "Due lists derived from persisted visit types; doctor sees only own clinic", "")

    T(ph, pn, "4.12", "DOC-04",
      "Clinic performance analysis — utilisation, no-show, wait, revenue (must reconcile with Account ledger)",
      "DOC-04.01",
      "GET /api/Analytics/ClinicPerformance; page /doctor/clinic-performance; extend GetPatientStatsCharts do not replace; revenue from ledger",
      "New", "NEW, DEP(FIN-01)", "Analytics", "DOC-04, F-13",
      "Doctor web", Y, Y, N, Y, N, "P2", "M", "FIN-01.02, DOC-02.01, DOC-10 (duration later)",
      "§12.13",
      "GetPatientStatsCharts exists",
      "No utilisation/no-show/wait/revenue",
      "Revenue figures reconcile with Account ledger for the same period", "")

    T(ph, pn, "4.13", "DOC-24",
      "View patient back history 70% → 100% — unified timeline: visits, notes, eRx, labs, payments",
      "DOC-24.01",
      "Composite read API + one chronological view per patient",
      "Existing Improvement", "P-ENH", "Patient Board", "DOC-24",
      "SPA + API", Y, Y, N, Y, N, "P2", "M", "DOC-08.02, GST-02.03",
      "§7.5, §12.15",
      "History panel exists",
      "No unified timeline",
      "One chronological view including eRx and payments", "")

    T(ph, pn, "4.14", "ADM-06",
      "Platform users 80% → 100% — wire dead Import/Export; verification column; activate/lock",
      "ADM-06.01",
      "Wire Import/Export buttons on ListUser.js; verification badge; activate/lock control",
      "Existing Improvement", "P-ENH", "Business Mgmt", "ADM-06, ADM-01",
      "Admin SPA", Y, Y, Y, Y, N, "P2", "S", "ADM-01.04",
      "§5.3, §12.15, §13.1",
      "List/Add/Edit live; Import/Export dead; no verification column",
      "Buttons perform real work",
      "Import/Export work; verification visible in list", "")

    # Deep analytics OQ-D1
    T(ph, pn, "4.15", "OQ-D1",
      "Deep Analytics placeholder — deliver in programme or formally defer (client decision)",
      "OQ-D1.01",
      "Either implement Deep Analytics per decision or replace 'coming soon' with explicit deferred messaging so expectations are managed",
      "Client Decision", "CLR", "Analytics", "OQ-D1, §4.10 #12",
      "Doctor web", Y, Y, N, Y, N, "P3", "S", "PRE-03.09",
      "§4.10 #12, §25",
      "Deep Analytics is a coming-soon placeholder",
      "Client expectation management",
      "Placeholder not mistaken for a shipped module", "")


def add_phase5(T):
    ph, pn = "5", "Phase 5 — Telemedicine"

    T(ph, pn, "5.1", "DOC-09",
      "Telemedicine — doctor online/offline availability + heartbeat (vendor-independent)",
      "DOC-09.01",
      "DB TeleAvailability; POST/GET Availability; heartbeat; stale status auto-expires; only Approved doctors may go online",
      "New", "NEW", "Telemedicine", "DOC-09, F-10, R-7",
      ".NET 8 + SPA + later mobile", Y, Y, Y, Y, N, "P2", "M", "ADM-01.02, PRE-01.07",
      "§12.10, §21.4",
      "None",
      "Abstract vendor; build availability independently",
      "Online toggle with liveness; public/doctor status readable", "")

    T(ph, pn, "5.2", "DOC-10",
      "Telemedicine waiting queue (not just E-CONSULT bucket)",
      "DOC-10.01",
      "GET /api/Telemedicine/Queue — waiting patients with wait time, payment status, visit type; call-next; UI TeleQueuePanel; payment gate per OQ-A8",
      "New", "NEW", "Telemedicine", "DOC-10, OQ-A8, REC-07",
      "Doctor web + reception view metadata", Y, Y, Y, Y, N, "P2", "M", "DOC-09.01, GST-02.04, PRE-01.08",
      "§12.10, §7.5",
      "E-CONSULT bucket + WhatsApp stub",
      "Real queue by doctor/online/paid",
      "Patient in waiting room appears with correct payment status", "")

    T(ph, pn, "5.3", "DOC-11",
      "Join video consultation in browser — vendor SDK, room tokens, full-page room (NEW INTEGRATION)",
      "DOC-11.01",
      "Vendor adapter interface; POST Sessions create room; GET session + join tokens; VideoRoom full-page; DeviceCheck; short-lived tokens; silent refresh on expiry",
      "New Integration", "NEW-INT, CLR", "Telemedicine", "DOC-11, PAT-M4, DOCM-08, OQ-A7",
      "SPA + API + vendor", Y, Y, Y, Y, Y, "P2", "XL", "PRE-04.03, DOC-10.01, PRE-01.07",
      "§12.10, §17, §13.3",
      "SweetAlert WhatsApp video stub",
      "Vendor room create failure → retry then audio-only or reschedule + ticket",
      "Both parties join the same room from web (and later mobile)", "")

    T(ph, pn, "5.4", "DOC-12",
      "Rejoin after dropped call while session Active",
      "DOC-12.01",
      "POST Sessions/{id}/Rejoin re-issues token; TeleSessionEvent reconnect audit; refuse after End",
      "New", "NEW", "Telemedicine", "DOC-12",
      ".NET 8 + UI", Y, Y, Y, Y, Y, "P2", "S", "DOC-11.01",
      "§12.10, §11.4",
      "None",
      "Dropped call rejoins without new appointment",
      "Rejoin refused after End; new session required", "")

    T(ph, pn, "5.5", "DOC-13",
      "Capture recording consent before consult — block recording unless stored; consult may proceed without recording",
      "DOC-13.01",
      "TeleConsentLog (pattern from AudioCaseConsentLog); POST Consent both parties; ConsentModal; recording blocked on decline; retention/access per OQ-C2 before enabling recording",
      "New", "NEW", "Telemedicine", "DOC-13, OQ-C2, §18.2",
      ".NET 8 + UI", Y, Y, Y, Y, Y, "P2", "M", "DOC-11.01, PRE-03.02",
      "§12.10, §18.2",
      "AudioCaseConsentLog exists for audio AI only",
      "Recording storage/retention/access unspecified — must be defined before enabling",
      "Recording cannot start unless consent stored; session duration captured for analytics", "")

    T(ph, pn, "5.6", "DOC-10",
      "Tele session lifecycle jobs and doctor dashboard online toggle",
      "DOC-09.02",
      "Tele session janitor: close abandoned sessions; expire stale availability; duration to clinic performance; Widgets.js online toggle + tele queue entry",
      "New", "NEW", "Telemedicine", "DOC-09, DOC-16, §14.3",
      "Worker + dashboard", Y, Y, Y, Y, N, "P2", "S", "DOC-09.01, DOC-11.01",
      "§14.3, §12.15 DOC-16",
      "Dashboard 70%",
      "Online toggle + tele queue on dashboard",
      "Doctor sees tele state without leaving dashboard", "")

    T(ph, pn, "5.7", "SEC-TEL",
      "Telemedicine security: short-lived tokens; Admin/Account see metadata never content; Reception sees queue cannot join; no PHI in push later",
      "SEC-TEL.01",
      "Enforce join permissions and metadata-only admin access; vendor DPA complete",
      "New", "NEW", "Security", "§12.10 Permissions, §18.2",
      "API", N, Y, N, Y, Y, "P2", "S", "DOC-11.01, PLT-05.05",
      "§12.10, §17",
      "N/A",
      "PHI protection",
      "Wrong party cannot join; recordings access-controlled if enabled", "")


def add_phase6(T):
    ph, pn = "6", "Phase 6 — Mobile applications (nothing exists in any repository)"

    # Patient app modules / screens
    m1 = [
        ("PAT-M1.01", "Language select screen (Hello Homeo Doc module 1) — OQ-C4 for whether web is also multilingual", "PAT-M1, OQ-C4"),
        ("PAT-M1.02", "Welcome screen", "PAT-M1"),
        ("PAT-M1.03", "Mobile + OTP login (same PatientAuth APIs as web)", "PAT-M1, GST-01"),
        ("PAT-M1.04", "Profile setup", "PAT-M1"),
        ("PAT-M1.05", "Privacy consent capture (ConsentRecord)", "PAT-M1, GST-05"),
        ("PAT-M1.06", "Family members management", "PAT-M1, GST-01.07"),
        ("PAT-M1.07", "Caregiver authorization", "PAT-M1"),
    ]
    for sid, title, req in m1:
        T(ph, pn, "6.1", "PAT-M1",
          "Patient mobile — Onboarding & Identity (no clinical case-taking on any mobile surface)",
          sid, title, "New", "NEW, DEP(platform)", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "M", "Phase 0–3 APIs, PRE-04.05",
          "§7.7, §12.15",
          "Mobile applications do not exist",
          "OTP identity; same APIs as web; AD-7 no mobile-only backend",
          "Onboarding completable; tokens stored securely (Recommended: pinning)", "")

    m2 = [
        ("PAT-M2.01", "Home dashboard", "PAT-M2"),
        ("PAT-M2.02", "Search & care categories", "PAT-M2"),
        ("PAT-M2.03", "Search results", "PAT-M2"),
        ("PAT-M2.04", "Filters", "PAT-M2"),
        ("PAT-M2.05", "Doctor profile", "PAT-M2, GST-01.02"),
        ("PAT-M2.06", "Credentials & verification display", "PAT-M2, ADM-01"),
        ("PAT-M2.07", "Ranking explanation screen (OQ-B4)", "PAT-M2, OQ-B4"),
        ("PAT-M2.08", "Health articles", "PAT-M2"),
    ]
    for sid, title, req in m2:
        T(ph, pn, "6.2", "PAT-M2",
          "Patient mobile — Discovery & Doctor Directory (verified doctors only)",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, N, Y, N, "P2", "M", "GST-01.02, ADM-01",
          "§7.7",
          "No patient directory",
          "Consume PublicBooking APIs",
          "Unverified doctors never listed", "")

    m3 = [
        ("PAT-M3.01", "Slot picker", "PAT-M3, GST-01.03"),
        ("PAT-M3.02", "Booking review & consent", "PAT-M3"),
        ("PAT-M3.03", "Checkout (Payments/Orders)", "PAT-M3, GST-02"),
        ("PAT-M3.04", "Payment status", "PAT-M3, GST-02"),
        ("PAT-M3.05", "Appointment detail", "PAT-M3"),
        ("PAT-M3.06", "Reschedule / cancel (same APIs)", "PAT-M3, DOC-01, DOC-02"),
        ("PAT-M3.07", "Waitlist offer", "PAT-M3, GST-01.06"),
        ("PAT-M3.08", "Instant consult request", "PAT-M3, GST-01.06"),
        ("PAT-M3.09", "Queue & doctor offer", "PAT-M3, DOC-10"),
    ]
    for sid, title, req in m3:
        T(ph, pn, "6.3", "PAT-M3",
          "Patient mobile — Booking, Queue & Payment",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "L", "GST-01, GST-02, Phase 5 for live queue",
          "§7.7, §12.5",
          "Nothing exists",
          "Feature parity with patient web where both exist",
          "Full booking+pay journey on device", "")

    m4 = [
        ("PAT-M4.01", "Device check", "PAT-M4, DOC-11"),
        ("PAT-M4.02", "Waiting room", "PAT-M4, DOC-10"),
        ("PAT-M4.03", "Live video (same vendor as web)", "PAT-M4, DOC-11"),
        ("PAT-M4.04", "Recording consent", "PAT-M4, DOC-13"),
        ("PAT-M4.05", "Fallback & join failure", "PAT-M4"),
        ("PAT-M4.06", "Case-linked chat", "PAT-M4"),
        ("PAT-M4.07", "Consultation summary", "PAT-M4"),
    ]
    for sid, title, req in m4:
        T(ph, pn, "6.4", "PAT-M4",
          "Patient mobile — Consultation (first-party telemedicine)",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "L", "Phase 5",
          "§7.7, §12.10",
          "No telemedicine",
          "Same Telemedicine APIs as web",
          "Join and rejoin from app", "")

    m5 = [
        ("PAT-M5.01", "Records timeline", "PAT-M5, DOC-24"),
        ("PAT-M5.02", "Consultation note (patient-visible, not full visit notes)", "PAT-M5, DOC-08"),
        ("PAT-M5.03", "Signed eRx with code-then-name disclosure", "PAT-M5, DOC-08, PHR-10"),
        ("PAT-M5.04", "Document upload (signed URLs)", "PAT-M5, AD-9"),
    ]
    for sid, title, req in m5:
        T(ph, pn, "6.5", "PAT-M5",
          "Patient mobile — Clinical Records & Prescription (codes until pharmacy OTP-accept)",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "M", "DOC-08, PLT-08.02",
          "§7.7, §12.8",
          "No patient records surface",
          "Server-side disclosure; no PHI in push payloads",
          "Patient sees codes until acceptance then names", "")

    m6 = [
        ("PAT-M6.01", "Follow-up plan & tasks (FollowUpTask)", "PAT-M6, DOC-03"),
        ("PAT-M6.02", "Symptom diary (SymptomDiary)", "PAT-M6, Phase 8 overlap"),
        ("PAT-M6.03", "CliniSight progress view (A-9 / OQ-C5 — progress over existing clinical data, not a separate product unless decided otherwise)", "PAT-M6, OQ-C5, A-9"),
    ]
    for sid, title, req in m6:
        T(ph, pn, "6.6", "PAT-M6",
          "Patient mobile — Follow-up & Continuity",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, N, "P2", "M", "DOC-03, PRE-03.05",
          "§7.7, §16.2 Continuity",
          "None",
          "CliniSight definition required",
          "Follow-up tasks visible to patient", "")

    # PAT-M8 is Phase 7
    T(ph, pn, "6.7", "PAT-M8",
      "Patient mobile HomeoMeds screens — sequenced with Phase 7 (do not build against fake pharmacy)",
      "PAT-M8.00",
      "Schedule PAT-M8 screens (medicines tab, order start, pharmacy & quote, review & consent, tracking, order detail & refill) to land with Phase 7 APIs",
      "New", "NEW, DEP(PHR)", "Patient app", "PAT-M8, PHR-*",
      "Patient mobile", Y, Y, Y, Y, Y, "P3", "L", "Phase 7",
      "§7.7, §21.3",
      "None",
      "Do not ship medicine UI without licence gating and ledger",
      "Screens exist but gated until HomeoMeds APIs exist", "")

    m9 = [
        ("PAT-M9.01", "Write a review", "PAT-M9, A-10"),
        ("PAT-M9.02", "My reviews & appeal", "PAT-M9, A-10"),
        ("PAT-M9.03", "Payments & refunds", "PAT-M9, FIN-07"),
        ("PAT-M9.04", "Profile & settings", "PAT-M9"),
        ("PAT-M9.05", "Consent centre & data rights (DPDP export/deletion handling)", "PAT-M9, §18.2"),
        ("PAT-M9.06", "In-app notifications list", "PAT-M9, PAT-M11"),
    ]
    for sid, title, req in m9:
        T(ph, pn, "6.8", "PAT-M9",
          "Patient mobile — Trust, Money & Account",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "M", "FIN-01, ADM-04",
          "§7.7, §18.2 Data rights",
          "None",
          "Reviews moderated by Admin (A-10)",
          "Consent centre works; payments/refunds list own ledger rows only", "")

    m10 = [
        ("PAT-M10.01", "Help centre & tickets (SupportTicket APIs)", "PAT-M10, ADM-04"),
        ("PAT-M10.02", "Physical clinic appointment (in-clinic booking path)", "PAT-M10, GST-01"),
        ("PAT-M10.03", "Assisted booking (fallback when OTP fails)", "PAT-M10, §11.1"),
        ("PAT-M10.04", "Low-data mode", "PAT-M10, §19.1"),
    ]
    for sid, title, req in m10:
        T(ph, pn, "6.9", "PAT-M10",
          "Patient mobile — Support & Access",
          sid, title, "New", "NEW", "Patient app", req,
          "Patient mobile", Y, Y, Y, Y, Y, "P2", "M", "ADM-04, GST-01",
          "§7.7, §19.1",
          "None",
          "Client-stated low-data mode",
          "Assisted booking offered after OTP failure N attempts", "")

    T(ph, pn, "6.10", "PAT-M11",
      "Patient mobile — Push notifications: OS permission handling + in-app list; DeviceToken; no PHI in payloads",
      "PAT-M11.01",
      "FCM/APNs: POST /api/Devices/Register, Notifications/Send internal, GET /api/Notifications; prune invalid tokens",
      "New Integration", "NEW-INT", "Patient app", "PAT-M11, F-11, §17",
      "Patient mobile + API", Y, Y, Y, Y, Y, "P2", "M", "PRE-04.05",
      "§7.7, §12.11, §18.2",
      "None",
      "Push for booking, payment, queue, refill",
      "OS permission handled; no PHI in notification payloads", "")

    # Patient web parity OQ-C7
    T(ph, pn, "6.11", "OQ-C7",
      "Patient web portal /me/* vs booking-only — implement only what OQ-C7 decides (A-6 default: booking, payment, basic records)",
      "OQ-C7.01",
      "If full web parity: build /me/* records, tickets, medicines, consent; else keep responsive booking/pay/records interim only",
      "New", "NEW, CLR", "Patient web", "OQ-C7, A-6, R-12",
      "Web SPA", Y, Y, N, Y, N, "P2", "L", "PRE-03.07, GST-01",
      "§25, §21.4, §24 A-6",
      "No patient portal",
      "Default assumption: limited web parity",
      "Scope matches signed OQ-C7", "")

    # Doctor mobile
    docm = [
        ("DOCM-01.01", "Login & identity — shared DoctorId, same auth as web (staff token audience)", "DOCM-01"),
        ("DOCM-02.01", "First-run onboarding — confirm number, grant permissions", "DOCM-02"),
        ("DOCM-03.01", "Notification permission handling — push, mic, camera", "DOCM-03"),
        ("DOCM-04.01", "Today's queue / schedule view", "DOCM-04, DOC-10"),
        ("DOCM-05.01", "Availability toggle — online/offline, working hours", "DOCM-05, DOC-09, DOC-17"),
        ("DOCM-06.01", "Push: patient waiting, new booking, reschedule/cancel, refill request, payment confirmed", "DOCM-06"),
        ("DOCM-07.01", "Read-only patient context card — name, age, chief complaint, last visit (NO case-taking)", "DOCM-07, §26 trap"),
        ("DOCM-08.01", "Join consultation (video/audio) — same sessions as web", "DOCM-08, DOC-11"),
        ("DOCM-09.01", "Refill / repeat-prescription approval (approve/reject only) — /api/Erx/RefillInbox + Approve/Reject", "DOCM-09, F-08"),
        ("DOCM-10.02", "Earnings summary UI on mobile (API from Phase 2)", "DOCM-10"),
        ("DOCM-11.01", "Error and offline states — dead connection, failed action, expired session", "DOCM-11, §19.1"),
        ("DOCM-12.01", "Crash / error monitoring (crash-free sessions NFR)", "DOCM-12"),
    ]
    for sid, title, req in docm:
        T(ph, pn, "6.12", "DOCM",
          "Doctor mobile app — consulting day from the phone; Patient Board remains web-only",
          sid, title, "New", "NEW, DEP(tele, FIN)", "Doctor app", req,
          "Doctor mobile", Y, Y, Y, Y, Y, "P3", "XL", "Phase 2, Phase 5, PRE-04.05",
          "§7.8, §12.15, §26 trap",
          "Nothing exists; explicit constraint: no case-taking on mobile",
          "Same DoctorId; refill approve/reject only",
          "Doctor can run a consulting day from the phone without case-taking", "")

    T(ph, pn, "6.13", "MOB-SEC",
      "Mobile security baseline — secure token storage, Recommended certificate pinning, device binding for doctor tokens, crash reporting",
      "MOB-SEC.01",
      "Implement mobile security requirements from §18.2; register DeviceToken; crash monitoring vendor",
      "New", "NEW", "Security", "§18.2 Mobile, DOCM-12",
      "Both apps", Y, Y, Y, Y, Y, "P2", "M", "DOCM-01.01, PAT-M1.03",
      "§18.2, §19.2 Monitoring",
      "N/A",
      "Public PHI-bearing apps",
      "No PHI in pushes; tokens not in logs", "")


def add_phase7(T):
    ph, pn = "7", "Phase 7 — HomeoMeds pharmacy marketplace"

    T(ph, pn, "7.1", "PHR-01",
      "Pharmacy partner onboarding — licensed premises, licence records, activation checklist",
      "PHR-01.01",
      "DB PharmacyPartner + PharmacyLicence; POST /api/Pharmacy/Onboard; GET/PUT Licence; Admin activation checklist POST /api/Admin/Pharmacy/{id}/Activate; screens Onboarding + Licence + ADM-08 console",
      "New", "NEW", "HomeoMeds", "PHR-01, ADM-08, OQ-C8",
      "Pharmacy console + Admin", Y, Y, Y, Y, Y, "P3", "L", "PLT-09.02, PLT-08.02, PRE-04.08, DOC-08.02",
      "§12.14, §13.2, §7.9",
      "No pharmacy entity, no inventory concept",
      "Licensed premises; licence records; activation checklist",
      "Partner can apply; Admin can activate only when checklist complete", "")

    T(ph, pn, "7.2", "PHR-02",
      "Licence gating — expired/suspended pharmacies auto-blocked from routing + scheduled sweep",
      "PHR-02.01",
      "Enforce licence validity at routing time; licence expiry sweep job; Admin alert; one active licence number unique",
      "New", "NEW", "HomeoMeds", "PHR-02, §14.3",
      ".NET 8 worker", N, Y, Y, Y, Y, "P3", "M", "PHR-01.01",
      "§12.14, §10.3",
      "None",
      "Expired/suspended auto-blocked",
      "Pharmacy with expired licence receives no routed orders", "")

    T(ph, pn, "7.3", "PHR-03",
      "Fulfilment consent & pharmacy selection — patient picks seller and consents before transmission",
      "PHR-03.01",
      "GET /api/HomeoMeds/Sellers eligible for patient; patient consent before transmission; PAT-M8 pharmacy & quote + order review",
      "New", "NEW", "HomeoMeds", "PHR-03, PAT-M8",
      "Patient app/web + API", Y, Y, Y, Y, N, "P3", "M", "PHR-02.01, GST-01.07",
      "§12.14, §7.9",
      "None",
      "Consent before transmission",
      "No order created without patient fulfilment consent", "")

    T(ph, pn, "7.4", "PHR-04",
      "Prescription handoff — signed eRx → immutable order draft, NO re-entry of clinical data",
      "PHR-04.01",
      "POST /api/HomeoMeds/Orders from ErxSnapshot; MedicineOrder + MedicineOrderItem; items copied from snapshot; human cannot retype clinical data",
      "New", "NEW", "HomeoMeds", "PHR-04, DOC-08, §26 trap",
      ".NET 8", Y, Y, Y, Y, N, "P3", "M", "DOC-08.02, PHR-03.01",
      "§12.14, §11.5",
      "No orders",
      "Immutable draft from snapshot; codes until accept",
      "Order draft contains no clinical data typed by a human", "")

    T(ph, pn, "7.5", "PHR-05",
      "Rule-based seller routing — licence, service area, hours, capacity; MANUAL stock confirmation, NO live inventory",
      "PHR-05.01",
      "SellerRoutingRule engine; on reject re-route next eligible; if none → exception queue; no inventory module",
      "New", "NEW", "HomeoMeds", "PHR-05, §12.14 constraint 1",
      ".NET 8", N, Y, Y, Y, N, "P3", "L", "PHR-02.01, PHR-04.01",
      "§12.14, §11.5",
      "None",
      "Client: no live inventory — stock confirmed manually",
      "Routing is a rule engine not manual assignment; reject re-routes", "")

    T(ph, pn, "7.6", "PHR-06",
      "Pharmacy console — accept/reject (OTP on accept), manual price quote, mark ready/dispatched/delivered",
      "PHR-06.01",
      "APIs Accept (OTP), Reject with reason, Quote, Status Ready/Dispatched/Delivered; console order inbox + detail; MedicineQuote; MedicineOrderEvent",
      "New", "NEW", "HomeoMeds", "PHR-06, PHR-11, PAT-M8",
      "Pharmacy console", Y, Y, Y, Y, Y, "P3", "L", "PHR-04.01, PLT-11.02, PRE-02.01",
      "§12.14, §13.2, §15.2",
      "None",
      "Acceptance OTP flips codes→names and unlocks quote",
      "Patient sees names only after OTP-verified acceptance", "")

    T(ph, pn, "7.7", "PHR-07",
      "Order confirmation & payment — quote shown BEFORE payment; pay now or COD; status tracking",
      "PHR-07.01",
      "POST Pay — S5 payment or COD; AwaitingPayment → Paid or CodPending until pharmacy confirms collection; unremitted COD is exception category",
      "New", "NEW", "HomeoMeds", "PHR-07, GST-02, ADM-03",
      "Patient + API + webhook", Y, Y, Y, Y, Y, "P3", "L", "PHR-06.01, GST-02.02",
      "§12.14 state machine, §11.5",
      "None",
      "Quote always before payment; COD logged and reconciled (SC-03)",
      "Payment never requested before a quote is shown", "")

    T(ph, pn, "7.8", "PHR-08",
      "Medicine ledger — seller/platform/delivery split, SEPARATE from consult money (complete FIN-05)",
      "PHR-08.01",
      "S5 ledger entries with seller/platform/delivery split; Account medicine ledger live totals; do not mix into consult GMV",
      "New", "NEW", "Finance / HomeoMeds", "PHR-08, FIN-05, AD-5",
      "Account console", Y, Y, Y, Y, Y, "P3", "M", "FIN-05.01, PHR-07.01, FIN-02.01",
      "§12.14, §26 trap",
      "None",
      "Separate medicine ledger",
      "Medicine money reportable independently of consult money", "")

    T(ph, pn, "7.9", "PHR-09",
      "HomeoMeds order exception queue — stuck/rejected/failed never silent (ADM-09)",
      "PHR-09.01",
      "GET /api/HomeoMeds/Exceptions; order SLA escalation worker; Admin/ops/Account queue; never silent terminal-failure",
      "New", "NEW", "HomeoMeds", "PHR-09, ADM-09, §14.3",
      "Admin + Account", Y, Y, Y, Y, N, "P3", "M", "PHR-05.01, ADM-03.01",
      "§12.14, §7.2 ADM-09",
      "None",
      "Stuck, rejected or failed orders surfaced to ops",
      "No order can sit in terminal-failure without appearing in the exception queue", "")

    T(ph, pn, "7.10", "PHR-10",
      "Code-then-name disclosure — patient codes until OTP accept, then names + payment QR/link (including print if OQ-B1 says so)",
      "PHR-10.01",
      "Single server-side disclosure flag on Erx read + order; generate payment QR/link after quote; apply to PDF if confirmed",
      "New", "NEW", "eRx / HomeoMeds", "PHR-10, DOC-08, OQ-B1",
      "Patient + Pharmacy + API", Y, Y, Y, Y, Y, "P3", "M", "PHR-06.01, PRE-02.01",
      "§11.5, §12.8 AC#3",
      "Names always visible to doctor; patient has no view",
      "Interpretation requires written sign-off",
      "App (and print if required) show codes until OTP-verified pharmacy acceptance", "")

    T(ph, pn, "7.11", "PHR-11",
      "OTP-based control across HomeoMeds so Homeocentrum can monitor and trace every transaction",
      "PHR-11.01",
      "OTP on pharmacy accept (and other high-risk pharmacy actions as designed); Account can list OTP challenges for payment, payout, pharmacy acceptance",
      "New", "NEW", "Control plane", "PHR-11, SC-03, §29 OTP audit",
      "Account + Pharmacy", Y, Y, Y, Y, Y, "P3", "S", "PLT-11.02, PHR-06.01",
      "§7.9, §29",
      "None",
      "OTP audit trail over every sensitive step",
      "Account can list OTP challenges for any pharmacy acceptance", "")

    T(ph, pn, "7.12", "PHR-RF",
      "Refill requests — patient → doctor mobile inbox; doctor approve/reject only (no case-taking)",
      "PHR-RF.01",
      "RefillRequest entity; POST /api/HomeoMeds/RefillRequest; doctor RefillInbox already specified in F-08",
      "New", "NEW", "HomeoMeds", "PHR, DOCM-09, PAT-M8",
      "Patient + Doctor app", Y, Y, Y, Y, Y, "P3", "M", "DOC-08.02, DOCM-09.01",
      "§12.8, §12.14",
      "None",
      "Refill does not reopen Patient Board on mobile",
      "Doctor can approve/reject refill from phone", "")

    T(ph, pn, "7.13", "ADM-08",
      "Admin pharmacy partner activation console (listed separately in ADM catalogue)",
      "ADM-08.01",
      "Admin UI for activation checklist over PharmacyPartner (if not fully covered by PHR-01.01 screens)",
      "New", "NEW", "Admin / HomeoMeds", "ADM-08, PHR-01",
      "Admin SPA", Y, Y, Y, Y, N, "P3", "S", "PHR-01.01",
      "§7.2",
      "None",
      "Activation console",
      "Admin can activate/block partners", "")


def add_phase8(T):
    ph, pn = "8", "Phase 8 — Continuity and trust"

    T(ph, pn, "8.1", "PAT-M6b",
      "Symptom diary (full continuity if not completed in mobile MVP)",
      "P8.01",
      "SymptomDiary entity + patient capture + clinician-visible progress inputs",
      "New", "NEW", "Continuity", "PAT-M6, §16.2",
      "Patient app/web", Y, Y, Y, Y, N, "P3", "M", "PAT-M6.02",
      "§26 Phase 8, §16.2",
      "None",
      "Diary over existing clinical data where possible",
      "Patient can log symptoms over time", "")

    T(ph, pn, "8.2", "CLINISIGHT",
      "CliniSight progress — implement only to signed OQ-C5 / A-9 definition",
      "P8.02",
      "Progress-tracking view over existing clinical data (default assumption A-9) or separate module if client expands scope",
      "New", "NEW, CLR", "Continuity", "PAT-M6, OQ-C5, A-9",
      "Patient app", Y, Y, Y, Y, N, "P3", "M", "PRE-03.05, DOC-03",
      "§24 A-9, §26 Phase 8",
      "None",
      "Undefined in pack",
      "Matches signed definition; no speculative product", "")

    T(ph, pn, "8.3", "REVIEWS",
      "Patient reviews of doctors with appeal path, Admin moderation (A-10)",
      "P8.03",
      "Review entity; write review; my reviews & appeal; Admin moderation; ranking input per OQ-B4",
      "New", "NEW", "Trust", "PAT-M9, A-10, OQ-B4, BO-6",
      "Patient + Admin", Y, Y, Y, Y, Y, "P3", "M", "ADM-01, PRE-02.04",
      "§24 A-10, §26 Phase 8, §6 BO-6",
      "None",
      "Trust infrastructure",
      "Reviews have appeal; unverified doctors still not listed", "")

    T(ph, pn, "8.4", "CONSENT",
      "Consent centre and data rights (DPDP) — export and deletion handling",
      "P8.04",
      "Patient consent centre: view consents, withdraw where allowed, data export, deletion request workflow",
      "New", "NEW", "Trust / Legal", "PAT-M9, §18.2 Data rights",
      "Patient app/web", Y, Y, Y, Y, N, "P3", "M", "GST-05.01, GST-01.07",
      "§18.2, §26 Phase 8",
      "No consent centre",
      "DPDP-aligned",
      "Patient can access consent centre and data rights flows", "")

    T(ph, pn, "8.5", "RANKING",
      "Doctor directory ranking explanation (patient-visible) per signed OQ-B4",
      "P8.05",
      "Ranking explanation screen disclosing actual rules honestly (web + app)",
      "New", "NEW, CLR", "Trust", "PAT-M2, OQ-B4, BO-6",
      "Patient web/app", Y, Y, N, Y, N, "P3", "S", "PRE-02.04, GST-01.02",
      "§7.7, §25 OQ-B4",
      "No ranking",
      "Cannot be built honestly without rules",
      "Explanation matches implemented ranking", "")


def add_existing_100(T):
    """Do not skip any existing 100% module — each is a regression + ACL/hygiene task."""
    ph, pn = "REG", "Existing 100% catalogue — regression, ACL, dual-API hygiene (no rebuild)"

    admin_items = [
        ("ADM-10.01", "Repertory — Section master", "Repertory"),
        ("ADM-10.02", "Repertory — Sub-section / rubric tree", "Repertory"),
        ("ADM-10.03", "Repertory — Rubric↔remedy mapping with author + grade", "Repertory"),
        ("ADM-10.04", "Repertory — Remedy-linked rubric viewer", "Repertory"),
        ("ADM-10.05", "Repertory — Language master", "Repertory"),
        ("ADM-10.06", "Repertory — Body-part master", "Repertory"),
        ("ADM-10.07", "Repertory — Intensity master", "Repertory"),
        ("ADM-10.08", "Repertory — Remedy master", "Repertory"),
        ("ADM-10.09", "Repertory — Remedy-grade master", "Repertory"),
        ("ADM-10.10", "Repertory — Excel import/export/update with async job status polling", "Repertory"),
        ("ADM-10.11", "Materia Medica — Author", "Materia Medica"),
        ("ADM-10.12", "Materia Medica — MM master", "Materia Medica"),
        ("ADM-10.13", "Materia Medica — MM head (chapter headings)", "Materia Medica"),
        ("ADM-10.14", "Materia Medica — Remedy-wise MM viewer", "Materia Medica"),
        ("ADM-10.15", "Materia Medica — Default differential-head flag", "Materia Medica"),
        ("ADM-10.16", "Clinical Patterns — Diagnosis system", "Clinical Patterns"),
        ("ADM-10.17", "Clinical Patterns — Diagnosis therapeutics", "Clinical Patterns"),
        ("ADM-10.18", "Clinical Patterns — Diagnosis & conditions with keyword→rubric linkage", "Clinical Patterns"),
        ("ADM-10.19", "Adverse Effect — Drug system", "Adverse Effect"),
        ("ADM-10.20", "Adverse Effect — Drug group", "Adverse Effect"),
        ("ADM-10.21", "Adverse Effect — Allopathic drug with serious/other side effects and adverse reactions", "Adverse Effect"),
        ("ADM-10.22", "Existance Questions — Question section", "Existance Questions"),
        ("ADM-10.23", "Existance Questions — Question group", "Existance Questions"),
        ("ADM-10.24", "Existance Questions — Sub-question group", "Existance Questions"),
        ("ADM-10.25", "Existance Questions — Clinical question mapping to body parts and rubrics", "Existance Questions"),
        ("ADM-10.26", "3D Body Part — Mesh-key master (GLB mesh names)", "3D Body Part"),
        ("ADM-10.27", "3D Body Part — Section master", "3D Body Part"),
        ("ADM-10.28", "3D Body Part — Hotspots linked to sub-section search", "3D Body Part"),
        ("ADM-10.29", "Business Management — Packages", "Business Management"),
        ("ADM-10.30", "Business Management — Qualifications", "Business Management"),
        ("ADM-10.31", "Business Management — Roles & menu permissions (data exists; GetMenuByRole restore is PLT-05 — still regression of CRUD screens)", "Business Management"),
        ("ADM-10.32", "Business Management — Labs / imaging catalogue", "Business Management"),
        ("ADM-10.33", "Business Management — Blogs", "CMS"),
        ("ADM-10.34", "Business Management — News", "CMS"),
        ("ADM-10.35", "Rubric Intelligence — AI metaphors and aliases CRUD with approve/reject", "Rubric Intelligence"),
        ("ADM-10.36", "Rubric Intelligence — Benchmark dashboard (summary, trends, config, rollout, repertory status)", "Rubric Intelligence"),
    ]
    for sid, title, mod in admin_items:
        T(ph, pn, "R.1", "ADM-10",
          "Admin portal master data — Existing 100% — regression only; apply ACL + dual-API hygiene; do not rebuild",
          sid, title + " — regression + [Authorize] + menu ACL",
          "Regression", "E-NC", mod, "ADM-10",
          "Admin SPA + both APIs", Y, Y, N, Y, N, "P2", "S", "PLT-05.03, PLT-13.01",
          "§4.6.1, §7.2, §8.3",
          "Full CRUD, Excel, pagination confirmed in code",
          "Verify by regression; remaining work is ACL, hygiene, dual-API discipline",
          "Module functions exactly as before after each phase", "")

    doc33 = [
        ("DOC-33.01", "Manual case taking — Body Parts tab"),
        ("DOC-33.02", "Clinical questions tab"),
        ("DOC-33.03", "Clinical Pattern / diagnosis tab"),
        ("DOC-33.04", "Repertory search tab"),
        ("DOC-33.05", "Allopathic / adverse-effect lookup"),
        ("DOC-33.06", "Labs & imaging orders in prescription modal (labs remain; notes split is DOC-08)"),
        ("DOC-33.07", "History notes save path (until split; then regression of typed notes)"),
        ("DOC-33.08", "Multi-patient sessions (max 5) with cloud backup and restore"),
        ("DOC-33.09", "Appointment slot grid"),
        ("DOC-33.10", "Dashboard stats / ApexCharts patient stats"),
        ("DOC-33.11", "Recent activity"),
        ("DOC-33.12", "New patient create"),
        ("DOC-33.13", "Patient import via template"),
        ("DOC-33.14", "Patient Excel/CSV/PDF export"),
        ("DOC-33.15", "Appointment status update (existing buckets)"),
        ("DOC-33.16", "Appointment time update (retained; wrapped by formal reschedule)"),
        ("DOC-33.17", "Appointment counts by bucket"),
        ("DOC-33.18", "Audio AI case taking pipeline (record/upload, consent, Whisper, GPT, engines, approve/reject, explainability, offline queue) — accuracy work is DOC-21"),
        ("DOC-33.19", "3D anatomy viewer existing behaviour (completion is DOC-26)"),
        ("DOC-33.20", "WhatsApp existing send/templates/campaigns (completion is DOC-20)"),
        ("DOC-33.21", "Doctor SaaS package purchase/renewal existing checkout (hardening is DOC-19)"),
        ("DOC-33.22", "Clipboard / intensity / common-uncommon / elimination / differential MM (COG is additive)"),
        ("DOC-33.23", "Doctor self-registration + email activation existing path (gated by ADM-01/GST-07)"),
        ("DOC-33.24", "Forgot-password screen presence (secure reset is PLT-02)"),
        ("DOC-33.25", "Public marketing: home, about, features, pricing, blog, news, contact, privacy, terms routes (content upgrades are GST-03–06)"),
    ]
    for sid, title in doc33:
        T(ph, pn, "R.2", "DOC-33",
          "Doctor / public existing 100% capabilities — regression; extend don't replace",
          sid, title + " — regression after each phase that touches shared code",
          "Regression", "E-NC", "Doctor / Public", "DOC-33, §8.3",
          "Web SPA", Y, Y, N, Y, N, "P2", "S", "PLT-13.01",
          "§4.6.2, §7.5 DOC-33, §8.3",
          "Confirmed existing functionality",
          "Preserved assets: do not rebuild",
          "Behaviour unchanged except documented deltas", "")

    rec = [
        ("REC-10.01", "Reception login (shared Account/Login)"),
        ("REC-10.02", "Create patient"),
        ("REC-10.03", "Search / list patients"),
        ("REC-10.04", "Create / manage appointments"),
        ("REC-10.05", "New appointment"),
        ("REC-10.06", "Status & time update (existing)"),
    ]
    for sid, title in rec:
        T(ph, pn, "R.3", "REC-10",
          "Reception existing 100% — regression; new work is queue, payment, schedule view, case paper, profile",
          sid, title,
          "Regression", "E-NC", "Reception", "REC-10",
          "Web SPA", Y, Y, N, Y, N, "P2", "S", "PLT-13.01",
          "§4.6.3, §7.6",
          "Reception shares doctor dashboard with some clinical actions disabled",
          "Keep working while chrome and new actions are added",
          "Existing reception flows still work", "")

    T(ph, pn, "R.4", "AI-CORE",
      "Existing AI platform — embeddings, knowledge graph, AI monitoring dashboard — regression; accuracy is DOC-21",
      "AI-CORE.01",
      "Regression: AudioCaseIntelligence, embeddings jobs, knowledge-graph, AiMonitoring — do not replace; continue per existing engine docs",
      "Regression", "E-NC", "AI", "§4.6.1 Rubric Intelligence, §8.3",
      ".NET 8", Y, Y, Y, Y, Y, "P2", "S", "PLT-13.01",
      "§4.3, §8.3",
      "Full AI pipeline confirmed",
      "Accuracy work continues; no greenfield rebuild",
      "Pipeline and monitoring still function", "")


def add_qa_nfr_int(T):
    ph, pn = "QA", "Cross-cutting — Testing, NFR, integrations, security remainder, frontend states"

    # Testing types
    tests = [
        ("QA-01", "Unit tests: COG (once defined), commission/GST, refund arithmetic, slot conflict, potency validation, code/name disclosure, OTP expiry/attempts", "P0"),
        ("QA-02", "API tests: every new endpoint — happy path, validation, authorisation, ownership, idempotency, pagination", "P0"),
        ("QA-03", "Integration: gateway sandbox (capture, failure, refund, duplicate webhook, signature mismatch)", "P0"),
        ("QA-04", "Integration: SMS sandbox DLT test templates + DLR", "P1"),
        ("QA-05", "Integration: video vendor sandbox token issuance", "P2"),
        ("QA-06", "Integration: storage signed URLs", "P0"),
        ("QA-07", "UI/E2E: public booking end-to-end", "P1"),
        ("QA-08", "UI/E2E: reception collection", "P0"),
        ("QA-09", "UI/E2E: reschedule and cancel across roles", "P1"),
        ("QA-10", "UI/E2E: prescription with potency; eRx code→name transition", "P1"),
        ("QA-11", "UI/E2E: teleconsult join and rejoin", "P2"),
        ("QA-12", "Regression suite on 100% modules (ties to PLT-13.01) run every phase", "P0"),
        ("QA-13", "Negative: booking taken slot, paying twice, replaying webhook, tampering amount, accessing another patient's eRx, pharmacy accepting unassigned order, reception approving payout", "P0"),
        ("QA-14", "Boundary: booking horizon, midnight/timezone, settlement hold-window, max clipboard for COG, max upload size", "P1"),
        ("QA-15", "Permission matrix: role × route × API — the single most important suite (no ACL today)", "P0"),
        ("QA-16", "Security tests: auth bypass, IDOR, signature bypass, rate-limit bypass, OTP brute force, signed-URL leakage, XSS on free-text", "P0"),
        ("QA-17", "Performance: booking slots under concurrency, ledger queries over volume, Patient Board large clipboard, dashboard aggregations", "P1"),
        ("QA-18", "Data validation & migration tests: password without lockout, note-type defaults, historical Rx render, ledger back-pop idempotent", "P0"),
        ("QA-19", "UAT scripts: doctor day-in-the-life, reception day-in-the-life, patient booking journey, Account month-end close, pharmacy fulfilment", "P1"),
        ("QA-20", "Phase exit: all P0/P1 defects closed; regression green; permission matrix passed; money phases need a balancing reconciliation across one simulated settlement cycle; security review if public surface opened", "P0"),
    ]
    for sid, title, prio in tests:
        T(ph, pn, "QA.1", "QA-STRAT",
          "Testing & QA strategy from §20 — not optional for a money/PHI programme",
          sid, title, "New", "NEW", "QA", "§20",
          "QA", Y, Y, Y, Y, Y, prio, "M", "PLT-13.01",
          "§20.1–20.3, §29",
          "Limited automated coverage implied",
          "Entry: signed req, Swagger frozen, test data, sandbox integrations",
          "Exit criteria per phase met", "")

    T(ph, pn, "QA.2", "QA-DATA",
      "Test data & environments",
      "QA-21",
      "Seed doctors in each verification state; patients with/without prior visits; appointments in every status including CANCELLED; Rx with/without potency; HomeoMeds orders in every state; dedicated finance test account; ledger must balance to zero in recon report",
      "New", "NEW", "QA", "§20.2",
      "All sandboxes", N, Y, Y, Y, Y, "P0", "M", "PRE-04.01",
      "§20.2",
      "No money-test discipline",
      "Gateway/SMS/video sandboxes + webhook tunnel",
      "Recon report balances after payment scenarios", "")

    # NFR
    nfrs = [
        ("NFR-01", "Interactive APIs p95 under 500 ms for list/detail at expected load (Recommended — confirm with client)", "Performance"),
        ("NFR-02", "Booking slots under 1 s including schedule computation; cacheable", "Performance"),
        ("NFR-03", "Patient Board: no regression vs current latency; COG must not block the tab", "Performance"),
        ("NFR-04", "Audio pipeline unchanged polling budget 2.5 s interval, ~8 minute cap", "Performance"),
        ("NFR-05", "Horizontal scale API tier; workers independent; ledger partition-ready for multi-year growth (Proposed)", "Scalability"),
        ("NFR-06", "Availability 99.5% clinical/booking; payment webhook is the most available surface", "Availability"),
        ("NFR-07", "At-least-once processing with idempotency for webhooks and notifications; no message loss for money events", "Reliability"),
        ("NFR-08", "Financial and prescription records append-only; reconciliation must balance daily", "Data integrity"),
        ("NFR-09", "Maintainability: no new domain on classic; PatientBoard decomposed; thunk/helper conventions preserved", "Maintainability"),
        ("NFR-10", "Usability: public booking < 2 minutes; reception collection < 30 seconds (Recommended)", "Usability"),
        ("NFR-11", "Accessibility: keyboard + labelled controls on public booking and payment; colour never sole carrier of payment status", "Accessibility"),
        ("NFR-12", "Compatibility: evergreen browsers; teleconsult desktop+tablet; patient app current iOS/Android majors", "Compatibility"),
        ("NFR-13", "Structured logging with correlation id; financial and OTP logs retained longer", "Logging"),
        ("NFR-14", "Monitoring: uptime, error rate, webhook lag, OTP delivery rate, payment failure rate, queue depth, mobile crash-free sessions", "Monitoring"),
        ("NFR-15", "Backup/recovery: PITR; documented RPO/RTO (currently unspecified — OQ-C1)", "DR"),
        ("NFR-16", "Disaster recovery runbook including gateway reconciliation after an outage — documented and tested", "DR"),
        ("NFR-17", "i18n: patient app language select required; patient web multilingual only if OQ-C4 yes", "i18n"),
        ("NFR-18", "Frontend states: skeletons on ledger/recon/queue/slots; 409 as alternatives; empty-state copy for queues/slots/exceptions/tickets; public booking mobile-first; admin desktop-first; teleconsult tablet", "Frontend UX"),
    ]
    for sid, title, cat in nfrs:
        T(ph, pn, "NFR.1", "NFR",
          "Non-functional requirements — document states no numeric NFRs from client; below are Recommended until confirmed",
          sid, title, "New", "NEW, CLR", cat, "§19",
          "Cross-cutting", Y, Y, Y, Y, Y, "P1", "S", "PRE-03.01",
          "§19.1–19.2, §13.4",
          "No numeric NFR targets in client DOCX",
          "Only explicit: traceability, never-silent exceptions, no live inventory, mobile offline/crash, low-data mode",
          "Recommended targets confirmed or revised by client; then tested", "")

    # Remaining security 18.2 (not fully covered)
    secs = [
        ("SEC-N01", "Payment security: no card data stored or logged; PCI scope minimised via hosted checkout", "§18.2"),
        ("SEC-N02", "PHI protection: Rx, notes, audio, documents only treating doctor, owning patient, and accepting pharmacy for that order — API not UI", "§18.2"),
        ("SEC-N03", "Public endpoint hardening: bot protection, generic errors on public surfaces", "§18.2"),
        ("SEC-N04", "Immutable audit for money, credentialing, prescriptions, OTP, document access", "§18.2"),
        ("SEC-N05", "Vendor security review + DPAs for video and SMS providers", "§18.2"),
        ("SEC-N06", "Recommended validation library for money and booking modules where rule density is high", "§14.5"),
        ("SEC-N07", "Optimistic concurrency on slot booking, credentialing decisions, order state transitions", "§14.5"),
        ("SEC-N08", "Indexes: ledger, appointment directory, medicine order, OTP audit (list in §16.4) — follow RubricDetails_Performance_Indexes.sql precedent", "§16.4"),
        ("SEC-N09", "Paginate every list API", "§14.5"),
        ("SEC-N10", "Patient duplication merge tool (Proposed) using mobile-number identity key", "§16.6"),
        ("SEC-N11", "Database-level protection for append-only LedgerEntry and ErxSnapshot (Proposed)", "§16.4"),
        ("SEC-N12", "WAF + rate limiting on public routes (ties PLT-12.02)", "AD-8"),
        ("SEC-N13", "Check constraints: amounts > 0, refund ≤ captured, appointment status enumerated set", "§16.4"),
        ("SEC-N14", "Uniqueness: one Approved DoctorVerification per doctor; one active PharmacyLicence per licence number; ReceiptNo unique per clinic", "§16.4"),
        ("SEC-N15", "Confirm live schema against documentation before writing migration scripts (exact existing columns not specified in the pack)", "§16.3"),
    ]
    for sid, title, src in secs:
        T(ph, pn, "SEC.1", "SEC-NEW",
          "New security & data-integrity requirements introduced by the public/money/PHI programme",
          sid, title, "New", "NEW", "Security", src,
          "All APIs", N, Y, Y, Y, Y, "P0", "S", "Phase 0",
          "§18.2, §16",
          "Closed clinic tool",
          "Public money-handling PHI platform",
          "Control implemented and tested", "")

    # Integrations remaining (OpenAI, WhatsApp, SMTP already exist — extend)
    ints = [
        ("INT-01", "Razorpay extend: refunds, payouts, webhook inbound, signature, keys in secret store, never log card data (covers F-02/DOC-19)", "Razorpay", "Existing Improvement"),
        ("INT-02", "SMS provider new (DOC-05) — mask numbers in logs; DND except transactional", "SMS", "New Integration"),
        ("INT-03", "Video vendor new — short-lived tokens; recording only with stored consent", "Video", "New Integration"),
        ("INT-04", "Push FCM/APNs — invalid token prune", "Push", "New Integration"),
        ("INT-05", "OpenAI / Azure OpenAI existing — review data-residency for patient audio; consent before upload (existing pattern)", "OpenAI", "Existing Improvement"),
        ("INT-06", "Meta WhatsApp Cloud existing — opt-in enforcement; failure list (DOC-20)", "WhatsApp", "Existing Improvement"),
        ("INT-07", "SMTP existing — stop sending passwords; invoices later", "SMTP", "Existing Modification"),
        ("INT-08", "Object storage new/hardened — signed URLs, per-object authorisation", "Storage", "New Integration"),
        ("INT-09", "Bank / payout rail — OTP dual control; maker-checker; failed payout exception", "Payout rail", "New Integration"),
        ("INT-10", "Webhook endpoints for video vendor events and SMS DLR (anonymous + signature/verify as applicable)", "Inbound webhooks", "New Integration"),
    ]
    for sid, title, mod, wt in ints:
        T(ph, pn, "INT.1", "INT",
          "Integration analysis §17 — each integration is a workstream with failure, retry, timeout, security",
          sid, title, wt, "NEW-INT" if "New" in wt else "P-ENH",
          mod, "§17",
          "External", N, Y, Y, Y, Y, "P1", "M", "Matching feature phase",
          "§17",
          "See AS-IS integrations table §4.9",
          "Failure handling and retry as specified per row in §17",
          "Sandbox proven before production", "")

    # Cross-role event map as implementation checklist
    events = [
        ("EVT-01", "Doctor registered → Admin credentialing queue"),
        ("EVT-02", "Doctor verified → practice unlock, directory ranking, verified badge"),
        ("EVT-03", "Slot saved → patient booking availability + doctor mobile queue"),
        ("EVT-04", "Appointment created → SMS+WhatsApp confirmation, payment, queue, Account if paid"),
        ("EVT-05", "Reschedule/Cancel → slot release, notifications, refund rule evaluation"),
        ("EVT-06", "Consult paid → queue unlock, doctor payment badge, Account ledger"),
        ("EVT-07", "eRx signed → patient sees codes, pharmacy offer routing"),
        ("EVT-08", "Pharmacy accepts (OTP) → patient sees names + quote + pay QR/link"),
        ("EVT-09", "Ticket opened → Admin support queue"),
        ("EVT-10", "Doctor online → patient instant consult and waiting room"),
        ("EVT-11", "Payment failed/mismatched → Admin+Account exception queue never silent"),
        ("EVT-12", "Licence expired → pharmacy blocked; Admin alert"),
    ]
    for sid, title in events:
        T(ph, pn, "EVT.1", "SC-01",
          "Cross-role event map — implement fan-out so one ecosystem is real (SC-01)",
          sid, "Event: " + title,
          "New", "NEW", "Notifications / domain", "§10.3, SC-01",
          "Workers", N, Y, Y, Y, Y, "P1", "S", "Matching domain feature",
          "§10.3",
          "Clinic-only events today",
          "Each significant action must fan out",
          "Event produces the listed consumer updates", "")

    # Remaining backend controllers checklist (ensure none skipped)
    ctrls = [
        ("BE-01", "PaymentsController, LedgerController, SettlementController, RefundController"),
        ("BE-02", "ConsultPaymentController, ConsultFeeController"),
        ("BE-03", "DoctorCredentialingController"),
        ("BE-04", "PublicBookingController, PatientAuthController"),
        ("BE-05", "TelemedicineController"),
        ("BE-06", "SmsController, NotificationsController, DevicesController"),
        ("BE-07", "SupportTicketController"),
        ("BE-08", "ErxController"),
        ("BE-09", "RepertorizationController CenterOfGravity extension"),
        ("BE-10", "PotencyMasterController"),
        ("BE-11", "AnalyticsController, AdminDashboardController"),
        ("BE-12", "HomeoMedsController, PharmacyController"),
        ("BE-13", "OtpController"),
        ("BE-14", "Modify existing: UserService (both APIs), PatientAppointmentService, PrescriptionService, DoctorDashBoardService, Order/Subscription (port), WhatsAppService, AudioCaseTakingService, PatientService — ReceptionStaffService no change"),
        ("BE-15", "Extend url_helper.js and realbackend_helper.js for all new endpoint constants (SPA)"),
        ("BE-16", "Redux thunks/reducers for each new module following existing List/Add/Edit pattern"),
    ]
    for sid, title in ctrls:
        T(ph, pn, "BE.1", "BE-SURF",
          "Backend / FE helper surface checklist — all new domain on .NET 8 (~70 proposed endpoints, 13 new controllers)",
          sid, title,
          "New", "NEW", "API / SPA", "§14.2, §15.1",
          ".NET 8 / SPA", Y, Y, Y, Y, N, "P1", "S", "Swagger freeze PRE-04.09",
          "§14, §15, §13.1",
          "~45 .NET 8 controllers; ~348 classic actions",
          "~70 new endpoints; 8 modified; 2 ported; 1 deprecated login path",
          "Controller exists, authorised, documented in Swagger", "")

    # url helpers already BE-15
    # Conflicts as tasks to honour chosen resolution
    T(ph, pn, "CFG.1", "C-RESOLVE",
      "Honour source-document conflict resolutions (do not silently revert)",
      "C-01",
      "C-1: Mobile IS in scope (ecosystem plan + DOCX). New-features plan web-only subset is not governing.",
      "Client Decision", "CLR", "Programme", "C-1",
      "PMO", N, N, N, N, N, "P1", "S", "—",
      "§23",
      "Plans disagreed on mobile",
      "DOCX + ecosystem plan govern",
      "Backlog includes PAT-M* and DOCM-*", "")

    T(ph, pn, "CFG.1", "C-RESOLVE",
      "Honour source-document conflict resolutions (do not silently revert)",
      "C-02",
      "C-2: Unified /api/Payments/* with ConsultPayment sub-surface — do not create a second webhook",
      "New", "NEW", "Payments", "C-2",
      "API design", N, Y, N, Y, Y, "P0", "S", "GST-02.01",
      "§23, §15.2 note",
      "Two plans used different namespaces",
      "Single ledger needs single order-create and webhook path",
      "Only one webhook endpoint in the system", "")

    T(ph, pn, "CFG.1", "C-RESOLVE",
      "Honour source-document conflict resolutions (do not silently revert)",
      "C-03",
      "C-3: Port Razorpay to .NET 8; classic OrderController only as time-boxed interim with removal date",
      "Existing Improvement", "P-ENH", "Payments", "C-3",
      "API", N, Y, N, Y, Y, "P0", "S", "PLT-10.03",
      "§23",
      "Plans disagreed on thin reuse vs port",
      "Classic is EOL behind public perimeter",
      "Port complete or interim date agreed", "")

    # Traps as explicit non-goals / QA checks
    traps = [
        ("TRAP-01", "Do not build Support/Credentialing/Admin KPI on Velzon demo routes"),
        ("TRAP-02", "Do not overload PackageEntryDetail for consult or medicine money"),
        ("TRAP-03", "Do not treat client-side Razorpay success as authoritative"),
        ("TRAP-04", "Do not treat UpdateAppointmentTime as the reschedule product"),
        ("TRAP-05", "Do not treat WhatsApp as SMS done"),
        ("TRAP-06", "Do not treat history notes inside Rx modal as notes/eRx split"),
        ("TRAP-07", "Do not treat empty Dose as potency"),
        ("TRAP-08", "Do not treat E-CONSULT + WhatsApp alert as telemedicine"),
        ("TRAP-09", "Do not treat enquiry form as support tickets"),
        ("TRAP-10", "Do not show remedy names to patients immediately"),
        ("TRAP-11", "Do not mix medicine money into consult GMV"),
        ("TRAP-12", "Do not build case-taking into doctor mobile"),
        ("TRAP-13", "Do not create a third backend"),
        ("TRAP-14", "Do not treat Account as a variant of Admin"),
    ]
    for sid, title in traps:
        T(ph, pn, "GOV.1", "TRAPS",
          "Explicit out-of-scope traps — add as definition-of-done / code-review gates",
          sid, title,
          "Regression", "E-NC", "Governance", "§26 traps",
          "All teams", Y, Y, Y, Y, N, "P0", "S", "—",
          "§26, §33",
          "Easy to accidentally do these",
          "Correct approach listed in the analysis document",
          "Code review rejects the trap", "")

    # Remaining frontend new screens not already named as own tasks
    extra_ui = [
        ("UI-01", "Account screens not already listed: confirm all 10 Account routes from §12.4 exist (ledger, consult-recon, medicine-ledger, exceptions, settlements, payouts, refunds, tax, payees, clinic-collections)"),
        ("UI-02", "Public booking empty/error/loading/responsive/a11y pass"),
        ("UI-03", "Doctor SMS templates screen (if not fully done in DOC-05.03)"),
        ("UI-04", "Teleconsult room /teleconsult/:sessionId for Doctor and Patient web"),
        ("UI-05", "Pharmacy history screen"),
        ("UI-06", "Follow-up due widget on doctor dashboard (DOC-16)"),
        ("UI-07", "url_helper + realbackend_helper + Redux for every new module"),
        ("UI-08", "Feature flags for Patient Board additions (COG, potency, notes split, export)"),
    ]
    for sid, title in extra_ui:
        T(ph, pn, "FE.1", "FE-GAP",
          "Frontend completeness sweep — screens/components/state from §13",
          sid, title,
          "New", "NEW", "Web SPA", "§13",
          "Web SPA", Y, N, N, Y, N, "P1", "S", "Matching feature",
          "§13.1–13.5",
          "Velzon shell",
          "All listed screens and components exist",
          "Screen mapped in §13.5 is implemented or explicitly deferred", "")

    # Background jobs checklist
    jobs = [
        ("JOB-01", "Existing jobs unchanged: audio queue, embeddings, WhatsApp bulk, Excel import, retention sweepers"),
        ("JOB-02", "Payment reconciliation sweep (ADM-03.03)"),
        ("JOB-03", "Settlement run (FIN-02.01)"),
        ("JOB-04", "Payout dispatch (FIN-03.01)"),
        ("JOB-05", "Notification dispatcher SMS/WhatsApp/push/email retry + dead-letter"),
        ("JOB-06", "Licence expiry sweep (PHR-02.01)"),
        ("JOB-07", "Order SLA escalation (PHR-09.01)"),
        ("JOB-08", "Waitlist offer (GST-01.06)"),
        ("JOB-09", "Tele session janitor (DOC-09.02)"),
        ("JOB-10", "OTP expiry cleanup (PLT-11.03)"),
        ("JOB-11", "Expiring doctor registration re-verification prompt (ADM-01.05 Proposed)"),
    ]
    for sid, title in jobs:
        T(ph, pn, "JOB.1", "JOBS",
          "Background processing checklist — extend existing hosted-service pattern",
          sid, title,
          "New" if not sid.endswith("01") or "Existing" in title else "Regression",
          "E-NC" if "Existing jobs" in title else "NEW",
          "Workers", "§14.3",
          ".NET 8", N, Y, Y, N, Y, "P1", "S", "Matching feature",
          "§14.3",
          "Hosted services already exist for AI/WhatsApp/Excel",
          "New workers listed in §14.3",
          "Job runs in non-prod with alerting", "")

    # Special considerations as standing constraints
    T(ph, pn, "GOV.2", "SC-01",
      "SC-01 One ecosystem — shared identity, appointment, eRx, ledger keys; one API family; no siloed stores",
      "SC-01.01",
      "Architecture review gate on every new module: uses shared keys; consumes same APIs on mobile (AD-7)",
      "New", "NEW", "Architecture", "SC-01, AD-7",
      "All apps", Y, Y, Y, Y, N, "P0", "S", "PLT-11.01",
      "§7.10, §10, §28",
      "Clinic ecosystem only",
      "Four clients on one API family",
      "No module invents its own patient or appointment id", "")

    T(ph, pn, "GOV.2", "SC-02",
      "SC-02 / SC-03 Homeocentrum merchant of record — every rupee including reception cash and COD has a ledger row",
      "SC-02.01",
      "Definition of done for any payment feature: webhook or offline receipt → ledger row; never silent failure",
      "New", "NEW", "Finance", "SC-02, SC-03, §29",
      "All money surfaces", Y, Y, Y, Y, Y, "P0", "S", "FIN-01.02",
      "§7.10, §11.6, §28",
      "S1 only, client-trusted",
      "Zomato/Blinkit pattern stated by client",
      "Every rupee has a ledger row", "")

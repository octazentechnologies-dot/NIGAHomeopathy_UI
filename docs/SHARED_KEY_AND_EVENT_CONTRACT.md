# Shared Key & Event Contract (FND-01.01 / FND-01.03 / SEC-03.03)

**Audience:** Web SPA, Patient App (M17), Doctor App (M18), Account / Pharmacy later modules.  
**Rule:** One ecosystem — never mint a second id on mobile for the same clinical/money object.

## Dual-API placement (FND-01.03)

| Work | Host |
|---|---|
| **All new domain HTTP** | **New-API** (`NIGA_NewAPI` / `API_URL_NIGAHOMEOPATHY`) |
| Login (until formal cut-over) | Classic Old-API |
| Rx-write (until cut-over) | Classic Old-API |
| Razorpay (until cut-over) | Classic Old-API |
| Third API | **Forbidden** |
| `/api/mobile/*` duplicates | **Forbidden** — mobile calls the same URLs |

## Canonical shared keys

| Key | Meaning | Owning side | JSON field (prefer) | Notes |
|---|---|---|---|---|
| `DoctorId` | Treating doctor | `Doctors` | `doctorId` / `DoctorId` | Also JWT claim `DoctorID` |
| `PatientId` | Clinical patient row | `Patient` | `patientId` | Family members are real `Patient` rows |
| `PatientAppId` | Appointment id | `PatientAppointment` | `patientAppId` | Historical name = appointment PK |
| `CaseId` | Case entry | Case tables | `caseId` | Do not invent mobile-only case keys |
| `ErxId` | Digital eRx | eRx module (M11) | `erxId` | Created once; mobile reuses |
| `LedgerTxnId` | Money ledger row | Account (M08) | `ledgerTxnId` | Not PackageEntryDetail |
| `MedicineOrderId` | Medicine order | HomeoMeds (M15) | `medicineOrderId` | Not PackageEntryDetail |

**PackageEntryDetail** = S1 SaaS subscription only. Never reuse for consult (S2) or medicine (S5) billing.

## Events other modules emit

Payloads **must** include the relevant shared keys above.

| Event | Typical producer | Must include |
|---|---|---|
| `created` | Appointments / Patients / Orders | ids of the new resource + DoctorId/PatientId as applicable |
| `rescheduled` | Appointments | `PatientAppId`, new time, DoctorId |
| `cancelled` | Appointments / Orders | resource id + reason code if any |
| `paid` | Payments / Ledger | `LedgerTxnId`, amount, PatientId/DoctorId |
| `signed` | eRx | `ErxId`, DoctorId, PatientId |
| `accepted` | Pharmacy / payouts | `MedicineOrderId` or payout id + actor |

## Mobile Logout contract (SEC-03.03)

```http
POST /api/Account/Logout
Authorization: Bearer <jwt>
```

Response shape:

```json
{ "success": true, "message": "Logged out successfully" }
```

- Patient App and Doctor App **must** call this endpoint (New-API after cut-over; same path).
- Mobile **must not** only delete the local token.
- Do **not** add `/api/mobile/logout`.

## Consent design lock (SEC-06.03)

- `AudioCaseConsentLog` — audio case-taking only.
- Telemedicine recording (Phase 11) writes `ConsentType.TeleRecording` into **ConsentRecord**.
- Do **not** create a third telemedicine consent table.


```http
POST /api/Account/ForgotPassword   { "email": "..." }
POST /api/Account/ResetPassword    { "token": "...", "newPassword": "..." }
POST /api/Account/ChangePassword   { "currentPassword": "...", "newPassword": "..." }  // JWT
```

Email link uses web route `/reset-password?token=...` (also accept `/reset-password/:token`). Mobile may open the same URL or deep-link to `ResetPassword`.

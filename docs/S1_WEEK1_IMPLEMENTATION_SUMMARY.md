# S1 Week 1 — Implementation summary (Waves 0–5)

**Approved:** Full remaining Week 1  
**Implemented:** 11 Sep 2026  
**Plan:** `S1_WEEK1_WEB_FRONTEND_API_OTHER_FULL_PLAN.md`

## Run these SQL scripts on the shared DB (order)

1. `New-API/.../Database/Scripts/M01_Foundation_Security_Server.sql` (if not already)
2. `New-API/.../Database/Scripts/M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`
3. `New-API/.../Database/Scripts/M16_Family_Caregiver.sql`

## Wave 0 — M02 confirm

- Doc: `docs/M02_DUAL_API_HOST_FREEZE_CONFIRMATION.md`
- No master rebuild

## Wave 1 — ADM-B04.02

- Runnable Account/Pharmacy MenuMaster + RoleDetails seed

## Wave 2 — Docs

- `SHARED_KEY_AND_EVENT_CONTRACT.md` (keys, dual-API, Logout contract, consent lock)
- `FIVE_PORTALS_MAP.md`

## Wave 3 — New-API

| Ticket | Change |
|---|---|
| SEC-03.01 | JWT `OnTokenValidated` checks denylist |
| SEC-05.02 | Removed `UseDirectoryBrowser` for `/attachments` and `/Blogs` |
| SEC-04.01 | `AccountPortal` policy stub |
| SEC-05.01 | Doctor ownership on appointment save/schedule/list-by-date; board backup JWT-bound |
| SEC-08.02 | Audit helper on Package Save/Delete/Topup |
| SEC-04.03 | Covered by menu seed |

## Wave 4 — SPA

| Ticket | Change |
|---|---|
| SEC-01.03 | Removed `fakeBackend()` from `App.js` |
| SEC-03.02 | Logout → New-API `/Account/Logout` then clear session |
| SEC-02.03 | Real forgotpwd + `/reset-password` pages |
| FND-02.01 | Account + Pharmacy stub routes + login redirects |
| FND-02.02 | `RoleProtected` + `allowedRoles` on new routes |
| SEC-04.02 | Velzon demo menus hidden unless `REACT_APP_SHOW_VELZON_DEMO=true`; Account/Pharmacy menus |

## Wave 5 — M16 New-API (mobile-reusable)

| API | Routes |
|---|---|
| Family | `POST /api/Family/LinkPrimary`, `GET/POST /api/Family`, `PUT/DELETE /api/Family/{id}`, `GET /api/Family/CanBookAs/{patientId}` |
| Caregiver | `POST /api/Caregiver/Grant`, `POST /api/Caregiver/Revoke`, `GET ListMine`, `GET ListActingFor` |
| Booking gate | `SavePatientApp` rejects Patient/Caregiver JWT for non-owned `PatientId` |

## UAT smoke (must pass)

1. Admin / Doctor / Reception login still works; Patient Board + one Admin master still work.
2. Logout shows New-API Logout POST (or fails soft) and clears session; board backup prompt unchanged.
3. Forgot password → New-API; reset link opens form.
4. After Logout on New-API token, protected New-API call → 401.
5. `/attachments` is not a directory listing.
6. Account role → `/account/home` stub; Doctor cannot open `/account/*`.
7. After SQL: GetMenuByRole for Account returns account URLs only.
8. Family LinkPrimary → Create member → CanBookAs 200; random PatientId → 403.

## Note on Logout + classic Login

SPA still logs in on **classic**. New-API Logout may return 401 if TokenKey differs — UI still clears session (best-effort). After formal login cut-over, denylist becomes fully effective for the SPA token.

# S1 Week 1 — UAT Smoke Test Guide

Use this after deploying Week 1 code. Tick each row. **Pass = behaviour matches Expected.**

Hosts (from `src/config.js` today):

| Client | Host |
|---|---|
| Classic (login, most Admin CRUD) | `https://devapi1.homeocentrum.com/api` |
| New-API (logout, reset pwd, Family, ACL probes) | `https://devapi2.homeocentrum.com/api` |
| SPA | your local `npm start` or deployed UI |

---

## Why this note exists (Logout / classic Login)

### What happens today

1. **SPA Login** posts to **classic** (`devapi1` → Old-API `POST /Account/Login`).
2. Classic returns a **JWT** signed with classic’s signing key (`TokenKey`).
3. That JWT is stored in `sessionStorage` as `authUser`.
4. On logout, SPA now calls **New-API** (`devapi2` → `POST /Account/Logout`) with that same Bearer token, then **always** clears `sessionStorage` even if the API fails.

### What “TokenKey differ” means

A JWT is only accepted if the API can **verify the signature** with the same secret used to create it.

- If **classic `TokenKey` == New-API `TokenKey`** → New-API accepts the login token, Logout runs, `jti` is denylisted, later New-API calls with that token return **401**. That is the full SEC-03 behaviour.
- If they **differ** → New-API cannot validate the classic token → Logout returns **401** before denylist runs. The SPA still clears local session (user is logged out in the browser). But a stolen copy of that JWT could still work on New-API until natural expiry **only if** somehow New-API accepted it — which it won’t if keys differ. On **classic**, the token may still work until expiry unless classic Logout was also called.

**Local repo check:** Old-API and New-API Development both use the same `TokenKey` string today, so local/dev often works. **Deployed `devapi1` vs `devapi2` must be confirmed on the servers** — do not assume production keys match the repo files.

### What “full denylist after login cut-over” means

When SPA Login is switched to New-API (same host that does Logout):

- Login and Logout share one signing key and one denylist.
- After Logout, reusing the same JWT on New-API is always **401**.
- Until then: treat Logout as **best-effort server revoke + guaranteed local clear**.

### What you should see in Network tab today

| Case | Logout POST to New-API | SPA after logout |
|---|---|---|
| Keys match | **200** `{ success: true }` | Redirect `/login`, `authUser` gone |
| Keys differ | **401** | Still redirect `/login`, `authUser` gone (correct) |

Either case is **acceptable for Week 1** as long as the user cannot stay in the app.

---

## Smoke tests

### 1. Existing clinic login + board + one Admin master

| Step | Action | Expected |
|---|---|---|
| 1.1 | Login as **Admin** | Lands `/dashboard`; Admin clinical menu visible; **no** Velzon “Dashboards/Apps” demo block |
| 1.2 | Open one Admin master (e.g. Section or Qualifications) | List loads; Network host matches freeze (Section → classic; Qualifications → New-API) |
| 1.3 | Login as **Doctor** | Lands `/doctordashboard` |
| 1.4 | Open Patient Board for an existing patient | Board loads; no console 500 storm |
| 1.5 | Login as **Reception** | Lands `/doctordashboard`; can open board for parent doctor’s patients |

**Pass criteria:** All three roles work like before Week 1.

---

### 2. Logout (SEC-03.02) + board backup prompt

| Step | Action | Expected |
|---|---|---|
| 2.1 | As Doctor with open Patient Board tabs that have work | Click Logout |
| 2.2 | Backup prompt | Same as before: Save & Logout / Logout without saving |
| 2.3 | Network tab | `POST .../Account/Logout` to **New-API** (`devapi2`) — 200 **or** 401 |
| 2.4 | After confirm | Redirect `/login`; `sessionStorage.authUser` empty |
| 2.5 | Back button / paste `/doctordashboard` | Forced to login |

---

### 3. Forgot / Reset password (SEC-02.03)

| Step | Action | Expected |
|---|---|---|
| 3.1 | Open `/forgot-password`, submit a real user email | Network → New-API `POST /Account/ForgotPassword`; success message (generic) |
| 3.2 | Open reset link from email (`/reset-password?token=...`) | Form shows |
| 3.3 | Set new password | Success state; can login with new password |
| 3.4 | Reuse same link | Expired/invalid message |

---

### 4. Denylist after New-API Logout (SEC-03.01)

**Only meaningful if Logout returned 200** (keys match).

| Step | Action | Expected |
|---|---|---|
| 4.1 | Login, copy Bearer token from Network/login or sessionStorage |
| 4.2 | Call New-API Logout with that token | 200 |
| 4.3 | Immediately `GET /api/AdminAcl/me` with **same** token | **401** |
| 4.4 | Login again | New token works |

If step 4.2 was 401, skip 4.3 and mark: “Denylist deferred until login cut-over / key align.”

---

### 5. Directory browsing disabled (SEC-05.02)

| Step | Action | Expected |
|---|---|---|
| 5.1 | Browser open `https://devapi2.homeocentrum.com/attachments` (or your New-API base without `/api`) | **Not** an HTML file index listing |
| 5.2 | Known public blog image URL (if any) | Still loads **or** Lead confirms moved to SecureDocument |

---

### 6. Account / Pharmacy stubs + ACL (FND-02 / SEC-04.02)

| Step | Action | Expected |
|---|---|---|
| 6.1 | Login as **Account** (needs Account role user in DB) | Lands `/account/home`; stub text about M08 |
| 6.2 | Sidebar | Home, Ledger, Earnings, Payouts, Invoices, Reports only |
| 6.3 | Type `/dashboard` or `/admin/listsection` | Redirect away from Admin |
| 6.4 | Login as Doctor, type `/account/home` | Redirect to doctor home |
| 6.5 | Login as PharmacyPartner | Lands `/pharmacy/home` stub |

If you have no Account user yet: create one in UserMaster with RoleName `Account` after M01 role seed.

---

### 7. GetMenuByRole after menu seed (ADM-B04.02)

**Prerequisite:** ran `M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`.

| Step | Action | Expected |
|---|---|---|
| 7.1 | As Admin, `GET /api/mastersAPI/GetMenuByRole?userId=<accountUserId>` on New-API | Account stub URLs only (`/account/...`) |
| 7.2 | As Account user, same without other userId (or own id) | Same account menus |
| 7.3 | SPA Admin sidebar | Unchanged (still hard-coded until ADM-B04.03) |

---

### 8. Family / Caregiver (M16) — Swagger/Postman

**Prerequisite:** ran `M16_Family_Caregiver.sql`. Needs a Patient-role JWT (or Admin for setup).

| Step | Action | Expected |
|---|---|---|
| 8.1 | `POST /api/Family/LinkPrimary` `{ "patientId": <self> }` | 200 |
| 8.2 | `POST /api/Family` create child member | 200 with `memberPatientId` |
| 8.3 | `GET /api/Family/CanBookAs/{memberPatientId}` | 200 `allowed: true` |
| 8.4 | `GET /api/Family/CanBookAs/{randomOtherId}` | **403** |
| 8.5 | `POST /api/Caregiver/Grant` then ListMine | Active grant listed |
| 8.6 | Revoke → CanBookAs as caregiver | **403** |
| 8.7 | Doctor `SavePatientApp` for own patient | Still **200** (clinic path unchanged) |

---

## Result log (fill during UAT)

| # | Result | Notes |
|---|---|---|
| 1 Login / board / admin | ☐ Pass / ☐ Fail | |
| 2 Logout | ☐ Pass / ☐ Fail | Logout HTTP status: ___ |
| 3 Reset password | ☐ Pass / ☐ Fail | |
| 4 Denylist | ☐ Pass / ☐ N/A / ☐ Fail | |
| 5 Directory browse | ☐ Pass / ☐ Fail | |
| 6 Account/Pharmacy ACL | ☐ Pass / ☐ Fail | |
| 7 GetMenuByRole seed | ☐ Pass / ☐ Fail | SQL run? Y/N |
| 8 Family/Caregiver | ☐ Pass / ☐ Fail | SQL run? Y/N |

**Week 1 UAT gate:** 1, 2, 3, 5, 6 must Pass. 4 Pass or N/A. 7–8 Pass after SQL.

# M02 Dual-API Host Freeze — Wave 0 Confirmation

**Status:** CONFIRM-ONLY (no master rebuild)  
**Date:** 11 Sep 2026  
**Proof sources:** `GET /api/AdminAcl/coverage`, `UI/.../src/helpers/realbackend_helper.js` W1–W7 comments, `[Authorize(Policy = AdminPortal)]` on New-API mutate actions, `AdminProtected` in SPA.

## Rule

Keep the HTTP host each Admin screen already uses. Do **not** silently switch Old-API ↔ New-API. Do **not** rebuild Admin master UIs in S1 Week 1.

## Host map

### Frozen on New-API (`nigahomeoAPI`)

| Area | Sub-tasks | Notes |
|---|---|---|
| 3D mesh / section / hotspots | ADM-3D1.03, 3D2.03, 3D3.03 | Full CRUD; AdminPortal on mutate |
| Qualifications | ADM-B01.03 | Admin CRUD on New-API |
| Rubric–remedy save + Excel | ADM-R03.03 (split) | Save/Excel New; other repertory admin Old |
| GetMenuByRole | ADM-B04.02 | Restored; Account/Pharmacy seed is leftover |
| Package reads (doctor widgets) | ADM-B03.03 | `GetPackages` New; admin CRUD Old |
| Allopathic board dropdown | ADM-A03.03 (split) | Dropdown New; admin CRUD Old |

### Frozen on Old-API (`api`)

| Area | Sub-tasks |
|---|---|
| Repertory section / subsection / language / body part / intensity / remedy / grade | ADM-R01, R02, R04–R09 |
| Materia medica author / master / heads / remedies | ADM-M01–M04 |
| Diagnosis system / therapeutics / conditions | ADM-D01–D03 |
| Drug system / drug group / allopathic admin | ADM-A01–A03 |
| Question taxonomy / clinical questions | ADM-Q01–Q02 |
| Lab catalog (`PatientLabTest`); board reads classic `PatientLab` | ADM-B02.03 |
| Package admin CRUD | ADM-B03.03 |
| Roles / RoleDetails / MenuMaster admin | ADM-B04.* |

## Leftover

- **ADM-B04.02** — Apply live Account/Pharmacy `MenuMaster` + `RoleDetails` seed (Wave 1). SPA still uses hard-coded `LayoutMenuData` until UI ticket ADM-B04.03.

## How to re-verify on UAT

1. Login as Admin → open one screen per wave → Network tab shows expected host.
2. Login as Doctor → mutate on New-API AdminPortal endpoint → **403**; board reads → **200**.
3. `GET /api/AdminAcl/coverage` → phases W0–W7 `status: done`.

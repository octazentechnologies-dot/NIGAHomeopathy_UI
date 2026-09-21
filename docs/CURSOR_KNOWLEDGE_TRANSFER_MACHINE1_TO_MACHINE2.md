# Cursor Knowledge Transfer: Machine 1 → Machine 2

## 0. Document Metadata
- **Project/workspace name:** NIGA Homeocentrum / Homeopathy (multi-root: New-API, Old-API, UI)
- **Date generated:** Wednesday 16 Sep 2026
- **Saved to disk:** Thursday 17 Sep 2026 (this file). Original extraction was chat-only because the extraction prompt forbade writing a project `.md`.
- **Machine 1 workspace:** `/Users/OctazenWork/NIGA_Homepathy` with folders `New-API`, `Old-API`, `UI`
- **Purpose:** Transfer Machine 1 Cursor conversation knowledge, decisions, rules, bugs, and constraints to a fresh Machine 2 session. Not a source-code dump.
- **Sources consulted:** Agent transcripts under NIGA-related Cursor project folders (especially `Users-OctazenWork-NIGA-Homepathy-New-API`); gitignored UI docs created in those chats; dual-API helper comments; read-only git status/branch; verification of key files.
- **Sources unavailable:** Empty Cursor agent stores (`c7daeab3-…`, personal store `u278660176`); no repo `.cursor/rules`, `.cursorrules`, or `AGENTS.md`; no live DB/server inspection; Excel tracker formulas not re-executed.
- **Coverage limitations:** Older chats (Jul–Aug 2026) used path `/Users/OctazenWork/NIGA Project/` (NigaHomeopathy-API / NIGA_Latest_Code_API / minimal). Current work is `/Users/OctazenWork/NIGA_Homepathy/`. Historical audio-case / import / publish chats exist but were not the active Machine 1 sprint after 3 Sep 2026. Excel “Done” cells are often stale vs code.
- **Confirmation:** Original extraction did not modify code. No credentials, tokens, connection strings, or secret-bearing config values are included. Where secrets appeared historically they are `[REDACTED]`.

---

## 1. How Machine 2 Cursor Must Use This Context

This document is transferred context from Machine 1. It is historical knowledge: what the developer taught Cursor, what was decided, what broke, and what must not be done.

- **Current source code on Machine 2 is the authority** for implementation.
- Use this document for business context, dual-API rules, sprint scope, password-migration caveats, search-approach intent, and “do not rebuild” constraints.
- Do **not** blindly follow outdated information. If this document conflicts with current code, investigate and prefer code unless the user restates the rule.
- Do not invent missing information. Label unknowns as Unknown.
- Preserve existing production behavior unless explicitly asked to change it.
- Avoid unnecessary refactoring.
- Consider production impact and backward compatibility (shared DB `HomeoCentrum_Production`, live clinic login).
- Do not expose or request secrets.
- Do not ask the user to repeat information already contained here unless clarification is genuinely required.
- The user’s default workflow is: **analyze / explain first → wait for “approve” → then implement**. Do not implement on the first ask unless they already said approve.

---

## 2. Machine 2 Onboarding Checklist

1. Read this context completely.
2. Inspect the Machine 2 workspace: three **separate git repos** (`New-API/NIGA_NewAPI`, `Old-API/NIGA_OldAPI`, `UI/NIGAHomeopathy_UI`).
3. Confirm current branches (Machine 1 last seen): UI `M01_and_M02_WebTask_V1.0`; New-API and Old-API `M01_and_M02_V1.0`.
4. Validate dual-API host map against `src/helpers/realbackend_helper.js` and `docs/M02_DUAL_API_HOST_FREEZE_CONFIRMATION.md` (UI `docs/` is **gitignored** — may be missing if not copied).
5. Understand recovered business rules: one ecosystem, no third API, login still classic, new HTTP only on New-API.
6. Understand historical decisions: M02 ACL freeze, PBKDF2 lazy hash, SearchNormalized FTS, infinite-scroll page sizes.
7. Identify outdated/conflicting information (Excel vs code; `config.js` host comments; local ports).
8. Use this context on new tasks. Do not modify code merely because this document was pasted.
9. Wait for the developer’s next development request.

---

## 3. Executive Context

Homeocentrum is a **homeopathy clinic SaaS**: doctors take cases, search repertory rubrics, repertorize, prescribe; admin maintains masters; reception books; future Account / Pharmacy (HomeoMeds) / Patient website / Patient+Doctor mobile apps.

Machine 1 work (3–16 Sep 2026) was **not** audio-case engine work. It was:

1. Multi-root Cursor workspace for three repos.
2. **M02 Admin Clinical ACL** (W0–W7/W8): doctor vs admin mutate; dual-API host freeze; do not rebuild Admin UIs.
3. **M01 Foundation Security:** PBKDF2 lazy password migration, logout denylist, forgot/reset, Account/Pharmacy stubs, Family/Caregiver APIs.
4. **35-day production sprint tracker Excel** (S1–S5) with intern-level task explanations and dashboards.
5. **S1 Week 1 web-only implementation** (Waves 0–5) after plan approval.
6. **Infinite scroll** on selected Patient Board lists (server page sizes unchanged).
7. Merge `origin/Dev_V1.0` into UI `M01_and_M02_WebTask_V1.0` without dropping M01/M02.
8. **Search-approach documentation** of Repertory FTS vs keyword `Contains` (16 Sep 2026).
9. Ops: local dual-API run/restart; publish both APIs; new VPS slower than in-house production after `.bak` restore.

**Product constraint the user repeated:** if a **new** HTTP API is needed, create it **only in New-API**. Never a third API. Do not silently switch an existing call from Old-API to New-API.

---

## 4. Conversation Index

Cite as `[title](uuid)` without `.jsonl`.

### Active Machine 1 workspace (`NIGA-Homepathy-New-API`)

| Title | ID | Date | Why it matters | Key takeaways |
|---|---|---|---|---|
| Search APIs deep analysis + MD | [Search APIs analysis](c7daeab3-82eb-4d0e-b153-d5cc1551d893) | 16 Sep 2026 | Latest work | Document **new search approach only**; explain first; MD only after approve; path `UI/NIGAHomeopathy_UI/docs` |
| M02/M01 + 35-day sprint + tracker | [M02 M01 sprint tracker](e178ebbf-812f-469c-aa55-8da3b7c5a096) | 4–11 Sep 2026 | Core teaching | Dual-API rule; ACL meaning; SQL manual on server; password hash bugs; Excel must be intern-detailed; dashboards must sync S1–S5 → module sheets |
| S1 Week 1 web plan + UAT | [S1 Week1 web](ff172052-9492-42d6-b54f-e9046b701e72) | 11–12 Sep 2026 | Sprint execution | Approve remaining Waves 0–5; web-only (not UI/M00); APIs reusable by mobile; Excel vs code truth; Logout TokenKey caveat |
| Infinite scroll Patient Board | [Infinite scroll lists](9f5ae893-4f7a-49ad-ae96-f464a57e09df) | 13 Sep 2026 | UX contract | Inspect first; keep API pageSize; approved 4 lists + Adverse Effect UI-only; admin only View Remedial Rubrics |
| M01 security implementation prompt | [M01 New-API security](608fe3e8-cfe8-4f5d-9c0d-b08129fdf504) | 5 Sep 2026 | Hash contract | Explicit PBKDF2 prefix, lazy migrate, never return password, New-API only |
| Merge Dev into M01/M02 UI | [UI merge Dev_V1.0](8e8830a9-bb06-4949-b34f-cbfa451cf768) | 15 Sep 2026 | Branch policy | Preserve M01/M02; don’t rewrite config URLs; no speculative changes; then user asked for merge commit + `.DS_Store` gitignore |
| roles.js merge | [roles.js merge](5b4792b5-29d9-47f2-bb9c-ed0701ebb7e7) | 9 Sep 2026 | ACL vs layout | Keep both AdminPortal helpers and Dev layout exports |
| Login 200 then dashboard error | [Dashboard 401 overlay](97874575-dc1c-4e48-b035-c6367c48022e) | 9 Sep 2026 | Dual-token pitfall | Login OK on classic; later 401 shown as “Invalid username or password”; explain first |
| Run/restart both APIs | [Local both APIs](c5e4ddb0-9db2-45d1-9992-5b933f239465) | 4–12 Sep 2026 | Dev ops | User repeatedly needs both New-API and Old-API running locally |
| Publish both APIs | [Publish both APIs](4232fbd5-a3eb-4fd2-927d-f8e1e4fc88d8) | 9 Sep 2026 | Deploy | Publish New-API and Old-API |
| New VPS slow after .bak | [VPS restore delay](15851457-620c-4360-b9be-860ad76f830b) | 4 Sep 2026 | Production vs Dev DB | Do not change code; FTS/stats/indexes/hardware; production is in-house PC |
| gitignore docs + build | [Ignore docs/build](9edbfcff-6e69-406c-9536-6a6b500ccea9) | 8–11 Sep 2026 | Repo hygiene | `docs/` local-only; `build/` should not go to git |
| Separate git repos in Cursor | [Multi-root git](0032621d-c50d-47f3-864c-cd3536b564bc) | 3 Sep 2026 | Workspace | Three repos must show separately in Git Changes |

Related earlier workspace chats (same product, older folder): [Workspace git visibility](b59ff7bb-1b4c-4f34-8d73-6cd9b9168929), [gitignore appsettings](ecb3da39-f35a-4a80-a066-0ec43f4b1dcf).

### Historical (Jul–Aug 2026, `/Users/OctazenWork/NIGA Project/`)

Large body of Audio Case / AI rubric / Excel import / publish / Patient Board Questions tab / multi-select Section on SubQuestionGroup. Useful background, **not** the Sep sprint’s active scope. Examples: [Audio case docs](b7faec6f-f2d0-4808-b513-716e9bd4b8dc), [SubQuestionGroup sections](e7f86603-77e9-4d79-a03d-8a1eaa5558d2), [Questions tab](c16ecacd-616d-4c28-8c28-bb34841b1cb8).

---

## 5. What I Explained / Taught Cursor

**Explicit** developer instructions (preserve their meaning):

### Workflow
- “Do Deep analysis of codebase first… do not skip any point.”
- “Do not directly implement when I approve then implement.”
- After explanation, they type **`approve`** (sometimes with a path or wave list).
- “When you implement any plan or module then check any impact on already going functionality.”
- Prefer **one** reference document, not many small verification guides.
- SQL on production/UAT is executed **manually by the user** on the server. Cursor should produce scripts and tell them which to run — not assume they ran.

### Architecture they stated
- New-API, Old-API, UI are **three separate git repos**.
- “If need to create new API then always create into the New_API.”
- “Need both API Old-API & New-API.”
- Web APIs must be **reusable for Mobile** (same URL/JSON/JWT). No `/api/mobile/*` duplicates.
- S1 Week 1 work: **only Web Frontend / Web API / Web Other** — not UI track, not M00 PRE client gates.
- M02 Admin screens: **do not rebuild**; freeze the host each screen already uses.
- Login stays on classic until a **formal cut-over**. Same for Rx-write and Razorpay.

### Passwords (explicit in M01 prompt + later Q&A)
- Existing `UserMaster` passwords were **plaintext**.
- `UserPassword` was MaxLength 50 and **must be widened** (script to NVARCHAR(500)).
- Format: PBKDF2 with prefix `PBKDF2$v1$` so hashed vs plaintext can be detected.
- On login: if hashed, verify; else plaintext compare then **re-hash and save** (lazy migrate).
- Never return `UserPassword` in API responses.
- User asked: after login/logout/relogin, is it hash or plaintext? They observed plaintext **even after column size 500** and demanded explain-then-approve before more changes.
- User will login as Admin **and** Doctor after running SQL themselves.

### Search (16 Sep 2026)
- Explain logic of four live URLs (Old `SearchBySectionPaged`, Old `SearchGlobal`, New `SearchRubricsByKeyword` with/without `sectionIds`).
- Include API + frontend + DB.
- “Do not skip any logic for searching which is new approach implemented.”
- “Also mention tab or module where this API used.”
- “Also need new approach only which is implement earlier.”
- MD file only after approve, at `UI/NIGAHomeopathy_UI/docs`.

### Tracker / sprint
- 35 days to production handover.
- Week-wise sprints S1–S5, module-wise like M02.
- Interns/trainees need **what exactly to develop** (fields, menus, files), not slogans.
- Put sprint plan **into the original Excel**, don’t create a separate untraceable sheet.
- Status change on S1_Week1…S5_Week5 **must reflect** on M00–M19 sheets and dashboards.
- Work bifurcation must be separate tracks: UI, Web Frontend, Web UI, Web API, API Mobile, Mobile UI, Mobile Frontend, QA, Database, etc.

### Infinite scroll (13 Sep 2026)
- Production React ERP. **Do not immediately modify.**
- Keep server page size. Do not fetch all. Do not switch to client pagination.
- IntersectionObserver + fill-container auto-load.
- Approved Patient Board: Questions rubrics (10), Clinical Pattern rubrics (10), Repertory subsection search (40), Repertorize accordion (10).
- Adverse Effect: **same UX pattern, no API/server change.**
- Admin: **only** “View Remedial Rubrics” approved from a larger candidate list.

### Git / Cursor
- Git Changes must show New-API, Old-API, UI **separately**.
- `UI/NIGAHomeopathy_UI/docs` → `.gitignore` (local only, do not push).
- `build/` should not be committed.
- Add `.DS_Store` to gitignore.
- Merge Dev into M01/M02: do **not** blindly take Current or Incoming; preserve M01/M02; do not change env URLs unless the merge requires it.

### Ops they described
- They can set up a new hosting server like production and restore `HomeoCentrum_Production.bak`.
- Production data load is “very very fast”; new server is slow; they asked whether they need indexing. **Do not change code.**
- They named machines: `DESKTOP-I7AMAS6` = in-house production PC; `Server1038\NIGA` = cloud VPS Dev.

---

## 6. Knowledge Not Obvious From Source Code

| Item | Classification | Notes |
|---|---|---|
| Three folders are **three git remotes**, not one monorepo | Explicit | Cursor Git pane only shows the folder that is the git root unless a multi-root `.code-workspace` is used. `*.code-workspace` is gitignored. |
| UI `docs/` is intentionally **not in git** | Explicit | Search MD and S1/M02 docs live only on the machine unless copied. |
| Excel tracker statuses are often **wrong** vs code | Observed | Always use code truth; user still updates Excel for management tracking. |
| Login SPA → **Old-API**; Logout SPA → **New-API** | Explicit / Observed | If JWT `TokenKey` differs, Logout 401 is expected; UI still clears session. Full denylist only after login cut-over. |
| Shared DB name `HomeoCentrum_Production` for FTS script | Observed | SearchNormalized setup is a **manual** SQL script, not an EF migration. |
| FTS `OR` vs LIKE fallback `AND` | Observed | Same query can return fewer rows if FTS is missing. |
| New-API `SearchRubricsByKeyword` is **substring Contains**, not FTS | Observed | `Father` matches `Grandfather`. No `SearchNormalized` on New-API entity. |
| Keyword `sectionIds` come from **admin mapping tables**, not from the search engine | Observed | `DiagnosisKeywordSection` and Question SubGroup sections. |
| Production vs VPS speed is hardware + restore (stats/FTS/indexes), not app code | Explicit request + Observed explanation | User forbade code changes. |
| Commented `config.js` blocks **swap** Old/New hosts in one historical Hostingraja snippet | Observed | Easy to point SPA at the wrong API. Active Machine 1 export: DEV `devapi1` (classic) + `devapi2` (New). File was **locally modified, uncommitted**. |
| Local ports in comments: New `:5038`; Old `:5001` in config comments vs earlier “`:5000`” | Conflict / Observed | Verify on Machine 2. |
| PBKDF2 string is longer than 50 chars; if SQL widen did not actually apply to the **instance EF uses**, hash save fails and plaintext remains | Observed | Message: “Login OK but password could not be stored hashed. Run M01_Foundation_Security_Server.sql…” |
| User saw column size 500 **and** plaintext | Explicit | Lazy hash only runs on successful login through an API that implements hasher. SPA login is classic; both APIs have hasher files. A user who never hit that login path stays plaintext. Truncated hash can look like garbage/plaintext. |
| Doctor dashboard overlay “Invalid username or password” after login 200 | Observed | Axios/global handler treating **any** 401 (e.g. New-API backup/count with classic JWT) as login failure. User asked explain-first; **approval to implement was not given in that chat**. |
| W8 | Partial | User asked if W8 is QA vs our side; then said “Approve W8”. Exact W8 contents not fully recovered here. |
| 35-day handover deadline | Explicit | Sprint S1–S5; delivery pressure is real. |
| Pharmacy console = **HomeoMeds**, not a 6th PDF portal | Observed (FIVE_PORTALS_MAP) | Account + Pharmacy S1 layouts are **stubs only**. |
| `PackageEntryDetail` = SaaS subscription only, never consult/medicine billing | Observed (shared-key doc) | |
| `AudioCaseConsentLog` vs `ConsentRecord` for telemedicine — do not make a third consent table | Observed | |
| ffmpeg on IIS required for long audio chunked Whisper | Historical explicit | Laptop without ffmpeg stays full-file Whisper. |
| SearchNormalized must exist on server or global search times out | Observed (UI error copy) | |

---

## 7. Business Understanding

**Product:** Homeocentrum — clinic operating system for homeopathic doctors.

**Actors:** Doctor (Patient Board, repertorize, Rx), Reception (shared doctor dashboard shell, JWT may include parent `DoctorID`), Admin/Management (masters, `/dashboard` + `/admin/*`), future Account (money), PharmacyPartner (HomeoMeds), Patient (website + app), Caregiver (acts for a patient).

**Core clinical workflow (Patient Board):**
- **Repertory:** pick SECTION → tree of SUB SECTIONS (rubrics) → rubric details/remedies. New search: type in top bar (global) or SUB SECTION box (section-scoped).
- **Clinical Pattern:** pick diagnosis → keyword tab → keyword chip (may carry section IDs) → live rubric search.
- **Questions:** Question Section → Group → Sub-group name as keyword → same New-API search.
- Clicking a rubric still loads **remedies via Old-API** `getRubricDetails`.
- **Repertorize:** accordion of selected rubrics (server page 10).

**Masters:** repertory sections/subsections/remedies/grades, materia medica, diagnosis systems/keywords, questions taxonomy, 3D anatomy hotspots (New-API), drugs.

**Security/business split:**
- Admin mutates clinical masters; Doctor **reads** on the board (403 on New-API AdminPortal mutate).
- Account must not get Admin money-opposite menus after seed; Account JWT 403 on AdminPortal.

**Search business intent (new approach):**
- Repertory search must feel like a **tree** (parent rubric path), ranked, fast on huge `SubSectionMaster`.
- Clinical Pattern / Questions search is “find rubrics whose **name or section name contains this keyword**,” optionally limited to mapped sections — not the old mapped-only `GetRubricByKeywordID` list.

---

## 8. Project-Specific Rules

### Explicit Rules
- New HTTP → **New-API only**. **No third API.**
- Do not silently switch Old-API ↔ New-API for an existing screen.
- Keep classic until cut-over: **Login, Rx-write, Razorpay**.
- Mobile reuses the same APIs; no `/api/mobile/*` clones.
- Do not implement until the user approves (unless they already combined approve in the same message).
- Do not skip tasks/points they listed.
- SQL for server DB: give script + order; user runs it.
- `UserPassword` hashing: `PBKDF2$v1$` prefix; lazy migrate plaintext.
- Do not return passwords in responses.
- Do not rebuild M02 Admin master UIs in S1 Week 1.
- Infinite scroll: do not change backend pageSize; prevent duplicate in-flight pages.
- Search write-up: new approach only; include tab/module.
- `docs/` not pushed; `build/` not pushed; `.DS_Store` ignored.
- Merge Dev into M01/M02: preserve M01/M02; don’t rewrite unrelated files; don’t change package versions unless the conflict requires it.
- Do not commit/push unless the user asks (user rule). Exception: they did ask to conclude the Dev merge commit.
- Do not change code when diagnosing VPS slowness.

### Observed Conventions
- Dual clients in SPA: `api` = `API_URL` (Old), `nigahomeoAPI` = `API_URL_NIGAHOMEOPATHY` (New).
- AdminPortal = RoleId **1** or role name Admin/Management.
- Doctor/Reception hitting `/admin/*` or `/dashboard` redirect to `/doctordashboard`.
- Array query params serialized as repeated keys: `sectionIds=1&sectionIds=41`.
- Verification docs live under gitignored `UI/NIGAHomeopathy_UI/docs/`.
- Tracker file name includes `(1).xlsx` copies; user iterates on those filenames.

### Inferred Behavior
- `config.js` is machine-local; each machine comments/uncomments host blocks. Treat committed vs working copy as possibly different.
- Production in-house SQL is more tuned (FTS, stats) than a fresh `.bak` on VPS.

### Unknown
- Exact production TokenKey equality Old vs New.
- Whether Machine 2 will use localhost, `devapi*`, or production hosts.
- Whether Appointment calendar-filter / Patient DOB type-in were finished after 13 Sep 2026.
- Whether dashboard 401 overlay was ever approved/fixed.

---

## 9. Decisions, Reasoning, and Rejected Approaches

1. **Dual-API freeze vs porting all Admin to New-API**  
   Problem: two APIs, live clinic.  
   Selected: freeze hosts; ACL-lock mutate; new work on New-API.  
   Rejected: silently moving Admin CRUD; third API; rebuilding Admin UIs.  
   Consequence: “Done” for M02 `.03` often means **correct host + ACL**, not a rewrite.

2. **Password hashing**  
   Problem: plaintext in DB, column 50 chars.  
   Selected: widen column + PBKDF2 prefix + lazy upgrade on login + optional admin bulk migrate.  
   Rejected: overnight force-hash without widen; storing hashes in 50-char column.  
   Consequence: login can succeed while hash persist fails; user must run SQL; both APIs have hasher.

3. **Login cut-over postponed**  
   SPA still posts login to Old-API. Logout/forgot/reset go New-API.  
   Reason: less risk to production login.  
   Consequence: JWT denylist incomplete for SPA token; 401s on New-API calls.

4. **SearchNormalized + CONTAINSTABLE for Repertory**  
   Replaced slow `SubSectionsBySearch` LIKE.  
   Ancestors returned so UI can rebuild tree.  
   LIKE fallback is AND (stricter). OFFSET inlined due to EF Core 2.2 `FromSql` param bug.

5. **SearchRubricsByKeyword on New-API**  
   Replaced mapped `GetRubricByKeywordID` for board keyword/sub-group clicks.  
   Live Contains on name/section + optional sectionIds.  
   Remedies still Old-API.

6. **S1 Week 1 scope**  
   Included 53 web rows; excluded M00 PRE, UI `ADM-B04.03` (GetMenuByRole in SPA), Web UI family screens, QA, mobile bootstrap.  
   User approved “Full remaining queue Waves 0–5”.

7. **Tracker Excel as the team OS**  
   Rejected a second sprint workbook. Dashboards must follow S1–S5 status. Intern-level “what to build” text required.

8. **Infinite scroll subset**  
   User listed all Doctor lists first, then approved only 1,2,3,5 plus Adverse Effect without API change, plus one admin page.

9. **Gitignore docs**  
   Planning/verification markdown stays local so it is not pushed with product code.

---

## 10. Problems, Bugs, Debugging Knowledge, and Workarounds

| Problem | Symptoms | Root cause / lesson | Avoid |
|---|---|---|---|
| Hash not stored | Login message: password could not be stored hashed | Column still 50 on the DB EF uses, or save truncated | Run `M01_Foundation_Security_Server.sql`; confirm **actual** column length on that instance |
| Still plaintext after 500 | User screenshot of 500 + plaintext | Lazy migrate only on login through hasher API; user may not have logged that account; or looking at a row never upgraded | Don’t assume SQL widen = all rows hashed |
| Login then 500 “An error occurred during login” | After hash work | Unknown exact stack in this recovery; likely hash/EF/maxlength/exception swallowed | Check both API logs; don’t treat as wrong password |
| Relogin “Invalid username or password” after hashing | Hash stored but other API still plaintext-compares, or truncated hash | Both APIs must use same hasher; Token/login host must match stored format | Keep Old+New hasher in sync |
| Dashboard overlay Invalid username/password after login 200 | CRA error overlay | Later 401 mapped as login error (classic JWT vs New-API, or interceptor) | Don’t assume login failed; check Network for the **second** call |
| Logout 401 | Expected until TokenKey/cut-over | Documented; UI clears session anyway | Don’t “fix” by switching login host without a cut-over plan |
| Global subsection search timeout | SweetAlert mentions SearchNormalized | FTS catalog missing on that DB | Run `SubSection_SearchNormalized_Setup.sql` |
| EF paged FTS empty while count > 0 | Fallback LIKE | EF Core 2.2 FromSql OFFSET param bug; values inlined | Don’t “fix” by binding @Offset |
| New VPS slow | Wait for data vs in-house fast | Restore `.bak` ≠ tuned production (stats, FTS populate, RAM, MAXDOP, cold cache) | Don’t “optimize” app first; DBA/index/FTS/stats |
| Git Changes shows one repo | User thought bugs | Multi-root workspace required | Don’t merge three repos |
| Excel dashboard DIVIDE errors | `'Total'` text vs number | Pivot/measure treated header text as value | Keep numeric measures; watch Total rows |
| S1 status not flowing to M-sheets | Dashboard stale | Formulas/scripts needed (`_sync_sprint_status_to_modules.py` in docs) | Changing only S1 cells isn’t enough unless sync exists |
| Merge roles.js | Failed pull | HEAD ACL helpers vs Dev layout exports | Keep **both** |
| fakeBackend | Was still on before S1 Wave 4 | Could mask real API errors | SEC-01.03 removed it from `App.js` — don’t put it back on production path |

---

## 11. Constraints, Assumptions, and Must/Do-Not-Change Items

**Must not change without explicit ask:**
- Dual-API host of each existing Admin/board call.
- Classic login / Rx-write / Razorpay hosts.
- Server page sizes for the infinite-scroll lists (10 / 10 / 40 / 10).
- AdminPortal policy meaning (RoleId 1 / Admin / Management).
- Shared keys (`DoctorId`, `PatientId`, `PatientAppId`, …).
- `PackageEntryDetail` meaning (SaaS only).
- Consent table split (audio vs ConsentRecord).
- M02 master screen UX rebuild.
- Production connection strings / `config.js` URLs unless the user is changing environment.

**Assumptions Machine 1 used:**
- Shared SQL Server DB conceptually named HomeoCentrum_Production.
- User can run SQL on server.
- Team includes interns; Excel is how they are assigned work.
- 35-day production target still active as of 7 Sep 2026.

**Do-not-break:** Patient Board repertory/clinical/questions, login for Admin+Doctor+Reception, repertorize, existing Admin CRUD on frozen hosts.

---

## 12. Historical Context

- **Jul–Aug 2026:** Heavy Audio Case / AI rubric / Excel import / IIS publish / Patient Board Questions / SubQuestionGroup multi-section. Lived under `/Users/OctazenWork/NIGA Project/`.
- **~3 Sep 2026:** Work moved to `/Users/OctazenWork/NIGA_Homepathy/` with three repos; Cursor workspace struggle.
- **4–5 Sep:** M02 W0–W7 ACL + dual-API; then M01 security plan/implementation.
- **6–7 Sep:** Password widen/hash bugs; 35-day sprint Excel.
- **8–11 Sep:** gitignore docs/build; tracker dashboard math; work bifurcation.
- **11–12 Sep:** S1 Week 1 web plan approved and implemented (Waves 0–5); UAT smoke; SQL list for user.
- **13 Sep:** Infinite scroll on selected board lists.
- **15 Sep:** Merge `Dev_V1.0` → UI `M01_and_M02_WebTask_V1.0`.
- **16 Sep:** Search-approach analysis + `SUBSECTION_SEARCH_NEW_APPROACH.md` in gitignored docs.

---

## 13. Current Project State

**As of Machine 1 extraction (16 Sep 2026), read-only git:**

| Repo | Branch | Dirty |
|---|---|---|
| UI | `M01_and_M02_WebTask_V1.0` tracking origin | Modified: tracker xlsx, `src/config.js` |
| New-API | `M01_and_M02_V1.0` | Clean |
| Old-API | `M01_and_M02_V1.0` | `.DS_Store` |

**Completed on Machine 1 (conversation + docs; verify on Machine 2):**
- M02 W0–W7 AdminPortal ACL + coverage endpoint + SPA `AdminProtected`.
- M01 hasher on New-API and Old-API; forgot/reset/change; logout denylist wiring (S1 Wave 3–4).
- S1 Waves 0–5: host-freeze doc, menu seed script, shared-key/five-portals docs, JWT denylist check, directory browsing removed, AccountPortal stub, doctor ownership on some appointment APIs, audit helper on packages, fakeBackend removed, logout/reset UI, Account/Pharmacy stub routes, Family/Caregiver APIs.
- Infinite scroll on approved Patient Board lists.
- UI merge from Dev with combined `roles.js`.
- Search documentation file (local `docs/` only).

**Current/last work:** Search knowledge transfer / this handoff. No further product coding after the search MD.

**Partial / pending:**
- Formal **login cut-over** to New-API (still classic).
- SPA consume `GetMenuByRole` (`ADM-B04.03`, excluded from S1 web filter).
- Family/caregiver **screens** (Web UI excluded).
- Remaining S1 Excel rows that were never in the web filter (QA, mobile, M00 PRE).
- User was given completed ID list to mark Done in Excel; whether they finished marking is Unknown.
- Appointment View All calendar filter + Patient DOB dual input: requested; completion Unknown.
- Dashboard 401 overlay: explained; implement approval Unknown.
- W8 exact leftover: Unknown.

**SQL user said they already ran (12 Sep):** `M01_Foundation_Security_Server.sql`, `M02_W7_MenuMaster_Account_Pharmacy_Seed.sql`, `M16_Family_Caregiver.sql` — **on their environment**; Machine 2 DB may differ.

**High-risk:** `config.js` local DEV URLs; TokenKey mismatch; SearchNormalized presence; password column/hash state.

---

## 14. Concise Technical Map

- **Old-API:** ASP.NET Core 2.2 `NIGA.Centrum` — login, most Admin CRUD, repertory FTS search, Rx, Razorpay, diagnosis keyword mapping.
- **New-API:** .NET 8 `Niga-Web` — new modules, M01 security tables, 3D, WhatsApp, Audio Case, `SearchRubricsByKeyword`, Family/Caregiver, AdminAcl.
- **UI:** React 18 CRA Velzon Redux — one SPA, two axios bases.
- **DB:** SQL Server, shared. Manual scripts under each API `Database/Scripts`.
- **Auth:** JWT; claims `RoleId`, `RoleName`, `DoctorID`, `jti`.
- **Logging/errors:** SPA axios interceptor; Old search swallows exceptions to empty lists.
- **Background:** Audio Case / Whisper historical; not Sep sprint focus.

---

## 15. Important Code Locations

`Feature → Project → Path → Symbol → Purpose`

- Dual-API rule → UI → `src/helpers/realbackend_helper.js` → header comment + `api` vs `nigahomeoAPI`
- Hosts → UI → `src/config.js` → `API_URL` / `API_URL_NIGAHOMEOPATHY` (local dirty)
- Array query stringify → UI → `src/helpers/api_helper.js` → `createAPIHelpers.get`
- Repertory search UI → UI → `src/pages/Doctor/PatientBoard/PatientBoard.js` → global/section search effects
- Search utils → UI → `src/utils/subSectionSearchUtils.js`
- Keyword search thunk → UI → `src/slices/doctor/patientdashboard/thunk.js` → `searchRubricsByKeyword`
- Admin ACL UI → UI → `src/Components/constants/roles.js`, `AdminProtected`
- FTS search → Old-API → `NIGA.Centrum.Business/Implementation/SubSectionService.cs` → `Search*`, `CONTAINSTABLE`, LIKE fallback, ancestors
- FTS SQL → Old-API → `Database/Scripts/SubSection_SearchNormalized_Setup.sql`
- Keyword search → New-API → `Niga-Web/Controllers/SubSectionController.cs` → `SearchRubricsByKeyword`
- Keyword query → New-API → `Niga-Domain/Repositories/SubSectionRepository.cs` (`SubSectionService`) → `SearchRubricsByKeywordAsync`
- Password hash → both APIs → `UserPasswordHasher.cs` (`PBKDF2$v1$`)
- AdminPortal → New-API → `Niga-Domain/Authorization/AdminAuthorizationPolicies.cs`
- Coverage map → New-API → `Niga-Web/Controllers/AdminAclController.cs` → `coverage`
- Search MD (local) → UI → `docs/SUBSECTION_SEARCH_NEW_APPROACH.md`
- S1 plan (local) → UI → `docs/S1_WEEK1_WEB_FRONTEND_API_OTHER_FULL_PLAN.md`
- Tracker → UI → `NIGA_PENDING_IMPLEMENTATION_TASK_TRACKER (1).xlsx` (dirty)

---

## 16. DO NOT BREAK / High-Risk Areas

- **Production login** (classic). Hash migration can lock users if one API hashes and the other still expects plaintext, or if hashes truncate.
- **Patient Board search:** FTS OR vs LIKE AND; SearchNormalized trigger; 45s global timeout.
- **Dual-API TokenKey:** New-API 401 after classic login looks like “bad password.”
- **Admin mutate ACL:** Doctor must keep board reads; must not gain master delete.
- **Repertorize / Rx-write / Razorpay** still classic.
- **Infinite scroll:** duplicate fetches, pageSize drift.
- **EF Core 2.2 FromSql** OFFSET parameters.
- **Shared DB scripts** applied twice or on the wrong instance.
- **`config.js` host swap** in commented blocks.

---

## 17. Conflicts and Possibly Outdated Information

| Topic | Historical | Current observed | Conflict | Confidence |
|---|---|---|---|---|
| Excel S1 M01 rows “Not Started” | Tracker | Code has hasher, logout, family APIs | Excel stale | High |
| S1 plan “fakeBackend still on / logout never calls API” | Written 11 Sep before Wave 4 | Wave 4 implemented same day | Plan body partially outdated; header says implemented | High |
| JWT denylist “never checked” in plan encyclopaedia | Pre-Wave 3 | Wave 3 added `OnTokenValidated` | Same | High |
| Old API local port 5000 vs 5001 | Early analysis vs config comments | Verify | Medium |
| Production URL comments in `config.js` | Multiple commented maps, one swaps hosts | Working export is `devapi1`/`devapi2` | Don’t copy comments blindly | High |
| Login hashing “both APIs” vs “SPA login classic only” | Implementation on both | Lazy migrate on New login may not run for SPA users | Users can stay plaintext until classic login upgrades | High |
| Search “new approach” vs Audio Case FTS on `SubSectionName` | User asked new approach only | Scripts 725/726 and hotspot search still in New-API | Different product path; don’t mix | High |
| W8 | Approved 4 Sep | Coverage endpoint lists W0–W7 | W8 may be QA/docs | Low |

---

## 18. Open Questions / Unrecovered Knowledge

- Unknown: Machine 2 intended API hosts and whether `docs/` and dirty `config.js` were copied.
- Unknown: whether dashboard 401 overlay was fixed.
- Unknown: Appointment calendar / DOB tasks completion.
- Unknown: W8 detailed scope.
- Unknown: whether production and New-API share JWT TokenKey.
- Unknown: full remaining S1 IDs after user Excel update (user asked for paste list 12 Sep).
- Unknown: client cash/GST/vendor decisions (M00 PRE excluded by user).
- Unknown: SMS vendor (OTP stub only).

---

## 19. Lessons Learned

- Always **explain, then wait for approve**.
- **Code truth > Excel.**
- **New API = New-API repo only**; freeze existing hosts.
- Password work is **DB column + both APIs + which login host the SPA uses**.
- 401 after login is often **the next call**, not login.
- Repertory search needs **FTS objects on that SQL instance**.
- Don’t rebuild working Admin screens.
- Don’t push `docs/` or `build/`.
- Interns need field-level task text.
- Preserve M01/M02 when merging Dev.
- Manual SQL is part of the delivery; tell the user the exact script names and order.

---

## 20. Source Appendix

**Conversations searched/read (parent jsonl):**  
`c7daeab3-82eb-4d0e-b153-d5cc1551d893`, `e178ebbf-812f-469c-aa55-8da3b7c5a096`, `ff172052-9492-42d6-b54f-e9046b701e72`, `9f5ae893-4f7a-49ad-ae96-f464a57e09df`, `608fe3e8-cfe8-4f5d-9c0d-b08129fdf504`, `8e8830a9-bb06-4949-b34f-cbfa451cf768`, `5b4792b5-29d9-47f2-bb9c-ed0701ebb7e7`, `c5e4ddb0-9db2-45d1-9992-5b933f239465`, `15851457-620c-4360-b9be-860ad76f830b`, `9edbfcff-6e69-406c-9536-6a6b500ccea9`, `4232fbd5-a3eb-4fd2-927d-f8e1e4fc88d8`, `97874575-dc1c-4e48-b035-c6367c48022e`, `0032621d-c50d-47f3-864c-cd3536b564bc`; indexes of other NIGA project folders (Jul–Aug historical).

**Rule files read:** none in-repo. User Cursor rules (commit/PR/browser verify) applied as session rules, not project files.

**Git evidence:** read-only `rev-parse` / `status -sb` on three repos. No history dump.

**Code/docs used for verification:** `realbackend_helper.js`, `config.js`, `api_helper.js`, `UserPasswordHasher.cs`, `AdminAclController.cs`, `SubSectionService` search, `SearchRubricsByKeyword`, gitignored UI docs (`M02_DUAL_API_HOST_FREEZE_CONFIRMATION.md`, `FIVE_PORTALS_MAP.md`, `SHARED_KEY_AND_EVENT_CONTRACT.md`, `S1_WEEK1_*`, `SUBSECTION_SEARCH_NEW_APPROACH.md`), UI `.gitignore`.

**Unavailable:** agent store files (empty); live SQL; whether Excel was fully marked Done; Machine 2 copy of gitignored `docs/`.

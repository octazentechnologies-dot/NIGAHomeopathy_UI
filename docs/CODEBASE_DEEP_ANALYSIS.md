# NIGA Homeocentrum — Complete Codebase Deep Analysis

**Generated:** 27 August 2026  
**Scope:** All project workspaces except `/Users/OctazenWork/NIGA Project/minimal` (explicitly skipped).  
**Repos analyzed:**

| Repo | Path | Role |
|------|------|------|
| NigaHomeopathy-UI | `/Users/OctazenWork/NIGA Project/NigaHomeopathy-UI` | React SPA (doctors, admin, marketing) |
| NigaHomeopathy-API | `/Users/OctazenWork/NIGA Project/NigaHomeopathy-API` | Newer .NET 8 API (`api1.homeocentrum.com`) |
| NIGA_Latest_Code_API | `/Users/OctazenWork/NIGA Project/NIGA_Latest_Code_API` | Classic ASP.NET Core 2.2 API (`api.homeocentrum.com`) |

**Not analyzed:** `/Users/OctazenWork/NIGA Project/minimal` (separate workspace; skipped as requested).  
**Also ignored:** `node_modules`, `bin`, `obj`, `build`, `publish`, `.git`.

Existing audio-case docs in this folder (`AUDIO_CASE_TAKING_*.md`) remain valid specialized references. This file is the **single full-system map** of modules, features, and implementation.

---

## Table of contents

1. [Product overview and how the three repos fit together](#1-product-overview-and-how-the-three-repos-fit-together)
2. [End-to-end clinical workflow](#2-end-to-end-clinical-workflow)
3. [NigaHomeopathy-UI — frontend](#3-nigahomeopathy-ui--frontend)
4. [NigaHomeopathy-API — newer backend](#4-nigahomeopathy-api--newer-backend)
5. [NIGA_Latest_Code_API — classic backend](#5-niga_latest_code_api--classic-backend)
6. [Dual-API split (which UI call goes where)](#6-dual-api-split-which-ui-call-goes-where)
7. [Feature catalog (user-facing + implementation)](#7-feature-catalog-user-facing--implementation)
8. [Data model / domain glossary](#8-data-model--domain-glossary)
9. [Auth, roles, subscriptions](#9-auth-roles-subscriptions)
10. [Architecture patterns, gaps, and notes](#10-architecture-patterns-gaps-and-notes)

---

## 1. Product overview and how the three repos fit together

**Niga Homeocentrum** (package still named `corporate-velzon-thunk` v4.3.0) is a **homeopathy clinic SaaS**: practice management + repertorization + materia medica + AI audio case-taking.

It is **not** a full hospital HIS. There is no pharmacy inventory, ward management, or invoice ledger. Monetization is **doctor subscription packages** (Razorpay on the classic API).

### Three-layer production topology

```
Browser (NigaHomeopathy-UI)
        │
        ├── default axios client  →  https://api.homeocentrum.com/api
        │                            NIGA_Latest_Code_API  (.NET Core 2.2)
        │                            Classic masters: repertory CRUD, diagnosis,
        │                            materia medica, pagination, Razorpay, news/blog
        │
        └── nigahomeo / multipart →  https://api1.homeocentrum.com/api
                                     NigaHomeopathy-API  (.NET 8)
                                     Doctor ops, audio AI, WhatsApp, 3D anatomy,
                                     qualifications, registration, board backup
```

Configured in `src/config.js`. Localhost alternatives are commented (`:5000` classic, `:5038` newer).

Despite the folder name **NIGA_Latest_Code_API**, that repo is the **older / classic** stack. `NigaHomeopathy-API` is the rewrite that adds AI, WhatsApp, 3D, reception staff, audio case taking, and embeddings. Both still share the same SQL Server database family (`HomeoCentrum_Production`) and overlapping entity names.

---

## 2. End-to-end clinical workflow

1. **Doctor registers** (`/register` → `POST /users/RegisterDoctor` on newer API) and is activated (`POST /users/ActivateUser`).
2. **Login** (`POST /Account/Login` on classic API) returns JWT + role + `DoctorId` + plan flags.
3. **Doctor dashboard** shows appointment buckets, patient list, stats, subscription days, WhatsApp entry.
4. Doctor creates/selects a **patient + appointment**, then opens **Patient Board**.
5. Case taking can be:
   - **Classic:** Body Parts / Questions / Clinical Pattern / Repertory tabs → clipboard rubrics.
   - **Audio AI:** record/upload → Whisper + rubric engines → suggested rubrics → doctor approve/reject.
6. **Repertorize** tab: common/uncommon remedies, elimination, differential materia medica.
7. **Prescription modal:** remedies + labs + history notes; save against appointment.
8. Optional **3D anatomy** to jump into subsection search by hotspot.
9. Admin maintains repertory, MM, questions, packages, 3D masters, and AI metaphors/aliases/benchmarks.

---

## 3. NigaHomeopathy-UI — frontend

### 3.1 What it is

Create React App SPA branded **Niga Homeocentrum**. Built on Themesbrand **Velzon** (thunk template). Domain features are grafted onto that shell. A large unused Velzon demo surface (ecommerce, NFT, crypto, charts, UI kit) remains registered in routes and the admin sidebar under the “Menu” header.

### 3.2 Tech stack

| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | React + CRA (`react-scripts`) | React 18.3.1, react-scripts 5.0.1 |
| UI | Bootstrap 5 + Reactstrap + React-Bootstrap + Velzon SCSS | bootstrap 5.3.3, reactstrap 9.2.3 |
| State | Redux Toolkit + classic thunks (not RTK Query) | RTK 2.3.0, react-redux 9.1.2 |
| Routing | react-router-dom v6 | 6.27.0 |
| HTTP | Axios, three clients | 1.7.7 |
| Forms | Formik + Yup | 2.4.6 / 1.4.0 |
| Tables | @tanstack/react-table + `TableContainer` | 8.20.5 |
| Charts | ApexCharts (doctor dashboard); Chart.js / ECharts (Velzon demos) | apexcharts 3.54.1 |
| 3D | three.js + @react-three/fiber + drei | three 0.184.0 |
| Payments | Razorpay checkout | 2.9.6 |
| i18n | i18next (Velzon chrome; domain UI mostly English) | 23.16.0 |
| Alerts | SweetAlert2, react-toastify | — |
| Rich text | CKEditor 5, Draft.js, Quill | — |
| Dates | moment, react-flatpickr | — |

**Scripts:** `start` / `build` wrap `react-scripts` with `NODE_OPTIONS=--max-old-space-size=4096` using Windows `set` syntax (macOS/zsh may not apply the env var as intended).

**Brand:** `src/common/brand.js` — `APP_TITLE = "Niga Homeocentrum"`; `installDocumentTitleBrand()` rewrites any “Velzon” document titles.

### 3.3 Folder structure (`src/`)

```
src/
├── index.js                 Store + BrowserRouter + ErrorBoundary
├── App.js                   Theme SCSS, brand title, fakeBackend(), <Route />
├── config.js                Dual API base URLs (authoritative)
├── i18n.js + locales/       en, fr, ar, ch, gr, it, ru, sp
├── common/brand.js
├── constants/landingRoutes.js
├── Routes/                  allRoutes, AuthProtected, PatientBoardRoute, index
├── Layouts/                 Vertical layout, Header, Sidebar, LayoutMenuData
├── Components/              Domain + Velzon chrome
│   ├── CaseTaking/          Audio AI UI
│   ├── Common/              Tables, slots, backup, theme, pagination
│   ├── WhatsAppModal/       Campaign composer
│   ├── Anatomy* / HumanModel
│   ├── Hooks/               useProfile, DoctorLayoutHook
│   └── constants/           roles.js, layout.js
├── pages/
│   ├── Admin/               Master-data CRUD
│   ├── Doctor/              Dashboard + PatientBoard
│   ├── Authentication/      Login, Register, Logout, Forgot, Profile
│   ├── Landing/             HomeoJobLanding + Minimaltheme (legacy)
│   ├── AnatomyPage.js
│   └── [Velzon demos…]
├── slices/                  Redux: auth, admin/*, doctor/*, layout, demos
├── helpers/                 api_helper, url_helper, realbackend_helper, domain helpers
├── Services/CommonServices.js
├── hooks/                   useAudioRecorder, useAudioWaveform, session persistence
├── utils/                   rubric cache/queue, WhatsApp format, subsection search
├── data/                    bodyParts, hotspots, meshKeyMapping, anatomyMenu
├── assets/                  scss, images, GLB models, fonts
└── styles/anatomy.css
```

### 3.4 Entry, routing, layouts

| File | Role |
|------|------|
| `src/index.js` | `configureStore({ reducer: rootReducer })`, Provider, BrowserRouter, ErrorBoundary |
| `src/App.js` | Themes SCSS, brand installer, **fakeBackend() still activated** (Velzon demos) |
| `src/Routes/index.js` | Public routes first (`NonAuthLayout`), then `AuthProtected` + `VerticalLayout` |
| `src/Routes/allRoutes.js` | All path → component maps |
| `src/Routes/AuthProtected.js` | `useProfile` + token; no profile → `/login` |
| `src/Routes/PatientBoardRoute.js` | Remounts Patient Board by patient key |
| `src/Layouts/LayoutMenuData.js` | Admin sidebar: domain menus first, then leftover Velzon “Menu” |
| `src/Layouts/Header.js` | Profile, theme, session stack, last-work backup |
| `src/Components/Hooks/DoctorLayoutHook.js` | Doctor/Reception: hide left nav (`doctor-layout`) |

Public splat `/*` is **HomeoJobLanding** (marketing). Authenticated catch-all `*` is `RoleBasedHomeRedirect`. Public routes are registered first so marketing wins for unknown paths when unauthenticated.

### 3.5 Roles

`src/Components/constants/roles.js`:

- `ADMIN`, `MANAGEMENT`, `SUPERVISOR`, `INSPECTOR`, `DOCTOR`, `RECEPTION`

**Actively branched:**

- Admin → `/dashboard`, sidebar **SHOW**
- Doctor / Reception → `/doctordashboard`, sidebar **HIDDEN**, fetch patient-board backup summary

`usesDoctorDashboardLayout(role)` is true for Doctor and Reception.  
Management / Supervisor / Inspector exist in the enum but are not specially routed.

**There is no per-route ACL.** Any authenticated user who knows a URL can open any `authProtectedRoutes` page. Authorization is layout + home redirect only.

### 3.6 Authentication implementation

**Login** (`pages/Authentication/Login.js` → `slices/auth/login/thunk.js`):

1. Formik/Yup (`userName`, `password`).
2. Always calls `realbackend_helper.login` → `POST /Account/Login` on **classic API** (`API_URL`). Firebase / fake / JWT branches are commented out.
3. Stores full user object in `sessionStorage.authUser` (must include `token` or `Token`).
4. Redirect by role (see 3.5).
5. Optional `?UserId=` on login → `POST /users/ActivateUser` (newer API).

**Logout:** clears patient-board session + backup summary, removes `authUser`.

**Register:** `registerDoctor` on newer API (`/users/RegisterDoctor`). Countries/states/qualifications from `/registration/*` with qualifications fallback to admin list.

**Subscription refresh:** `GET /Account/SubscriptionStatus` → merges `daysRemaining`, `isPlanActive`, `islastFiveDays` into session + Redux.

**Guard:** `useProfile` (`Components/Hooks/UserHooks.js`) reads `authUser` / token; `setAuthorization(token)` updates axios.

`.env` still has `REACT_APP_DEFAULTAUTH=fake` and empty Firebase keys. Domain login **does not** use that path. Fake backend remains mounted for Velzon demo pages.

### 3.7 API layer

| File | Role |
|------|------|
| `src/config.js` | `API_URL` (classic) + `API_URL_NIGAHOMEOPATHY` (newer) |
| `src/helpers/api_helper.js` | Axios factory: `default`, `nigahomeo`, `nigahomeoMultipart`; Bearer from session; Blob passthrough; 400/401/404/500 message mapping |
| `src/helpers/url_helper.js` | Path constants (~580 lines; real APIs from line 236) |
| `src/helpers/realbackend_helper.js` | Typed wrappers |
| `src/Services/CommonServices.js` | Alternate axios helper (same default API) |
| `src/helpers/fakebackend_helper.js` / `AuthType/fakeBackend.js` | Velzon mock |

Request interceptor attaches `Authorization: Bearer <token>`. Response interceptor unwraps `response.data`.

Pagination query params are typically `PageNumber` / `PageSize` / `SearchText`. Pagination metadata may arrive as a `Pagination` response header (classic API).

### 3.8 Redux store (`src/slices/index.js`)

**Auth:** `Login`, `Account` (register), `ForgetPassword`, `Profile`  
**Layout:** theme / sidebar visibility  

**Admin domain:**

- `Section`
- Materia medica: `Author`, `Head`, `MateriaMedica`, `MateriaMedicaRemedy`
- Repertory: `Rubric`, `Language`, `Intensity`, `BodyPart`, `RemedyGrade`, `RemedicalRubric`, `Remedy`, `SubSection`
- Drugs: `DrugSystem`, `DrugGroup`, `AllopathicDrug`
- Questions: `Existance`, `QuestionGroup`, `ClinicalQuestions`, `SubQuestionGroup`
- Clinical pattern: `DiagnosisSystem`, `DiagnosisCondition`, `DiagnosisTherapeutics`
- Business: `Package`, `Qualification`, `Role`, `User`, `LabTest`, `News`, `Blog`
- 3D: `MeshKeyMaster`, `AnatomySectionMaster`, `AnatomyHotspot`

**Doctor domain:** `DoctorDashboard`, `PatientDashboard`, `PatientBoardSession`, `PatientBoardBackup`, `AudioCaseTaking`

**Velzon leftovers still combined:** Calendar, Chat, Ecommerce, Projects, Tasks, Crypto, Tickets, CRM, Invoice, Mailbox, all dashboard-* demos, Team, FileManager, Todos, Jobs, APIKey.

Pattern per feature: `reducer.js` + `thunk.js` calling `realbackend_helper`.

### 3.9 Helpers, hooks, utils

| Path | Purpose |
|------|---------|
| `helpers/patientBoardSessionHelper.js` | Multi-patient keys, max **5** sessions, snapshot serialize, resume paths, audio path (`caseTakingMode=audio`) |
| `helpers/patientBoardBackupHelper.js` | Backup merge / schema v1 |
| `helpers/audioCaseTakingHelper.js` | Formats, languages, rubric mapping, history-note text from AI summary |
| `helpers/audioCaseOfflineQueueHelper.js` | Offline upload queue |
| `helpers/audioCaseDownloadHelper.js` | Blob download naming |
| `helpers/appointmentSlotHelper.js` | Slot math from daily schedule |
| `helpers/whatsapp_helper.js` | WhatsApp API glue |
| `helpers/dashboard_helper.js` | Home path by role, plan-days display, `doctor-dashboard:open-new-appointment` event |
| `helpers/patient_payload_helper.js` | Patient create/update payload |
| `helpers/patient_history_helper.js` | History notes helpers |
| `hooks/useAudioRecorder.js` | Mic capture |
| `hooks/useAudioWaveform.js` | Waveform visualization |
| `hooks/usePatientBoardSessionPersistence.js` | Persist board sessions in Redux |
| `utils/rubricDetailsCache.js` | Prefetch/cache `GetRubricDetails` |
| `utils/rubricDetailsFetchQueue.js` | Priority fetch queue + cancel |
| `utils/subSectionSearchUtils.js` | Paged clinical/repertory search merge, tree build, debounce |
| `utils/formatForWhatsApp.js` | Message formatting |

### 3.10 Protected domain routes (product)

#### Admin

| Area | Paths |
|------|-------|
| Dashboard | `admin/dashboard` |
| Coming soon | `admin/commingsoon` |
| Existance Questions | `listexistance`, `listquestiongroup`, `listsubquestiongroup`, `listclinicalquestion` (+ add/edit) |
| Clinical Patterns | `listdiagnosissystem`, `listdiagnosistherapeuticsdetails`, `listdiagnosisconditions` (+ add/edit) |
| Repertory | `listsection`, `listsubsection`, `listrubrics`, `listremedialrubrics` (+ view), `listlanguage`, `listbodyparts`, `listintensity`, `listremedy`, `listremedygrade` (+ add/edit) |
| Materia Medica | `listauthor`, `listmateriamedicaremedies` (+ view), `listmateriamedica`, `listhead` (+ add/edit) |
| Adverse Effect | `listdrugsystem`, `listdruggroup`, `listallopathicdrug` (+ add/edit) |
| Business | `listpackage`, `listqualification`, `listblog`, `listnews`, `listlabsimaging`, `listusers`, `listrole` (+ add/edit) |
| 3D Body Part | `listmeshkeymaster`, `list3dsectionmaster`, `list3dhotspots` (+ add/edit) |
| Rubric Intelligence | `listrubricmetaphors`, `listrubricaliases`, `rubric-intelligence-benchmark` |

#### Doctor

| Path | Screen |
|------|--------|
| `doctordashboard`, `index` | Doctor dashboard |
| `doctor/patientboard` | Patient Board |
| `doctor/anatomy` | 3D Anatomy viewer |

Also: `/profile` (user profile). `/dashboard` is the Velzon ecommerce dashboard used as **Admin home**.

#### Public (real)

`/login`, `/register`, `/forgot-password`, `/logout`, marketing splat `/*` (`/`, `/about`, `/features`, `/pricing`, `/blog`, `/news`, `/contact`, `/privacy`, `/terms`, `/account`). Legacy prefixes redirect: `/minimaltheme/*`, `/HomeoCentrum/*`, `/job-landing`, `/jobs-landing`.

### 3.11 Admin sidebar (product menus)

From `LayoutMenuData.js` — this is the real product IA:

1. **Dashboard** → `/admin/dashboard`
2. **Existance Questions** → Existance, Question Group, Sub Question Group, Clinical Questions
3. **Clinical Patterns** → Diagnosis System, Diagnosis Therapeutics, Diagnosis & Conditions
4. **Repertory** → Section, Sub Section, Add Remedies (rubrics), Remedial Rubrics, Language, Body Parts, Intensity, Remedy, Remedy Grade
5. **Materia Medica** → Author, Materia Medica Remedies, Materia Medica, Head
6. **Adverse Effect** → Drug System, Drug Group, Allopathic Drug
7. **Deep Analytics** → Coming soon (placeholder)
8. **Business Management** → Packages, Qualifications, Roles, Users, Blogs, News, Labs & Imaging
9. **3D Body Part** → Mesh Key Master, Section Master, Hotspots
10. **Rubric Intelligence** → Metaphors, Aliases, Benchmark

Below that, leftover Velzon “Menu” (Dashboards, Apps, Auth, Pages, Base UI, …) is still in the same file.

### 3.12 Shared domain components

**Case taking (`Components/CaseTaking/`):**

- `CaseTakingModeModal.js` — choose audio vs classic
- `AudioCasePanel.js` — main shell
- `AudioCaseProcessingStatus.js` — poll UI
- `AudioCaseTranscriptEditor.js` — edit transcript / reanalyze
- `AudioCaseConversationPanel.js` — conversation view
- `AudioCaseSummaryPanel.js` — AI summary
- `AudioCaseRubricSuggestions.js` + `AudioCaseRubricApprovalBar.js` — approve/reject
- `AudioCaseRubricExplainabilityPanel.js` — why a rubric was suggested
- `AudioCaseConfidenceBadge.js`
- `AudioCaseConceptTimeline.js`
- `AudioCaseSessionHistory.js`

**Appointments (`Components/Common/`):** `AppointmentSlotGrid.js`, `AppointmentTimePicker.js`, `DailyScheduleSetupModal.js`

**Sessions:** `ActivePatientSessionsStack.js`, `LastWorkBackupHeaderButton.js`

**Anatomy:** `AnatomyViewer.js`, `HumanModel.js`, `Hotspot.js`, `MeshKeySelector.js`, `GenderSelector.js`, `BodyPartSectionsPanel.js`, `BodyPartHotspotsPanel.js`, `RightPanel.js`

**WhatsApp (`Components/WhatsAppModal/`):** templates, hospital services, offers, health tips, bulk send, recipient selector, message editor

**Tables / chrome:** `TableContainer.js`, `TableContainerReactTable.js`, `AdminListPagination.js`, `DeleteModal.js`, `BreadCrumb.js`, `ErrorBoundary.js`, `RoleBasedHomeRedirect.js`, `ThemeCustomizer*`

**Scoring:** `RemedyScoreBar.js`

### 3.13 Doctor dashboard — implementation

**Pages:** `pages/Doctor/Dashboard/index.js` composes widgets.

**`Widgets.js` (~3.5k lines):** appointment counts (Waiting, Walk-In, Not Arrived, E-Consult, Remaining, Completed), new patient/appointment Formik modals, Razorpay upgrade, subscription days, WhatsApp launch. Misnamed Velzon remnants:

- `BestSellingProducts.js` — patient list, import, export (Excel/CSV/PDF blob)
- `StoreVisits.js`, `RecentOrders.js`, `TopSellers.js` — charts/lists
- `DashboardEcommerceCharts.js` + `patientStatsChartsHelper.js` + `PatientStatsPeriodFilter.js`

**Redux:** `slices/doctor/dashboard/*`  
**APIs:** `/doctorDashBoard/*`, `/PatientApp`, `/PatientAppointment/*`, `/patient`, `/Order/GenerateOrderId`, `/Subscription/SaveUpdateSubscription`

Appointment slot generation uses `appointmentSlotHelper` + `DailyScheduleSetupModal` (`GetDailySchedule` / `SaveDailySchedule` / `GetAppointmentSlots`). Cross-widget open-new-appointment uses `CustomEvent` `doctor-dashboard:open-new-appointment`.

### 3.14 Patient Board — implementation (core clinical workspace)

**Route:** `/doctor/patientboard?patientId=&caseId=&patientAppId=`  
**File:** `pages/Doctor/PatientBoard/PatientBoard.js` (~13.5k lines) — mega-component holding UI + business logic.

**Main tabs:**

| Tab | Behavior |
|-----|----------|
| Body Parts | Anatomy-driven navigation into rubrics |
| Questions | Clinical question sections → groups → subgroups → keywords → rubrics |
| Clinical Pattern | Diagnosis search → keyword tabs → linked rubrics |
| Repertory | Hierarchical subsection tree, paged search, intensity grades, add to clipboard |
| Repertorize | Selected rubrics; COMMON / UNCOMMON remedies; elimination; differential MM accordion |
| Materia Medica | Author → headings → remedy content |
| Adverse Effect | Allopathic drug dropdown → side-effect lookup |
| Deep Analysis | Limited / placeholder |

**Clinical Pattern keyword tabs:** Symptoms, Monogram, Causations, Pathology, Emergencies, Onset/Duration/Progress, Patterns, Location/Extention, Sensation, Modalities, Accompanied, Observations, Before/After/During.

**Prescription modal tabs:** Prescription, Labs & Imaging, History Notes.

**Audio mode:** query `caseTakingMode=audio` mounts `AudioCasePanel` instead of (or alongside) classic taking.

**Session model:**

- Key: `userId|patientId|caseId|patientAppId`
- Max 5 concurrent sessions
- Header stack to switch patients
- Snapshot persistence via `patientBoardSession` slice + `usePatientBoardSessionPersistence`
- Cloud backup: `PatientBoardBackup` Save / Summary / Latest / Delete

**Performance:** `rubricDetailsCache` + `rubricDetailsFetchQueue` prefetch `GetRubricDetails` as the tree scrolls. Subsection search is debounced and paged (`subSectionSearchUtils`).

**Redux:** `slices/doctor/patientdashboard/*` holds lists/loading/error for board APIs.

### 3.15 Audio case taking — UI implementation

Flow:

1. Mode modal → audio.
2. Record (`useAudioRecorder` + waveform) or pick file.
3. `POST /AudioCaseTaking/upload` (multipart, newer API) with consent.
4. Poll `/{sessionId}/status` every **2.5s**, max **192** attempts (~8 minutes).
5. Fetch result: transcript, conversation, summary, suggested rubrics.
6. Doctor edits transcript, reanalyze, approve/reject rubrics (feedback), view concepts/explainability, download audio, browse session history.
7. Offline: `audioCaseOfflineQueueHelper` queues uploads.

**State:** `slices/doctor/audioCaseTaking/{thunk,reducer}.js`

Specialized docs already in this folder:

- `AUDIO_CASE_TAKING_FEATURE_SPEC.md`
- `AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md`
- `AUDIO_CASE_TAKING_COMPLETE_REPORT.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V2_APPROVAL_PACK.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V3_ARCHITECTURE.md`

### 3.16 Admin CRUD pattern

Almost every admin master follows:

- `ListX.js` — table + search + pagination (`AdminListPagination` / `TableContainer`)
- `AddX.js` / `EditX.js` — Formik + Yup
- `slices/admin/.../thunk.js` + `reducer.js`
- Soft delete via dedicated Delete* endpoints

**Excel:** subsection import/export/update, reference-rubric template/import, rubric-remedy Excel import with **async job status polling** (`IMPORT_FROM_EXCEL_STATUS`), patient import template + import.

### 3.17 3D anatomy — UI

**Admin masters:** Mesh Key (GLB mesh names), Section Master (linked to mesh key), Hotspots (linked to section + subsection search).

**Doctor:** `/doctor/anatomy` → `AnatomyPage.js` → `AnatomyViewer` (R3F Canvas, male/female GLB, OrbitControls). Click hotspot → subsection search (`SEARCH_SUBSECTION_BY_HOTSPOT`). Static fallback data in `src/data/{bodyParts,hotspots,meshKeyMapping,anatomyMenu}.js`.

### 3.18 Rubric Intelligence admin

Pages under `pages/Admin/RubricIntelligence/`:

- Metaphors CRUD + approve/reject
- Aliases CRUD + approve/reject
- Benchmark dashboard: summary, trends, config, rollout / repertory status

APIs under `/AudioCaseIntelligence/...` (newer API).

### 3.19 WhatsApp

Modal suite used from doctor dashboard. Templates CRUD; send Hospital Service / Offer / Health Tip / Bulk; history and campaign APIs. Message formatting in `utils/formatForWhatsApp.js`. Newer API (`/WhatsApp/*`).

### 3.20 Marketing landing

`pages/Landing/HomeoJobLanding/` at domain root (`LANDING_SPLAT_PATH = "/*"`). Inner routes: about, features, pricing, blog, news, contact, privacy, terms, account.

`pages/Landing/Minimaltheme/` is a previous landing implementation; public routes redirect legacy prefixes to the current site. **This is not the skipped workspace folder** `/Users/OctazenWork/NIGA Project/minimal`.

### 3.21 Forms, tables, charts, upload, print, PDF, i18n, theming

| Concern | Implementation |
|---------|----------------|
| Forms / validation | Formik + Yup on Login, Register, Admin Add/Edit, appointment/patient modals |
| Tables | TanStack + `TableContainer` |
| Charts | Apex on doctor dashboard; Velzon chart pages unused in prod flow |
| Maps | Velzon Google Maps demo only |
| Upload | Multipart client for Excel/audio/patient import; FilePond/Dropzone on demos |
| Print | `window.print` on leftover invoice/subscription UI |
| PDF | Server-side blob export (`exportPatients` `format=pdf\|csv\|xlsx`); no client jsPDF for Rx |
| i18n | `src/i18n.js` + `LanguageDropdown` (Velzon chrome) |
| Theming | Velzon SCSS `assets/scss/themes.scss`; layout slice (mode, sidebar); doctor layout forces zero sidebar width |

### 3.22 Domain URL inventory (real APIs from `url_helper.js`)

**Auth / users:** `/Account/Login`, `/Account/SubscriptionStatus`, `/users/ActivateUser`, `/users/RegisterDoctor`, `/registration/countries|states|qualifications`, `/Pagination/GetUser`, `/users`

**Repertory / MM:** `/section`, `/subsection/*`, `/RubricRemedy/*`, `/remedy`, `/remedygrade`, `/Author`, `/MateriaMedicaMaster`, `/MateriaMedicaHead`, `/MateriaMedicaRemediesDetails`, `/LanguageMaster`, `/intensity`, `/bodypart`, `/Pagination/Get*`

**Clinical questions / diagnosis:** `/questionsection`, `/questiongroup`, `/QuestionSubGroup`, `/clinicalquestions/*`, `/DiagnosisSystem`, `/DiagnosisTherapeuticsDetail`, `/diagnosis/*`

**Drugs:** `/DrugSystem`, `/DrugGroup`, `/AllopathicDrug`, `/SeriousSideEffect`, `/OtherSideEffect`, `/AdverseReaction`

**Business:** `/package`, `/qualification/*`, `/roleMaster`, `/PatientLabTest`, `/NewsDetail`, `/NewsCategory`, `/BlogDetail`

**Doctor / board:** `/doctorDashBoard/*`, `/PatientApp`, `/PatientAppointment/*`, `/patient/*`, `/PatientBoard/GetPatientBoardData`, `/clipboardRubrics/*`, `/Prescription/*`, `/PatientLab/*`, `/AppointmentHistoryNote/*`, `/Order/GenerateOrderId`, `/Subscription/SaveUpdateSubscription`

**3D:** `/threeDBodyPartMeshKeyMaster/*`, `/threeDBodyPartSectionMaster/*`, `/threeDBodyPartSectionHotspot/*`

**WhatsApp / backup / audio / AI admin:** `/WhatsApp/*`, `/PatientBoardBackup/*`, `/AudioCaseTaking/*`, `/AudioCaseIntelligence/*`

---

## 4. NigaHomeopathy-API — newer backend

**Root:** `/Users/OctazenWork/NIGA Project/NigaHomeopathy-API`  
**Solution:** `Niga.sln`  
**Run:** `dotnet run` in `Niga-Web` — `http://localhost:5038` / `https://localhost:7190`, Swagger at `/swagger`.

### 4.1 Stack

| Aspect | Detail |
|--------|--------|
| Language | C# / .NET **8.0** |
| Host | `Niga-Web` |
| Domain | `Niga-Domain` (EF models, services, DI; also `Sdk.Web`) |
| Tests | `Niga-Domain.Tests` (RubricIntelligence, AiEmbeddingInfrastructure) |
| ORM | EF Core + SQL Server (`NIGACentrumContext`, **187 DbSets**) |
| Auth | JWT Bearer; Identity registered (`AppUser`/`AppRole`) but **login uses custom `UserMaster`** |
| Mapping | AutoMapper 13 |
| Docs | Swashbuckle |
| PDF/Excel | iText7, ClosedXML, RazorLight |

**Bootstrap:** `Niga-Web/Program.cs` — compression, Swagger+Bearer, `AddApplicationServices`, SQL DbContext, Identity, JWT (issuer/audience **not** validated), CORS AllowAnyOrigin, static files `/attachments` and `/Blogs`, `MapControllers`.

**DI:** `Niga-Domain/Extensions/ApplicationServiceExtensions.cs`

**BackgroundServiceExceptionBehavior.Ignore** so long embedding jobs cannot kill the host.

### 4.2 Folder structure

```
NigaHomeopathy-API/
├── Niga.sln
├── Niga-Web/                 API host, ~45 controllers, appsettings, Data/
├── Niga-Domain/
│   ├── Data/NIGACentrumContext.cs
│   ├── Master/               ~156 entity files
│   ├── DTOs/                 ~176 DTOs
│   ├── Interfaces/
│   ├── Repositories/         mostly *Service implementations
│   ├── Services/             Token, Email, AudioCase, WhatsApp, embeddings
│   │   ├── AudioCaseIntelligence/   V3/V6/V7/ECI-V8, KG, learning
│   │   └── AiEmbeddingInfrastructure/
│   ├── Configuration/, Helpers/, Extensions/, Mapper/, Enums/
├── Niga-Domain.Tests/
├── Database/Scripts/         SQL migrations/seeds
├── docs/                     AUDIO_CASE_*.md, rubric engine docs
└── Scripts/
```

Pattern: Controller → Interface → Repository/Service → `NIGACentrumContext` / HTTP clients. Controllers often inherit `BaseAPIController` for `ReturnErrorResponse`.

### 4.3 Controllers (complete list)

| Controller | Route prefix | Domain |
|------------|--------------|--------|
| `AccountController` | `api/Account` | Login + subscription status |
| `UsersController` | `api/users` | Users / doctor registration |
| `RegistrationController` | `api/registration` | Countries/states/qualifications (anon) |
| `PatientController` | `api/patient` | Patients & cases |
| `PatientAppointmentController` | `api/PatientApp` + `/api/PatientAppointment/*` | Appointments / schedule / slots |
| `DoctorDashBoardController` | `api/doctorDashBoard` | Dashboard stats |
| `PrescriptionController` | `api/Prescription` | Prescription read/write |
| `PatientLabController` | `api/PatientLab` | Lab orders/entries |
| `ClipboardRubricsController` | `api/clipboardRubrics` | Repertorization clipboard |
| `RepertorizationPageController` | `api/RepertorizationPage` | Differential MM |
| `SectionController` | `api/section` | Repertory sections |
| `SubSectionController` | `api/subsection` | Rubrics (subsections) |
| `RubricRemedyController` | `api/RubricRemedy` | Rubric↔remedy grades + Excel jobs |
| `RemedyController` | `api/remedy` | Remedy master |
| `RemedyGradeController` | `api/remedyGrade` | Grade master |
| `MastersAPIController` | `api/mastersAPI` | Lookup masters |
| `DropdownListController` | `api/DropdownList` | DDLs |
| `QuestionGroupController` | `api/questiongroup` | Question groups |
| `QuestionSectionController` | `api/questionsection` | Question sections |
| `QuestionSubGroupController` | `api/questionsubgroup` | Subgroups |
| `QualificationController` | `api/qualification` | Qualifications |
| `PackageController` | `api/package` | Subscription packages |
| `SubscriptionController` | `api/Subscription` | Doctor package subscriptions |
| `StateController` | `api/state` | States |
| `ReceptionStaffController` | `api/ReceptionStaff` | Reception users |
| `PatientBoardBackupController` | `api/PatientBoardBackup` | Board JSON backup |
| `AllopathicDrugController` | `api/AllopathicDrug` | Allopathic drugs / SE |
| `SeriousSideEffectController` | `api/SeriousSideEffect` | Delete SE |
| `MateriaMedicaRemediesDetailsController` | `api/MateriaMedicaRemediesDetails` | MM details |
| `BlogDetailsController` | `api/blog` | Blog CMS |
| `WhatsAppController` | `api/WhatsApp` | Meta WhatsApp |
| `ThreeDBodyPartMeshKeyMasterController` | `api/threeDBodyPartMeshKeyMaster` | 3D mesh keys |
| `ThreeDBodyPartSectionMasterController` | `api/threeDBodyPartSectionMaster` | 3D sections |
| `ThreeDBodyPartSectionHotspotController` | `api/threeDBodyPartSectionHotspot` | 3D hotspots |
| `AudioCaseTakingController` | `api/AudioCaseTaking` | Audio pipeline |
| `AudioCaseIntelligenceController` | `api/AudioCaseIntelligence` | Config/benchmark/rollout |
| `AudioCaseIntelligenceAdminController` | `api/AudioCaseIntelligence/admin` | Weights/metaphors/aliases |
| `AudioCaseIntelligenceV3Controller` | `api/AudioCaseIntelligence/v3` | Concept graph views |
| `AiEmbeddingInfrastructureController` | `api/AiEmbeddingInfrastructure` | Embedding builds/search |
| `AiMonitoringDashboardController` | `api/AiMonitoringDashboard` | AI ops dashboard |
| `KnowledgeGraphController` | `api/KnowledgeGraph` | Enterprise KG |
| `NewsDetailController` / `NewsCategoryController` | — | **Fully commented out** |
| `LocationController` | — | **Fully commented out** |
| `DropdownController` | — | Empty stub |
| `BaseAPIController` | — | Shared error helper |

**Auth inconsistency:** Patient, audio, WhatsApp, 3D, users are `[Authorize]`. Many repertory/admin controllers have `[Authorize]` **commented out**.

### 4.4 Services (`Niga-Domain/Repositories/`)

`UserService`, `PatientService`, `PatientAppointmentService`, `PrescriptionService`, `DoctorDashBoardService`, `SectionRepository`, `SubSectionRepository`, `RubricRemedyDetailsService`, `RemedyService`, `RemedyGradeService`, `MastersAPIService`, `DropdownListService`, `ClipboardRubricsService`, `RepertorizationPageService`, `WhatsAppService` + `WhatsAppRepository`, `AudioCaseTakingService`, `AudioCaseIntelligenceRepository`, `RubricIntelligenceAdminService`, `RubricBenchmarkService`, `ConceptGraphRepository`, `EnterpriseKnowledgeGraphRepository`, `AiMonitoringDashboardService`, `ReceptionStaffService` + repository, `PackageService`, `SubscriptionService`, `SubscriptionStatusService`, `PatientBoardBackupService`, `QualificationService`, `BlogDetailService`, `AllopathicDrugService`, `Question*Service`, `ThreeDBodyPart*Service`, `LabTestMasterServices`, `PatientLab*`, `StateService`, `News*` (present even if controllers disabled), `LocationRepository`.

Plus `Niga-Domain/Services/` for Token, Email, Whisper chunker, AudioCase AI processor, embedding infra, hosted queues.

### 4.5 Endpoint groups (purpose)

**Auth & users**

- `POST /api/Account/Login` — UserMaster then reception fallback; JWT + AuthModel
- `GET /api/Account/SubscriptionStatus`
- `POST /api/users/RegisterDoctor` (anon)
- `GET/POST /api/users`, `ActivateUser`, `DeleteUser`, `ForgetPassword`, `GetCount`
- `GET /api/registration/countries|states|qualifications`

**Patients & cases**

- List by user (paged), save patient, details, complaints, case details, all cases, Excel export, import template + import, soft delete, back history

**Appointments**

- CRUD-ish on `PatientApp`, status updates (WAITING, WALK-IN, …), list by patient/date, update time, daily schedule get/save, slot generation

**Dashboard**

- Count by date, paged appointments, status dropdown, stats, charts, export patients

**Clipboard / repertorization / prescription / labs**

- Clipboard get/save/delete; rubric details; common/uncommon; repertorize remedies; elimination
- MM headings + differential MM
- Prescription details by appointment; save prescription
- Lab tests, orders, entries

**Repertory masters**

- Section / subsection / rubric-remedy / remedy / grade CRUD
- Subsection Excel import/export/update, reference-rubric import, search (global/section/paged/hotspot)
- Rubric-remedy Excel import as **background job** + status

**Questions, packages, reception, board backup, allopathic, MM, blog, qualification, 3D** — standard list/get/save/delete as in §4.3.

**WhatsApp** (`Authorize`): SendIndividual/Bulk/HospitalService/Offer/HealthTip; templates CRUD; message/campaign history; dashboard. Bulk uses a background queue.

**Audio case taking** (`Authorize`):

| Method | Path | Purpose |
|--------|------|---------|
| POST | `upload` | Audio + consent → session + queue |
| GET | `{sessionId}/status` | Poll |
| GET | `{sessionId}/result` | Transcript, symptoms, suggested rubrics |
| POST | `{sessionId}/reanalyze` | Re-run from transcript |
| POST | `{sessionId}/doctor-action` | Approve/reject/etc. |
| GET | `latest` | Latest for patient |
| GET | `sessions` | List |
| GET | `{sessionId}/concepts` | Clinical concepts |
| POST | `{sessionId}/rubrics/feedback` | Learning signal |
| GET | `{sessionId}/download` | Audio file |

**AI ops**

- `AudioCaseIntelligence`: health (anon); config GET/PUT; rollout; repertory/embeddings status; reindex; benchmark summary/trends/evaluate; v7 accuracy; feedback queue; learning summary
- `.../admin`: weights, metaphors (approve/reject), aliases
- `.../v3`: graph/meanings/coverage by session
- `AiEmbeddingInfrastructure`: status; build rubrics/concepts; incremental sync; semantic-search; rubric-candidates; evidence-chains
- `AiMonitoringDashboard`: overview, trends, charts, embedding-health, hallucinations, snapshots, audit-log
- `KnowledgeGraph`: stats, expressions search/resolve, paths, rubric remedies, bootstrap import, remedies sync

### 4.6 Auth implementation

- JWT HMAC-SHA512 from `TokenKey`; claims `NameId` = UserId, `UniqueName` = UserName; reception adds `DoctorID`, `FullName`, Role=`ReceptionStaff`
- Login expiry passed as **7 days**
- Login: lookup `UserMasters`, **plaintext** `UserPassword == model.Password`, `IsUserActivated`, load `RoleMasters` (RoleId 1 super user; RoleId 3 / Doctor → `DoctorId` + subscription flags), else `ReceptionStaffService.TryBuildAuthModelForLoginAsync`
- Identity is registered but **not** used for password hashing on the primary path

### 4.7 Database domains (`NIGACentrumContext`)

**Clinic:** `UserMaster`, `RoleMaster`/`RoleDetail`, `Doctor`, `DoctorReceptionStaff`, `DoctorDailySchedule`, `Patient`, `CaseEntryDetail` + complaints/diagnoses/`CaseDetail`/`CaseDetailRemedy`, `PatientAppointment`, `AppointmentHistoryNote`, `PrescriptionRubricDetail`/`PrescriptionRemedyDetail`, `ClipboardRubric`, `PatientLabOrder`/`PatientLabEntry`/`LabTestMaster`, `PackageMaster`/`PackageEntryDetail`/`PackageTopupMaster`, `FirmDetail`/`ModuleMaster`/`MenuMaster`, `DoctorPatientBoardBackup`

**Repertory / clinical knowledge:** `SectionMaster` → `SubSectionMaster` → `RubricRemedyDetail` + authors + grades; `RemedyMaster`; languages; body parts; sensations/modalities/patterns; diagnosis trees; materia medica; clinical questions; allopathic drugs & side effects; 3D mesh/section/hotspot

**AI / audio / embeddings / KG:** `AudioCaseSession` + consent/events/match logs/feedback/benchmark; V3 concept-graph tables; embedding jobs/versions/queues; KG nodes/edges; monitoring snapshots; WhatsApp campaign/message/template

Schema evolution is largely **SQL scripts** under `Database/Scripts/` (not only EF migrations).

### 4.8 Audio AI pipeline (implementation)

Documented in API `docs/AUDIO_CASE_ARCHITECTURE.md` and engine docs. Runtime path:

1. Upload → store file → `AudioCaseSession` → `AudioCaseTakingQueue`
2. `AudioCaseTakingBackgroundService` → `WhisperAudioChunker` (OpenAI Whisper) → GPT extract
3. **FastClinicalRetrievalOrchestrator** (`fast-f`) when `EnableFastClinicalRetrievalPipeline=true`; optional V3 concept graph, V6, V7 repertory intelligence, ECI v8 (feature-flagged in `RubricIntelligence` config)
4. Persist suggested rubrics + match logs; doctor feedback → `DoctorFeedbackLearningEngine` / weight provider
5. Hosted sweepers: retention, zombie sessions, embedding indexer/builders/recovery/warmup/incremental, rubric Excel import, WhatsApp bulk

**Engines (selected):** `SymptomExtractionEngine`, `HybridRetrievalEngine`, `EmbeddingSearchEngine`, `ExplainabilityEngine`, `CausationDetectionEngine`, `HomeopathicWeightEngine`, V3 `PatientMeaningGraphEngine` / `MultiConceptDiscoveryEngine` / `SensationOntologyService` / `RubricCandidateEngine`, V6 SQL repertory search + ontology, Enterprise hybrid completion + hierarchical repertory search, KG traversal.

**Integrations:** OpenAI (Whisper, GPT-4o, text-embedding-3-small); optional Azure OpenAI; Meta WhatsApp Cloud API; Gmail SMTP.

### 4.9 Middleware / validation / errors

Pipeline: Swagger → CORS → compression → HTTPS redirect → Authentication → Authorization → static files → MapControllers.

Validation is mostly `ModelState` + service-level checks (no FluentValidation). Errors: try/catch 500, `BaseAPIController` maps `ErrorResponseModel`. Pagination via `ParameterParams` + `PagedList` + `Pagination` header.

**Config sections (names only):** `TokenKey`, `ConnectionStrings`, `JWT`, `WhatsAppMeta`, `AudioCaseTaking`, `RubricIntelligence`, `AiEmbeddingInfrastructure`, `OpenAI`, `AzureOpenAI`, `smtp`, `ConfigurationModel`, `App:Version`. Secrets live in `appsettings.json` and should be treated as rotatable (not copied here).

---

## 5. NIGA_Latest_Code_API — classic backend

**Root:** `/Users/OctazenWork/NIGA Project/NIGA_Latest_Code_API`  
**Solution:** `NIGA.Centrum.sln`  
**Product name in code:** NIGA.Centrum / Homeo Centrum  
**Run:** `dotnet run` in `NIGA.Centrum.API` — `http://localhost:5000`, Swagger `/swagger`. IIS Express profile `http://localhost:28017`.

### 5.1 Stack

ASP.NET Core **2.2** (EOL), EF Core 2.2.6, SQL Server, JWT Bearer, Swashbuckle 4, IMemoryCache, Newtonsoft (OrderService), SmtpClient, Razorpay HTTP API.

**Five projects:**

| Project | Role |
|---------|------|
| NIGA.Centrum.API | Host, controllers, Startup, static NewsImages |
| NIGA.Centrum.Business | ~64 interfaces, ~66 implementations |
| NIGA.Centrum.Entity | EF entities + `NIGACentrumContext` (~120+ DbSets) |
| NIGA.Centrum.Model | DTOs |
| NIGA.Centrum.Common | `GlobalConstants`, password helper |

Layering: Controller → I*Service → *Service → DbContext.

### 5.2 Why this is “classic” not “latest”

- `netcoreapp2.2`
- SQL comments refer to “Old API” normalization
- No audio AI, WhatsApp, 3D, embeddings, KG, PatientBoardBackup, Registration, ReceptionStaff **API** (reception login exists on Account)
- UI still depends on it for **masters, pagination, diagnosis, MM, Razorpay, news/blog, login**

Both repos received commits in 2026; this one continues classic master-data work.

### 5.3 Controllers (complete)

**Auth / access:** `AccountController`, `LoginController` (legacy JWT via `GlobalConstants.AuthKey`), `UsersController`, `RoleMasterController`, `RoleDetailsController`, `MenuMasterController`

**Clinic:** `PatientController`, `PatientAppointmentController`, `AppointmentHistoryNoteController`, `DoctorDashBoardController`, `CaseDetailsController`, `ClipboardRubricsController`, `PrescriptionController`, `PatientLabController`, `PatientLabTestController`

**Repertory:** `SectionController`, `SubSectionController`, `RubricRemedyController`, `RemedyController`, `RemedyGradeController`, `IntensityController`, `AuthorController`, `PaginationController` (~30 search/list helpers), `RepertorizationPageController`

**Clinical Q / anatomy masters:** `QuestionSectionController`, `QuestionGroupController`, `QuestionSubGroupController`, `ClinicalQuestionsController`, `ClinicalQueKeywordController`, `BodyPartController`, `PartLocationController`

**Diagnosis / therapeutics:** `DiagnosisController`, `DiagnosisGroupController`, `DiagnosisSystemController`, `DiagnosisTherapeuticsDetailController`, `PathologyController`, `MonogramController`

**Materia medica:** `MateriaMedicaMasterController`, `MateriaMedicaHeadController`, `MeteriaMedicaDetailsController` (typo in name), `MateriaMedicaRemediesDetailsController`

**Allopathic:** `AllopathicDrugController`, `DrugSystemController`, `DrugGroupController`, `AdverseReactionController`, `OtherSideEffectController`, `SeriousSideEffectController`

**Masters / geo / commercial:** `MastersAPIController`, `DropdownListController`, `CountryController`, `StateController`, `GenderController`, `QualificationController`, `LanguageMasterController`, `PackageController`, `SubscriptionController`, `OrderController` (Razorpay)

**CMS:** `NewsDetailController`, `NewsCategoryController`, `BlogDetailController`, `EnquiryDetailController`

**Base:** `BaseAPIController`

~**348** HTTP actions.

### 5.4 Business services (complete implementation list)

`AuthService`, `TokenService`, `UserService`, `PatientService`, `PatientAppointmentService`, `AppointmentHistoryNoteService`, `DoctorDashBoardService`, `CaseDetailsService`, `ClipboardRubricsService`, `PrescriptionService`, `PatientLabOrderServices`, `PatientLabEntryServices`, `PatientLabTestService`, `LabTestMasterServices`, `SectionService`, `SubSectionService`, `RubricRemedyDetailsService`, `RemedyService`, `RemedyGradeService`, `IntensityService`, `AuthorService`, `PaginationService`, `RepertorizationPageService`, `QuestionSectionService`, `QuestionGroupService`, `QuestionSubGroupService`, `ClinicalQuestionsService`, `ClinicalQueKeywordService`, `BodyPartService`, `PartLocationService`, `DiagnosisService`, `DiagnosisGroupService`, `DiagnosisSystemService`, `DiagnosisTherapeuticsDetailService`, `PathologyService`, `MonogramService`, `MateriaMedicaMasterService`, `MateriaMedicaHeadService`, `MateriaMedicaDeatailsService`, `MateriaMedicaRemediesDetailsService`, `AllopathicDrugService`, `DrugSystemService`, `DrugGroupService`, `AdverseReactionService`, `OtherSideEffectService`, `SeriousSideEffectService`, `MastersAPIService`, `DropdownListService`, `CountryService`, `StateService`, `GenderService`, `QualificationService`, `LanguageMasterService`, `PackageService`, `SubscriptionService`, `OrderService`, `RoleMasterService`, `RoleDetailsService`, `MenuMasterService`, `NewsDetailService`, `NewsCategoryService`, `BlogDetailService`, `EnquiryDetailService`, `EmailSenderService` (new’ed, not always DI), `EncryptionHelper`.

### 5.5 Dual auth paths

1. **Primary:** `POST api/Account/Login` — plaintext UserMaster or hashed reception (`ReceptionStaffPasswordHelper`); JWT via `TokenService` (`JWT:Secret`, issuer/audience, ~7 days); doctors get subscription flags from `PackageEntryDetails`.
2. **Legacy:** `POST api/Login/authenticate` — `AuthService` signed with **`GlobalConstants.AuthKey`** (different key).

CORS AllowAllOrigins. Some controllers (package, subscription, news, blogs, enquiry, patient lab) have `[Authorize]` commented.

### 5.6 Features only (or richer) on this API

First-class here vs thinner/missing on NigaHomeopathy-API:

- Full **Pagination** search surface (what the UI `GET_SECTIONS`, `GET_AUTHORS`, `GetDiagnosis`, etc. call)
- Diagnosis group / system / therapeutics / keyword / monogram / pathology
- Materia medica master/head/details CRUD
- Clinical questions + keywords + body-part mapping
- Author, intensity, language, country, gender
- Role + menu masters
- Razorpay `Order/GenerateOrderId`
- News + news category + enquiry
- CaseDetails dedicated controller
- PatientLabTest master CRUD
- AppointmentHistoryNote dedicated controller

SQL helpers: `Database/Scripts/SubSection_SearchNormalized_Setup.sql`, `RubricDetails_Performance_Indexes.sql`, junction scripts under `Scripts/`.

Static: `GET /NewsImages/...` from `Resources/NewsImages`.

---

## 6. Dual-API split (which UI call goes where)

From `config.js` + `api_helper.js` + `realbackend_helper` usage:

### Classic API — `api.API_URL` (`default` client) — NIGA_Latest_Code_API

Typical: Login, SubscriptionStatus, Pagination/*, section/subsection/rubric-remedy/remedy/author/MM/diagnosis/clinical questions/drugs/packages/roles/users/news/blog/labs pagination, doctorDashBoard, PatientApp (some), clipboard, prescription, Order/GenerateOrderId, Subscription/SaveUpdateSubscription, country/state, intensity, language, bodypart.

This is why admin repertory/MM/clinical-pattern screens keep working even if the .NET 8 API is down — **most master CRUD still hits api.homeocentrum.com**.

### Newer API — `api.API_URL_NIGAHOMEOPATHY` (`nigahomeo` / multipart) — NigaHomeopathy-API

Typical: RegisterDoctor, ActivateUser, registration dropdowns, qualifications CRUD, 3D body-part masters, WhatsApp, PatientBoardBackup, AudioCaseTaking, AudioCaseIntelligence, some patient import/multipart, audio download blobs.

Doctor dashboard mix: counts/lists often classic; schedule/slots, backup, audio, WhatsApp, 3D on newer.

**Implication:** One UI, two backends, one shared DB conceptually. Features can diverge if only one API is updated.

---

## 7. Feature catalog (user-facing + implementation)

### 7.1 Public marketing site

**User:** Home, about, features, pricing, blog, news, contact, privacy, terms, account.  
**UI:** `pages/Landing/HomeoJobLanding/*`, `constants/landingRoutes.js`  
**Data:** Blog/news list APIs on classic (`Pagination/GetAllBlogDetail`, `GetAllNewsDetails`).

### 7.2 Authentication & onboarding

**User:** Login, register as doctor, forgot password, activate via email link, logout.  
**UI:** `pages/Authentication/*`, `slices/auth/*`  
**API:** Classic Account/Users/Login; newer RegisterDoctor + registration dropdowns + ActivateUser; SMTP for mail.

### 7.3 Subscriptions & payments

**User:** See days remaining, last-5-days warning, upgrade package, Razorpay checkout.  
**UI:** Doctor `Widgets.js`, `refreshAuthSubscriptionStatus`  
**API:** Classic `Order/GenerateOrderId` + `Subscription/SaveUpdateSubscription`; packages on both; login flags `IsPlanActive` / `DaysRemaining` / `IslastFiveDays`.

### 7.4 Admin dashboard

**User:** Admin landing (currently Velzon ecommerce dashboard at `/dashboard` plus `admin/dashboard`).  
**UI:** `pages/Admin/Dashboard`, login redirect to `/dashboard`.

### 7.5 Existance / clinical questions masters

**User:** Maintain question sections (“Existance”), groups, subgroups, clinical questions mapped to body parts and rubrics.  
**UI:** `pages/Admin/ExistanceQuestions/**`  
**Redux:** `existance`, `questiongroup`, `subquestiongroup`, `clinicalquestions`  
**API:** Classic question* + clinicalquestions + Pagination GetQuestion*.

**Doctor use:** Patient Board **Questions** tab loads the same taxonomy (`getQuestionSectionDll`, groups by existance, subgroups by QG+QS, keywords → rubrics).

### 7.6 Clinical patterns / diagnosis

**User (admin):** Diagnosis systems, therapeutics details, diagnosis & conditions with keyword→rubric links.  
**UI:** `pages/Admin/ClinicalPatterns/**` including `DiagnosisKeywordTable.js`, `DiagnosisSubSectionSelect.js`  
**Doctor use:** Patient Board **Clinical Pattern** tab: diagnosis search → 13 keyword tabs → rubrics + therapeutics (`GetThrepoticByDiagonisID`).

**API:** Classic diagnosis* controllers.

### 7.7 Repertory

**User (admin):** Sections, hierarchical subsections (rubrics), languages, body parts, intensity, remedies, grades, map remedies onto rubrics by author/grade, Excel import/export, small/confirmation flags, remedial-rubrics viewer.  
**UI:** `pages/Admin/Repertory/**`  
**Doctor use:** Patient Board **Repertory** tree + search + intensity chips → clipboard.

**API:** Mix — Pagination/search on classic; some subsection search/hotspot on newer.

### 7.8 Materia medica

**User (admin):** Authors, MM records, heads (chapter headings), remedy-wise MM viewer, default differential-head flag.  
**Doctor use:** MM tab + repertorize differential accordion.  
**API:** Classic MM controllers + `RepertorizationPage`.

### 7.9 Adverse effects (allopathic)

**User (admin):** Drug systems, groups, allopathic drugs with serious/other/adverse reactions.  
**Doctor use:** Adverse Effect tab on Patient Board while taking the case (cross-reference conventional drugs).  
**API:** Classic drug* + AllopathicDrug; newer AllopathicDrug also present.

### 7.10 Deep analytics

**User:** Menu items exist.  
**Implementation:** `admin/commingsoon` placeholder only. Not built.

### 7.11 Business management

Packages, qualifications, roles, users, blogs, news, labs & imaging — standard CRUD. Qualifications hit **newer** API; news/blog/labs/roles/users/packages largely **classic**.

### 7.12 3D body part

**Admin:** Mesh keys, sections, hotspots.  
**Doctor:** Interactive GLB anatomy; hotspot → rubric search.  
**API:** Newer `threeDBodyPart*` only.

### 7.13 Rubric intelligence (admin)

Maintain metaphors and aliases the AI uses; approve/reject; watch benchmark/rollout/config.  
**API:** Newer `AudioCaseIntelligence`.

### 7.14 Doctor dashboard & appointments

Counts by status, day schedule, slot picker, create patient, create/reschedule appointment, status transitions, patient import/export, stats charts, WhatsApp, subscription.  
**Files:** `pages/Doctor/Dashboard/**`, `slices/doctor/dashboard`, appointment Common components.

### 7.15 Patient Board (classic case taking + repertorize + Rx)

See §3.14. This is the product’s clinical heart.

### 7.16 Audio AI case taking

See §3.15 (UI) and §4.8 (API). Unique to NigaHomeopathy-API + UI CaseTaking components.

### 7.17 Patient board backup / multi-session

Up to 5 in-memory sessions; header stack; last-work restore from server JSON (`DoctorPatientBoardBackup`).  
**API:** newer `PatientBoardBackup`.

### 7.18 WhatsApp outreach

Templates + hospital service / offer / health tip / bulk; opt-in on Patient.  
**API:** newer WhatsApp + Meta Cloud; background bulk queue.

### 7.19 Reception staff

Role `Reception` uses doctor dashboard layout. Login via Account (both APIs). Newer API has dedicated `ReceptionStaff` CRUD. Reception JWT includes `DoctorID`.

### 7.20 Labs & imaging

Admin lab-test master; doctor orders and enters results on Patient Board prescription modal.  
**API:** classic PatientLab / PatientLabTest / Pagination GetPatientLabTests.

### 7.21 CMS / enquiry

Admin news & blogs. Classic also has public enquiry + email. News controllers on newer API are commented out.

### 7.22 Velzon template leftovers (not product)

Still routed: ecommerce, NFT, crypto, CRM, tickets, mailbox, kanban, job boards, Apex/Chart.js/ECharts galleries, Base/Advance UI, maps, invoices, file manager, todos, API keys, extra landings. Fake backend serves them. **Not part of Homeocentrum clinical product.**

---

## 8. Data model / domain glossary

| Term | Meaning in this product |
|------|-------------------------|
| **Section** | Top-level repertory chapter (e.g. Mind, Head) |
| **SubSection / Rubric** | Hierarchical symptom text; the unit added to a clipboard |
| **Remedy** | Homeopathic medicine |
| **Grade** | Strength of remedy–rubric relationship (by author) |
| **Intensity** | Patient symptom intensity when selecting a rubric |
| **Clipboard** | Working set of selected rubrics for repertorization |
| **Repertorization** | Score remedies from selected rubrics (common/uncommon/elimination) |
| **Materia Medica** | Narrative remedy descriptions by author/head |
| **Existance** | Question-section taxonomy for case-taking questionnaires |
| **Clinical Pattern / Diagnosis** | Disease-pattern keywords linked to rubrics and therapeutics |
| **CaseEntryDetail** | A case owned by a doctor for a patient |
| **PatientAppointment** | Visit; status bucket; Rx and labs hang off it |
| **Package / PackageEntryDetail** | SaaS plan and the doctor’s subscription row |
| **Mesh key / hotspot** | 3D model region mapped to repertory search |
| **AudioCaseSession** | One recording → transcript → AI rubrics |
| **Metaphor / alias** | Admin-curated language the AI uses to match spoken symptoms to rubrics |

There is **no pharmacy module** and **no invoice entity**. Commercial model = package subscription.

---

## 9. Auth, roles, subscriptions

```
Login UI  →  POST api.homeocentrum.com/api/Account/Login
          →  JWT in sessionStorage.authUser
          →  axios interceptors attach Bearer to BOTH API hosts
```

| Role | Home | Sidebar | Notes |
|------|------|---------|-------|
| Admin | `/dashboard` | Visible | Master data |
| Doctor | `/doctordashboard` | Hidden | Full clinical UI |
| Reception | `/doctordashboard` | Hidden | Same layout; JWT has DoctorID |
| Management / Supervisor / Inspector | (enum only) | — | Not specially routed |

Plan gating is **flag-based in login payload + UI**, not a hard API gateway for every clinical call.

Passwords: doctor/user masters compared **plaintext** on both APIs; reception uses a hash helper on classic.

---

## 10. Architecture patterns, gaps, and notes

### Patterns

1. **Velzon shell + domain graft** — unused demo surface still in routes, menu, and Redux.
2. **Thunk → url_helper → realbackend_helper → axios client** — consistent UI data access.
3. **Mega-components** — `PatientBoard.js` (~13.5k) and `Widgets.js` (~3.5k) concentrate logic.
4. **Dual API / shared DB** — classic masters vs newer AI/ops.
5. **Feature flags** on newer API for AI engine versions (fast-f, V3–V7, ECI v8, KG).
6. **Client performance work** — rubric prefetch queue, paged subsection search, audio poll cap.
7. **Background processing** on .NET 8: audio queue, embeddings, WhatsApp bulk, Excel import, retention.

### Gaps / risks (observational)

- No per-route frontend ACL.
- Many repertory APIs have `[Authorize]` commented (classic and newer).
- Plaintext passwords on UserMaster.
- `.env` `REACT_APP_API_URL` points at Themesbrand demo; domain code ignores it (`config.js` wins).
- Fake backend still activated in `App.js`.
- `start`/`build` scripts use Windows `set` (macOS may ignore heap bump).
- Identity registered on .NET 8 but unused for login.
- Admin login lands on Velzon `/dashboard` (ecommerce), not only `admin/dashboard`.
- Deep Analytics is coming-soon.
- Two APIs can drift; UI must keep calling the correct host.
- Secrets in API `appsettings.json` (rotate; do not commit new copies).
- Directory browsing enabled for `/attachments` and `/Blogs` on newer API.

### How to run (local)

```bash
# Classic API
cd "/Users/OctazenWork/NIGA Project/NIGA_Latest_Code_API/NIGA.Centrum.API"
dotnet run
# http://localhost:5000/swagger

# Newer API
cd "/Users/OctazenWork/NIGA Project/NigaHomeopathy-API/Niga-Web"
dotnet run --launch-profile http
# http://localhost:5038/swagger

# UI — uncomment localhost block in src/config.js
cd "/Users/OctazenWork/NIGA Project/NigaHomeopathy-UI"
npm start
```

### Related docs (this folder)

- `AUDIO_CASE_TAKING_FEATURE_SPEC.md`
- `AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md`
- `AUDIO_CASE_TAKING_COMPLETE_REPORT.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V2_APPROVAL_PACK.md`
- `AUDIO_CASE_TAKING_AI_ENGINE_V3_ARCHITECTURE.md`

API-side: `/Users/OctazenWork/NIGA Project/NigaHomeopathy-API/docs/AUDIO_CASE_*.md`, `AI_RUBRIC_ENGINE_SYSTEM_DOCUMENTATION.md`.

---

## Appendix A — UI domain file map (product only)

```
pages/Admin/
  Dashboard/
  CommingSoon/
  ExistanceQuestions/{Existance,QuestionGroup,SubQuestionGroup,ClinicalQuestions}/
  ClinicalPatterns/{DiagnosisSystem,DiagnosisTherapeuticsDetails,DiagnosisConditions}/
  Repertory/{Section,SubSection,Rubrics,RemedialRubrics,Language,BodyParts,Intensity,Remedy,RemedyGrade}/
  MateriaMedica/{Author,MateriaMedicaRemedies,MateriaMedica,Head}/
  AdverseEffect/{DrugSystem,DrugGroup,AllopathicDrug}/
  BusinessManagement/{Packages,Qualifications,Roles,Users,Blogs,News,LabsImaging}/
  3DBodyPartv/{MeshKeyMaster,SectionMaster,Hotspots}/
  RubricIntelligence/
pages/Doctor/
  Dashboard/   index, Widgets, BestSellingProducts, charts, stats
  PatientBoard/PatientBoard.js
pages/Authentication/  Login, Register, Logout, ForgetPassword, user-profile
pages/Landing/HomeoJobLanding/  + Minimaltheme (legacy)
pages/AnatomyPage.js
```

## Appendix B — Newer API vs classic API (module presence)

| Module | Classic 2.2 | Newer .NET 8 |
|--------|-------------|--------------|
| Login / users / roles | Yes | Partial (users, no Role/Menu controllers) |
| Pagination master lists | Yes (central) | Limited / overlapping |
| Repertory CRUD + Excel | Yes | Yes (subset + jobs) |
| Diagnosis / MM / clinical Q | Yes (full) | Thin (MM details, questions) |
| Appointments / patients / Rx / labs | Yes | Yes (extended schedule/slots) |
| Razorpay orders | Yes | No OrderController |
| News / blogs / enquiry | Yes | Blog yes; news commented |
| Reception CRUD | Login only | Yes |
| Doctor self-registration | No dedicated | Yes |
| Patient board backup | No | Yes |
| WhatsApp | No | Yes |
| 3D anatomy masters | No | Yes |
| Audio case + AI engines | No | Yes |
| Embeddings / KG / monitoring | No | Yes |
| Qualifications as first-class API | Yes | Yes (what UI register/admin uses) |

---

*End of analysis. Workspace `/Users/OctazenWork/NIGA Project/minimal` was not included.*

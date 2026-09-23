# HomeoCentrum — Audio Case Taking Feature
## Complete Technical & Functional Documentation

**Version:** 1.0 (June 2026)  
**Project:** NigaHomeopathy-UI + New_API  
**Production API:** `https://api1.homeocentrum.com/api`  
**Database:** `HomeoCentrum_Production`  
**Purpose:** This document describes the full Audio Case Taking feature for doctors. Upload to ChatGPT or share with developers for onboarding, support, or further development.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Goals & User Roles](#2-business-goals--user-roles)
3. [End-to-End User Journey](#3-end-to-end-user-journey)
4. [System Architecture](#4-system-architecture)
5. [Frontend (NigaHomeopathy-UI)](#5-frontend-nigahomeopathy-ui)
6. [Backend (New_API)](#6-backend-new_api)
7. [REST API Reference](#7-rest-api-reference)
8. [Database Schema & SQL Script](#8-database-schema--sql-script)
9. [AI Processing Pipeline](#9-ai-processing-pipeline)
10. [Rubric Matching (Database + AI Suggested)](#10-rubric-matching-database--ai-suggested)
11. [Repertorization Integration](#11-repertorization-integration)
12. [Audit Logging & Safety](#12-audit-logging--safety)
13. [Background Jobs & Retention](#13-background-jobs--retention)
14. [Configuration (appsettings.json)](#14-configuration-appsettingsjson)
15. [Deployment Checklist](#15-deployment-checklist)
16. [Testing Guide](#16-testing-guide)
17. [Known Limitations](#17-known-limitations)
18. [Troubleshooting](#18-troubleshooting)
19. [Complete File Index](#19-complete-file-index)

---

## 1. Executive Summary

Audio Case Taking allows a **doctor** on the HomeoCentrum dashboard to:

1. Record live audio **or** upload an existing audio file during a patient consultation.
2. Obtain patient **consent** before processing.
3. Send audio to the backend for **AI analysis** (OpenAI Whisper + GPT-4o).
4. Receive:
   - **English transcript** (translated if source language is Marathi/Hindi/etc.)
   - **Doctor–patient conversation** (Q&A format with timestamps)
   - **Clinical summary** (chief complaint, HPI, mentals, generals, modalities, particulars, red flags)
   - **Suggested rubrics** from the repertory database (English `SubSectionMaster`)
   - **AI suggested rubrics** (GPT-generated, tagged, not in DB) when DB matches are insufficient
5. **Auto-add** up to 20 rubrics to the Patient Board **Repertorize** tab.
6. **Edit transcript** and **re-analyze** without re-uploading audio.
7. **Append summary** to the appointment history note.
8. **Download** the original recording.
9. **Restore** the latest session when reopening Patient Board in audio mode.

All steps are **audit-logged** in SQL Server for clinical safety and traceability.

---

## 2. Business Goals & User Roles

| Role | Access |
|------|--------|
| Doctor | Full access: upload, analyze, rubrics, repertorization, history note |
| Patient | No direct access; consent captured by doctor |
| Admin | DB/SQL script, server config, OpenAI key on API server |

**Clinical workflow goal:** Reduce manual case entry time while keeping the doctor in control of rubric selection and repertorization.

**Repertorization limit:** Maximum **20 rubrics** per patient board session (existing Patient Board rule).

---

## 3. End-to-End User Journey

### Step 1 — Entry from Doctor Dashboard

**File:** `src/pages/Doctor/Dashboard/BestSellingProducts.js`

- Doctor clicks **patient name** on the dashboard appointment/patient list.
- Modal opens: **`CaseTakingModeModal`**
  - **Manual case taking** → navigates to Patient Board (normal mode)
  - **Audio case taking** → navigates to Patient Board with URL query `caseTakingMode=audio`

**Navigation URL pattern (audio mode):**
```
/patient-board?patientId={id}&caseId={id}&patientAppId={id}&patientName={name}&caseTakingMode=audio
```

### Step 2 — Patient Board (Audio Mode)

**File:** `src/pages/Doctor/PatientBoard/PatientBoard.js`

When `caseTakingMode=audio`, the **`AudioCasePanel`** component renders at the top of the board.

### Step 3 — Audio Input

Doctor can choose:

| Tab | Action |
|-----|--------|
| **Record live** | Browser microphone: Record → Pause → Resume → Stop |
| **Upload file** | Accepts mp3, wav, m4a, webm, ogg, aac (max 50 MB) |

Additional UI:
- **Consent checkbox** (required before analyze)
- **Source language dropdown** (optional; Auto-detect, en, hi, mr, gu, ta, te, kn, bn)
- **Live waveform** visualization while recording
- **Download recording** (local blob or from server after upload)

### Step 4 — Analyze Conversation

- Doctor clicks **Analyze conversation**.
- Confirmation dialog (SweetAlert2).
- Frontend uploads multipart form to API → receives `sessionId` → polls status every 2.5s until `Completed` or `Failed`.

### Step 5 — Results Display

After completion, panels show:

| Panel | Content |
|-------|---------|
| Processing status | Progress step + percent |
| Transcript editor | Editable English transcript + Re-analyze button |
| Conversation | Doctor/patient messages with timestamps |
| Summary report | Chief complaint, HPI, mentals, generals, modalities, particulars, red flags |
| Suggested rubrics | DB rubrics + AI suggested rubrics (tagged) |

### Step 6 — Repertorization

- Up to **20 rubrics auto-applied** to Repertorize tab when analysis completes.
- Doctor can also click **Add** or **Add all to repertorization** manually.
- **Append to history note** button adds summary text to the Draft.js history note editor.

### Step 7 — Session Restore

On Patient Board load (audio mode), frontend calls **`GET /latest`** to restore the most recent session for that patient/case.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     NigaHomeopathy-UI (React)                           │
│  BestSellingProducts → CaseTakingModeModal → PatientBoard             │
│  AudioCasePanel → Redux (AudioCaseTaking) → realbackend_helper.js     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS + JWT Bearer
                                │ https://api1.homeocentrum.com/api
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     New_API (ASP.NET Core)                              │
│  AudioCaseTakingController → AudioCaseTakingService                     │
│  Background: AudioCaseTakingBackgroundService (queue worker)            │
│  Background: AudioCaseRetentionBackgroundService (purge old audio)        │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────────────────┐
│  SQL Server               │   │  OpenAI API (Direct)                  │
│  HomeoCentrum_Production  │   │  whisper-1 (translation/transcription)│
│  SubSectionMaster (rubrics)│   │  gpt-4o (extraction + AI rubrics)    │
│  7 AudioCase* audit tables  │   └───────────────────────────────────────┘
└───────────────────────────┘
                │
                ▼
┌───────────────────────────┐
│  Local file storage       │
│  Data/AudioCaseTaking/    │
│  (on API server disk)     │
└───────────────────────────┘
```

### Processing Model

- **Synchronous:** Upload, status poll, result fetch, download, re-analyze request, doctor-action log, latest session.
- **Asynchronous:** AI pipeline runs in **`AudioCaseTakingBackgroundService`** via an in-memory queue (`AudioCaseTakingQueue`).

---

## 5. Frontend (NigaHomeopathy-UI)

### 5.1 API Base URL

**File:** `src/config.js`

```javascript
API_URL_NIGAHOMEOPATHY: "https://api1.homeocentrum.com/api"
```

All audio endpoints use this base URL with JWT from the logged-in doctor session.

### 5.2 Components

| File | Purpose |
|------|---------|
| `src/Components/CaseTaking/CaseTakingModeModal.js` | Manual vs Audio choice modal |
| `src/Components/CaseTaking/AudioCasePanel.js` | Main panel: record, upload, analyze, all sub-panels |
| `src/Components/CaseTaking/AudioCaseProcessingStatus.js` | Upload/processing progress UI |
| `src/Components/CaseTaking/AudioCaseTranscriptEditor.js` | Editable transcript + re-analyze |
| `src/Components/CaseTaking/AudioCaseConversationPanel.js` | Doctor/patient Q&A list |
| `src/Components/CaseTaking/AudioCaseSummaryPanel.js` | Summary + append to history note |
| `src/Components/CaseTaking/AudioCaseRubricSuggestions.js` | DB rubrics + AI suggested rubrics table |

**Important:** Folder is `Components` (capital C). Imports must use `../../../Components/CaseTaking/...` not `components`.

### 5.3 Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useAudioRecorder.js` | MediaRecorder: start/pause/resume/stop, local blob, duration |
| `src/hooks/useAudioWaveform.js` | Live audio level bars during recording |

### 5.4 Helpers

| File | Purpose |
|------|---------|
| `src/helpers/audioCaseTakingHelper.js` | Constants, mock data, rubric mapping, summary→history text builder |
| `src/helpers/audioCaseDownloadHelper.js` | Download filename builder, blob download |
| `src/helpers/audioCaseOfflineQueueHelper.js` | IndexedDB queue when upload fails (offline resilience) |
| `src/helpers/url_helper.js` | API path constants |
| `src/helpers/realbackend_helper.js` | Axios API function wrappers |
| `src/helpers/patientBoardSessionHelper.js` | Session persistence fields for audio state |

### 5.5 Redux

| File | Purpose |
|------|---------|
| `src/slices/doctor/audioCaseTaking/reducer.js` | State: sessionId, status, transcript, messages, summary, rubrics, loading flags |
| `src/slices/doctor/audioCaseTaking/thunk.js` | Async actions: upload, poll, re-analyze, load latest, log doctor action |
| `src/slices/index.js` | Registers `AudioCaseTaking` reducer |
| `src/slices/thunks.js` | Re-exports audio thunks |

**Redux state shape:**
```javascript
{
  sessionId: null,
  audioSource: null,           // LiveRecording | FileUpload
  selectedFileName: null,
  language: '',
  status: 'idle',              // idle | uploading | processing | completed | failed
  progressStep: null,
  progressPercent: 0,
  transcript: null,
  messages: [],
  summary: null,
  suggestedRubrics: [],
  usedMockData: false,
  canDownloadFromServer: false,
  error: null,
  uploadLoading: false,
  pollLoading: false,
  reAnalyzeLoading: false,
  restoredFromServer: false,
}
```

### 5.6 Thunk Actions

| Action | Description |
|--------|-------------|
| `uploadAndAnalyzeAudioCase` | Multipart upload → poll until complete |
| `pollAudioCaseAnalysis` | Status loop (max 120 attempts × 2.5s ≈ 5 min) |
| `reAnalyzeAudioCase` | POST edited transcript → poll again |
| `loadLatestAudioCaseSession` | Restore session on Patient Board mount |
| `logAudioDoctorAction` | Audit log when doctor accepts rubrics / appends summary |

**Mock fallback (frontend only):** If API returns 404/501/5xx, frontend may show demo mock data. Disable by ensuring API is deployed and SQL tables exist. Set backend `UseMockWhenNoApiKey: false` for live AI.

### 5.7 Patient Board Integration

**File:** `src/pages/Doctor/PatientBoard/PatientBoard.js`

- Renders `AudioCasePanel` when `caseTakingMode=audio`
- Passes `onApplyRubric={handleIntensityChipClick}` for repertorization
- Passes `onAppendSummaryToHistoryNote` to append summary to Draft.js history note
- Persists audio session fields in patient board session snapshot

**Repertorization handler:** `handleIntensityChipClick(rubricData, intensity, options)`

- AI suggested rubrics pass `{ skipCommanUncommanRefresh: true }` because they have negative/fake SubSectionId and no remedy data in DB.

### 5.8 Auto-Apply Rubrics

**File:** `AudioCasePanel.js`

When analysis status becomes `completed` and `suggestedRubrics.length > 0`:
- Automatically adds rubrics to repertorization (up to 20 total)
- Logs `RubricsAutoAppliedToRepertorization` doctor action
- Uses ref to avoid duplicate apply on same sessionId

---

## 6. Backend (New_API)

### 6.1 Controller

**File:** `Niga-Web/Controllers/AudioCaseTakingController.cs`

- Route prefix: `[Route("api/AudioCaseTaking")]`
- Requires `[Authorize]` (JWT)
- All responses use `ThreeDBodyPartApiResponseHelper` wrapper

### 6.2 Service Layer

**File:** `Niga-Domain/Repositories/AudioCaseTakingService.cs`

Main business logic:
- Upload validation (size, extension, consent)
- Save audio to `Data/AudioCaseTaking/{sessionId}.ext`
- Create session + consent log
- Enqueue background job
- Status/result/download/re-analyze/latest/doctor-action
- Rubric matching orchestration
- Audit event logging

### 6.3 AI Processor

**File:** `Niga-Domain/Services/AudioCaseAiProcessor.cs`

| Method | OpenAI Endpoint | Purpose |
|--------|-----------------|---------|
| `TranslateAudioToEnglishAsync` | `POST /v1/audio/translations` | Marathi/Hindi audio → English transcript |
| `TranscribeAsync` | `POST /v1/audio/transcriptions` | Raw transcription (when OutputEnglishOnly=false) |
| `ExtractCaseDataAsync` | `POST /v1/chat/completions` | Conversation, summary, symptoms, englishTranscript |
| `SuggestAiRubricsAsync` | `POST /v1/chat/completions` | AI rubrics not in DB |
| `ComputeTextSimilarity` | (local Jaccard) | Semantic score for DB rubric ranking |

### 6.4 Background Services

| File | Purpose |
|------|---------|
| `AudioCaseTakingBackgroundService.cs` | Reads queue; runs `ProcessSessionAsync` or `ProcessReAnalyzeAsync` |
| `AudioCaseRetentionBackgroundService.cs` | Deletes audio files older than retention policy |
| `AudioCaseTakingQueue.cs` | In-memory `Channel<AudioCaseTakingJob>` |

### 6.5 DI Registration

**File:** `Niga-Domain/Extensions/ApplicationServiceExtensions.cs`

```csharp
services.Configure<AudioCaseTakingOptions>(...);
services.Configure<OpenAiOptions>(...);
services.Configure<AzureOpenAiOptions>(...);  // registered but NOT wired to AI processor yet
services.AddHttpClient("OpenAI", ...);
services.AddScoped<AudioCaseAiProcessor>();
services.AddScoped<IAudioCaseTakingService, AudioCaseTakingService>();
services.AddSingleton<AudioCaseTakingQueue>();
services.AddHostedService<AudioCaseTakingBackgroundService>();
services.AddHostedService<AudioCaseRetentionBackgroundService>();
```

### 6.6 Entity / DbContext

**Entities:** `Niga-Domain/Master/AudioCaseSession*.cs` (7 entities)

**DbContext:** `Niga-Domain/Data/NIGACentrumContext.cs` — DbSets + fluent mappings for all 7 tables.

### 6.7 Rubric DB Search

**File:** `Niga-Domain/Repositories/SubSectionRepository.cs`  
**Method:** `SearchSubSectionsByHotspotAsync`

**SQL equivalent:**
```sql
SELECT SubSectionId, SubSectionName
FROM dbo.SubSectionMaster
WHERE DeleteStatus = 0
  AND SubSectionName IS NOT NULL
  AND LOWER(SubSectionName) LIKE '%' + LOWER(@searchTerm) + '%'
ORDER BY SubSectionName
```

Searches **English rubric names only** in `SubSectionName`. Does not search alias, description, or language tables.

---

## 7. REST API Reference

**Base URL:** `https://api1.homeocentrum.com/api`  
**Auth:** `Authorization: Bearer {JWT_TOKEN}`

### 7.1 POST `/AudioCaseTaking/upload`

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audioFile | file | Yes | Audio recording |
| patientId | long | Yes | Patient ID |
| caseId | long | No | Case ID |
| patientAppId | long | No | Legacy appointment ID |
| doctorUserId | long | No | Doctor user ID |
| audioSource | string | Yes | `LiveRecording` or `FileUpload` |
| originalFileName | string | No | Display/download filename |
| language | string | No | Source language hint (en, hi, mr, etc.) |
| consentGiven | bool | Yes | Must be true |

**Response (success):**
```json
{
  "resultObject": {
    "sessionId": "guid",
    "status": "Uploaded"
  }
}
```

### 7.2 GET `/AudioCaseTaking/{sessionId}/status`

**Response:**
```json
{
  "resultObject": {
    "sessionId": "guid",
    "status": "Processing",
    "progressStep": "TranscriptionStarted",
    "percent": 40,
    "errorMessage": null
  }
}
```

**Status values:** `Uploaded`, `Processing`, `Completed`, `Failed`

### 7.3 GET `/AudioCaseTaking/{sessionId}/result`

**Response (when Completed):**
```json
{
  "resultObject": {
    "sessionId": "guid",
    "transcript": "English transcript text...",
    "messages": [
      { "role": "doctor", "text": "...", "timestamp": "00:01:15" },
      { "role": "patient", "text": "...", "timestamp": "00:01:25" }
    ],
    "summary": {
      "chiefComplaint": "...",
      "historyOfPresentIllness": "...",
      "mentals": [],
      "generals": [],
      "modalities": [],
      "particulars": [],
      "redFlags": []
    },
    "suggestedRubrics": [
      {
        "subSectionId": 12345,
        "subSectionName": "GENITALIA - ERUPTIONS, fungal",
        "matchScore": 0.82,
        "suggestedIntensityNo": 3,
        "matchedFrom": "fungal infection scrotum",
        "isAiSuggested": false,
        "matchSource": "Database"
      },
      {
        "subSectionId": -1,
        "subSectionName": "SKIN - DISCHARGE, pus",
        "matchScore": 0,
        "suggestedIntensityNo": 2,
        "matchedFrom": "pus discharge",
        "isAiSuggested": true,
        "matchSource": "AiGenerated"
      }
    ]
  }
}
```

### 7.4 GET `/AudioCaseTaking/{sessionId}/download`

Returns audio file bytes (`Content-Disposition` attachment).

### 7.5 POST `/AudioCaseTaking/{sessionId}/reanalyze`

**Body:**
```json
{ "transcript": "Edited English transcript..." }
```

Re-runs GPT extraction + rubric matching (skips Whisper). Increments `ReAnalysisCount`.

### 7.6 POST `/AudioCaseTaking/{sessionId}/doctor-action`

**Body:**
```json
{
  "actionType": "RubricAccepted",
  "targetType": "SubSection",
  "targetId": "12345",
  "beforeJson": null,
  "afterJson": "{\"rubricName\":\"...\",\"intensityNo\":2}",
  "notes": null
}
```

**Logged action types:**
- `RubricAccepted`
- `RubricsAcceptedBulk`
- `RubricsAutoAppliedToRepertorization`
- `SummaryAppendedToHistoryNote`
- Plus event types mirrored from session events

### 7.7 GET `/AudioCaseTaking/latest?patientId={id}&caseId={id}`

Returns most recent session for doctor + patient (+ optional case). If completed, includes full `result`.

---

## 8. Database Schema & SQL Script

**Script path:** `New_API/Database/Scripts/AudioCaseTaking_CreateTables.sql`  
**Run manually** on `HomeoCentrum_Production` before first API use. Safe to re-run (IF NOT EXISTS).

### 8.1 Tables (7 total)

| Table | Purpose |
|-------|---------|
| `AudioCaseSession` | Core session: audio path, transcript, JSON results, status |
| `AudioCaseSessionEventLog` | Lifecycle events (upload, transcribe, fail, etc.) |
| `AudioCaseAiRequestLog` | Every OpenAI call: model, tokens, latency, success/fail |
| `AudioCaseConsentLog` | Patient consent record with IP, user agent, version |
| `AudioCaseRubricMatchLog` | Each suggested rubric with scores and rank |
| `AudioCaseDoctorActionLog` | Doctor accept/reject/append actions |
| `AudioCaseRetentionLog` | Audio file purge audit |

### 8.2 AudioCaseSession Key Columns

| Column | Description |
|--------|-------------|
| AudioCaseSessionId | GUID primary key |
| PatientId, CaseId, DoctorUserId | Ownership |
| AudioSourceType | LiveRecording / FileUpload |
| Status, CurrentStep | Processing state |
| AudioFilePath | Server disk path |
| TranscriptRaw | English transcript (NVARCHAR MAX) |
| ConversationJson | JSON array of messages |
| SummaryJson | JSON summary object |
| ExtractedSymptomsJson | JSON symptoms with searchTerms |
| SuggestedRubricsJson | JSON rubric list (DB + AI) |
| LanguageOverride | UI language hint |
| ReAnalysisCount | Times transcript was re-analyzed |
| AudioPurgedAtUtc | When retention job deleted file |
| CompletedAtUtc | Analysis finish time |

### 8.3 Rubric Source Table (Existing)

**Table:** `dbo.SubSectionMaster`  
**Key columns:** `SubSectionId`, `SubSectionName`, `DeleteStatus`  
Rubrics are stored in **English** in `SubSectionName`.

---

## 9. AI Processing Pipeline

### 9.1 Full Pipeline (New Upload)

```
1. UPLOAD
   → Save file to Data/AudioCaseTaking/
   → Insert AudioCaseSession (Status=Uploaded)
   → Insert AudioCaseConsentLog
   → Enqueue job (JobType=ProcessAudio)

2. BACKGROUND WORKER picks job

3. ENGLISH TRANSLATION (if OutputEnglishOnly=true)
   → OpenAI POST /v1/audio/translations (whisper-1)
   → Output: English transcript
   → Store in TranscriptRaw
   → Log AudioCaseAiRequestLog (ServiceType=Translation)

4. GPT EXTRACTION
   → OpenAI POST /v1/chat/completions (gpt-4o)
   → Input: English transcript
   → Output JSON:
       - englishTranscript (refined)
       - conversation[] (doctor/patient, English)
       - symptoms[] (phrase + searchTerms[], English)
       - summary{} (all fields English)
   → Store JSON columns on session
   → Log AudioCaseAiRequestLog (ServiceType=ChatCompletion)

5. RUBRIC MATCHING
   a) DATABASE MATCH
      → For each symptom (max 12), for each searchTerm:
         Search SubSectionMaster LIKE '%term%'
      → Score: keyword 0.75 + semantic Jaccard × 0.4
      → Top 20 DB rubrics

   b) AI SUGGESTED RUBRICS (if EnableAiSuggestedRubrics=true)
      → If DB count low or zero:
         GPT suggests additional English repertory-style names
      → SubSectionId = -1, -2, -3... (negative = not in DB)
      → isAiSuggested = true, matchSource = AiGenerated
      → Log AudioCaseAiRequestLog (ServiceType=AiRubricSuggestion)

   → Store SuggestedRubricsJson
   → Insert AudioCaseRubricMatchLog rows

6. COMPLETE
   → Status=Completed, CompletedAtUtc=now
```

### 9.2 Re-Analyze Pipeline (Edited Transcript)

```
POST /reanalyze
→ Update TranscriptRaw
→ Enqueue job (JobType=ReAnalyze)
→ Skip Whisper
→ Run steps 4 + 5 only on edited transcript
→ ReAnalysisCount++
```

### 9.3 OpenAI Configuration

**Currently active:** Direct OpenAI only (`OpenAI` section in appsettings.json)

**NOT active yet:** `AzureOpenAI` section is registered in DI but `AudioCaseAiProcessor` does not read it. Use direct OpenAI key for production today.

**Required models:**
- `whisper-1` — audio translation/transcription
- `gpt-4o` — extraction and AI rubric suggestions

**Mock mode:** When `UseMockWhenNoApiKey=true` and no API key, backend returns fixed demo transcript/rubrics. Set `UseMockWhenNoApiKey=false` for live AI.

---

## 10. Rubric Matching (Database + AI Suggested)

### 10.1 Database Rubrics

**MatchSource:** `Database` or `Combined`  
**isAiSuggested:** `false`  
**SubSectionId:** Positive integer from `SubSectionMaster`

**Scoring:**
```
keywordScore = 0.75  (row matched LIKE search)
semanticScore = Jaccard(symptomPhrase, subSectionName)
finalScore = (keywordScore × 0.6) + (semanticScore × 0.4)   [if EnableSemanticRubricMatch]
```

**Search terms built from:**
- Full symptom phrase
- Individual words (length ≥ 3)
- GPT-provided `searchTerms[]` array

### 10.2 AI Suggested Rubrics

**When generated:**
- DB returns 0 rubrics → up to `MaxAiSuggestedRubrics` (default 10) AI rubrics
- DB returns some → AI fills remaining slots up to 20 total

**Properties:**
- **isAiSuggested:** `true`
- **matchSource:** `AiGenerated`
- **SubSectionId:** Negative (-1, -2, ...)
- **matchScore:** 0 (no DB match)
- **UI badge:** Yellow "AI suggested"

**Purpose:** Clinical reference when English DB rubrics don't exist or don't match. **Not stored in SubSectionMaster.**

### 10.3 Why Marathi/Hindi Audio Failed Before English Pipeline

Original flow transcribed in source language → GPT extracted Marathi symptoms → LIKE search on English `SubSectionName` returned **zero rows**.

**Fix:** `OutputEnglishOnly=true` uses Whisper **translations** API + English-only GPT prompt.

---

## 11. Repertorization Integration

### 11.1 Mapping Suggested Rubric → Repertorize List

**File:** `audioCaseTakingHelper.js` → `mapSuggestedRubricToRepertorization`

```javascript
{
  rubricId: subSectionId,
  rubricName: subSectionName,
  sectionId,
  remedyCountForSort,
  matchScore,
  suggestedIntensityNo,
  isAiSuggested
}
```

### 11.2 Adding to Repertorize Tab

**Handler:** `PatientBoard.js` → `handleIntensityChipClick`

- Max 20 rubrics
- Updates intensity if rubric already in list
- For DB rubrics: calls `getRemedyCounts` API
- For AI rubrics: `skipCommanUncommanRefresh: true` (no remedy API call)

### 11.3 Auto-Apply on Analysis Complete

`AudioCasePanel.js` automatically adds all suggested rubrics (DB + AI) up to the 20 limit with default intensity grade 2.

### 11.4 AI Rubric Limitations in Repertorization

| Feature | DB Rubric | AI Suggested Rubric |
|---------|-----------|---------------------|
| Appears in Repertorize list | Yes | Yes |
| Common/Uncommon remedy panel | Yes | No |
| Remedy count API | Yes | No |
| Full repertorization scoring | Yes | Limited |

---

## 12. Audit Logging & Safety

### 12.1 Consent

- Required checkbox in UI before analyze
- Stored in `AudioCaseConsentLog` with:
  - ConsentType: `AudioRecordingClinical`
  - ConsentTextVersion: from config (e.g. `v1.0-2026-06-23`)
  - IP address, User-Agent

### 12.2 Session Events (`AudioCaseSessionEventLog`)

Examples: `SessionCreated`, `AudioUploaded`, `ConsentRecorded`, `ProcessingStarted`, `TranscriptionCompleted`, `LlmExtractionCompleted`, `RubricMatchingCompleted`, `SessionCompleted`, `SessionFailed`, `TranscriptEdited`, `ReAnalysisRequested`, `AudioDownloaded`

### 12.3 AI Request Log (`AudioCaseAiRequestLog`)

Every OpenAI call logged with:
- Provider, ServiceType, ModelName
- PromptTokens, CompletionTokens, LatencyMs
- IsSuccess, ErrorMessage
- Optional RequestPayloadJson / ResponsePayloadJson

### 12.4 Doctor Actions (`AudioCaseDoctorActionLog`)

Logs rubric accepts, bulk adds, auto-apply, summary append with before/after JSON.

### 12.5 Rubric Match Log (`AudioCaseRubricMatchLog`)

Full audit trail of every suggested rubric with scores, rank, MatchSource (`Database`, `Combined`, `AiGenerated`).

---

## 13. Background Jobs & Retention

### 13.1 Processing Queue

- **Type:** In-memory `System.Threading.Channels` (single server)
- **Job types:** `ProcessAudio`, `ReAnalyze`
- **Note:** Jobs lost on API restart; session remains in DB and can be re-triggered manually if needed

### 13.2 Retention Job

**Service:** `AudioCaseRetentionBackgroundService`  
**Interval:** `RetentionJobIntervalHours` (default 24)  
**Policy:** Delete audio files where `CompletedAtUtc` older than `AudioRetentionDays` (default 30)  
**Logs:** `AudioCaseRetentionLog` with ActionType `AudioBlobDeleted`  
**Does NOT delete:** Transcript, JSON results, audit logs (only audio blob on disk)

---

## 14. Configuration (appsettings.json)

**File:** `New_API/Niga-Web/appsettings.json`

```json
{
  "AudioCaseTaking": {
    "StoragePath": "Data/AudioCaseTaking",
    "MaxFileSizeBytes": 52428800,
    "MaxAudioDurationMinutes": 45,
    "ConsentTextVersion": "v1.0-2026-06-23",
    "UseMockWhenNoApiKey": false,
    "EnableSemanticRubricMatch": true,
    "OutputEnglishOnly": true,
    "EnableAiSuggestedRubrics": true,
    "MaxAiSuggestedRubrics": 10,
    "AudioRetentionDays": 30,
    "RetentionJobIntervalHours": 24
  },
  "OpenAI": {
    "ApiKey": "sk-proj-YOUR_KEY_HERE",
    "BaseUrl": "https://api.openai.com/v1",
    "WhisperModel": "whisper-1",
    "ChatModel": "gpt-4o",
    "EmbeddingModel": "text-embedding-3-small"
  },
  "AzureOpenAI": {
    "Endpoint": "",
    "ApiKey": "",
    "DeploymentNameGpt4o": "gpt-4o",
    "DeploymentNameEmbedding": "text-embedding-3-small",
    "ApiVersion": "2024-08-01-preview",
    "PreferAzureOverOpenAi": false
  }
}
```

| Setting | Description |
|---------|-------------|
| UseMockWhenNoApiKey | false = require real OpenAI key |
| OutputEnglishOnly | true = Whisper translations → English |
| EnableAiSuggestedRubrics | true = GPT rubrics when DB match low |
| MaxAiSuggestedRubrics | Max AI rubrics per session (default 10) |
| EnableSemanticRubricMatch | Jaccard scoring on DB matches |
| AudioRetentionDays | Days before audio file deleted |
| MaxFileSizeBytes | 52428800 = 50 MB |

**Security:** Store OpenAI API key on server only. Never in React frontend. Use user-secrets or environment variables in production; do not commit keys to git.

---

## 15. Deployment Checklist

### Database
- [ ] Run `AudioCaseTaking_CreateTables.sql` on production DB
- [ ] Verify 7 tables exist

### API Server (api1.homeocentrum.com)
- [ ] Deploy latest New_API build
- [ ] Set `OpenAI:ApiKey` on server
- [ ] Set `UseMockWhenNoApiKey: false`
- [ ] Set `OutputEnglishOnly: true`
- [ ] Create writable folder `Data/AudioCaseTaking/`
- [ ] Restart IIS / app pool
- [ ] Verify Swagger shows AudioCaseTaking endpoints

### UI
- [ ] Deploy latest NigaHomeopathy-UI build
- [ ] Confirm `config.js` → `API_URL_NIGAHOMEOPATHY: https://api1.homeocentrum.com/api`
- [ ] Test doctor login → dashboard → patient → audio mode

---

## 16. Testing Guide

### 16.1 Happy Path Test

1. Login as doctor
2. Dashboard → click patient name → **Audio case taking**
3. Check consent checkbox
4. Upload mp3/wav OR record 30–60 seconds
5. Click **Analyze conversation**
6. Wait for **Analysis complete**
7. Verify:
   - Transcript in **English**
   - Conversation in **English**
   - Summary in **English**
   - Suggested rubrics section (DB and/or AI tagged)
   - Repertorize tab count > 0 (auto-applied)
8. Click **Append to history note** → verify text in history editor
9. Edit transcript → **Re-analyze from transcript**

### 16.2 SQL Verification

```sql
-- Latest session
SELECT TOP 1 AudioCaseSessionId, Status, LEFT(TranscriptRaw, 300), EnteredDate
FROM dbo.AudioCaseSession ORDER BY EnteredDate DESC;

-- AI calls
SELECT TOP 5 ServiceType, ModelName, IsSuccess, ErrorMessage, EnteredDate
FROM dbo.AudioCaseAiRequestLog ORDER BY EnteredDate DESC;

-- Rubric matches
SELECT SymptomPhrase, SubSectionName, MatchSource, FinalScore, RankPosition
FROM dbo.AudioCaseRubricMatchLog
WHERE AudioCaseSessionId = 'YOUR-GUID'
ORDER BY RankPosition;

-- Doctor actions
SELECT ActionType, TargetType, Notes, EnteredDate
FROM dbo.AudioCaseDoctorActionLog
WHERE AudioCaseSessionId = 'YOUR-GUID';
```

### 16.3 Test Marathi/Hindi Audio

Use Marathi consultation audio → expect English output after `OutputEnglishOnly=true`.

---

## 17. Known Limitations

1. **Azure OpenAI** config exists but is **not wired** to AI processor; use direct OpenAI.
2. **Rubric search** only matches `SubSectionMaster.SubSectionName` (English substring LIKE). No full-text search on alias/description.
3. **AI suggested rubrics** are not in DB — no remedy counts or full repertorization analysis.
4. **Processing queue** is in-memory — not suitable for multi-server load balancing without redesign.
5. **Audio storage** is local disk on API server — not Azure Blob (future enhancement).
6. **Frontend mock fallback** may show demo data if API unreachable (404/5xx).
7. **Max 20 rubrics** in repertorization (existing Patient Board rule).
8. **Max file size** 50 MB; **max duration** config 45 minutes (not strictly enforced server-side beyond file size).
9. **Re-analyze** does not re-run Whisper — transcript edits only.
10. **IndexedDB offline queue** stores metadata only on upload failure — does not auto-retry upload yet.

---

## 18. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Demo/mock data shown | API down or UseMockWhenNoApiKey=true | Deploy API, set key, false mock |
| 0 suggested rubrics | Language mismatch (old sessions) or no English DB match | Re-analyze with OutputEnglishOnly=true; check AI suggested section |
| Repertorize count 0 | Old code before auto-apply; or 0 rubrics returned | Deploy latest UI; check rubric match logs |
| Transcript still Marathi | OutputEnglishOnly=false or old API deploy | Set true, redeploy API |
| OpenAI error in logs | Billing, invalid key, rate limit | Check AudioCaseAiRequestLog.ErrorMessage |
| Upload 401 | JWT expired | Re-login doctor |
| Upload 500 | SQL tables missing | Run SQL script |
| Download fails | Retention purged file | AudioPurgedAtUtc set; re-upload |
| Import error Components | Wrong case in import path | Use `Components` not `components` |

---

## 19. Complete File Index

### Frontend (NigaHomeopathy-UI)

```
src/Components/CaseTaking/
  CaseTakingModeModal.js
  AudioCasePanel.js
  AudioCaseProcessingStatus.js
  AudioCaseTranscriptEditor.js
  AudioCaseConversationPanel.js
  AudioCaseSummaryPanel.js
  AudioCaseRubricSuggestions.js

src/hooks/
  useAudioRecorder.js
  useAudioWaveform.js

src/helpers/
  audioCaseTakingHelper.js
  audioCaseDownloadHelper.js
  audioCaseOfflineQueueHelper.js
  url_helper.js                    (AUDIO_CASE_TAKING_* constants)
  realbackend_helper.js            (API wrappers)
  patientBoardSessionHelper.js     (session persistence)

src/slices/doctor/audioCaseTaking/
  reducer.js
  thunk.js

src/pages/Doctor/Dashboard/
  BestSellingProducts.js           (entry modal)

src/pages/Doctor/PatientBoard/
  PatientBoard.js                  (AudioCasePanel host, repertorization)

src/config.js                      (API_URL_NIGAHOMEOPATHY)

docs/
  AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md   (this file)
```

### Backend (New_API)

```
Niga-Web/
  Controllers/AudioCaseTakingController.cs
  appsettings.json

Niga-Domain/
  Repositories/AudioCaseTakingService.cs
  Services/AudioCaseAiProcessor.cs
  Services/AudioCaseTakingBackgroundService.cs
  Services/AudioCaseRetentionBackgroundService.cs
  Services/AudioCaseTakingQueue.cs
  Interfaces/IAudioCaseTakingService.cs
  DTOs/AudioCaseTakingModels.cs
  Configuration/AudioCaseTakingOptions.cs
  Master/AudioCaseSession.cs
  Master/AudioCaseSessionEventLog.cs
  Master/AudioCaseAiRequestLog.cs
  Master/AudioCaseConsentLog.cs
  Master/AudioCaseRubricMatchLog.cs
  Master/AudioCaseDoctorActionLog.cs
  Master/AudioCaseRetentionLog.cs
  Data/NIGACentrumContext.cs
  Extensions/ApplicationServiceExtensions.cs
  Repositories/SubSectionRepository.cs   (SearchSubSectionsByHotspotAsync)
  Helpers/QueryablePaginationHelper.cs   (ApplySubSectionByHotspotSearch)

Database/Scripts/
  AudioCaseTaking_CreateTables.sql
```

---

## Appendix A — Session Status Flow Diagram

```
Uploaded → Processing → Completed
                ↓
              Failed

Processing steps (CurrentStep):
  ProcessingStarted
  → TranscriptionStarted
  → TranscriptionCompleted
  → LlmExtractionStarted
  → LlmExtractionCompleted
  → RubricMatchingStarted
  → Completed
```

## Appendix B — Supported Audio Formats

**Extensions:** `.mp3`, `.wav`, `.webm`, `.ogg`, `.m4a`, `.aac`, `.mp4`  
**Max size:** 50 MB (52428800 bytes)  
**Live recording:** Browser MediaRecorder (typically webm/opus)

## Appendix C — GPT Extraction JSON Schema

```json
{
  "englishTranscript": "string",
  "conversation": [
    { "role": "doctor|patient", "text": "English", "timestamp": "HH:MM:SS" }
  ],
  "symptoms": [
    {
      "phrase": "short English symptom",
      "searchTerms": ["keyword1", "keyword2"],
      "category": "particular|general|mental",
      "intensityHint": 1
    }
  ],
  "summary": {
    "chiefComplaint": "English",
    "historyOfPresentIllness": "English",
    "mentals": [],
    "generals": [],
    "modalities": [],
    "particulars": [],
    "redFlags": []
  },
  "detectedLanguage": "en"
}
```

## Appendix D — AI Suggested Rubric JSON Schema (Internal GPT Response)

```json
{
  "rubrics": [
    {
      "rubricName": "GENITALIA - ERUPTIONS, fungal",
      "sectionHint": "GENITALIA",
      "matchedFrom": "fungal infection scrotum",
      "suggestedIntensityNo": 3,
      "reason": "Patient reported fungal infection in genital area"
    }
  ]
}
```

---

**Document end.**  
For questions or changes, reference this file and the file index in Section 19.

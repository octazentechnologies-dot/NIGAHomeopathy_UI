# Audio Case & AI Rubric Engine — ONE Combined Technical Document

**Use this file for sharing and for uploading to Claude, ChatGPT, Cursor, or any other AI tool.**  
It is self-contained. You do not need any companion markdown files.

| Field | Value |
| ----- | ----- |
| Combined | 2026-08-16 |
| Source of truth | NigaHomeopathy-API + NigaHomeopathy-UI source code |
| Production engine | **fast-f** (`EnableFastClinicalRetrievalPipeline = true`) |
| Secrets | **NONE included.** API keys, JWT secrets, SMTP, WhatsApp tokens are `[REDACTED]`. |
| Rule for AI tools | Do **not** invent features. If something is marked NOT IMPLEMENTED / LEGACY, treat that as fact. Source code wins over older 31 Jul 2026 UI docs. |

**How to use with AI tools:** upload this single `.md` file and instruct: *“This is the current HomeoCentrum Audio Case → Whisper → GPT → Rubric Discovery → Doctor Review system as implemented. Answer only from this document. Do not design a new architecture unless asked.”*

---

## Combined table of contents

1. [Master source-of-truth table and sections 1–54](#part-1--complete-technical-documentation-sections-154)
2. [Architecture (detailed)](#part-2--architecture-detailed)
3. [API reference (detailed)](#part-3--api-reference-detailed)
4. [Database reference (detailed)](#part-4--database-reference-detailed)
5. [AI prompts (full text)](#part-5--ai-prompts-full-text)
6. [Rubric engine (detailed)](#part-6--rubric-engine-detailed)
7. [Version history (detailed)](#part-7--version-history-detailed)
8. [Performance and accuracy (detailed)](#part-8--performance-and-accuracy-detailed)

Internal “see companion file” links in Part 1 refer to Parts 2–8 **in this same document**.

---



---

# PART 1 — COMPLETE TECHNICAL DOCUMENTATION (SECTIONS 1–54)

# Audio Case & AI Rubric Engine — Complete Technical Documentation

**Audit date:** 2026-08-16  
**Method:** Source code + SQL scripts + existing dated docs. Git SHAs for every historical commit were not fully dumped; engine stamps and dated docs (`AI_RUBRIC_ENGINE_VS_FAST_PIPELINE.md`, 2026-08-13) reconstruct evolution.  
**Code changes in this task:** none.

This file is the **combined** document. Detailed appendices follow as Parts 2–8.

Older `AI_RUBRIC_ENGINE_*.md` files remain. **If they disagree with this audit, source code wins.**

Frontend-side reports dated 31 Jul 2026 live in `NigaHomeopathy-UI/docs/AUDIO_CASE_TAKING_*.md`. They predate `fast-f` and must not be treated as current engine behavior.

---

## Master source-of-truth table

| Area | Current Implementation | Source | Status |
| ---- | ---------------------- | ------ | ------ |
| Frontend | React 18.3.1, Redux Toolkit, react-scripts 5, Bootstrap 5 / reactstrap, axios, Velzon template | `NigaHomeopathy-UI/package.json` | IMPLEMENTED |
| Audio | `useAudioRecorder` MediaRecorder + file upload + live waveform, 50 MB, webm/mp3/wav/ogg/m4a/aac | `useAudioRecorder.js`, `useAudioWaveform.js` | IMPLEMENTED |
| API | ASP.NET Core 8, JWT, `/api/AudioCaseTaking/*`, in-memory job queue | `AudioCaseTakingController.cs` | IMPLEMENTED |
| Whisper | OpenAI `whisper-1` via `audio/translations` (English) | `AudioCaseAiProcessor.TranslateAudioToEnglishAsync` | IMPLEMENTED |
| Transcript | Stored `AudioCaseSession.TranscriptRaw`; not overwritten by GPT | `ProcessSessionAsync` | IMPLEMENTED |
| AI | `gpt-4o` JSON extraction; optional V1 rubric-name GPT | `ExtractCaseDataAsync` | IMPLEMENTED |
| Rubric Search | Fast-f: parallel V1 FTS + keyword + alias + embedding + catalog | `FastClinicalRetrievalOrchestrator` | IMPLEMENTED |
| Embeddings | `text-embedding-3-small` 1536-d JSON vectors; in-memory cache | `EmbeddingSearchEngine`, `AiEmbeddingInfrastructure` | IMPLEMENTED (optional 8s channel) |
| Validation | QualityGate + gender/hierarchy/hallucination + enterprise 8-step | `FastClinicalEvidenceGate`, `ClinicalValidationEngine` | IMPLEMENTED |
| Ranking | CanonicalScore 0.30/0.25/0.20/0.15/0.10 + MMR λ=0.80 | `FastClinicalRanking` | IMPLEMENTED |
| Database | SQL Server `HomeoCentrum_Production`, `AudioCase*` + `SubSectionMaster` | SQL scripts + EF | IMPLEMENTED |
| Doctor Review | Approve/Reject UI + doctor-action + rubric feedback APIs | `AudioCaseRubricApprovalBar`, thunks | IMPLEMENTED |
| Performance | Discovery ~2–3 s; Whisper ~2 min; total ~2.5–9+ min historically | dated docs + timeouts in code | PARTIALLY MEASURED |

---

## 1. Executive Summary

HomeoCentrum Audio Case Taking records or uploads a consultation, transcribes it to English with OpenAI Whisper, extracts symptoms with GPT-4o, and discovers **database-backed** repertory rubrics (`SubSectionMaster`) using the **fast clinical retrieval** pipeline (`engineVersion = fast-f`).

The repository also contains V1–V7, V3 concept-graph GPT models, V6, and ECI v8. Those are **not** the production discovery path while `EnableFastClinicalRetrievalPipeline` is true.

Historical 15–20 minute runs match the **legacy V7/Enterprise** path (measured ~9.4 minutes with 314 s discovery). Fast-c was measured at **~2.5 minutes**, almost entirely Whisper. Target 2–3 minutes is **approachable after Whisper**, not after discovery.

Doctor acceptance for **fast-\*** engines is **not yet measured** (no feedback rows in the accuracy doc).

---

## 2. System Purpose

Let a doctor capture live or uploaded audio for a patient, obtain an English transcript and structured case summary, receive suggested repertory rubrics grounded in `SubSectionMaster`, approve/reject them, apply accepted ones to repertorization, and persist audit/learning signals.

It is **not** an automatic prescribing engine. Remedies appear after the doctor adds rubrics to the existing repertorization UI.

---

## 3. Current Architecture

Full architecture is in **Part 2** of this document.

```text
Frontend → JWT API → disk + SQL session → background worker
  → Whisper translations → GPT extraction → FastClinicalRetrieval
  → poll status/result → doctor approve/reject → feedback logs
```

---

## 4. Technology Stack

### Backend (`NigaHomeopathy-API`)

| Item | Actual |
| ---- | ------ |
| Runtime | .NET 8 (`net8.0`) |
| Web | `Niga-Web` (Swagger / Swashbuckle 6.4) |
| Domain | `Niga-Domain` (services, EF, hosted workers) |
| ORM | EF Core SQL Server 9.0.0-preview.3 |
| Auth | JWT Bearer (`Microsoft.AspNetCore.Authentication.JwtBearer` 8.0.4) |
| JSON | Newtonsoft on MVC + `System.Text.Json` in AI processors |
| Tests | xUnit in `Niga-Domain.Tests` |
| Docker / CI | **Not found** in this repo |
| Queue | `System.Threading.Channels` in-process, single reader |

### Frontend (`NigaHomeopathy-UI`)

| Item | Actual |
| ---- | ------ |
| Framework | React 18.3.1 |
| Language | JavaScript (not TypeScript for Audio Case files) |
| Build | `react-scripts` 5.0.1 (Create React App), not Vite |
| UI | Bootstrap 5.3.3, reactstrap, react-bootstrap |
| State | Redux Toolkit 2.3 + react-redux |
| Forms | Formik/Yup exist in app; Audio Case uses local/Redux state |
| Audio | Browser `MediaRecorder` / `getUserMedia` (no extra audio npm lib) |
| HTTP | axios 1.7.7 |
| Auth | JWT in `sessionStorage.authUser` |
| Routing | react-router-dom 6 |

### Other workspace repos

- `NIGA_Latest_Code_API`: ASP.NET Core **2.2** `NIGA.Centrum` repertory-admin API. Classic `SubSection` FTS via `CONTAINSTABLE(... SearchNormalized ...)` and LIKE fallback. **No** Whisper/OpenAI/embeddings/Audio Case. Still maintained for master CRUD (last seen commit theme 2026-08-04). Shares `HomeoCentrum_Production` conceptually.
- `minimal`: template UI — **no** Audio Case components found.
- `NigaHomeopathy-UI/docs/AUDIO_CASE_TAKING_*.md`: frontend reports compiled **31 Jul 2026** (V1–V8 pack). **Stale relative to fast-f.**

---

## 5. Repository Structure (audio/rubric relevant)

```text
NigaHomeopathy-API/
  Niga-Web/Controllers/AudioCaseTakingController.cs
  Niga-Web/appsettings.json                 # flags + OpenAI (secrets present — redact)
  Niga-Domain/Repositories/AudioCaseTakingService.cs
  Niga-Domain/Services/AudioCaseAiProcessor.cs
  Niga-Domain/Services/AudioCaseTakingBackgroundService.cs
  Niga-Domain/Services/AudioCaseIntelligence/**   # engines V2–V8 + fast path
  Niga-Domain/Services/AiEmbeddingInfrastructure/**
  Niga-Domain/Master/AudioCase*.cs
  Database/Scripts/AudioCaseTaking_CreateTables.sql
  Database/Scripts/AudioCaseIntelligenceV2/**
  Niga-Domain.Tests/RubricIntelligence/**
  docs/                                     # this package + older AI_RUBRIC_ENGINE_* 

NigaHomeopathy-UI/
  src/Components/CaseTaking/AudioCase*.js
  src/hooks/useAudioRecorder.js
  src/slices/doctor/audioCaseTaking/
  src/helpers/audioCaseTakingHelper.js
  src/pages/Doctor/PatientBoard/PatientBoard.js   # hosts panel
```

---

## 6. Implementation Version History

Full version history is in **Part 7** of this document.

**CURRENT:** `fast-f`. **ROLLBACK:** `EnableFastClinicalRetrievalPipeline=false` (V3/V7/Enterprise). **DISABLED:** V6, ECI v8.

---

## 7. Complete End-to-End Flow

Implemented stages only:

```text
Audio Input
    ↓ Frontend recording or file pick
    ↓ Client MIME/extension/size check (50 MB)
    ↓ POST upload (consent required)
    ↓ Store file under Data/AudioCaseTaking
    ↓ Queue ProcessAudio
    ↓ Whisper translations → TranscriptRaw
    ↓ GPT extraction → conversation/symptoms/summary JSON
    ↓ Dual-language helper (ignored by fast retrieval; extra Whisper only if non-English)
    ↓ FastClinicalRetrieval (parallel DB/semantic channels)
    ↓ Enterprise clinical validation
    ↓ Persist rubrics JSON + match logs
    ↓ UI poll → result
    ↓ Doctor approve/reject/add
    ↓ doctor-action + optional rubric feedback
```

**PLANNED / NOT CURRENTLY IMPLEMENTED**

- WebSocket progress
- Redis/Hangfire audio jobs
- Enforced `MaxAudioDurationMinutes` (config exists, **never read** outside Options)
- Auto-apply high-confidence rubrics (`AllowAutoApplyHighConfidence: false`)
- Automated fleet Precision@10 in production UI

---

## 8. Frontend Architecture

Host: `PatientBoard.js` when `caseTakingMode === 'audio'`. Entry: Dashboard `CaseTakingModeModal` (Manual vs Audio) → `buildPatientBoardAudioPath`.

Redux slice: `state.AudioCaseTaking` (`src/slices/doctor/audioCaseTaking/reducer.js`).

API base: `src/config.js` currently `API_URL_NIGAHOMEOPATHY: https://api1.homeocentrum.com/api` (localhost block is commented). `.env` `REACT_APP_API_URL` is **not** used for NIGA audio calls. **No `.env.example`.**

Admin (not doctor panel): `src/pages/Admin/RubricIntelligence/*` — metaphors, aliases, benchmark.

**UI gaps vs `fast-f` stamp (CONFIRMED):**

- `AudioCaseConceptTimeline` renders **only** if `engineVersion === 'v2'` — hidden on `fast-f` even when concepts are loaded.
- Explainability expand in `AudioCaseRubricSuggestions` is gated to `v2|v4.0|v5.2|v6.0|v7.0` — **not** `fast-f`.
- `correctedSubSectionId` is accepted by the feedback thunk but **never set by UI** (no in-panel rubric remap).
- Intensity in panel is default `#2`; no per-rubric intensity editor.
- No cancel of in-flight upload/poll; no upload byte-progress.
- Offline helper enqueues **metadata only** (no audio blob); `list`/`remove` unused.
- `checkForPreviousAudioCaseSession` / resume-latest exists in Redux but **Panel does not call it** (uses session history instead).
- `getMockAudioCaseAnalysisResult` is unused by the current thunk.

---

## 9. Audio Recording & Upload

### 9.1 `useAudioRecorder`

```text
Component/Hook: useAudioRecorder
File: NigaHomeopathy-UI/src/hooks/useAudioRecorder.js
Purpose: Live microphone capture
Inputs: none
Outputs: blob, durationMs, isRecording, isPaused, error
State: MediaRecorder + chunks every 1000 ms
API calls: none
Dependencies: MediaRecorder, getUserMedia
Validation: browser support
Error handling: NotAllowedError → permission message; else unable to access mic
```

MIME preference: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg;codecs=opus`.  
Pause/resume: **implemented**.  
Duration limit: **not enforced** in hook.  
Waveform: `useAudioWaveform.js` — 48-bar `AnalyserNode` levels while recording (not paused).

### 9.2 `AudioCasePanel`

```text
Component: AudioCasePanel
File: src/Components/CaseTaking/AudioCasePanel.js
Purpose: Studio UI — record, upload, consent, language, analyze, results, history
API: uploadAndAnalyzeAudioCase, poll, reanalyze, download, history, feedback
```

Consent checkbox required before analyze. Language select: auto, en, hi, mr, gu, ta, te, kn, bn.

### 9.3 File upload

```text
Helper: isAcceptedAudioFile
File: audioCaseTakingHelper.js
MIME: mpeg/mp3/wav/x-wav/webm/ogg/aac/mp4/x-m4a
Extensions: mp3|wav|webm|ogg|m4a|aac
Max size: 50 * 1024 * 1024
```

Backend also allows `.mp4`. Frontend regex does not list `mp4` extension explicitly (MIME `audio/mp4` is accepted).

### 9.4 Frontend audio sequence

```text
User clicks Record
↓ getUserMedia({ audio: true })
↓ MediaRecorder.start(1000)
↓ optional pause/resume
↓ stop → Blob (webm/mp4/ogg)
↓ consent + Analyze
↓ FormData audioFile, patientId, consentGiven=true, audioSource, language
↓ POST /AudioCaseTaking/upload
↓ poll GET .../status every 2.5s
↓ GET .../result
```

Offline: failed upload may `enqueueOfflineAudioUpload` (`audioCaseOfflineQueueHelper.js`).

---

## 10. Frontend API Integration

Full API reference is in **Part 3** of this document.

Retry: poll loop only; upload errors queue offline helper; no exponential backoff library.  
Timeout: poll 8 min UX; backend 20 min. Mismatch is **intentional** (comment in thunk).

---

## 11. Backend Architecture

- Controllers in `Niga-Web` / `Niga-Domain.API.Controllers`
- Business in `Niga-Domain/Repositories` (service classes live here historically) and `Services/`
- DI: `ApplicationServiceExtensions.AddApplicationServices`
- Logging: `ILogger<T>`
- Exceptions: controller try/catch → helper Error; background FailSessionAsync
- Config: `appsettings.json` sections `AudioCaseTaking`, `RubricIntelligence`, `OpenAI`, `AzureOpenAI`, `AiEmbeddingInfrastructure`
- Runtime flag overrides: `RubricIntelligenceSettingsService` (in-memory, process lifetime)

---

## 12. Audio APIs

Full API reference is in **Part 3**. Processing pipeline per upload:

```text
Upload endpoint → validation → disk → AudioCaseSession Uploaded → Enqueue
Background → ProcessSessionAsync
  → Whisper
  → RunExtractionAndRubricsAsync
  → MatchRubricsWithIntelligenceAsync (fast-f)
  → SuggestedRubricsJson Completed
Status/Result read session JSON
```

---

## 13. Whisper Transcription

```text
Feature: Whisper English translation
File: Niga-Domain/Services/AudioCaseAiProcessor.cs
Function: TranslateAudioToEnglishAsync
API: POST {OpenAI.BaseUrl}/audio/translations
Status: IMPLEMENTED and ACTIVE when OutputEnglishOnly=true (default)
```

| Item | Value |
| ---- | ----- |
| Provider | OpenAI (Azure section exists; `PreferAzureOverOpenAi: false`) |
| Model | `whisper-1` |
| Format | original upload bytes; no server transcode found |
| Preprocessing | none found |
| Max duration | config 45 min **not enforced** |
| Language | translations → English; `detectedLanguage` forced `"en"` on that path |
| Temperature | not set |
| Response | `verbose_json`; code reads `.text` |
| Cleanup | none beyond storing string |
| Retry | none |
| Timeout | HttpClient 10 minutes |
| Storage | file remains on disk; transcript in SQL |
| Cost | `EstimatedCostUsd` column exists on AI log; fill not confirmed in Whisper logger |

**Where transcript lives**

1. Generated: Whisper response `text`
2. Stored: `AudioCaseSession.TranscriptRaw`
3. Retrieved: `GetResultAsync`
4. Passed to GPT: user message `Transcript:\n\n{transcript}`
5. Displayed: Redux `audioCase.transcript` / `AudioCaseTranscriptEditor`

Mock: if no API key and `UseMockWhenNoApiKey` (appsettings **false** in current file; class default true).

---

## 14. Transcript Processing

| Step | Status |
| ---- | ------ |
| Cleaning / normalization | NOT IMPLEMENTED as a dedicated stage |
| Sentence splitting | NOT IMPLEMENTED |
| Speaker handling | GPT `conversation[].role` doctor\|patient — model-inferred, not diarization |
| Patient/doctor separation | Same |
| Medical terminology normalization | Prompt-level only |
| Duplicate removal | Prompt asks to ignore filler |
| Truncation | Whisper text stored whole; GPT must not echo it |
| Token limits / chunking | Single GPT call with full transcript; **no chunking** |
| Summarization | `summary` object from GPT |
| Clinical extraction | `symptoms[]` from GPT |

CONFIRMED: no separate NLP pipeline between Whisper and GPT.

---

## 15. AI / GPT Architecture

Every chat call uses HTTP `chat/completions` with Bearer `OpenAI:ApiKey`.

| Call | Model | Temp | Max tokens | Format |
| ---- | ----- | ---- | ---------- | ------ |
| ExtractCaseDataAsync | gpt-4o | 0.1 | 8192 | json_object |
| SuggestAiRubricsAsync | gpt-4o | 0.2 | unset | json_object |
| IntelligenceGptClient (legacy engines) | gpt-4o | 0.1 | unset | json_object |

Token usage logged on `AudioCaseAiRequestLog`. No cost aggregator UI confirmed for doctors.

Azure OpenAI is configured but not preferred.

---

## 16. AI Prompts

Full prompt texts are in **Part 5** of this document.

---

## 17. Clinical Information Extraction

**Fields that actually exist** on `AudioCaseSymptomModel` / `AudioCaseSummaryModel`:

- Symptom: `phrase`, `searchTerms`, `category` (particular\|general\|mental), `intensityHint` 1–4, `isSensationBearing`, `originalLanguageText`, `languageCode`
- Summary: `chiefComplaint`, `historyOfPresentIllness`, `mentals[]`, `generals[]`, `modalities[]`, `particulars[]`, `redFlags[]`
- Conversation: `role`, `text`, `timestamp`

**Not first-class schema fields** (may appear only inside free-text phrase/summary): dedicated location, sensation, time, duration, frequency, concomitants, causation, food craving/aversion, sleep, dreams, fears, sexual, menstrual, family/past history objects.

M5 legacy categories (Fear, Sleep, Dream, Sexual, …) are **not** extracted as typed objects on the fast path.

---

## 18. Rubric Discovery Engine

Full rubric-engine detail is in **Part 6** of this document.

---

## 19. Database Rubric Search

`SearchSubSectionsByHotspotAsync` — CONTAINS FTS then Contains fallback; word-boundary filter. Table `SubSectionMaster.SubSectionName`. Full table reference is in **Part 4**.

---

## 20. Embedding Architecture

Provider OpenAI `text-embedding-3-small`, 1536 dims, JSON float arrays.  
Input: concept query strings.  
Storage: `RubricEmbeddings` + `AiRubricEmbedding`.  
Search: in-memory cosine, top 50, min 0.74.  
Incremental refresh: V4 infrastructure background services.  
Fast path timeout 8s; proceeds with zero embedding hits if cache cold.

---

## 21. Semantic Search

Two different “semantic” meanings:

1. **V1 `ComputeTextSimilarity`** — lexical Jaccard-like (not vectors). Active inside V1 scoring (0.4 weight).
2. **Embedding cosine** — true vector search. Active as parallel fast-f channel.

---

## 22. AI Rubric Suggestions

V1 can call GPT to invent repertory-style names. Fast-f drops `SubSectionId <= 0`. Reconciler maps names to DB if they remain. Distinguish:

```text
AI GENERATED CANDIDATE  → IsAiSuggested / SubSectionId 0 / Source AiSuggested
DATABASE VERIFIED RUBRIC → SubSectionId > 0, IsDbBacked
```

UI `mapSuggestedRubricToRepertorization` returns null for `resultKind=aiclinicalconcept` or missing id.

---

## 23. Rubric Validation

Full validation/ranking is in **Part 6**. Enterprise 8 steps still run after fast-f because `EnableEnterpriseClinicalValidation: true`.

---

## 24. Rubric Ranking

Actual fast-f formula (hardcoded weights):

```text
0.30 Evidence + 0.25 ClinicalMatch + 0.20 Semantic + 0.15 ExactAlias + 0.10 Keyword
```

Then MMR. HybridWeights in appsettings are **legacy V2**.

---

## 25. Hallucination Prevention

Implemented: DB id required; evidence overlap; enterprise Hallucination step on leftover path; extraction prompt forbids inventing diagnoses.

Not implemented: blocking `SuggestAiRubricsAsync` from running on fast path (wasted call still possible).

---

## 26. Duplicate Prevention

- Candidate dictionary keyed by `SubSectionId` in V1
- `RubricResultMerger.Merge`
- MMR name Jaccard
- `DeduplicateAiConceptsWhenDbMatched` in QualityGate
- Match log replace-all for session

---

## 27. Doctor Review

```text
AI Result
 ↓ AudioCaseRubricSuggestions
 ↓ RequireManualApprovalForAllAiRubrics=true → Approve / Reject
 ↓ Approve → mapSuggestedRubricToRepertorization → PatientBoard repertorization
 ↓ Reject → local approval state + logAudioDoctorAction + submitAudioCaseRubricFeedback
 ↓ Transcript edit → reanalyze
```

No in-panel edit of rubric name or mapping: `correctedSubSectionId` is on the feedback API/thunk but **the UI never sends it**. Custom add/remove of repertory rubrics is the existing PatientBoard Repertory tab, not the audio panel.

Auto-apply exists in `AudioCasePanel` only when `requireManualApprovalForSuggestedRubrics` is false (currently true). History-opened sessions skip auto-apply. “Add all” is also hidden when manual approval is required.

---

## 28. Database Schema

Full database reference is in **Part 4** of this document.

---

## 29. Database Relationships

```text
SectionMaster → SubSectionMaster → RubricRemedyDetail → RemedyMaster
                              ↘ RubricEmbeddings / AiRubricEmbedding

AudioCaseSession → EventLog, AiRequestLog, Consent, MatchLog,
                   DoctorAction, Feedback, Concepts, IntelligenceLog
```

---

## 30. Data Persistence

Session JSON columns are the doctor-facing result store. Match logs are the ranked rubric audit. AI logs may store request/response JSON (PHI risk).

---

## 31. Configuration

**Do not copy secrets.** `Niga-Web/appsettings.json` currently contains live `OpenAI:ApiKey`, JWT Secret, SMTP password, WhatsApp token. Treat as **P0 security issue**. Use `[REDACTED]` in any copy.

| Variable / key | Purpose | Used in | Required | Default / current |
| -------------- | ------- | ------- | -------- | ----------------- |
| ConnectionStrings:DefaultConnection | SQL | EF | yes | localhost HomeoCentrum_Production |
| OpenAI:ApiKey | OpenAI auth | AudioCaseAiProcessor, EmbeddingClient | yes for real AI | [REDACTED] |
| OpenAI:BaseUrl | API host | HttpClient | no | https://api.openai.com/v1 |
| OpenAI:WhisperModel | Whisper | processor | no | whisper-1 |
| OpenAI:ChatModel | GPT | processor | no | gpt-4o |
| OpenAI:EmbeddingModel | embeddings | EmbeddingClient | no | text-embedding-3-small |
| AudioCaseTaking:StoragePath | audio files | service | no | Data/AudioCaseTaking |
| AudioCaseTaking:MaxFileSizeBytes | upload cap | UploadAsync | no | 52428800 |
| AudioCaseTaking:MaxAudioDurationMinutes | **unused** | Options only | — | 45 |
| AudioCaseTaking:OutputEnglishOnly | translations vs transcriptions | ProcessSessionAsync | no | true |
| AudioCaseTaking:EnableAiSuggestedRubrics | V1 GPT names | MatchRubricsV1Async | no | true |
| AudioCaseTaking:MaxAiSuggestedRubrics | cap | V1 | no | 25 (class default 10) |
| AudioCaseTaking:MaxProcessingMinutes | job cancel | CreateProcessingTimeoutSource | no | **20** (class default 10) |
| AudioCaseTaking:UseMockWhenNoApiKey | mock | processor | no | **false** in json |
| RubricIntelligence:EnableFastClinicalRetrievalPipeline | production gate | MatchRubricsWithIntelligenceAsync | no | **true** |
| RubricIntelligence:FastPipelineEngineVersion | stamp | orchestrator | no | fast-f |
| RubricIntelligence:FastPipelineMaxFinalRubrics | final K | fast path | no | 12 |
| RubricIntelligence:FastPipelineMmrLambda | MMR | ranking | no | 0.80 |
| RubricIntelligence:FastPipelineMinCanonicalScore | floor | ranking | no | 0.45 |
| RubricIntelligence:FastPipelineMinEvidenceScore | hallucination | evidence gate | no | 0.15 |
| RubricIntelligence:FastPipelineEmbeddingTimeoutSeconds | embed budget | orchestrator | no | 8 |
| RubricIntelligence:EmbeddingTopK | vector K | EmbeddingSearchEngine | no | 50 |
| RubricIntelligence:MinEmbeddingCosineForCandidate | cosine floor | search | no | 0.74 |
| RubricIntelligence:RequireManualApprovalForAllAiRubrics | UI gate | settings | no | true |
| RubricIntelligence:EnableV2 | must be true for fast path (`IsV2Active`) | settings | no | true |
| RubricIntelligence:RollbackToV1Only | skip V2/fast if used with EnableV2 | settings | no | false |
| JWT:Secret | tokens | auth | yes | [REDACTED] |

Azure keys empty; unused when PreferAzureOverOpenAi is false.

Frontend: no `.env.example` found; API URL hardcoded in `src/config.js`.

---

## 32. Security

| Topic | Finding |
| ----- | ------- |
| Authentication | JWT `[Authorize]` on audio APIs |
| Authorization | Session scoped to `DoctorUserId` from token |
| API key protection | Key in appsettings **in repo** — CONFIRMED risk |
| Upload validation | Extension allow-list + size; MIME from client not strictly matched to magic bytes |
| Path traversal | Stored name is `{guid}{extension}` under StoragePath |
| SQL injection | EF + parameterized FromSqlRaw `{0}` for FTS |
| Prompt injection | Transcript sent raw to GPT; no sanitizer found |
| Transcript logging | AI request/response JSON may include transcript |
| CORS | `AllowedHosts: *` |
| Rate limiting | **Not found** on audio endpoints |
| Frontend token logging | `api_helper.js` logs first 20 chars of JWT |

---

## 33. Error Handling

| Error | Detection | Backend | Frontend | Retry | User message | Logging |
| ----- | --------- | ------- | -------- | ----- | ------------ | ------- |
| Invalid/empty audio | Length 0 / missing |  Failure | Error banner | offline queue | file required | LogError |
| Unsupported format | extension set | Failure | same | no | Unsupported audio file type | |
| File too large | MaxFileSizeBytes | Failure | helper 50MB | no | exceeds maximum | |
| Whisper fail | HTTP/exception | FailSession PROCESSING_FAILED | poll failed | no | translation/transcription failed | AiRequestLog |
| OpenAI timeout | 10 min client / 20 min job | FailSession PROCESSING_TIMEOUT | poll timeout UX | Continue waiting | exceeded N-minute limit | |
| Rate limit | HTTP body | fail | message | no | response body | |
| Invalid JSON | deserialize | extraction fail session | failed | no | Case extraction failed | |
| Truncated JSON | no dedicated detector | likely deserialize fail | failed | no | | |
| DB fail | EF exception | FailSession unwrap inner | failed | no | SQL text truncated to 2000 | |
| Embedding fail | catch in SafeEmbeddingAsync | continue without | still completes | no | silent warn | |
| No candidates | empty list | Completed with 0 rubrics | empty hint | reanalyze | | |
| Frontend 8 min | poll attempts | still running | takingLonger message | manual continue | Analysis is taking longer… | |
| Mic denied | NotAllowedError | n/a | upload instead | | permission denied | |

Duration over 45 min: **not detected**.

---

## 34. Logging & Monitoring

- CorrelationId (12 hex) on session
- `AudioCaseSessionEventLog` step trail including `LatencyGap1_*` / `LatencyGap3_*`
- `AudioCaseAiRequestLog` per OpenAI call
- `IRubricPipelineTelemetry` stages → intelligence log / `PipelineBaselineSummary` (`EngineVersion` constant `base-a` for some telemetry rows — **can disagree** with session `fast-f`)
- `EnableAiMonitoringDashboard: true` — admin benchmark endpoints
- No Datadog/App Insights package found in csproj

**Debug one case:** take `sessionId` → event log ordered → AI log latencies → match log → `SuggestedRubricsJson`.

---

## 35. Performance Analysis

Full performance and accuracy analysis is in **Part 8** of this document.

---

## 36. Current Bottlenecks

1. Whisper wall clock (~100–140 s measured)
2. Single-reader in-memory queue
3. Optional extra Whisper (dual-language, non-English)
4. Optional extra GPT inside V1 suggestions
5. Cold embedding cache (degraded recall, not usually latency)
6. Legacy path if flag flipped (V7 ~5 min discovery)

---

## 37. Accuracy Analysis

No automated production Precision/Recall. Tiny historical samples: v2 accept 50%; v7 n=4 100%; fast-* **none**. False positive/negative rates **UNKNOWN**.

---

## 38. Current Limitations

- One GPT extraction; missed symptoms are not recovered on fast path
- No audio duration enforcement
- Queue not durable
- Health API reports v1/v2 not fast-f
- Frontend 8 min vs backend 20 min
- Prompts and keys in source/config
- `englishTranscript` fixed; large conversation JSON can still truncate
- Manual approval always on

---

## 39. Legacy Implementations

| Old | Location | Why replaced | Replacement | Referenced? | Delete? |
| --- | -------- | ------------ | ----------- | ----------- | ------- |
| V7 discovery | RepertoryIntelligence | Too slow (314 s) | fast-f | Rollback | No |
| V3 M0–M5 GPT | V3/Engines | Latency / duplicate GPT | extraction + FTS | Rollback | No |
| V6 | V6/ | Flag off | — | Tests | No |
| ECI v8 | ECI/V8 | Flag off | — | Tests | No |
| NIGA.Centrum API | sibling repo | Different product surface | NigaHomeopathy-API | No audio | N/A |

---

## 40. Duplicate Implementations

- Hotspot search used by V1, Keyword, Hierarchical, V6 SQL engines
- Two embedding stacks (legacy `RubricEmbeddings` vs `AiRubricEmbedding`)
- Two “semantic” scores (Jaccard vs cosine)
- Dual-language built then unused on fast path
- Telemetry engine `base-a` vs session `fast-f`
- Docs `AI_RUBRIC_ENGINE_*` vs this audit
- Controllers: Taking vs Intelligence vs IntelligenceV3 vs Admin vs Embedding

---

## 41. Testing

**Existing:** xUnit tests under `Niga-Domain.Tests/RubricIntelligence/` (FastClinicalRanking, FastClinicalRetrievalStageC, accuracy packs, validation, embeddings, V7, ECI, etc.) and `AiEmbeddingInfrastructure/`.

**Not found:** frontend Audio Case tests; API integration tests hitting Whisper; Playwright E2E.

Run: `dotnet test Niga-Domain.Tests/Niga-Domain.Tests.csproj`

**Recommended matrix**

| Area | Unit | Integration | Notes |
| ---- | ---- | ----------- | ----- |
| Audio upload | extension/size | multipart | duration currently untested |
| Transcript | overwrite EnglishTranscript | Whisper mock | |
| Extraction JSON | schema deserialize | golden transcripts | |
| Discovery | ranking/MMR/gates | FTS on SQL | |
| Validation | enterprise steps | | |
| Embedding | cosine math | cache empty | |
| Ranking | weight formula | | |
| Doctor review | — | feedback types | |

---

## 42. Debugging Guide

### Case A — Transcription fails

Start: `AudioCaseAiRequestLog` ServiceType Translation/Transcription. Files: `AudioCaseAiProcessor.cs`, `ProcessSessionAsync`. Expect: Failed + error body. Causes: key, timeout, bad file, OpenAI outage. Disk: `AudioFilePath`.

### Case B — Transcript OK, no rubrics

Start: `ExtractedSymptomsJson` empty? Then FastClinicalRetrieval log `final=0`. Causes: extraction empty; gates too strict; FTS down falling back poorly; all scores &lt; 0.45.

### Case C — Wrong rubrics

Start: MatchLog `MatchedFrom` vs `SubSectionName`. Inspect QualityGate hitchhikers; extraction searchTerms (fit vs convulsion). Reanalyze after transcript edit.

### Case D — AI rubric not in DB

Should not appear as addable on fast-f (`subSectionId>0` required). If it does, check `EnableFastClinicalRetrievalPipeline` and reconciler. `SuggestAiRubrics` log shows invented names.

### Case E — Only 2–3 rubrics

Expected if MMR pool small. Check funnel counts in intelligence log (`v1=; kw=; emb=`). Do not assume a bug if clinically sparse.

### Case F — 15+ minutes

Likely **legacy path** or **queue wait** or **Whisper + dual-language**. Check `IntelligenceEngineVersion` on session. If `v7.0`, fast flag is off. Event `SemanticCacheWait` 120s = old behavior.

### Case G — Invalid/truncated JSON

Extraction `max_tokens` 8192. Confirm `LlmExtraction` AI log response. `englishTranscript` echo is fixed. Retry reanalyze.

---

## 43. API Reference

Full API reference is in **Part 3** of this document.

---

## 44. Database Reference

Full database reference is in **Part 4** of this document.

---

## 45. End-to-End Example

Fictional patient. **Actual system behavior** marked.

Patient says: *"I get severe headache on the right side when exposed to sunlight."*

```text
Audio (webm blob)
    ↓ ACTUAL: MediaRecorder or file
Whisper translations
    ↓ ACTUAL: English transcript stored on session
GPT extraction
    ↓ ACTUAL likely fields: phrase ~ "severe right-sided headache from sunlight"
      category particular; searchTerms e.g. headache, right, sun; modalities in summary
Speaker filter
    ↓ ACTUAL: keep if patient-affirmed
Parallel search
    ↓ ACTUAL: FTS/Contains on SubSectionName for terms; alias; embedding if cache warm; catalog tokens
Validation
    ↓ ACTUAL: drop SubSectionId 0; evidence overlap; gender if known
Ranking
    ↓ ACTUAL: CanonicalScore + MMR ≤ 12
Final rubrics
    ↓ ACTUAL: names from SubSectionMaster only (e.g. HEAD pain / sun related rows IF they exist in DB)
Doctor
    ↓ ACTUAL: Approve adds to repertorization; Reject logs feedback
```

Exact rubric strings **depend on the live SubSectionMaster corpus** — not invented here.

---

## 46. Architecture Diagrams

Full architecture diagrams are in **Part 2**. Additional:

```text
Doctor browser
    → api1.homeocentrum.com/api  (current UI config)
    → Niga-Web
    → OpenAI api.openai.com
    → SQL Server HomeoCentrum_Production
    → local disk Data/AudioCaseTaking
```

---

## 47. Current Implementation Status

| Feature | Status | Evidence | File | Notes |
| ------- | ------ | -------- | ---- | ----- |
| Audio recording | IMPLEMENTED | MediaRecorder | useAudioRecorder.js | pause/resume yes |
| Audio upload | IMPLEMENTED | FormData | thunk.js | 50 MB |
| Whisper | IMPLEMENTED | translations | AudioCaseAiProcessor.cs | |
| Transcript | IMPLEMENTED | TranscriptRaw | AudioCaseSession | |
| AI extraction | IMPLEMENTED | gpt-4o JSON | ExtractCaseDataAsync | |
| DB rubric search | IMPLEMENTED | FTS/Contains | SubSectionRepository | |
| Embedding search | IMPLEMENTED | optional 8s | EmbeddingSearchEngine | skip if cold |
| AI suggestion | PARTIALLY IMPLEMENTED | V1 GPT names often dropped | SuggestAiRubricsAsync | |
| Rubric validation | IMPLEMENTED | gates + enterprise | FastClinicalEvidenceGate | |
| Ranking | IMPLEMENTED | Canonical+MMR | FastClinicalRanking.cs | |
| Doctor review | IMPLEMENTED | Approve/Reject | AudioCaseRubricApprovalBar | no in-panel remap/intensity |
| Concept timeline | PARTIALLY IMPLEMENTED | hidden unless `engineVersion==='v2'` | AudioCaseConceptTimeline.js | invisible on fast-f |
| Rubric explainability UI | PARTIALLY IMPLEMENTED | gated to v2/v4/v5.2/v6/v7 | AudioCaseRubricSuggestions.js | not shown for fast-f |
| Live waveform | IMPLEMENTED | AnalyserNode 48 bars | useAudioWaveform.js | |
| Feedback | IMPLEMENTED | feedback API | DoctorFeedbackLearningEngine | |
| Performance tracking | PARTIALLY IMPLEMENTED | telemetry + SQL 730 | RubricPipelineTelemetry | N small |
| Duration limit | NOT IMPLEMENTED | unused option | AudioCaseTakingOptions | |
| WebSocket | NOT IMPLEMENTED | polling only | thunk.js | |
| Redis queue | NOT IMPLEMENTED | Channel | AudioCaseTakingQueue | |
| V6/ECI | NOT IMPLEMENTED as active | flags false | RubricIntelligenceOptions | code exists |
| Docker | NOT FOUND | — | — | |

---

## 48. Recommended Performance Improvements

Full performance and accuracy analysis is in **Part 8** of this document. Do not mix with current behavior.

---

## 49. Recommended Accuracy Improvements

See **Part 8**. Do not claim 90–95% targets are met.

---

## 50. Future Architecture

Not implemented. If designed later, keep: DB-backed finals, one extraction GPT, parallel retrieval, durable queue, Whisper as async stage with UI honesty. **Do not** re-enable V7 on the default path without a flag.

---

## 51. Developer Quick Start

Actual commands from the repos:

```text
1. Frontend:  cd NigaHomeopathy-UI && npm start
   (package.json: react-scripts start, NODE_OPTIONS 4096)
2. Backend:   cd NigaHomeopathy-API/Niga-Web && dotnet run --launch-profile http
   Swagger: http://localhost:5038/swagger
3. Environment: Niga-Web/appsettings.json (do not commit secrets)
4. Database: SQL Server; ConnectionStrings:DefaultConnection → HomeoCentrum_Production
5. OpenAI: OpenAI:ApiKey, WhisperModel, ChatModel, EmbeddingModel
6. Run SQL: Database/Scripts/AudioCaseTaking_CreateTables.sql
            then AudioCaseIntelligenceV2 MASTER guide
            then AIV4 embedding scripts as needed
            FTS: 725_FullText_SubSectionMaster_SubSectionName.sql
7. Verify rubrics: SELECT COUNT(*) FROM SubSectionMaster WHERE DeleteStatus=0
8. Verify embeddings: SELECT COUNT(*) FROM RubricEmbeddings
                      and/or AiRubricEmbedding
9. Point UI src/config.js at http://localhost:5038/api (commented block)
10. Patient Board → Audio case → consent → record/upload
11. Check TranscriptRaw / UI transcript
12. Check ExtractedSymptomsJson
13. Check SuggestedRubricsJson / match log
14. Approve/Reject → AudioCaseRubricFeedback
```

Tests: `dotnet test` on `Niga-Domain.Tests`. Frontend `npm test` is CRA default; no Audio Case specs found.

---

## 52. Complete File Reference

| Path | Role |
| ---- | ---- |
| `Niga-Web/Controllers/AudioCaseTakingController.cs` | HTTP API |
| `Niga-Web/Controllers/AudioCaseIntelligenceController.cs` | health/config/benchmark |
| `Niga-Web/appsettings.json` | production flags |
| `Niga-Domain/Repositories/AudioCaseTakingService.cs` | session + routing to engines |
| `Niga-Domain/Services/AudioCaseAiProcessor.cs` | Whisper + extraction + AI names |
| `Niga-Domain/Services/AudioCaseTakingBackgroundService.cs` | worker |
| `Niga-Domain/Services/AudioCaseTakingQueue.cs` | Channel queue |
| `Niga-Domain/Services/AudioCaseIntelligence/Orchestration/FastClinicalRetrievalOrchestrator.cs` | production discovery |
| `Niga-Domain/Services/AudioCaseIntelligence/Merging/FastClinicalRanking.cs` | scores + MMR |
| `Niga-Domain/Services/AudioCaseIntelligence/Merging/FastClinicalEvidenceGate.cs` | gates |
| `Niga-Domain/Services/AudioCaseIntelligence/Merging/RubricCandidateQualityGate.cs` | Bugs A–D |
| `Niga-Domain/Services/AudioCaseIntelligence/Merging/AiSuggestedRubricReconciler.cs` | AI→DB map |
| `Niga-Domain/Services/AudioCaseIntelligence/Engines/EmbeddingSearchEngine.cs` | vectors |
| `Niga-Domain/Services/AudioCaseIntelligence/Engines/ConceptKeywordDiscoveryEngine.cs` | per-concept FTS |
| `Niga-Domain/Repositories/SubSectionRepository.cs` | hotspot search |
| `Niga-Domain/Configuration/RubricIntelligenceOptions.cs` | all flags |
| `NigaHomeopathy-UI/src/Components/CaseTaking/AudioCasePanel.js` | UI |
| `NigaHomeopathy-UI/src/hooks/useAudioRecorder.js` | mic |
| `NigaHomeopathy-UI/src/slices/doctor/audioCaseTaking/thunk.js` | poll/upload |

---

## 53. Glossary

| Term | Meaning in this codebase |
| ---- | ------------------------ |
| Rubric | `SubSectionMaster` row (repertory heading) |
| SubSectionId | Rubric primary key |
| fast-f | Current retrieval engine stamp |
| V1 | Hotspot/FTS + optional GPT names |
| Concept | ClinicalConceptModel derived from extracted symptoms on fast path |
| AI suggested | Name without verified SubSectionId |
| CanonicalScore | 0–1 fast-path rank score |
| CorrelationId | 12-char job/session trace id |
| Repertorization | Existing doctor UI that scores remedies from selected rubrics |

---

## 54. Final Technical Assessment

### What Is Working

- Upload/record, consent, background processing, English Whisper, GPT extraction without echoing transcript
- Fast-f DB-backed rubric discovery in ~2–3 s
- Polling UI with stage labels, transcript editor, reanalyze, history, download
- Manual approval, feedback learning hooks, embedding infrastructure, extensive unit tests for ranking/gates

### What Is Partially Working

- Embeddings (timeout/skip)
- AI name suggestions (generated then dropped)
- Dual-language (built, unused on fast path)
- Performance/accuracy telemetry (tables exist, N too small)
- Health endpoint (wrong engine label)
- Concept timeline / explainability UI (gated to old engineVersion strings; hidden on `fast-f`)
- Offline upload queue (metadata only; no blob; never flushed)

### What Is Not Working / Not implemented

- Duration cap
- Durable queue
- Automated fleet accuracy
- Auto-apply
- Docker/CI in repo

### What Is Too Slow

- Whisper (dominant)
- Legacy V7 path if re-enabled
- Single worker queue under load

### What Is Reducing Accuracy

- Single-shot extraction misses
- MMR/min-score dropping valid candidates (false negatives)
- Cold embedding cache
- Possible V1 GPT names polluting V1 merge before drop (false positives if reconciler later maps badly on non-fast path)

### What Creates False Positives

- Broad Contains/FTS hits; mitigated by word-boundary and domain score 0.35
- Hitchhiker rubric tails; QualityGate
- Legacy V2 prompt mapping fit→convulsion (not on fast-f extraction)

### What Creates False Negatives

- Canonical floor 0.45, evidence 0.15, MMR cliff, max 12, embedding timeout

### What Creates AI Hallucinations

- `SuggestAiRubricsAsync` (contained on fast-f by SubSectionId filter)
- GPT extraction inventing symptoms (prompt forbids; not programmatically verified)

### What Creates Duplicate Work

- V1 + Keyword same hotspot API
- Dual-language unused
- V1 GPT suggestions discarded
- Multiple engine codebases still registered in DI

### What Is Legacy

- V3/V6/V7/ECI discovery; V2 orchestrator; `NIGA_Latest_Code_API` for this feature

### What Should Be Refactored

- Split `AudioCaseTakingService` (2000+ lines)
- Align health EngineVersion with fast-f
- Remove or gate V1 AI suggestions on fast path
- Secret storage

### What Should Be Optimized First

P0 Whisper UX/time; P0 skip wasted V1 GPT; P1 skip unused dual-language; P1 worker concurrency.

### What Should NOT Be Changed

- DB-backed-only finals
- Whisper as source of transcript
- Manual doctor approval default
- MMR “do not fabricate to fill 12”

### Recommended Priority

| ID | Item | Priority |
| -- | ---- | -------- |
| Remove secrets from appsettings / stop logging JWTs | P0 |
| Skip SuggestAiRubrics on fast path | P0 |
| Collect fast-f Accept/Reject (SQL 730) | P0 |
| Whisper latency / client compression | P0 |
| Gate dual-language on fast path | P1 |
| Multi-worker queue | P1 |
| Enforce duration + magic-byte MIME | P1 |
| Health API engine stamp | P2 |
| Durable jobs | P2 |
| Delete unused engines | P3 — do not delete until rollback unused |

---

## Current System Reality

1. **How does audio enter?** Live MediaRecorder or file → multipart POST `/api/AudioCaseTaking/upload`.
2. **Transcript?** OpenAI Whisper `audio/translations` (`whisper-1`) when `OutputEnglishOnly`.
3. **Stored?** `AudioCaseSession.TranscriptRaw` (+ file on disk).
4. **Clinical concepts?** One GPT-4o JSON extraction (`symptoms`, `summary`, `conversation`).
5. **DB search?** `SubSectionMaster` FTS CONTAINS / Contains hotspot, plus keyword/alias/catalog.
6. **Embedding search?** Yes, parallel, optional, cosine ≥ 0.74, 8 s timeout.
7. **AI suggestions?** V1 may generate names; fast-f does not keep unverified ids.
8. **Verified?** SubSectionId &gt; 0, reconciler exact/fuzzy if AI rows remain.
9. **Hallucinations?** Dropped if not in DB; evidence overlap gate.
10. **Ranked?** CanonicalScore weighted sum + MMR.
11. **How many?** Up to 12; fewer allowed; never padded.
12. **Doctor validation?** Approve/Reject UI; APIs doctor-action + rubrics/feedback; auto-apply off.
13. **Results stored?** Session JSON + match logs + feedback tables.
14. **Processing time?** Measured fast-c ~2.5 min (Whisper ~139 s); legacy ~9.4 min; 15–20 min is legacy/queue/timeout territory; P50 unproven.
15. **Biggest performance bottlenecks?** Whisper; single worker; leftover GPT/Whisper extras.
16. **Biggest accuracy bottlenecks?** Unmeasured acceptance; extraction misses; score floors.
17. **Legacy?** V3–V7/ECI discovery code; sibling Centrum API.
18. **Duplicated?** Multiple engines, two embedding tables, two semantic scores.
19. **Incomplete?** Duration limit, durable queue, fleet metrics, secret hygiene.
20. **Improve first?** Secrets, skip wasted GPT, measure fast-f acceptance, Whisper time.

---

## Confidence labels

CONFIRMED: fast-f is the discovery path; Whisper translations; GPT extraction; FTS search; CanonicalScore formula; 12 max; no duration enforcement; in-memory queue; englishTranscript overwrite.

LIKELY: production UI talks to `https://api1.homeocentrum.com/api` per `config.js` (may differ per deploy).

UNCERTAIN: live P50 latency for fast-f; production embedding cache hit rate; whether appsettings in git matches the hosted API.

NOT IMPLEMENTED: automated doctor acceptance-rate job that fills 95% claims; Redis; WebSocket; MaxAudioDurationMinutes enforcement.

LEGACY: V3/V7/ECI/V6 discovery when fast flag is on.

---

DOCUMENTATION AUDIT COMPLETE

Repository scanned: NigaHomeopathy-API, NigaHomeopathy-UI, NIGA_Latest_Code_API, minimal  
Frontend: NigaHomeopathy-UI (React 18 / CRA)  
Backend: NigaHomeopathy-API (ASP.NET Core 8)  
Database: SQL Server scripts + EF models (HomeoCentrum_Production)  
AI: OpenAI gpt-4o + whisper-1 + text-embedding-3-small  
Audio: MediaRecorder + multipart upload + Whisper translations  
Rubric Engine: FastClinicalRetrievalOrchestrator fast-f  
Embedding: optional cosine channel + V4 infra  
Git history: reconstructed from engine stamps and dated docs (2026-08-13); full SHA timeline not dumped  
Documentation files created: 8 under NigaHomeopathy-API/docs/AUDIO_CASE_*  
Major unknowns: fast-f fleet accuracy; hosted config drift; exact git SHAs per milestone  
Major risks: secrets in appsettings; PHI in AI logs; 8 vs 20 minute timeouts; wasted V1 GPT; Whisper-bound SLA  
Top 5 recommended improvements: (1) secret hygiene (2) skip V1 AI suggestions on fast path (3) measure doctor accept on fast-f (4) Whisper time/UX (5) durable multi-worker queue  



---

# PART 2 — ARCHITECTURE (DETAILED)

**Source of truth:** `NigaHomeopathy-API` + `NigaHomeopathy-UI` source code as of 2026-08-16.  
**Production engine:** `fast-f` via `RubricIntelligence:EnableFastClinicalRetrievalPipeline = true`.  
**Confidence:** CONFIRMED unless marked otherwise.

This architecture section is Part 2 of the combined document.

---

## Repositories in this workspace

| Repo | Role for Audio Case | Status |
| ---- | ------------------- | ------ |
| `NigaHomeopathy-API` | Current backend (ASP.NET Core 8, Niga-Web + Niga-Domain) | CONFIRMED current |
| `NigaHomeopathy-UI` | Current frontend (React 18 + Redux Toolkit + react-scripts) | CONFIRMED current |
| `NIGA_Latest_Code_API` | ASP.NET Core 2.2 `NIGA.Centrum` repertory-admin API (`api/subsection` FTS `CONTAINSTABLE` on `SearchNormalized`) | No Whisper / OpenAI / Audio Case; classic rubric CRUD only |
| `minimal` | Velzon React template workspace | No Audio Case components found |

Older `AI_RUBRIC_ENGINE_*.md` files in this folder describe earlier engines (V2–V7). Where they disagree with `appsettings.json` + `AudioCaseTakingService.MatchRubricsWithIntelligenceAsync`, **the source code wins**.

---

## Current production path

```text
Doctor UI (AudioCasePanel)
    ↓ JWT Bearer
POST /api/AudioCaseTaking/upload
    ↓ disk store + AudioCaseSession row
In-memory Channel queue (AudioCaseTakingQueue)
    ↓ AudioCaseTakingBackgroundService (single reader)
ProcessSessionAsync
    ↓
Whisper translations (whisper-1)  →  TranscriptRaw
    ↓
GPT-4o ExtractCaseDataAsync       →  ConversationJson / SummaryJson / ExtractedSymptomsJson
    ↓
FastClinicalRetrievalOrchestrator (engine fast-f)
    parallel: V1 hotspot/FTS + Keyword + Alias + Embedding + Catalog
    ↓ gates + CanonicalScore + MMR
SuggestedRubricsJson + AudioCaseRubricMatchLog
    ↓
GET /status (poll 2.5s) → GET /result
    ↓
Doctor Approve / Reject / Add to repertorization
    ↓
POST /doctor-action + POST /rubrics/feedback
```

Rollback: set `EnableFastClinicalRetrievalPipeline` to `false`. That re-enables the V3/V7/Enterprise path. See **Part 7**.

---

## Layer diagram

```text
NigaHomeopathy-UI
  AudioCasePanel / useAudioRecorder / Redux thunks
        │  axios (JWT from sessionStorage.authUser)
        ▼
Niga-Web  AudioCaseTakingController  [Authorize]
        │
        ▼
Niga-Domain
  AudioCaseTakingService          session lifecycle
  AudioCaseAiProcessor            Whisper + GPT extraction + optional AI rubric names
  FastClinicalRetrievalOrchestrator   production rubric discovery
  ClinicalValidationEngine        enterprise 8-step validation (still applied after fast path)
  AiSuggestedRubricReconciler     map AI names → SubSectionMaster
        │
        ▼
SQL Server  HomeoCentrum_Production
  AudioCase* tables, SubSectionMaster, RubricEmbeddings / AiRubricEmbedding
        │
        ▼
OpenAI  https://api.openai.com/v1
  audio/translations | audio/transcriptions | chat/completions | embeddings
```

---

## What is NOT on the production hot path

When `EnableFastClinicalRetrievalPipeline` is true, these still exist in the repo but are **not called** by `MatchRubricsWithIntelligenceAsync`:

| Component | Path | Status |
| --------- | ---- | ------ |
| V3 Concept Graph (M0–M5) | `Services/AudioCaseIntelligence/V3` | LEGACY / rollback |
| V6 Clinical Reasoning | `Services/AudioCaseIntelligence/V6` | Disabled (`EnableV6ClinicalReasoningEngine: false`) |
| V7 Repertory Intelligence | `Services/AudioCaseIntelligence/RepertoryIntelligence` | LEGACY / rollback |
| ECI v8 | `Services/AudioCaseIntelligence/ECI/V8` | Disabled (`EnableEciV8Engine` default false) |
| V2 `RubricIntelligenceOrchestrator` | `Orchestration/RubricIntelligenceOrchestrator.cs` | LEGACY / rollback |

CONFIRMED: `AudioCaseTakingService.MatchRubricsWithIntelligenceAsync` returns immediately into `MatchRubricsFastClinicalAsync` when the fast-pipeline flag is on.

---

## Runtime services (hosted)

| Service | File | Purpose |
| ------- | ---- | ------- |
| `AudioCaseTakingBackgroundService` | `Niga-Domain/Services/AudioCaseTakingBackgroundService.cs` | Dequeues jobs; optional semantic-cache wait (0s on fast path) |
| `AudioCaseRetentionBackgroundService` | `Niga-Domain/Services/AudioCaseRetentionBackgroundService.cs` | Purge audio files if `AudioRetentionDays > 0` (currently 0 = never) |
| `AudioCaseZombieSessionSweeperBackgroundService` | `Niga-Domain/Services/AudioCaseZombieSessionSweeperBackgroundService.cs` | Fail stale Processing/Uploaded sessions |
| Embedding builders / refresh | `Services/AiEmbeddingInfrastructure/*` | Background embedding sync (not on request path) |

Queue: in-process `System.Threading.Channels` unbounded channel, **single reader**. Jobs are lost on process restart; startup requeues recent `Uploaded` sessions.

---

## Data stores

```text
Audio file  →  {cwd}/Data/AudioCaseTaking/{sessionId}{ext}
Transcript  →  AudioCaseSession.TranscriptRaw
Extraction  →  ConversationJson, SummaryJson, ExtractedSymptomsJson
Rubrics     →  SuggestedRubricsJson + AudioCaseRubricMatchLog
Events      →  AudioCaseSessionEventLog
AI calls    →  AudioCaseAiRequestLog
Consent     →  AudioCaseConsentLog
Doctor acts →  AudioCaseDoctorActionLog
Feedback    →  AudioCaseRubricFeedback
Concepts    →  AudioCaseClinicalConcept (+ session ClinicalConceptsJson)
```

No Redis. No Hangfire for audio jobs (`UseHangfireForIncrementalRefresh: false` applies to embeddings only).

---

## Authentication

- Backend: `[Authorize]` on `AudioCaseTakingController`. JWT Bearer.
- Frontend: `src/helpers/api_helper.js` attaches `Authorization: Bearer {sessionStorage.authUser.token}`.
- Intelligence health endpoint `GET /api/AudioCaseIntelligence/health` is `[AllowAnonymous]`.

---

## Diagrams

### Audio flow (implemented)

```text
Audio blob → multipart upload → disk
    → Whisper translations (English)
    → GPT JSON extraction (symptoms + summary + conversation)
    → Fast clinical retrieval
    → JSON result to UI
```

### Rubric flow (implemented, fast-f)

```text
Extracted symptoms
  → speaker/negation filter
  → multi-query concept expand
  → parallel DB/FTS/alias/embedding/catalog
  → quality / gender / hierarchy / hallucination gates
  → CanonicalScore
  → optional doctor-learning boost
  → MMR ≤ FastPipelineMaxFinalRubrics (12)
  → SubSectionId > 0 only
```

### Doctor feedback flow (implemented)

```text
Suggested rubrics
  → Approve / Reject in AudioCaseRubricApprovalBar
  → Add to repertorization (PatientBoard)
  → POST doctor-action (audit)
  → POST rubrics/feedback (learning + benchmark)
```



---

# PART 3 — API REFERENCE (DETAILED)

Base path: `/api/AudioCaseTaking`  
Auth: JWT Bearer (`[Authorize]`) unless noted.  
Frontend HTTP: `src/helpers/realbackend_helper.js` via `nigahomeoMultipart` / `nigahomeoAPI`.  
URL constants: `src/helpers/url_helper.js`.  
Thunks: `src/slices/doctor/audioCaseTaking/thunk.js`.

Response envelope (typical): `{ success, message, resultObject }` via `ThreeDBodyPartApiResponseHelper`. Frontend unwraps `resultObject` then `data`.

---

## Endpoints used by Audio Case UI

| API | Method | Route | Purpose | Frontend |
| --- | ------ | ----- | ------- | -------- |
| Upload | POST | `/api/AudioCaseTaking/upload` | Multipart audio + consent | `uploadAudioCaseTaking` |
| Status | GET | `/api/AudioCaseTaking/{sessionId}/status` | Poll progress | `getAudioCaseTakingStatus` |
| Result | GET | `/api/AudioCaseTaking/{sessionId}/result` | Transcript, summary, rubrics | `getAudioCaseTakingResult` |
| Re-analyze | POST | `/api/AudioCaseTaking/{sessionId}/reanalyze` | Re-run from edited transcript | `reAnalyzeAudioCaseTaking` |
| Doctor action | POST | `/api/AudioCaseTaking/{sessionId}/doctor-action` | Audit accept/reject/apply | `logAudioCaseDoctorAction` |
| Latest | GET | `/api/AudioCaseTaking/latest?patientId=&caseId=` | Resume last session | `getLatestAudioCaseSession` |
| Sessions | GET | `/api/AudioCaseTaking/sessions?patientId=&pageNumber=&pageSize=` | History | `getAudioCaseTakingSessions` |
| Concepts | GET | `/api/AudioCaseTaking/{sessionId}/concepts` | Clinical concepts | `getAudioCaseConcepts` |
| Rubric feedback | POST | `/api/AudioCaseTaking/{sessionId}/rubrics/feedback` | Learning + benchmark | `submitAudioCaseRubricFeedback` |
| Download | GET | `/api/AudioCaseTaking/{sessionId}/download` | Audio bytes | `downloadAudioCaseRecording` |

Handler: `Niga-Web/Controllers/AudioCaseTakingController.cs`.

---

### POST `/api/AudioCaseTaking/upload`

**Auth:** JWT. Doctor user id from token (`User.GetUserId()`), not trusted solely from form.

**Request:** `multipart/form-data` (`AudioCaseUploadRequestModel`)

| Field | Required | Notes |
| ----- | -------- | ----- |
| audioFile | yes | Size ≤ `MaxFileSizeBytes` (50 MiB) |
| patientId | yes | |
| caseId | no | |
| patientAppId | no | |
| audioSource | no | default `LiveRecording`; UI sends `LiveRecording` or `FileUpload` |
| originalFileName | no | |
| language | no | Whisper language override |
| consentGiven | yes | must be true |

Allowed extensions (backend): `.mp3 .wav .webm .ogg .m4a .aac .mp4`.

**Response:** `{ sessionId, status: "Uploaded" }`

**Errors:** invalid user, missing file, missing patient, no consent, file too large, unsupported type.

**DB:** insert `AudioCaseSession`, `AudioCaseConsentLog`, event logs; enqueue `ProcessAudio`.

**AI:** none at request time (background).

**Frontend timeout:** axios default (no special upload timeout found). Request size limit disabled on action (`[DisableRequestSizeLimit]`).

---

### GET `/api/AudioCaseTaking/{sessionId}/status`

**Response (`AudioCaseStatusModel`):** `sessionId`, `status`, `progressStep`, `stageLabel`, `percent`, `errorMessage`, `processingStartedAt`, `elapsedSeconds`, `engineVersion`.

Statuses include: `Uploaded`, `Processing`, `Transcribing`, `Extracting`, `MatchingRubrics`, `Completed`, `Failed`.

**Frontend poll:** every 2500 ms, max 192 attempts (~8 min), then stops auto-poll but does **not** mark failed (backend may still run up to 20 min).

---

### GET `/api/AudioCaseTaking/{sessionId}/result`

**Response (`AudioCaseResultModel`):**

- `transcript`
- `messages` (conversation)
- `summary` (chiefComplaint, HPI, mentals, generals, modalities, particulars, redFlags)
- `suggestedRubrics` (see rubric fields below)
- `rubricIntelligence` (`engineVersion`, `requireManualApprovalForSuggestedRubrics`, …)
- `processingMetrics` (optional telemetry)

---

### POST `/api/AudioCaseTaking/{sessionId}/reanalyze`

**JSON:** `{ "transcript": "..." }`

Skips Whisper. Re-queues `JobType: ReAnalyze`. Blocked if session already in-flight.

---

### POST `/api/AudioCaseTaking/{sessionId}/doctor-action`

**JSON (`AudioCaseDoctorActionRequestModel`):** `actionType`, `targetType`, `targetId`, `beforeJson`, `afterJson`, `notes`.

Writes `AudioCaseDoctorActionLog`. Does not change repertorization by itself.

---

### POST `/api/AudioCaseTaking/{sessionId}/rubrics/feedback`

**JSON:** `feedbackType` (`Approved`/`Accepted`, `Rejected`, `Edited`/`Corrected`), `rubricName` required, `subSectionId`, `correctedSubSectionId` for edits, `reason`, `rejectReasonStage`.

Handler: `DoctorFeedbackLearningEngine.ProcessFeedbackAsync`.

---

### GET download

Returns `File(bytes, contentType, fileName)` or `400 { success:false, message }`.

---

## Suggested rubric payload (actual DTO fields)

From `AudioCaseSuggestedRubricModel` — do not invent extra fields:

`subSectionId`, `subSectionName`, `sectionId`, `matchScore`, `suggestedIntensityNo`, `matchedFrom`, `remedyCountForSort`, `isAiSuggested`, `matchSource`, `confidenceScore`, `whySuggested`, `engineVersion`, `requiresManualApproval`, `homeopathicWeight`, `matchLayer`, `rubricTier`, `requiresDoctorReview`, `sourceConceptId`, `explainability`, `evidenceChain`, `qualityScore`, `validationStatus`, `validationFlags`, `resultKind`, `repertoryPath`, `canonicalScore`, `evidenceScore`, `isDbBacked`, …

Fast path filters to `subSectionId > 0` before response.

---

## Related intelligence APIs (admin / ops)

Controller: `AudioCaseIntelligenceController` route `/api/AudioCaseIntelligence`.

| Method | Route | Auth | Purpose |
| ------ | ----- | ---- | ------- |
| GET | `/health` | Anonymous | V2/rollback/repertory status (engineVersion reported as v2/v1 — **does not report fast-f**) |
| GET | `/config` | (see controller) | Runtime flags |
| PUT | `/config` | | Runtime overrides |
| GET | `/benchmark/summary` | | Benchmark |
| GET | `/benchmark/trends` | | Trends |
| GET | `/feedback/queue` | | Feedback queue |
| GET | `/rollout/status` | | Rollout |
| GET | `/repertory/status` | | Mapping |

Admin: `AudioCaseIntelligenceAdminController` — metaphors, aliases.  
V3: `AudioCaseIntelligenceV3Controller`.  
Embeddings: `AiEmbeddingInfrastructureController`.

Frontend admin URLs in `url_helper.js` (`RUBRIC_INTELLIGENCE_*`).

**Documented discrepancy:** `/health` `EngineVersion` is `"v2"` or `"v1"`, not `fast-f`. Session result `rubricIntelligence.engineVersion` is the real processing stamp.

---

## Headers

| Header | Set by |
| ------ | ------ |
| `Authorization: Bearer …` | `api_helper.js` interceptor |
| `Content-Type: multipart/form-data` | `nigahomeoMultipart` on upload |
| `Content-Type: application/json` | other calls |

No WebSocket. Status is HTTP polling only.

---

## Errors

Backend returns helper Failure/Error with message string. Frontend `assertApiSuccess` throws if `success === false`. Failed sessions: status `failed` + `errorMessage` / `errorCode` (`PROCESSING_TIMEOUT`, `PROCESSING_FAILED`, `PROCESSING_STALE`, `UPLOAD_STALE`, `UPLOAD_FILE_MISSING`, `BACKGROUND_JOB_FAILED`).



---

# PART 4 — DATABASE REFERENCE (DETAILED)

Database name in scripts: `HomeoCentrum_Production`.  
EF context: `Niga-Domain/Data/NIGACentrumContext.cs`.  
Migrations folder exists but audio tables are created via **manual SQL scripts**, not EF migrations.

---

## Script map

| Script | Purpose |
| ------ | ------- |
| `Database/Scripts/AudioCaseTaking_CreateTables.sql` | Core session, logs, consent, match, doctor action, retention |
| `Database/Scripts/AudioCaseIntelligenceV2/001–010, 101–103` | Concepts, intelligence log, embeddings, feedback, benchmark, V2 columns |
| `721–722` | Unified scores on match log |
| `728` | Widen `EngineVersion` on intelligence log |
| `725_FullText_SubSectionMaster_SubSectionName.sql` | FTS used by hotspot search (referenced in `SubSectionRepository`) |
| `Database/Scripts/AIV4EmbeddingInfrastructure/801–802` | `AiRubricEmbedding`, `AiConceptEmbedding`, sync state |
| `docs/sql/728_Widen_AudioCaseIntelligenceLog_EngineVersion.sql` | Duplicate/docs copy of 728 |

---

## Audio Case tables

### AudioCaseSession

**Purpose:** One consultation audio analysis.  
**PK:** `AudioCaseSessionId` UNIQUEIDENTIFIER  
**FK:** none declared to Patient in create script (PatientId/CaseId/DoctorUserId stored as BIGINT).  
**Important columns:** `AudioFilePath`, `TranscriptRaw`, `ConversationJson`, `SummaryJson`, `ExtractedSymptomsJson`, `SuggestedRubricsJson`, `ClinicalConceptsJson`, `CausationLinksJson`, `Status`, `CurrentStep`, `DetectedLanguage`, `LanguageOverride`, `CorrelationId`, `ErrorCode`, `ErrorMessage`, `IntelligenceEngineVersion`, `ConceptGraphEngineVersion`, `RecallEngineVersion`, `TranscriptCoverageScore`, `CaseCompletenessScore`, `ReAnalysisCount`, `CompletedAtUtc`, `AudioPurgedAtUtc`, `DeleteStatus`.  
**Indexes:** DoctorUserId+EnteredDate; PatientId+CaseId+EnteredDate.  
**Writes:** upload, process, reanalyze, fail, retention.  
**Reads:** status, result, latest, sessions, download.

### AudioCaseSessionEventLog

**PK:** `EventLogId`  
**FK:** `AudioCaseSessionId` → AudioCaseSession  
**Purpose:** Step audit (`SessionCreated`, `TranscriptionCompleted`, `LatencyGap*`, `SessionFailed`, …).

### AudioCaseAiRequestLog

**PK:** `AiRequestLogId`  
**FK:** session  
**Purpose:** Whisper/GPT payloads, tokens, latency, success. May contain transcript-adjacent JSON — treat as PHI.

### AudioCaseConsentLog

Consent type `AudioRecordingClinical`, `ConsentTextVersion` from config (`v1.0-2026-06-23`).

### AudioCaseRubricMatchLog

Per suggested rubric: scores, rank, match source, explainability JSON, unified scores (`FinalHybridScore`, `EvidenceChainComplete`, `GroundedInOntology`).  
**FK:** session. `SubSectionId` is INT but create script does **not** FK to SubSectionMaster (AI-suggested ids may be 0).

### AudioCaseDoctorActionLog

Accept/reject/apply audit from UI `doctor-action`.

### AudioCaseRetentionLog

File purge actions when retention &gt; 0 (currently disabled).

### AudioCaseClinicalConcept

V2+ persisted concepts for a session (`001_Create_AudioCaseClinicalConcept.sql`). Fast path also saves via `IAudioCaseIntelligenceRepository.SaveConceptsAsync`.

### AudioCaseIntelligenceLog

Stage logs including `FastClinicalRetrieval` (`EngineVersion` widened in 728; telemetry also uses `base-a` constant).

### AudioCaseCausationLink / AudioCaseClinicalInferenceLog

V2 causation/inference. Fast path passes empty causation list.

### AudioCaseRubricFeedback

Doctor Approved / Rejected / Corrected. Feeds learning + benchmark.

### AudioCaseRubricBenchmark

Daily/engine snapshots (`010_Create_AudioCaseRubricBenchmark.sql`).

---

## Repertory / rubric tables (discovery)

### SectionMaster

**PK:** `SectionId`  
**Columns:** `SectionName`, `SectionAlias`, `DeleteStatus`  
**Children:** `SubSectionMaster`

### SubSectionMaster

**PK:** `SubSectionId`  
**FK:** `SectionId` → SectionMaster; `ParentSubSectionId` self  
**Search column:** `SubSectionName` (FTS CONTAINS + `Contains` fallback)  
**Also:** `SubSectionNameAlias`, `Description`, `DeleteStatus`  
**Used by:** V1 hotspot, keyword discovery, catalog, reconciler, embeddings FK.

### RubricRemedyDetail

**PK:** `RubricRemedyId`  
**FK:** `SubSectionId`, `RemedyId`, `GradeId`  
**Purpose:** Remedy mapping / counts (`DeletedStatus`).  
Not queried on the fast discovery hot path except reconciler `RemedyCount`.

### RemedyRubricAuthorDetail

Child of `RubricRemedyDetail`. Not on audio hot path.

### RemedyMaster / RemedyGradeMaster

Remedy lookup after doctor applies rubric to repertorization (existing case-taking, not audio-specific).

---

## Embedding tables

### RubricEmbeddings (legacy)

**PK:** `Id`  
**FK:** `RubricId` → SubSectionMaster  
**Columns:** `EmbeddingJson` (JSON float array, not native VECTOR), `ModelName`, `TextHash`, `SourceType`  
**Config:** `KeepLegacyRubricEmbeddingsActive: true`

### AiRubricEmbedding (V4 infra)

**PK:** `RubricEmbeddingId`  
**FK:** `EmbeddingVersionId` → AiEmbeddingVersion; `RubricId`  
**Columns:** `SourceText`, `TextHash`, `EmbeddingPayloadJson`, `DimensionCount` (1536), `Status`, `RevisionNo`

### AiConceptEmbedding

Concept-level vectors for enterprise/V3 engines. Fast path embedding search uses rubric cache (`IRubricEmbeddingMemoryCache`), not necessarily this table directly.

### AiEmbeddingVersion / AiEmbeddingSyncState / jobs

Builder + incremental refresh (`AiEmbeddingInfrastructure`).

---

## Which tables participate in which concern

| Concern | Tables |
| ------- | ------ |
| Rubric discovery | SubSectionMaster, (FTS index), RubricEmbeddings / AiRubricEmbedding, alias/metaphor admin tables if present |
| Rubric validation | In-process; match log stores outcomes |
| Embedding | RubricEmbeddings, AiRubricEmbedding, AiConceptEmbedding, AiEmbeddingVersion |
| Remedy mapping | RubricRemedyDetail, RemedyMaster (after apply) |
| Doctor review | AudioCaseDoctorActionLog, AudioCaseRubricFeedback, AudioCaseRubricBenchmark |

---

## Relationships

```text
SectionMaster
    └── SubSectionMaster
            ├── RubricRemedyDetail → RemedyMaster
            │         └── RemedyRubricAuthorDetail
            ├── RubricEmbeddings (legacy)
            └── AiRubricEmbedding → AiEmbeddingVersion

AudioCaseSession
    ├── AudioCaseSessionEventLog
    ├── AudioCaseAiRequestLog
    ├── AudioCaseConsentLog
    ├── AudioCaseRubricMatchLog  (SubSectionId logical → SubSectionMaster)
    ├── AudioCaseDoctorActionLog
    ├── AudioCaseRetentionLog
    ├── AudioCaseClinicalConcept
    ├── AudioCaseIntelligenceLog
    ├── AudioCaseCausationLink
    ├── AudioCaseClinicalInferenceLog
    └── AudioCaseRubricFeedback
```

No separate Transcript, AudioCase, or DoctorReview header tables — transcript lives on the session row; review is action + feedback logs.

---

## Persistence writes (audio processing)

| Table | Operation | Trigger | Source |
| ----- | --------- | ------- | ------ |
| AudioCaseSession | INSERT | Upload | service |
| AudioCaseSession | UPDATE | each progress step, complete, fail | service |
| AudioCaseConsentLog | INSERT | Upload | consent true |
| AudioCaseSessionEventLog | INSERT | many steps | LogEventAsync |
| AudioCaseAiRequestLog | INSERT | Whisper/GPT | LogAiRequestAsync |
| AudioCaseClinicalConcept | UPSERT/insert | Fast retrieval | SaveConceptsAsync |
| AudioCaseIntelligenceLog | INSERT | FastClinicalRetrieval stage | repository |
| AudioCaseRubricMatchLog | DELETE+INSERT | PersistRubricMatchLogsAsync | final rubrics |
| AudioCaseSession.SuggestedRubricsJson | UPDATE | finalize | JSON serialize |
| AudioCaseDoctorActionLog | INSERT | doctor-action API | UI |
| AudioCaseRubricFeedback | INSERT | feedback API | UI |
| AudioCaseRetentionLog | INSERT | purge job | if retention enabled |

---

## Sample debug queries (no PHI in comments)

```sql
-- Session timeline
SELECT EventType, EventStatus, Message, EnteredDate, DurationMs
FROM dbo.AudioCaseSessionEventLog
WHERE AudioCaseSessionId = @id
ORDER BY EventLogId;

-- AI calls
SELECT ServiceType, ModelName, LatencyMs, IsSuccess, PromptTokens, CompletionTokens, ErrorMessage, EnteredDate
FROM dbo.AudioCaseAiRequestLog
WHERE AudioCaseSessionId = @id
ORDER BY AiRequestLogId;

-- Suggested rubrics
SELECT RankPosition, SubSectionId, SubSectionName, FinalScore, MatchSource, IsSelectedForUi
FROM dbo.AudioCaseRubricMatchLog
WHERE AudioCaseSessionId = @id
ORDER BY RankPosition;
```



---

# PART 5 — AI PROMPTS (FULL TEXT)

**Never include API keys.** Prompts below are copied from source.

Models (config): Chat `gpt-4o`, Whisper `whisper-1`, Embedding `text-embedding-3-small`.  
Shared GPT client (`IntelligenceGptClient`): `temperature = 0.1`, `response_format = json_object`, **no max_tokens**.  
Extraction (`AudioCaseAiProcessor.ExtractCaseDataAsync`): `temperature = 0.1`, `max_tokens = 8192`, `json_object`.  
AI rubric names (`SuggestAiRubricsAsync`): `temperature = 0.2`, `json_object`, no max_tokens.

---

## CURRENT production prompts

### 1. Case extraction (ACTIVE on every audio case)

```text
Prompt name: ExtractCaseData
File: Niga-Domain/Services/AudioCaseAiProcessor.cs
Function: ExtractCaseDataAsync
Model: OpenAI:ChatModel (gpt-4o)
Called by: AudioCaseTakingService.RunExtractionAndRubricsAsync
Current/legacy: CURRENT
```

**System prompt (full):**

```
You are a homeopathic case-taking assistant. The repertory database uses ENGLISH rubric names only.
ALL output must be in English. If the transcript is in another language, translate symptom phrases and summary to English.

The full transcript is provided separately — do NOT repeat or echo the full transcript in your response.

Return strict JSON only with this schema:
{
  "conversation":[{"role":"doctor|patient","text":"English text","timestamp":"HH:MM:SS or empty"}],
  "symptoms":[
    {
      "phrase":"short English symptom phrase using patient's clinical wording",
      "searchTerms":["english","keywords","for","repertory","lookup"],
      "category":"particular|general|mental",
      "intensityHint":1-4,
      "isSensationBearing":false
    }
  ],
  "summary":{
    "chiefComplaint":"English only — primary reason for visit",
    "historyOfPresentIllness":"English only — chronological clinical narrative",
    "mentals":[],
    "generals":[],
    "modalities":[],
    "particulars":[],
    "redFlags":[]
  },
  "detectedLanguage":"ISO code e.g. en, mr, hi"
}

Accuracy rules (critical):
- Never invent symptoms, modalities, or history not supported by the transcript.
- Extract EVERY distinct symptom, concomitant, modality, mental, and general mentioned.
- Preserve clinical specificity (location, side, timing, before/after, aggravation/amelioration).
- Ignore filler/repetition ("Yes. Yes. Yes.") and role-attribution noise from translation.
- Doctor questions are NOT patient symptoms. Patient saying "No" negates that symptom.
- Do NOT invent diagnoses. Keep the patient's word "fit" as "fit" unless the transcript
  explicitly says epilepsy / convulsion / seizure. Never auto-add those as searchTerms.
- Do NOT invent organs or locations (e.g. feet fear must not become chest/heart/convulsion).
- ALWAYS extract when present: talking in sleep; desire for salt; desire for meat/mutton;
  thirst / drinks large quantities of water; increased sexual desire;
  fear of heights / high places; dropping things / awkwardness; fear before fit;
  aura/vibration before fit; face red with anger; anger before fit.
- If Whisper likely said "feet" but clinical context is clearly epileptic "fit", you may note
  both in searchTerms as "fit" and "feet" — still do NOT add epilepsy/convulsion unless spoken.
- symptom.phrase: use concise English reflecting what the patient actually said.
- searchTerms: 2-6 short English keywords drawn from the patient's language for repertory lookup
  (examples: fear, fit, vibration, hands, thirst, salt, sleep talking, sexual desire, awkward, drops).
- isSensationBearing: true when the symptom is a sensation, emotion, or idiomatic bodily feeling
  (burning, tingling, crawling ants, fear, grief, anxiety, "as if" sensations). False for plain
  factual history without sensory/emotional quality.
- summary.chiefComplaint: single clearest presenting complaint.
- summary.particulars: list each local/particular symptom separately.
- summary.modalities: all aggravations and ameliorations.
- summary.mentals: fears, anxieties, irritability, delusions, etc.
- conversation: include every exchange that contains clinical information; omit greetings/small talk only.
```

**User prompt:** `Transcript:\n\n{transcript}`

**Post-parse:** `extraction.EnglishTranscript = transcript.Trim()` from Whisper — GPT is not allowed to own the transcript field.

**Truncation:** `englishTranscript` is **not** requested in the GPT JSON schema. Historical truncation of that field is **CONFIRMED fixed** in current extraction (prompt + overwrite). Remaining risk: large `conversation`/`symptoms` arrays hitting `max_tokens` 8192.

---

### 2. AI rubric name suggestion (CONDITIONALLY ACTIVE)

```text
Prompt name: SuggestAiRubrics
File: AudioCaseAiProcessor.cs
Function: SuggestAiRubricsAsync
Called by: MatchRubricsV1Async when EnableAiSuggestedRubrics and aiSlots > 0
Current/legacy: CURRENT code path inside V1; often WASTED on fast-f because SubSectionId<=0 is dropped
```

**System prompt (full):**

```
You are a homeopathic repertory assistant. Suggest English rubric names in standard repertory style
(e.g. "GENITALIA - ERUPTIONS, fungal", "SKIN - ERUPTIONS, itching") for symptoms NOT already covered
by the database rubrics list. These are AI suggestions only — they may not exist in the user's database.

Return strict JSON only:
{
  "rubrics":[
    {
      "rubricName":"SECTION - SYMPTOM, modality",
      "sectionHint":"GENITALIA|SKIN|MIND|etc",
      "matchedFrom":"symptom phrase from case",
      "suggestedIntensityNo":1-4,
      "reason":"brief clinical reason"
    }
  ]
}

Rules:
- English only, repertory-style naming.
- Do not duplicate rubrics already in the database list.
- Suggest only clinically supported rubrics from the case.
- Max rubrics as requested in the user message.
```

The prompt **explicitly allows names that may not exist in DB**. Fast path later requires `SubSectionId > 0`. Reconciler can map high-confidence names to `SubSectionMaster` **if they survive to finalize** (they usually do not on fast-f).

---

### 3. Whisper (no chat prompt)

| Call | Endpoint | Params |
| ---- | -------- | ------ |
| English output (default `OutputEnglishOnly: true`) | `POST audio/translations` | `model=whisper-1`, `response_format=verbose_json` |
| Native transcription | `POST audio/transcriptions` | same + optional `language` |
| Dual-language extra | `audio/transcriptions` with source language | at most one extra per case |

No Whisper instruction prompt is sent.

---

## LEGACY prompts (not on fast-f hot path)

These run only if `EnableFastClinicalRetrievalPipeline` is false (and the corresponding engine flags are on).

| Name | File | Model id / stage | Purpose |
| ---- | ---- | ---------------- | ------- |
| M1 Patient Meaning Graph | `V3/Engines/PatientMeaningGraphEngine.cs` | v3-m1 | Meanings JSON only, no rubrics |
| M2 Metaphor | `V3/Engines/ConceptGraphAiEngines.cs` | v3-m2 | Metaphor vs literal |
| M3 Clinical Concept | same | v3-m3 | Clinical concepts |
| M4 Homeopathic Concept | same | v3-m4 | Homeopathic concepts |
| M5 Multi Concept | `V3/Engines/MultiConceptDiscoveryEngine.cs` | v5-m5 | Parallel categories: Fear, Sleep, Sexual, … |
| M0 Case Decomposition | `V3/Engines/ConceptGraphV35Engines.cs` | | Split case |
| M1b Multi-Symptom | same | | Extra symptoms |
| M4b Recall Expansion | same | | Expand recall |
| Case Understanding | `Engines/CaseUnderstandingEngine.cs` | V2 | Concepts + enhancedSymptoms |
| V7 Clinical Extraction | `RepertoryIntelligence/Extraction/ClinicalExtractionService.cs` | v7-extraction | Symptoms, **never rubric names** |
| ECI v8 Symptom Extractor | `ECI/V8/Extraction/EciStructuredSymptomExtractor.cs` | eci-v8-symptom-extractor | Structured symptoms, never rubrics |

### M1 (excerpt — full text in source)

```
You are Model M1 — Patient Meaning Graph Engine for homeopathic case taking.
Purpose: Convert patient language into structured MEANINGS only.
...
- Do NOT generate rubrics, repertory terms, searchTerms, or SubSection names.
- Do NOT invent symptoms not in the transcript.
```

### V2 Case Understanding (excerpt)

```
You are a homeopathic clinical case understanding engine. The repertory uses ENGLISH rubric names only.
...
- Never invent symptoms not supported by the transcript.
- Identify metaphors and translate to clinical meaning (e.g. "vibration before fit" → prodromal aura before convulsion).
```

Note: V2 prompt **does** map “vibration before fit” → convulsion; extraction prompt **forbids** auto-adding convulsion unless spoken. Fast-f uses extraction, not this engine.

### V7 extraction (full short prompt)

```
You are a clinical language extraction engine for homeopathic case taking.
Extract symptoms from the transcript as structured JSON only.
NEVER output repertory rubric names.
NEVER invent rubric names from Kent or any repertory.
NEVER suggest remedies.
Output symptoms with: text, normalized, category (Mental|General|Particular|Modality|Etiology|Concomitant), timing, location, confidence (0-100).
```

### ECI v8 (opening)

```
You are an enterprise clinical symptom extraction engine for homeopathic case taking.
Output JSON only with symptoms[], evidence, speaker, confidence, time, location, modality, sensation, emotion, trigger, ...
```

Full remaining M2–M5 / M0 / M1b / M4b / ECI JSON schemas: read the `SystemPrompt` constants in the files above.

---

## JSON validation

| Call | Schema | Recovery |
| ---- | ------ | -------- |
| Extraction | Deserialize `AudioCaseExtractionModel`; fail session if `!Success` | No retry loop found |
| IntelligenceGptClient | Deserialize `T`; Success=false if null | No retry |
| SuggestAiRubrics | `AudioCaseAiSuggestedRubricsModel` | Empty list on failure |

No JSON Schema library. No automatic retry on truncated JSON. No partial-JSON repair found.



---

# PART 6 — RUBRIC ENGINE (DETAILED)

Production engine stamp: **`fast-f`**.  
Orchestrator: `Niga-Domain/Services/AudioCaseIntelligence/Orchestration/FastClinicalRetrievalOrchestrator.cs`.  
Entry: `AudioCaseTakingService.MatchRubricsWithIntelligenceAsync` → `MatchRubricsFastClinicalAsync` when `EnableFastClinicalRetrievalPipeline`.

---

## Actual stages (fast-f)

```text
Transcript (already English)
    ↓
GPT extraction → symptoms + summary + conversation
    ↓
Speaker / negation filter (FastClinicalEvidenceGate)
    ↓
Concepts from symptoms (ConceptGraphConceptMapper.FromSymptoms)
    ↓
Multi-query expand (FastClinicalSymptomBlockBuilder) if FastPipelineEnableMultiQueryBlocks
    ↓
PARALLEL:
    V1 MatchRubricsV1Async (hotspot FTS/Contains, ≤12 symptoms, pageSize 8)
    ConceptKeywordDiscoveryEngine (per-concept, concurrency 6, timeout 15s)
    RubricAliasEngine
    EmbeddingSearchEngine (topK 50, cosine ≥ 0.74, timeout 8s)
    FastClinicalRubricCatalog token lookup (max 40)
    ↓
Merge funnel cap FastPipelineCandidateFunnelSize = 80
    ↓
Keep SubSectionId > 0
    ↓
RubricCandidateQualityGate (substring collision, hitchhikers, citation lock, AI/DB dup)
    ↓
Gender gate
    ↓
Hierarchy specificity gate
    ↓
Hallucination hard gate (evidence overlap ≥ 0.15)
    ↓
CanonicalScore (FastClinicalRanking)
    ↓
Doctor learning soft boost (optional)
    ↓
MMR select ≤ 12, min canonical 0.45, score cliff after 5
    ↓
Evidence contract attach
    ↓
ClinicalValidationEngine (enterprise 8-step) if RequiresStrictValidation
    ↓
Take maxFinal 5–20 (config 12), SubSectionId > 0
    ↓
ApplyRubricMetadata (manual approval)
    ↓
AiSuggestedRubricReconciler + QualityGate + unified contract
```

Stages **not** on this path: V3 graph GPT, V7 search, ECI v8, knowledge-graph ranking.

---

## Database search (V1 + Keyword)

**Repository:** `SubSectionRepository.SearchSubSectionsByHotspotAsync`

1. Build FTS query from hotspot; `CONTAINS(SubSectionName, {ftsQuery})`.
   Audio Case (NigaHomeopathy): `"term*"` or `"a*" AND "b*"` (`725_FullText_SubSectionMaster_SubSectionName.sql`).
   Classic admin API (`NIGA_Latest_Code_API`): `CONTAINSTABLE(..., SearchNormalized)` with `"word*" OR ...` ordered by SQL `RANK` — **not** on the audio path.
2. On FTS failure → `ApplySubSectionByHotspotSearch` (Contains/LIKE scan).
3. Word-boundary filter via `WordBoundaryMatcher` (drops drop/dropsy-style collisions).
4. V1: `PageSize = 8`, take 12 symptoms; score:

```text
keywordScore = max(0.45, domainScore)   // domainScore < 0.35 → skip
semanticScore = AudioCaseAiProcessor.ComputeTextSimilarity(phrase, name)  // Jaccard-like, not embeddings
finalScore = EnableSemanticRubricMatch ? 0.6*keyword + 0.4*semantic : keyword
```

`EnableSemanticRubricMatch` is **true** — this is **string similarity**, not vector search.

V1 then may call GPT `SuggestAiRubricsAsync` to fill up to 20 combined (config `MaxAiSuggestedRubrics: 25` but V1 caps combined at 20). Fast path drops non-DB ids afterward.

Keyword engine: same hotspot search per concept search term, with domain scoring and traces in `AudioCaseIntelligenceLog`.

---

## Embedding search

```text
Feature: Rubric semantic search
File: Niga-Domain/Services/AudioCaseIntelligence/Engines/EmbeddingSearchEngine.cs
Function: SearchAsync
Database: RubricEmbeddings / memory cache (legacy + V4 infra)
Status: IMPLEMENTED (optional channel; timeout 8s; skip if cache empty)
```

| Parameter | Current value | File |
| --------- | ------------- | ---- |
| Model | `text-embedding-3-small` | `OpenAI:EmbeddingModel` |
| Dimensions | 1536 | `AiEmbeddingInfrastructure:DefaultDimensionCount` |
| Top K | 50 | `EmbeddingTopK` / `V7EmbeddingTopK` |
| Min cosine | 0.74 | `MinEmbeddingCosineForCandidate` |
| Max query texts | 12 | `MaxEmbeddingConceptsPerPass` |
| Similarity | cosine (`EmbeddingVectorMath`) | |
| Fallback | Jaccard over cache texts if embed fails | `FallbackJaccardSearch` |

Query text: built from concept (`BuildQueryText`). Results mapped to `MatchSource = "Embedding"`.

Refresh: `RubricEmbeddingIndexerBackgroundService` + V4 `AiIncrementalEmbeddingRefreshBackgroundService` / builder. Fast path **does not wait** for cache (`FastPipelineSemanticCacheMaxWaitSeconds: 0`).

---

## Ranking formula (ACTUAL — fast-f)

`FastClinicalRanking.ScoreWeights` defaults (hardcoded, not appsettings):

```text
CanonicalScore =
    0.30 * Evidence
  + 0.25 * ClinicalMatch
  + 0.20 * Semantic
  + 0.15 * ExactAlias
  + 0.10 * Keyword
```

- Evidence: token overlap of rubric name vs concept haystack (`ComputeEvidenceOverlap`).
- If evidence &lt; 0.15: evidence forced to 0; clinical ×0.4; semantic ×0.3.
- ClinicalMatch: existing confidence/matchScore scaled to 0–1.
- Semantic component boosted if `MatchSource` contains `"embed"`.
- ExactAlias boosted if source contains alias/exact/database.
- Keyword boosted if source contains keyword/fts/concept.

Display: `MatchScore = CanonicalScore * 100`.

**V2 HybridWeights** apply to the **legacy** `HybridRetrievalEngine` only (skipped on fast-f):

```text
hybridScore =
    Embedding * embeddingScore          // 0.40
  + Alias * aliasScore                  // 0.30
  + ClinicalMeaning * clinicalScore     // 0.20
  + KeywordLike * keywordScore          // 0.10
  + 0.15 * domainScore                  // hardcoded extra term
confidence = min(0.99, hybrid * 0.92 + 0.08)   // Calibrate
```

Domain reject: skip if `domainScore < 0.25` and embedding>0 and alias<0.4.

**ECI v8 weights** (ClinicalMatch 30, Evidence 20, …) apply only if ECI is enabled (it is not).

**ECI v8 weights** (ClinicalMatch 30, Evidence 20, …) apply only if ECI is enabled (it is not).

### MMR

```text
mmr = λ * relevance − (1−λ) * maxNameSimilarity(selected)
λ = FastPipelineMmrLambda = 0.80
minCanonicalScore = 0.45
scoreCliffRatio = 0.70 after ≥5 selected
targetCount = FastPipelineMaxFinalRubrics = 12 (clamped 5–20)
```

Never fabricates rubrics to fill 12.

### Doctor learning boost (after canonical)

If acceptance rate known: `score = 0.95*score + 0.05*rate`.  
Concept-rubric map: `+ cappedWeight * 0.05`.  
Cannot rescue below evidence/canonical floors.

---

## Top-K

| Layer | Count |
| ----- | ----- |
| V1 symptoms | 12 |
| V1 page size | 8 |
| V1 combined cap | 20 |
| Embedding topK | 50 then cosine filter |
| Catalog tokens | 40; results 40 |
| Funnel merge | 80 |
| Final | ≤12 |
| Min required | **None** — empty list is allowed (`Success` if rubrics or concepts &gt; 0) |

If requested 10–12 and found 7: **return 7**. CONFIRMED.

---

## Validation

| # | Check | Implemented on fast-f? |
| - | ----- | ---------------------- |
| 1 | DB existence | Yes — `SubSectionId > 0` hard filter |
| 2 | Exact/normalized match | Partial — FTS/Contains + word boundary; reconciler exact name |
| 3 | Semantic similarity | Yes if embedding channel succeeds |
| 4 | Clinical relevance | Enterprise pipeline + canonical evidence |
| 5 | Context (location/sensation/…) | Hierarchy specificity gate; not a full Kent analysis |
| 6 | Duplicates | Merge by SubSectionId; MMR; QualityGate AI/DB dup |
| 7 | Confidence | CanonicalScore 0–1 **is** implemented on fast-f |

Enterprise steps (`EnterpriseValidationStepNames`): Evidence, Clinical, Gender, Age, Domain, Hallucination, Duplicate, Confidence.  
Quality floors: `MinRubricQualityScore` 70, Tier3 58, review fallback 50, `MinEnterpriseRubricConfidenceScore` 62.

---

## Hallucination prevention

```text
AI Candidate with SubSectionId <= 0
    ↓ FastClinicalEvidenceGate.ApplyHallucinationHardGate
    ↓ dropped (NotDbBacked)
```

Also: evidence token overlap &lt; `FastPipelineMinEvidenceScore` (0.15) dropped.  
Reconciler can promote AI names **only if they still exist in the list** and fuzzy/exact match ≥ `AiReconciliationMinConfidence` (0.7). Fast-f usually never gives them that chance.

AI **can** invent names inside `SuggestAiRubricsAsync`. They are **not** shown as repertory rubrics on the fast path unless mapped and kept. `EnableAiClinicalConceptSuggestions` is for unmatched concepts as `resultKind=AiClinicalConcept` on other engines.

---

## Decision tree (actual fast-f)

```text
Transcript
   ↓
GPT: clinically extract symptoms? (model may omit items — no second pass on fast path)
   ↓
Filter doctor-only / negated
   ↓
Search DB (5 parallel channels)
   ↓
Candidate SubSectionId > 0?
   ├── NO  → drop
   └── YES → quality/gender/hierarchy/evidence
                  ↓
             CanonicalScore ≥ 0.45?
                  ├── NO  → drop from MMR pool
                  └── YES → MMR until 12 or cliff
```

---

## Quality control mapping

| Issue | Mechanism |
| ----- | --------- |
| False positive | Evidence gate, gender, hitchhiker filter, domain score 0.35, word boundary |
| False negative | Multi-query, catalog, embedding, alias; MMR cliff / min score can drop valid ones |
| Hallucination | DB id required |
| Duplicate | SubSectionId group + MMR name similarity |
| Over-generalization | Hierarchy specificity prefers evidence-backed leaves |
| Under-specificity | Extraction prompt asks to preserve location/side/timing; not separately scored |



---

# PART 7 — VERSION HISTORY (DETAILED)

Do **not** treat these as marketing version names. They are engine stamps found in source, `appsettings.json`, telemetry, and existing dated docs.

Exact git SHAs for every milestone were **not fully enumerated** in this audit. Use:

```bash
cd NigaHomeopathy-API
git log --all --oneline --decorate -- Niga-Domain/Repositories/AudioCaseTakingService.cs
git log --follow -- Niga-Domain/Services/AudioCaseIntelligence/Orchestration/FastClinicalRetrievalOrchestrator.cs
```

---

## Current production

| Field | Value | Evidence |
| ----- | ----- | -------- |
| Engine stamp | `fast-f` | `RubricIntelligence:FastPipelineEngineVersion` in `Niga-Web/appsettings.json` |
| Gate | `EnableFastClinicalRetrievalPipeline: true` | same file; `AudioCaseTakingService` Stage C comment |
| Rollback | set flag `false` | `RubricIntelligenceOptions.EnableFastClinicalRetrievalPipeline` |

CONFIRMED: this is the path `MatchRubricsWithIntelligenceAsync` takes today.

---

## Chronological evolution (from code + existing docs)

### Phase — Initial audio case (V1)

- **Problem:** Capture consultation audio and suggest repertory rubrics.
- **Implementation:** Upload → Whisper → GPT extraction → `SearchSubSectionsByHotspotAsync` LIKE/FTS → optional GPT rubric names.
- **Files:** `AudioCaseTakingController`, `AudioCaseTakingService`, `AudioCaseAiProcessor`, `Database/Scripts/AudioCaseTaking_CreateTables.sql`
- **Database:** `AudioCaseSession`, event/AI/consent/match/doctor-action logs.
- **AI:** `whisper-1` + `gpt-4o` extraction JSON.
- **Status:** Still implemented as `MatchRubricsV1Async`. Used as one **parallel channel** on the fast path, or as the only path if `RollbackToV1Only`.

### Phase — V2 Rubric Intelligence

- **Problem:** Keyword-only matching missed synonyms/metaphors; no explainability.
- **Implementation:** `RubricIntelligenceOrchestrator` + concept extraction, alias, embedding hybrid, doctor feedback learning, clinical validation V2.1.
- **Config:** `EnableV2: true` (still true; required for fast path because `IsV2Active` must be true).
- **Status:** LEGACY for discovery when fast path is on. Settings/approval flags still apply.

### Phase — V3 Concept Graph (M1–M4)

- **Problem:** Need patient-meaning → clinical → homeopathic concept graph before search.
- **Implementation:** `ConceptGraphOrchestrator` + GPT models M1–M4 in `V3/Engines`.
- **Config:** `EnableV3ConceptGraph: true` (still true, but skipped on fast path).
- **Status:** LEGACY / rollback path.

### Phase — V3.5 recall + fast V3 internals

- **Problem:** Missed multi-symptom coverage; sequential GPT too slow.
- **Implementation:** M0 / M1b / M4b in `ConceptGraphV35Engines.cs`; `EnableV35RecallEngine`, `EnableV35FastPipeline`.
- **Status:** LEGACY / rollback path.

### Phase — V4 / V5 enterprise discovery

- **Problem:** Merge multiple sources; per-concept slots; hybrid completion.
- **Implementation:** `EnableEnterpriseRubricDiscoveryEngine`, `EnableHybridCompletionEngine`, knowledge graph flags.
- **Status:** LEGACY / rollback path. Flags remain `true` in appsettings but are not executed on fast-f.

### Phase — V6 SQL-authoritative reasoning

- **Problem:** Stop AI from inventing rubrics; SQL as authority.
- **Implementation:** `Services/AudioCaseIntelligence/V6/*`
- **Config:** `EnableV6ClinicalReasoningEngine: false`
- **Status:** Implemented but **disabled**.

### Phase — V7 Repertory Intelligence

- **Problem:** Modular vocabulary / search / ranking / completion with latency budget.
- **Implementation:** `Services/AudioCaseIntelligence/RepertoryIntelligence/*`
- **Config:** `EnableV7RepertoryIntelligenceEngine: true` (still true, skipped on fast path).
- **Measured:** Existing doc `AI_RUBRIC_ENGINE_VS_FAST_PIPELINE.md` (2026-08-13): legacy case engine `v7.0`, **562.9 s** total, discovery **314.6 s**.
- **Status:** LEGACY / rollback path. Accuracy table still has a tiny n=4 acceptance sample.

### Phase — ECI v8

- **Problem:** New enterprise clinical intelligence pipeline.
- **Implementation:** `Services/AudioCaseIntelligence/ECI/V8/*`
- **Config:** `EnableEciV8Engine` default **false** (not set true in appsettings).
- **Status:** Implemented, **not active**.

### Phase — Stage C Fast Clinical Retrieval (`fast-c`)

- **Problem:** 9–20 minute cases; V7+Enterprise+EnsureAll dominated post-Whisper time.
- **Implementation:** `FastClinicalRetrievalOrchestrator` — skip V3/V7/Enterprise; parallel V1 + Keyword FTS; no semantic-cache wait.
- **Measured (case_5, 2026-08-13):** total **151.7 s**; Whisper **139.2 s**; discovery **1.9 s**; LLM calls **1**; final **8** DB-backed rubrics.
- **Status:** Superseded by later fast-* stamps; same orchestrator.

### Phase — Stage D embedding on fast path (`fast-d` / `fast-e`)

- **Problem:** Fast-c had 0 embedding calls; recall risk.
- **Implementation:** Parallel embedding channel with `FastPipelineEmbeddingTimeoutSeconds` (8s); alias; catalog.
- **Telemetry:** `AI_RUBRIC_ENGINE_PERFORMANCE_BENCHMARK.md` lists FastClinicalRetrieval `fast-d` 3039 ms, `fast-e` 2673 ms (n=1 each).
- **Status:** Intermediate stamps.

### Phase — Stage F ranking + accuracy pack (`fast-f`) — CURRENT

- **Problem:** Need canonical score, MMR diversity, hallucination/gender/hierarchy gates, doctor-learning soft boost, multi-query blocks.
- **Implementation:** `FastClinicalRanking`, `FastClinicalEvidenceGate`, `FastClinicalSymptomBlockBuilder`, query embedding cache.
- **Config:** `FastPipelineEngineVersion: "fast-f"`, `FastPipelineMaxFinalRubrics: 12`, `FastPipelineMmrLambda: 0.80`, `FastPipelineMinCanonicalScore: 0.45`.
- **Accuracy:** `AI_RUBRIC_ENGINE_ACCURACY_BENCHMARK.md` — **no doctor feedback rows yet** for fast-* engines.
- **Status:** CURRENT.

---

## Timeline template (as requested)

```text
V1 hotspot search
↓ Problem: low synonym recall
↓ V2 hybrid + embeddings + approval
↓ Files: RubricIntelligenceOrchestrator, HybridRetrievalEngine
↓ DB: AudioCaseIntelligenceV2 scripts, RubricEmbeddings
↓ AI: extra GPT concept engines
↓ Performance: slower
↓ Status: LEGACY discovery / ACTIVE flags

V7 repertory intelligence
↓ Problem: accuracy + modular search
↓ Implementation: RepertoryIntelligence/*
↓ Performance impact: ~5 min discovery (measured 314 s)
↓ Status: LEGACY (skipped when fast path on)

Stage C–F fast pipeline
↓ Problem: 9–20 min wall clock
↓ Implementation: FastClinicalRetrievalOrchestrator
↓ DB: none required beyond existing FTS + embeddings
↓ AI: typically 1 GPT extraction (+ Whisper)
↓ Performance: discovery ~2–3 s; Whisper still ~2 min
↓ Accuracy: unmeasured at fleet scale
↓ Status: CURRENT (fast-f)
```

---

## Related existing docs (may lag source)

| File | Date / note | Discrepancy vs source |
| ---- | ----------- | --------------------- |
| `AI_RUBRIC_ENGINE_VS_FAST_PIPELINE.md` | 2026-08-13, engine `fast-c` | Current stamp is `fast-f` |
| `AI_RUBRIC_ENGINE_FAST_PIPELINE_ARCHITECTURE.md` | describes `fast-f` | Aligns with current orchestrator |
| `AI_RUBRIC_ENGINE_SYSTEM_DOCUMENTATION.md` (repo root) | older full-engine writeup | Do not treat as current hot path |
| `AI_RUBRIC_ENGINE_ACCURACY_BENCHMARK.md` | tiny N; no fast-* feedback | Still accurate as “unproven” |

---

## Abandoned / duplicate implementations

| Item | Location | Still referenced? | Safe to delete? |
| ---- | -------- | ----------------- | --------------- |
| V6 engine | `AudioCaseIntelligence/V6` | DI registered; flag off | No — rollback / tests |
| ECI v8 | `AudioCaseIntelligence/ECI/V8` | DI registered; flag off | No |
| V3/V7 orchestrators | `V3/Orchestration`, `RepertoryIntelligence` | Rollback path | No |
| Legacy `RubricEmbeddings` table | `005_Create_RubricEmbeddings.sql` | `KeepLegacyRubricEmbeddingsActive: true` | No |
| `NIGA_Latest_Code_API` (`NIGA.Centrum` netcoreapp2.2) | sibling repo | Classic SubSection FTS/CRUD only; no AI | Keep as admin API | N/A |



---

# PART 8 — PERFORMANCE AND ACCURACY (DETAILED)

**Do not mix this with the current-implementation sections of the complete doc.**  
Recommendations are at the end.

---

## Measured timings (existing repo evidence)

Source: `docs/AI_RUBRIC_ENGINE_VS_FAST_PIPELINE.md` (2026-08-13) and `docs/AI_RUBRIC_ENGINE_PERFORMANCE_BENCHMARK.md`.

These are **historical session measurements**, not live profiling from this audit.

| Stage | Legacy V7 case | Fast-c case_5 | Notes |
| ----- | -------------- | ------------- | ----- |
| SemanticCacheWait | 120.0 s (timeout) | 0 s | Fast path skips wait |
| Whisper | 116.5 s | 139.2 s | Dominates wall clock |
| GptExtraction | 11.6 s | 10.5 s | 1 GPT call |
| DualLanguageWhisper | — | 3 ms | English session; no extra Whisper |
| Match / discovery | 314.6 s | 1.9 s | V7+Enterprise removed |
| FastClinicalRetrieval | — | 1.5 s | v1=20, kw=24, concepts 8→12 |
| Total | **562.9 s (~9.4 min)** | **151.7 s (~2.5 min)** | |

SQL 730-C averages (tiny N≈4, mixed engines):

| Stage | Avg | Min | Max |
| ----- | --- | --- | --- |
| Whisper | 115 s | 97 s | 139 s |
| GptExtraction | 11 s | 10 s | 12 s |
| FastClinicalRetrieval | 1.5–3.0 s | 1.5 s | 3.0 s |
| ProcessSessionTotal | 207 s | 111 s | 443 s |
| PipelineBaselineSummary | 237 s | 111 s | **563 s** |

CONFIRMED from code (not from a new run):

- Frontend auto-poll budget ≈ **8 minutes** (`MAX_POLL_ATTEMPTS = 192` × 2500 ms).
- Backend job timeout **20 minutes** (`AudioCaseTaking:MaxProcessingMinutes`).
- OpenAI HttpClient timeout **10 minutes**.
- Desired product target **2–3 minutes** is **not guaranteed**. Whisper alone was ~2.3 minutes on the measured fast-c case.

UNCERTAIN: current production P50/P90 for `fast-f`. Existing 730-D NTILE query returned NULL (N too small). `fast-f` was “not in export yet” in the performance doc.

---

## Current-path stage analysis

| Stage | Sequential / parallel | API calls | DB | Bottleneck? |
| ----- | --------------------- | --------- | -- | ----------- |
| Upload + disk write | Sequential | 1 HTTP | 1 insert session + consent + events | Small |
| Queue wait | Sequential, single worker | 0 | 0 | **Yes if jobs pile up** (one reader) |
| Semantic cache wait | Skipped on fast path (`FastPipelineSemanticCacheMaxWaitSeconds: 0`) | 0 | 0 | Was 120 s; now 0 |
| Whisper `audio/translations` | Sequential | 1 OpenAI | 1 AI log | **Primary bottleneck** |
| Dual-language Whisper | Conditional | 0 or 1 | log | Extra Whisper if non-English + sensation-bearing |
| GPT extraction | Sequential | 1 chat/completions, max_tokens 8192 | persist JSON | Secondary (~10 s) |
| Fast retrieval | **Parallel** V1 + Keyword + Alias + Embedding + Catalog | 0–1 embedding batch; V1 may add GPT rubric suggestion | many SubSection queries | Usually 2–3 s |
| Clinical validation | Sequential in-process | 0 | 0 | Small |
| Finalize + SaveChanges | Sequential | 0 | match logs, concepts, session | Small |

---

## Duplicate / wasted work on the current path

CONFIRMED:

1. **V1 AI rubric suggestion can still fire** inside `MatchRubricsV1Async` when `EnableAiSuggestedRubrics: true` and fewer than 20 DB hits. Fast path then **drops** `SubSectionId <= 0` before finalize, so those GPT names are often discarded.
2. **Dual-language context is built** (`DualLanguageForSensationSegments: true`) even though `MatchRubricsFastClinicalAsync` **does not receive** `dualLanguage`. Extra Whisper only if language is not English.
3. **V1 and Keyword both hit** `SearchSubSectionsByHotspotAsync` (FTS/Contains) for overlapping terms.
4. **Enterprise validation still runs** after fast retrieval (`EnableEnterpriseClinicalValidation: true`) — extra in-process scoring, not extra GPT.

NOT IMPLEMENTED on fast path: V3 M0–M5 GPT chain, V7 extraction GPT, EnsureAllConcepts.

---

## Caching (actual)

| Cache | Key | TTL | Used on audio path? |
| ----- | --- | --- | ------------------- |
| `RubricEmbeddingMemoryCache` | process memory | until refresh | Yes (embedding channel) |
| `FastClinicalQueryEmbeddingCache` | query text + model | process lifetime | Yes if `FastPipelineEnableQueryEmbeddingCache` |
| `AiEnterpriseRubricEmbeddingMemoryCache` / concept cache | warmup | 30 min config | Fast path proceeds without waiting |
| Redis | — | — | **Not found** |
| Transcript cache | — | — | **Not found** |
| GPT result cache | — | — | **Not found** |

---

## Parallelization (actual vs opportunity)

**Actual (fast-f):** V1, keyword, alias, embedding, catalog run via `Task.WhenAll`.

**Still sequential:** Whisper then GPT extraction then retrieval. Symptoms are not each sent to GPT; one extraction call covers the transcript.

**Opportunity (recommendation only):** stream Whisper; skip V1 AI suggestion on fast path; skip dual-language when fast path is on; consider a second worker (queue is single-reader).

---

## Accuracy — measured vs targets

Targets from the audit brief are **goals**, not claims.

| Target | Current measured value | Gap | How to measure | Potential solution |
| ------ | ---------------------- | --- | -------------- | ------------------ |
| Overall rubric accuracy 90–100% | **Not automatically measured** | Unknown | Golden set + doctor accept | Keep DB-backed-only finals |
| Doctor acceptance ~95% | v2 **0.50** (n=14); v7 **1.00** (n=4); fast-* **no rows** | Unproven | `AudioCaseRubricFeedback` + SQL 730 | Collect fast-f feedback |
| Primary Top-5 ~95% | TBD | Unknown | `RubricBenchmarkMetrics.ComputeAtK` | Ranking/MMR tuning |
| False positive &lt;5% | TBD | Unknown | Rejects / suggested | Hallucination + gender + hitchhiker gates already exist |
| 10–12 rubrics when clinically available | Fast-c returned **8**; MMR stops on score cliff after 5 | May return fewer than 12 **by design** | Count `SuggestedRubricsJson` | Do not pad; improve recall |

CONFIRMED: `SelectWithMmr` **never fabricates** to fill `targetCount`. If 7 pass the score floor, 7 are returned.

NOT IMPLEMENTED: automated Precision/Recall dashboard that is populated in production without running SQL 730.

---

## Recommended Performance Improvements

*(Separate from current behavior.)*

### P0 — Whisper dominates wall clock

- **Problem:** 97–139 s of a ~2.5 min case is transcription.
- **Current:** Full-file `audio/translations`, HttpClient 10 min timeout.
- **Proposed:** Shorter recordings; compress/convert client-side; consider chunked transcription; show “Transcribing…” (UI already has stage labels).
- **Expected:** Largest cut toward 2–3 min total.
- **Risk:** Accuracy of translation on long mixed-language audio.
- **Complexity:** Medium–high.

### P0 — Disable wasted GPT on V1 during fast path

- **Problem:** `SuggestAiRubricsAsync` can run inside V1; fast path drops non-DB ids.
- **Proposed:** Skip `EnableAiSuggestedRubrics` when fast pipeline is on.
- **Expected:** Avoid 5–20 s extra GPT + hallucination risk.
- **Risk:** Low if DB recall is adequate.
- **Complexity:** Low.

### P1 — Skip dual-language work on fast path

- **Problem:** Dual-language is built then ignored.
- **Proposed:** Gate `TryBuildDualLanguageContextAsync` on `!EnableFastClinicalRetrievalPipeline`.
- **Expected:** Avoid extra Whisper on non-English cases.
- **Risk:** Sensation nuance for Marathi/Hindi on fast path.
- **Complexity:** Low.

### P1 — Multi-worker queue

- **Problem:** Unbounded channel, `SingleReader = true`.
- **Proposed:** Bounded parallel workers with session gate (gate already exists).
- **Expected:** Removes head-of-line blocking.
- **Risk:** OpenAI rate limits; DB load.
- **Complexity:** Medium.

### P2 — Prompt / JSON size

- **Problem:** Extraction `max_tokens = 8192`; conversation array can be large.
- **Proposed:** Cap conversation turns; keep “do not echo transcript” (already in prompt).
- **Expected:** Lower truncation risk and latency.
- **Risk:** Missing exchanges.
- **Complexity:** Low.

### P3 — Persistent job queue

- **Problem:** In-memory queue dies on restart (mitigated by requeue of Uploaded).
- **Proposed:** SQL/Hangfire jobs.
- **Expected:** Survive recycles mid-Whisper.
- **Risk:** Duplicate processing (session gate helps).
- **Complexity:** High.

---

## Recommended Accuracy Improvements

### P0 — Instrument fast-f acceptance

- Run SQL `730_Golden_Set_Benchmark_Queries.sql` after doctors Accept/Reject.
- Fill `AI_RUBRIC_GOLDEN_SET.md` with SessionIds only (no PHI).

### P1 — Recall without padding

- Fast-c had 8 rubrics vs 10–12 goal. Tune multi-query / catalog / embedding timeout rather than lowering `FastPipelineMinCanonicalScore` blindly.
- Risk: more false positives.

### P1 — Extraction completeness

- Extraction prompt already lists must-extract items (salt, sleep-talk, thirst, etc.). Misses are likely Whisper or prompt coverage, not ranking.

### P2 — Keep hallucination hard gate

- `FastPipelineMinEvidenceScore = 0.15` + `SubSectionId > 0` is the main anti-hallucination design. Do not re-enable unmapped AI names on the default UI path.



---

# End of combined document

Upload **this one file only** to Claude / ChatGPT / other AI tools.

Location on disk:

`/Users/OctazenWork/NIGA Project/NigaHomeopathy-UI/AUDIO_CASE_AI_RUBRIC_COMPLETE_SINGLE_DOCUMENT.md`

Suggested AI instruction:

> You are working on HomeoCentrum Audio Case Taking. This document is the source of truth for the **currently implemented** system (engine `fast-f`). Do not invent APIs, tables, prompts, or scores. Distinguish CURRENT vs LEGACY vs NOT IMPLEMENTED. Never request or repeat secrets.

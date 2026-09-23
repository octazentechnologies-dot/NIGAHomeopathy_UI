# HomeoCentrum — Audio Case Taking
## Complete Full Report (Frontend · Backend · Database · All Versions · All Functionality)

> **Superseded for current engine behavior (2026-08-16):**  
> Upload this one combined file instead: [`../AUDIO_CASE_AI_RUBRIC_COMPLETE_SINGLE_DOCUMENT.md`](../AUDIO_CASE_AI_RUBRIC_COMPLETE_SINGLE_DOCUMENT.md)  
> This 31 Jul 2026 pack describes V1–V8. Production discovery is now **`fast-f`**. Prefer the combined audit when they disagree.

**Report version:** 2.0 (Claude AI complete pack)  
**Compiled:** 31 Jul 2026  
**Projects:** NigaHomeopathy-UI + NigaHomeopathy-API (`New_API`)  
**Production API:** `https://api1.homeocentrum.com/api`  
**Database:** `HomeoCentrum_Production` (SQL Server)  
**Consent version:** `v1.0-2026-06-23`

> **How to use this report (especially for Claude / other AI)**  
> Upload **this file first**. It is the single consolidated report covering Frontend, Backend, Database, versions **V1 → V8**, exact DTOs, GPT prompts, SQL DDL, appsettings, Redux state, acceptance criteria, and risks.  
> For extra line-level architecture depth, also upload the companion docs in [§0](#0-companion-documents--do-not-skip).  
> **Do not invent** endpoints, tables, or flags not listed here. Prefer the production `appsettings` values in §23 over option-class defaults when they differ.

---

## 0. Companion documents (do not skip)

| Document | What it covers | Lines (approx.) |
|----------|----------------|-----------------|
| [AUDIO_CASE_TAKING_FEATURE_SPEC.md](./AUDIO_CASE_TAKING_FEATURE_SPEC.md) | Original proposed feature spec (UI/UX, phased rollout, acceptance criteria, Cursor prompt) | ~1485 |
| [AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md](./AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md) | **V1 complete** tech/functional doc — journey, FE, BE, REST, SQL, AI pipeline, testing | ~1065 |
| [AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md](./AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md) | V2 enterprise architecture — 10 phases to 95%+ accuracy | ~1316 |
| [AUDIO_CASE_TAKING_AI_ENGINE_V2_APPROVAL_PACK.md](./AUDIO_CASE_TAKING_AI_ENGINE_V2_APPROVAL_PACK.md) | **APPROVED** locked V2 decisions, DB, APIs, UI, roadmap, sign-off | ~1011 |
| [AUDIO_CASE_TAKING_AI_ENGINE_V3_ARCHITECTURE.md](./AUDIO_CASE_TAKING_AI_ENGINE_V3_ARCHITECTURE.md) | V3 concept-graph-first architecture | ~887 |
| API: `Database/Scripts/AudioCaseIntelligenceV2/000_MASTER_SQL_DEPLOYMENT_GUIDE.md` | Manual SSMS deploy order Phases 0–7+ | — |
| API: `docs/AIV4_EMBEDDING_INFRASTRUCTURE_PHASE1.md` | V4 embedding infrastructure schema/services | — |

### Branch / code locations

| Layer | Repo | Branch with full feature | Current note |
|-------|------|--------------------------|--------------|
| Frontend | `NigaHomeopathy-UI` | **`AudioCasetaking_29-6-26`** | Current HEAD `Gourav_CodeMerge_9-6-26` has **docs only** (no `src/` Audio Case UI yet) |
| Backend | `NigaHomeopathy-API` | **`GouravDev_29-6-26`** | Full stack through **ECI V8** implemented |
| Other | `minimal`, `NIGA_Latest_Code_API` | — | **No** Audio Case Taking code |

### Git milestones

| Repo | Commit | Message |
|------|--------|---------|
| API | `83e49b0` | Audio case taking changes |
| API | `98a3196` | Audio v8 |
| UI | `205238b` | audio case taking function |
| UI | `c1833f5` | audio case v8 |

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Business goals & roles](#2-business-goals--roles)
3. [End-to-end user journey](#3-end-to-end-user-journey)
4. [System architecture](#4-system-architecture)
5. [Version history (V1 → V8)](#5-version-history-v1--v8)
6. [Frontend (complete)](#6-frontend-complete)
7. [Backend (complete)](#7-backend-complete)
8. [REST API reference (complete)](#8-rest-api-reference-complete)
9. [Database (complete)](#9-database-complete)
10. [AI processing pipeline](#10-ai-processing-pipeline)
11. [Rubric matching & intelligence](#11-rubric-matching--intelligence)
12. [Repertorization integration](#12-repertorization-integration)
13. [Audit, consent, security](#13-audit-consent-security)
14. [Background jobs & retention](#14-background-jobs--retention)
15. [Configuration](#15-configuration)
16. [Admin & benchmarking](#16-admin--benchmarking)
17. [Deployment checklist](#17-deployment-checklist)
18. [Testing guide](#18-testing-guide)
19. [Known limitations & troubleshooting](#19-known-limitations--troubleshooting)
20. [Complete file index](#20-complete-file-index)
21. [Feature-spec extras (proposed UX / phases)](#21-feature-spec-extras-proposed-ux--phases)
22. [Appendices A–F](#22-appendices)
23. [Claude pack — exact DTOs](#23-claude-pack--exact-dtos)
24. [Claude pack — exact GPT prompts](#24-claude-pack--exact-gpt-prompts)
25. [Claude pack — full V1 SQL DDL](#25-claude-pack--full-v1-sql-ddl)
26. [Claude pack — production appsettings](#26-claude-pack--production-appsettings-redacted)
27. [Claude pack — FE constants, Redux, API wrappers](#27-claude-pack--fe-constants-redux-api-wrappers)
28. [Cost, providers, intensity, security](#28-cost-providers-intensity-security)
29. [Phased rollout, experts, risks, acceptance](#29-phased-rollout-experts-risks-acceptance)
30. [What to log / not log + unit tests](#30-what-to-log--not-log--unit-tests)
31. [Instructions for Claude when answering](#31-instructions-for-claude-when-answering)

---

## 1. Executive summary

Audio Case Taking lets a **doctor** on HomeoCentrum:

1. Choose **Manual** or **Audio** case taking when opening a patient from the Doctor Dashboard.
2. **Record live** (mic: Record / Pause / Resume / Stop) **or upload** an existing audio file (mp3, wav, m4a, webm, ogg, aac; max **50 MB**; config max duration **45 min**).
3. Capture patient **consent** before analyze (`ConsentTextVersion: v1.0-2026-06-23`).
4. Upload audio to API → background AI pipeline:
   - **Whisper** English translation/transcription
   - **GPT-4o** conversation Q&A, clinical summary, symptoms
   - **Rubric intelligence** (V1 LIKE/Jaccard and/or V2–V8 engines) → up to **20** suggested rubrics
5. Review **transcript** (editable + re-analyze), **conversation chat**, **summary**, **concepts/explainability**, **rubrics** (manual approval for AI/inference per V2 lock).
6. Apply rubrics to Patient Board **Repertorization** (existing ≤20 limit).
7. **Append summary** to history note; **download** recording; **restore latest** session on reopen.

All steps are **audit-logged** in SQL Server. Audio blobs are purged after retention (default **30 days**); transcripts/JSON/audit remain.

---

## 2. Business goals & roles

| Role | Access |
|------|--------|
| Doctor | Upload, analyze, rubrics, repertorization, history note, feedback |
| Patient | No direct access; consent captured by doctor |
| Admin | Metaphor/alias CRUD, benchmark dashboard, SQL deploy, OpenAI key on API server |

**Clinical goal:** Cut manual case-entry time while keeping the doctor in control of rubric selection.  
**Accuracy goal (V2+):** ≥95% doctor acceptance AND ≥95% primary rubric in top-5 (stretch 98%).  
**Repertorization limit:** Max **20 rubrics** per Patient Board session.

---

## 3. End-to-end user journey

```
Dashboard patient click
  → CaseTakingModeModal (Manual | Audio)
  → Patient Board ?caseTakingMode=audio
  → AudioCasePanel: Consent + Record|Upload + Language + Waveform
  → Download (optional) → Analyze conversation (confirm)
  → Upload multipart → poll status every ~2.5s
  → Results: Processing | Transcript editor | Conversation | Summary | Concepts | Rubrics (+ approval/explainability)
  → Auto/manual apply to Repertorize (≤20; V2: manual approval for AI/inference)
  → Append summary to history note | Download audio | Resume via GET /latest
```

### Detailed steps

1. **Entry:** Doctor Dashboard → Today / All patients → click patient name.
2. **Modal:** “How would you like to take this case?” — Manual | Audio-based.
3. **Audio path URL pattern:**
   ```
   /patient-board?patientId={id}&caseId={id}&patientAppId={id}&patientName={name}&caseTakingMode=audio
   ```
4. **Input:** Record live **or** upload file; consent required; optional language (Auto / en / hi / mr / gu / ta / te / kn / bn).
5. **Processing steps:** Uploading → Transcribing → Extracting → (ConceptGraph) → MatchingRubrics → Completed | Failed.
6. **Results:** English transcript, doctor/patient chat with timestamps, summary (chief complaint, HPI, mentals, generals, modalities, particulars, red flags), suggested rubrics (DB + AI tagged), concepts/causation timeline, explainability.
7. **Continue:** Existing Repertory / Questions / Prescription tabs.

---

## 4. System architecture

```
NigaHomeopathy-UI (React)
  BestSellingProducts → CaseTakingModeModal → PatientBoard
  AudioCasePanel → Redux audioCaseTaking → realbackend_helper.js
           │ HTTPS + JWT Bearer
           ▼
NigaHomeopathy-API (ASP.NET Core)
  AudioCaseTakingController
  AudioCaseIntelligenceController (+ V3 + Admin)
  AudioCaseTakingService → queue → BackgroundService
  AudioCaseAiProcessor (Whisper + GPT-4o)
  RubricIntelligence stack (V2 orchestrator / V3 graph / V6 / V7 / ECI V8)
           │                    │
           ▼                    ▼
  SQL Server (HomeoCentrum_Production)    OpenAI (whisper-1, gpt-4o, text-embedding-3-small)
  SubSectionMaster (READ for rubrics)     Optional Azure OpenAI (registered; PreferAzureOverOpenAi)
  AudioCase* + Intelligence + V4 embed tables
           │
           ▼
  Local disk: Data/AudioCaseTaking/{sessionId}.ext
```

**Sync:** upload, status, result, download, re-analyze request, doctor-action, latest, concepts, feedback.  
**Async:** AI pipeline via in-memory `AudioCaseTakingQueue` + `AudioCaseTakingBackgroundService`.

---

## 5. Version history (V1 → V8)

| Version | Name | Purpose | Status in code (API `GouravDev_29-6-26`) | Default flags (appsettings) |
|---------|------|---------|------------------------------------------|------------------------------|
| **V1** | Audio Case Taking core | Upload, Whisper EN, GPT extract, LIKE+Jaccard, AI fallback rubrics, 7 audit tables | **Live** | Core always on |
| **V2** | Rubric Intelligence | Case understanding, metaphors, causation, aliases, hybrid embeddings, weights, inference, explainability, benchmarks | **Implemented** | `EnableV2: true`, all doctors |
| **V2.1** | Clinical validation | Gender/domain/quality gates; reduce false positives | **Implemented** | `EnableClinicalValidationV21: true` |
| **V3** | Concept Graph First | Patient Meaning → Clinical → Homeopathic → Discovery → Evidence chain | **Implemented** | `EnableV3ConceptGraph: true`, shadow off |
| **V3.5** | Recall / fast pipeline | Multi-symptom recall, tiers, coverage, deferred graph writes | **Implemented** | `EnableV35RecallEngine: true`, `EnableV35FastPipeline: true` |
| **V4** | Embedding infrastructure | Versioned `AIRubricEmbedding` / jobs / queue / audit (enterprise builder) | **Implemented** | `AiEmbeddingInfrastructure.Enabled: true` |
| **V6** | Clinical reasoning (SQL authoritative) | SQL-first repertory search; AI concepts not auto-repertorized | **Implemented, flag OFF** | `EnableV6ClinicalReasoningEngine: false` |
| **V7** | Repertory Intelligence | Modular search, vocabulary, ranking, completion, GPT structured extraction (language only) | **Implemented, ON** | `EnableV7RepertoryIntelligenceEngine: true` |
| **ECI V8** | Enterprise Clinical Intelligence | Conversation parser, multi-module DB search (exact/synonym/ontology/FTS/embedding/hierarchy/bootstrap/historical), ranker, validation, benchmarks | **Implemented** | `EnableEciV8Engine` option present (enable explicitly) |

### Accuracy ceilings (documented)

| Approach | Estimated ceiling |
|----------|-------------------|
| V1 LIKE + Jaccard | ~65–70% |
| V2 hybrid + inference | ~75–85% |
| V2 + V2.1 validation | ~85–90% |
| V3 concept graph target | ≥95% |

### V2 locked stakeholder decisions (APPROVED)

1. **NO** auto-apply for inference/AI rubrics — manual doctor approval only (future optional auto after ≥95% + flag).
2. Embeddings stored as **JSON in SQL** (`RubricEmbeddings.EmbeddingJson`) — no native vector type in V2.
3. Repertory Phase 9: Kent+Complete first → Boericke+Phatak → clinical/remedy relationships.
4. Rollout: **all doctors** + feature flag + monitoring + rollback.
5. Gold cases: **250+** internal (50 each: epilepsy, psychological, GI, pediatric, chronic).
6. **Full admin UI** for metaphors/aliases.
7. Dual metrics mandatory: ≥95% acceptance AND ≥95% primary in top-5; FP ≤5%; confidence calibration ≥90%.
8. Accuracy target 95%+ (stretch 98%).
9. DB deploy **manual SSMS only** + rollback scripts.
10. **Zero breaking changes** to existing AudioCaseTaking APIs / V1 pipeline.

### V2 phases (architecture)

1. Case Understanding Engine  
2. Metaphor Interpretation Engine  
3. Causation Engine  
4. Rubric Alias Database  
5. Hybrid Embedding Search  
6. Homeopathic Weight Engine  
7. Clinical Inference Rubrics  
8. Doctor Explainability (UI)  
9. Advanced Repertory Matching  
10. Accuracy Benchmarking  

### V3 paradigm shift

```
STOP:  Audio → Transcript → GPT → Rubric Search → Result
BUILD: Audio → Transcript → Patient Meaning Graph → Clinical Concept Graph
       → Homeopathic Concept Graph → Rubric Discovery → Validation
       → Evidence Chain → Doctor Review → Learning Engine
```

**Rubrics are the final outcome, not the first interpretation.** Master repertory tables remain **READ ONLY**.

### V3 phases

1. PatientMeaningGraphEngine  
2. MetaphorUnderstandingEngine (AI; not admin-dict only)  
3. ClinicalConceptEngine  
4. HomeopathicConceptEngine  
5. RubricDiscoveryEngine (concept-driven)  
6. RubricValidationEngine  
7. EvidenceChainEngine (mandatory)  
8. HomeopathicWeightEngine (enhanced)  
9. SelfLearningEngine  
10. Multi-Language AI  

### ECI V8 modules (implemented)

- `EciConversationParser` — parse doctor/patient conversation  
- `EciStructuredSymptomExtractor` — structured symptoms  
- `EciDatabaseIntelligenceEngine` with modules: Exact SQL, Synonym, Ontology, FullText, Embedding, Hierarchy, Bootstrap mapping, Historical mapping, CandidateMerger, EciRubricRanker, EvidenceVerifier, ExplainabilityGenerator  
- `EciClinicalValidator`  
- Benchmark: runner, metrics (precision/recall/F1/Top-K/MRR/NDCG), calibration, report generator  
- Targets: 10–20 DB rubrics; latency budget ~5s; ranking weights configurable  

---

## 6. Frontend (complete)

**Source of truth:** UI branch `AudioCasetaking_29-6-26`  
**API base:** `src/config.js` → `API_URL_NIGAHOMEOPATHY: "https://api1.homeocentrum.com/api"`

### 6.1 Components (`src/Components/CaseTaking/` — capital C)

| File | Purpose |
|------|---------|
| `CaseTakingModeModal.js` | Manual vs Audio choice modal |
| `AudioCasePanel.js` | Main panel: tabs, consent, language, analyze, wires all sub-panels (~V8 updates) |
| `AudioCaseProcessingStatus.js` | Upload/processing progress |
| `AudioCaseTranscriptEditor.js` | Editable English transcript + Re-analyze |
| `AudioCaseConversationPanel.js` | Doctor/patient Q&A with timestamps |
| `AudioCaseSummaryPanel.js` | Summary + append to history note |
| `AudioCaseRubricSuggestions.js` | DB + AI suggested rubrics; add / add all |
| `AudioCaseRubricApprovalBar.js` | Manual approval gate (V2+) |
| `AudioCaseRubricExplainabilityPanel.js` | Why-suggested / evidence UI |
| `AudioCaseConceptTimeline.js` | Clinical concepts / causation timeline |
| `AudioCaseConfidenceBadge.js` | Confidence display |

### 6.2 Hooks

| File | Purpose |
|------|---------|
| `useAudioRecorder.js` | `getUserMedia` + `MediaRecorder`: start/pause/resume/stop, blob, duration |
| `useAudioWaveform.js` | Live audio level bars while recording |

### 6.3 Helpers

| File | Purpose |
|------|---------|
| `audioCaseTakingHelper.js` | MIME/ext validation, 50MB max, `LiveRecording`/`FileUpload`, map rubrics → repertorization, summary→history text |
| `audioCaseDownloadHelper.js` | Local blob download naming |
| `audioCaseOfflineQueueHelper.js` | IndexedDB queue when upload fails (metadata; limited auto-retry) |
| `url_helper.js` | `AUDIO_CASE_TAKING_*` + `RUBRIC_INTELLIGENCE_*` path constants |
| `realbackend_helper.js` | Axios wrappers |
| `patientBoardSessionHelper.js` | Persist `audioCaseSessionId`, transcript, messages, summary, rubrics in board snapshot |

### 6.4 Redux (`src/slices/doctor/audioCaseTaking/`)

**State shape:**
```javascript
{
  sessionId, audioSource, selectedFileName, language,
  status, // idle | uploading | processing | completed | failed
  progressStep, progressPercent,
  transcript, messages, summary, suggestedRubrics,
  usedMockData, canDownloadFromServer, error,
  uploadLoading, pollLoading, reAnalyzeLoading, restoredFromServer
  // + V2+: concepts, approval, explainability fields as extended
}
```

| Thunk | Behavior |
|-------|----------|
| `uploadAndAnalyzeAudioCase` | Multipart upload → poll until complete |
| `pollAudioCaseAnalysis` | Status loop (`2500ms` × `192` ≈ **8 min**) |
| `reAnalyzeAudioCase` | POST edited transcript → poll again |
| `loadLatestAudioCaseSession` | Restore on Patient Board mount |
| `logAudioDoctorAction` | Audit accept rubrics / append summary |
| (+ feedback / concepts as wired on V8 branch) | Rubric feedback, concepts load |

### 6.5 Integration points

| File | Role |
|------|------|
| `BestSellingProducts.js` | Patient click → modal → `caseTakingMode=audio` |
| `PatientBoard.js` | Hosts `AudioCasePanel`; `onApplyRubric={handleIntensityChipClick}`; history note append; session snapshot |
| `LayoutMenuData.js` | Admin: Rubric Intelligence → Metaphors / Aliases / Benchmark |
| `Routes/allRoutes.js` | `admin/listrubricmetaphors`, `admin/listrubricaliases`, `admin/rubric-intelligence-benchmark` |

### 6.6 Admin UI pages

| Page | Purpose |
|------|---------|
| `ListRubricMetaphors.js` | Metaphor CRUD + approve/reject |
| `ListRubricAliases.js` | Alias CRUD |
| `ListRubricBenchmarkDashboard.js` | Benchmark summary/trends |

### 6.7 Frontend API constants

- `POST /AudioCaseTaking/upload`
- `GET /AudioCaseTaking/{id}/status`
- `GET /AudioCaseTaking/{id}/result`
- `GET /AudioCaseTaking/{id}/download`
- `POST /AudioCaseTaking/{id}/reanalyze`
- `POST /AudioCaseTaking/{id}/doctor-action`
- `GET /AudioCaseTaking/latest?patientId=&caseId=`
- `GET /AudioCaseTaking/{id}/concepts`
- `POST /AudioCaseTaking/{id}/rubrics/feedback`
- Intelligence: config, rollout, repertory status, benchmark summary/trends, feedback queue, admin metaphors/aliases

### 6.8 Auto-apply rubrics

When status becomes `completed` and rubrics exist, `AudioCasePanel` may auto-add up to 20 and log `RubricsAutoAppliedToRepertorization`.  
**V2 lock:** `RequireManualApprovalForAllAiRubrics: true` — AI/inference rubrics require explicit approve before repertorize; `AllowAutoApplyHighConfidence: false`.

### 6.9 Mock fallback

If API returns 404/501/5xx, UI may show demo mock data. Disable by deploying API + SQL; set `UseMockWhenNoApiKey: false`.

---

## 7. Backend (complete)

### 7.1 Controllers

| Controller | Route | Endpoints |
|------------|-------|-----------|
| `AudioCaseTakingController` | `api/AudioCaseTaking` `[Authorize]` | upload, status, result, reanalyze, doctor-action, latest, concepts, rubrics/feedback, download |
| `AudioCaseIntelligenceController` | `api/AudioCaseIntelligence` | health, config GET/PUT, rollout/status, repertory/status, embeddings status/reindex, benchmark summary/trends, V6/V7 benchmarks, feedback queue, learning summary |
| `AudioCaseIntelligenceV3Controller` | `api/AudioCaseIntelligence/v3` | graph/{sessionId}, meanings/{sessionId}, coverage/{sessionId}, health |
| `AudioCaseIntelligenceAdminController` | `api/AudioCaseIntelligence/admin` | metaphors/aliases CRUD + approve/reject |

Responses use `ThreeDBodyPartApiResponseHelper` wrapper.

### 7.2 Core services

| Component | Role |
|-----------|------|
| `AudioCaseTakingService` | Upload validation, store file, consent, enqueue, status/result/download, re-analyze, doctor actions, latest, purge hooks, pipeline orchestration |
| `AudioCaseAiProcessor` | Whisper translate/transcribe; GPT extract; AI suggested rubrics; Jaccard similarity |
| `AudioCaseTakingQueue` | In-memory `Channel<AudioCaseTakingJob>` |
| `AudioCaseTakingBackgroundService` | Worker: wait embedding cache ready → ProcessAudio / ReAnalyze |
| `AudioCaseRetentionBackgroundService` | Purge audio after retention days |
| `AudioCaseZombieSessionSweeperBackgroundService` | Fail stuck Processing/Uploaded sessions |
| `AudioCaseSessionProgressReporter` | Progress reporting |
| `AudioCaseIntelligenceRepository` | Intelligence persistence |
| `SubSectionRepository.SearchSubSectionsByHotspotAsync` | LIKE search on English `SubSectionName` |

### 7.3 AI processor methods

| Method | OpenAI | Purpose |
|--------|--------|---------|
| `TranslateAudioToEnglishAsync` | `POST /v1/audio/translations` | Non-English audio → English (`OutputEnglishOnly`) |
| `TranscribeAsync` | `POST /v1/audio/transcriptions` | When OutputEnglishOnly=false |
| `ExtractCaseDataAsync` | `POST /v1/chat/completions` gpt-4o | Conversation, summary, symptoms, englishTranscript |
| `SuggestAiRubricsAsync` | chat completions | AI rubrics not in DB |
| `ComputeTextSimilarity` | local Jaccard | Semantic score for V1 ranking |

### 7.4 Intelligence folders (`Niga-Domain/Services/AudioCaseIntelligence/`)

| Folder | Contents |
|--------|----------|
| `Engines/` | CaseUnderstanding, Metaphor, Causation, Concomitant, Modality, SymptomExtraction, Alias, EmbeddingSearch, HybridRetrieval, HomeopathicWeight/Reasoning, ClinicalInference/Reasoning, Confidence, Explainability, RepertoryTier |
| `Orchestration/` | `RubricIntelligenceOrchestrator` |
| `Merging/` | `RubricResultMerger` (V1+V2 merge) |
| `Validation/` (+ Enterprise) | ClinicalValidationEngine, enterprise validators |
| `Embeddings/` | Client, indexer, memory cache, repository, vector math |
| `Learning/` | Doctor feedback learning, scoring, signals, benchmark calculator |
| `Monitoring/` | Metrics + audit logger |
| `KnowledgeGraph/` | Enterprise KG engines + bridge |
| `Enterprise/` | Discovery, expansion, quality |
| `V3/` | Concept-graph engines + orchestration |
| `V6/` | SqlAuthoritativeRepertorySearch, V6ClinicalReasoning, V6Benchmark |
| `RepertoryIntelligence/` | V7: Extraction, Vocabulary, Synonyms, Ontology, Search, Ranking, Completion, Validation, Confidence, Explanation, Learning, Concepts, Normalization |
| `ECI/V8/` | Conversation, Extraction, Database modules, Validation, Benchmark |

### 7.5 DI registration

`ApplicationServiceExtensions.cs` registers options, HttpClient OpenAI, AI processor, taking service, queue, hosted services (processing, retention, zombie sweeper, embedding indexer), and full intelligence stack.

### 7.6 Entities / DbContext

Entities under `Niga-Domain/Master/AudioCase*.cs` (+ AI concept/embedding entities).  
DbSets + fluent mappings in `NIGACentrumContext.cs`.

---

## 8. REST API reference (complete)

**Base:** `https://api1.homeocentrum.com/api`  
**Auth:** `Authorization: Bearer {JWT}`

### 8.1 Audio case taking

#### POST `/AudioCaseTaking/upload` — `multipart/form-data`

| Field | Required | Description |
|-------|----------|-------------|
| audioFile | Yes | Audio recording |
| patientId | Yes | Patient ID |
| caseId | No | Case ID |
| patientAppId | No | Appointment ID |
| doctorUserId | No | Doctor user ID |
| audioSource | Yes | `LiveRecording` \| `FileUpload` |
| originalFileName | No | Display/download name |
| language | No | Source hint (en, hi, mr, …) |
| consentGiven | Yes | Must be true |

**Success:** `{ sessionId, status: "Uploaded" }`

#### GET `/AudioCaseTaking/{sessionId}/status`

Returns `sessionId`, `status` (`Uploaded`|`Processing`|`Completed`|`Failed`), `progressStep`, `percent`, `errorMessage`, timing.

#### GET `/AudioCaseTaking/{sessionId}/result`

When Completed: `transcript`, `messages[]`, `summary{}`, `suggestedRubrics[]` (scores, `isAiSuggested`, `matchSource`, V2+ explainability/evidence/validation), optional `rubricIntelligence` meta.

#### GET `/AudioCaseTaking/{sessionId}/download`

Audio file bytes (`Content-Disposition` attachment). Ownership checked.

#### POST `/AudioCaseTaking/{sessionId}/reanalyze`

Body: `{ "transcript": "..." }` — skips Whisper; re-runs GPT + rubric match; `ReAnalysisCount++`.

#### POST `/AudioCaseTaking/{sessionId}/doctor-action`

Body: `actionType`, `targetType`/`targetId`, `beforeJson`/`afterJson`, `notes`.  
Types include: `RubricAccepted`, `RubricsAcceptedBulk`, `RubricsAutoAppliedToRepertorization`, `SummaryAppendedToHistoryNote`, `AudioDownloaded`, plus mirrored session events.

#### GET `/AudioCaseTaking/latest?patientId=&caseId=`

Most recent session for doctor+patient (+ optional case); includes full result if completed.

#### GET `/AudioCaseTaking/{sessionId}/concepts`

Clinical concepts / causation for timeline UI.

#### POST `/AudioCaseTaking/{sessionId}/rubrics/feedback`

Doctor accept/reject/correct signals for learning engine.

### 8.2 Intelligence / admin / V3

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/AudioCaseIntelligence/health` | Health |
| GET/PUT | `/AudioCaseIntelligence/config` | Feature flags |
| GET | `/AudioCaseIntelligence/rollout/status` | Rollout |
| GET | `/AudioCaseIntelligence/repertory/status` | Repertory mapping |
| GET/POST | `/AudioCaseIntelligence/embeddings/status`, `.../reindex` | Embeddings |
| GET | `/AudioCaseIntelligence/benchmark/summary`, `.../trends` | Benchmarks |
| GET/POST | `/AudioCaseIntelligence/benchmark/v6/...` | V6 curated/evaluate |
| POST | `/AudioCaseIntelligence/benchmark/v7/accuracy` | V7 accuracy |
| GET | `/AudioCaseIntelligence/feedback/queue` | Feedback queue |
| GET | `/AudioCaseIntelligence/learning/summary` | Learning summary |
| CRUD | `/AudioCaseIntelligence/admin/metaphors`, `.../aliases` (+ approve/reject) | Admin |
| GET | `/AudioCaseIntelligence/v3/graph/{sessionId}` | Concept graph |
| GET | `/AudioCaseIntelligence/v3/meanings/{sessionId}` | Patient meanings |
| GET | `/AudioCaseIntelligence/v3/coverage/{sessionId}` | Coverage metrics |
| GET | `/AudioCaseIntelligence/v3/health` | V3 health |

---

## 9. Database (complete)

**Policy:** Manual SSMS only. No app auto-migrate. Take backup first.  
**V1 script:** `Database/Scripts/AudioCaseTaking_CreateTables.sql`  
**V2+ folder:** `Database/Scripts/AudioCaseIntelligenceV2/`  
**V4 folder:** `Database/Scripts/AIV4EmbeddingInfrastructure/`

### 9.1 V1 core tables (7)

| Table | Purpose |
|-------|---------|
| `AudioCaseSession` | Master session: audio meta, transcript, Conversation/Summary/Symptoms/Rubrics JSON, status, language, errors, purge, ReAnalysisCount |
| `AudioCaseSessionEventLog` | Lifecycle events |
| `AudioCaseAiRequestLog` | Every Whisper/GPT/embedding call (tokens, latency, payloads) |
| `AudioCaseConsentLog` | Consent version + IP/UA |
| `AudioCaseRubricMatchLog` | Per-candidate scores + rank + MatchSource |
| `AudioCaseDoctorActionLog` | Doctor actions |
| `AudioCaseRetentionLog` | Audio purge audit |

**AudioCaseSession key columns:** AudioCaseSessionId (GUID PK), PatientId, CaseId, DoctorUserId, PatientAppId, AudioSourceType, Status, CurrentStep, AudioFilePath/Name/Mime/Size/Sha256/Duration, TranscriptRaw, ConversationJson, SummaryJson, ExtractedSymptomsJson, SuggestedRubricsJson, DetectedLanguage, LanguageOverride, CorrelationId, ErrorCode/Message, ReAnalysisCount, CompletedAtUtc, AudioPurgedAtUtc, DeleteStatus, audit Entered*/Changed*.

**Indexes:** DoctorUserId+EnteredDate; PatientId+CaseId+EnteredDate.

**Rubric source (existing, READ):** `dbo.SubSectionMaster` (`SubSectionId`, `SubSectionName`, `DeleteStatus`) — English names only for V1 LIKE.

### 9.2 V2+ intelligence tables

| Table | Purpose |
|-------|---------|
| `AudioCaseClinicalConcept` | Structured concepts per session |
| `AudioCaseIntelligenceLog` | Pipeline stage audit |
| `AudioCaseCausationLink` | Causation edges |
| `AudioCaseClinicalInferenceLog` | Inference audit |
| `AudioCaseRubricFeedback` | Doctor feedback |
| `AudioCaseRubricBenchmark` | Benchmark rows |
| `RubricMetaphorDictionary` | Expression → clinical meaning (EN/HI/MR seeds) |
| `RubricAlias` | Phrase → SubSectionId |
| `RubricEmbeddings` | JSON embedding vectors (V2 legacy) |
| `HomeopathicWeightRule` | SRP/mental/general weights |
| `RepertorySource` | Kent, Complete, etc. |
| `RubricRepertoryMap` | Rubric ↔ repertory mapping |
| `RubricAdminAuditLog` | Admin CRUD audit |
| `GoldCaseLibrary` | Gold standard cases |
| `RubricGenderRule` / `RubricDomainRule` | V2.1 validation |
| `AudioCaseRubricValidationLog` / `PrimarySymptomLog` | Validation/primary logs |

**ALTERs:** `AudioCaseSession` V2 columns (`ClinicalConceptsJson`, `IntelligenceEngineVersion`, causation JSON); `AudioCaseRubricMatchLog` V2 explainability columns.

### 9.3 V3 concept graph tables

`AIPatientMeaning`, `AIMetaphorResolution`, `AIClinicalConcept`, `AIHomeopathicConcept`, `AIConceptGraph`, `AIRubricDiscovery`, `AIRubricEvidence`, `AIRubricValidation`, `AIRubricConfidence`, `AIDoctorFeedback`, `AICaseLearning`, `AIReasoningAudit`, `AIConceptMappingBootstrap`, plus V3.5: `AISymptomBlock`, `AIConceptCluster`, `AIConceptClusterMember`, `AICaseCoverageMetrics`, `AIMissingSymptomCandidate`.

### 9.4 Monitoring / enterprise KG

`AIMonitoringDailySnapshot`, `AIMonitoringAuditLog`, enterprise knowledge graph scripts (`712_Create_EnterpriseKnowledgeGraph.sql`).

### 9.5 V4 embedding infrastructure

| Table | Purpose |
|-------|---------|
| `AIEmbeddingVersion` | Model/version registry |
| `AIRubricEmbedding` | Versioned rubric vectors |
| `AIConceptEmbedding` | Versioned concept vectors |
| `AIEmbeddingJob` | Batch job metadata |
| `AIEmbeddingQueue` | Retryable queue with lock/backoff |
| `AIEmbeddingAudit` | Append-only audit |
| `AIEmbeddingStatistics` | Daily metrics |
| (+ sync state as deployed) | Incremental refresh |

Legacy `RubricEmbeddings` kept active via `KeepLegacyRubricEmbeddingsActive: true`.

### 9.6 Deploy order (summary)

1. Phase 0: `AudioCaseTaking_CreateTables.sql`  
2. Phases 1–6: `000_DEPLOY_ALL_Phases_0_to_6.sql` (or numbered 001–014 + seeds 501–507 + alters 101–103 + indexes 201)  
3. Phase 7 / V2.1: `601_Create_RubricValidationRules.sql`, `000_DEPLOY_Phase_7.sql`  
4. V3: `000_DEPLOY_V3_ALL.sql` / `701–707` (+ V3.5 `000_DEPLOY_V3_5_ALL.sql`)  
5. Monitoring/KG: `711`, `712`  
6. V4: `AIV4EmbeddingInfrastructure/801_*.sql` (+ enterprise deploy scripts)  
7. Rollback available: `401_Rollback_All_V2.sql`, `704_Rollback_AIConceptGraph.sql`

---

## 10. AI processing pipeline

### 10.1 New upload (full)

```
1. UPLOAD → save Data/AudioCaseTaking/ → AudioCaseSession(Uploaded) → ConsentLog → enqueue ProcessAudio
2. WORKER picks job (after embedding cache ready if configured)
3. TRANSLATION (OutputEnglishOnly=true) → Whisper /audio/translations → TranscriptRaw → AiRequestLog
4. GPT EXTRACTION → conversation[], symptoms[], summary{}, englishTranscript → JSON columns → AiRequestLog
5. RUBRIC INTELLIGENCE (flag chain):
   a) V1 LIKE + Jaccard on SubSectionMaster (always available as baseline/fallback)
   b) V2 orchestrator (understanding → metaphor → causation → alias/embedding hybrid → weight → inference → merge)
   c) V3 concept graph (if EnableV3ConceptGraph) with V3.5 recall/tiers/coverage
   d) V7 repertory intelligence (if enabled) — modular DB search + ranking/completion
   e) ECI V8 (if EnableEciV8Engine) — conversation parse → multi-module DB search → rank → validate
   f) V6 SQL-authoritative path (if EnableV6…)
   g) AI suggested rubrics (negative SubSectionId) when DB short and EnableAiSuggestedRubrics
6. Persist SuggestedRubricsJson + MatchLog + events → Status=Completed
```

**Processing steps (CurrentStep):** ProcessingStarted → TranscriptionStarted → TranscriptionCompleted → LlmExtractionStarted → LlmExtractionCompleted → (ConceptGraph…) → RubricMatchingStarted → Completed | Failed.

### 10.2 Re-analyze

Skip Whisper → update TranscriptRaw → GPT extract + rubric match → ReAnalysisCount++.

### 10.3 Why English-only pipeline

Marathi/Hindi transcript → Marathi symptoms → LIKE on English `SubSectionName` = **zero rubrics**.  
**Fix:** `OutputEnglishOnly=true` uses Whisper **translations** + English-only GPT prompts.

### 10.4 Models required

- `whisper-1` — translation/transcription  
- `gpt-4o` — extraction / AI rubrics / intelligence GPT calls  
- `text-embedding-3-small` — embeddings (V2/V4)

Azure OpenAI section exists; wire via `PreferAzureOverOpenAi` when configured. Direct OpenAI is the primary production path documented for V1.

---

## 11. Rubric matching & intelligence

### 11.1 V1 Database rubrics

- `matchSource`: Database | Combined  
- `isAiSuggested`: false  
- `SubSectionId`: positive from SubSectionMaster  
- Score: `keywordScore=0.75`; `semanticScore=Jaccard`; `finalScore = 0.6*keyword + 0.4*semantic` if `EnableSemanticRubricMatch`  
- Search terms: full phrase + words ≥3 chars + GPT `searchTerms[]`  
- Cap: top **20**

### 11.2 V1 AI suggested rubrics

- When DB low/zero → up to `MaxAiSuggestedRubrics` (config; currently up to 25 in appsettings)  
- `SubSectionId` negative (−1, −2, …); `isAiSuggested=true`; `matchSource=AiGenerated`  
- UI yellow “AI suggested” badge  
- **Not** in SubSectionMaster — no remedy counts / limited repertorization

### 11.3 V2 hybrid ranking (concept)

```
Hybrid = wE*Embedding + wA*Alias + wC*ClinicalMeaning + wK*KeywordLike
(appsettings HybridWeights: 0.40 / 0.30 / 0.20 / 0.10)
→ × HomeopathicWeight → inference candidates → explainability → merge with V1
```

### 11.4 V2.1 / enterprise validation

Gender/domain rules, min quality scores (tiered), evidence similarity floors, enterprise evidence chain, doctor learning boosts/penalties.

### 11.5 Manual approval (locked)

All AI/inference rubrics require doctor approval before Repertorize (`RequireManualApprovalForAllAiRubrics: true`).

---

## 12. Repertorization integration

| Step | Detail |
|------|--------|
| Map | `mapSuggestedRubricToRepertorization` → `{ rubricId, rubricName, intensity, matchScore, isAiSuggested, ... }` |
| Add | `PatientBoard.handleIntensityChipClick` — max 20; update intensity if exists |
| DB rubrics | Call `getRemedyCounts` |
| AI rubrics | `skipCommanUncommanRefresh: true` (no remedy API) |
| Auto-apply | Panel may auto-add on complete (gated by approval flags for V2+) |
| History note | Append summary via Draft.js helper + doctor-action log |

| Feature | DB Rubric | AI Suggested |
|---------|-----------|--------------|
| In Repertorize list | Yes | Yes |
| Common/Uncommon remedies | Yes | No |
| Remedy count API | Yes | No |
| Full scoring | Yes | Limited |

---

## 13. Audit, consent, security

### Consent

- UI checkbox required before Analyze  
- `AudioCaseConsentLog`: ConsentType `AudioRecordingClinical`, ConsentTextVersion from config, IP, User-Agent  

### Session events (examples)

`SessionCreated`, `AudioUploaded`, `ConsentRecorded`, `ProcessingStarted`, `TranscriptionCompleted`, `LlmExtractionCompleted`, `RubricMatchingCompleted`, `SessionCompleted`, `SessionFailed`, `TranscriptEdited`, `ReAnalysisRequested`, `AudioDownloaded`

### AI request log

Provider, ServiceType, ModelName, tokens, LatencyMs, IsSuccess, ErrorMessage, optional request/response JSON.

### Security / privacy

- JWT on all AudioCaseTaking endpoints  
- OpenAI key **server-only** (never in React)  
- Download ownership checks  
- PHI in SQL audit tables — follow retention/compliance  
- Spec Phase 2 mentioned Azure speaker diarization — **not** dedicated; GPT role inference used instead  

---

## 14. Background jobs & retention

| Job | Behavior |
|-----|----------|
| Processing queue | In-memory Channel; jobs `ProcessAudio`, `ReAnalyze`; **lost on restart** (session remains in DB; orphan requeue on startup if configured) |
| Retention | Interval `RetentionJobIntervalHours` (24); delete audio if `CompletedAtUtc` older than `AudioRetentionDays` (30); log `AudioBlobDeleted`; **keep** transcript/JSON/audit |
| Zombie sweeper | Fail stale Processing/Uploaded (`ZombieSessionStaleMinutes` 20, interval 5); `UploadedStaleMinutes` 15; `RequeueOrphanedUploadedOnStartup` |
| Embedding indexer | Batch reindex / V4 builder + auto-resume on startup |

---

## 15. Configuration

### AudioCaseTaking (current API appsettings highlights)

| Key | Value / meaning |
|-----|-----------------|
| StoragePath | `Data/AudioCaseTaking` |
| MaxFileSizeBytes | 52428800 (50 MB) |
| MaxAudioDurationMinutes | 45 |
| ConsentTextVersion | `v1.0-2026-06-23` |
| UseMockWhenNoApiKey | false |
| EnableSemanticRubricMatch | true |
| OutputEnglishOnly | true |
| EnableAiSuggestedRubrics | true |
| MaxAiSuggestedRubrics | 25 |
| AudioRetentionDays | 30 |
| RetentionJobIntervalHours | 24 |
| MaxProcessingMinutes | 20 |
| EnableZombieSessionRecovery | true |
| ZombieSessionStaleMinutes | 20 |
| SemanticCacheMaxWaitMinutes | 20 |

### RubricIntelligence (highlights)

EnableV2 (+ all doctors), RequireManualApprovalForAllAiRubrics, EnableEmbeddingSearch, HybridWeights, EnableClinicalInference, EnableDoctorFeedbackLearning, EnableRepertoryMapping, RollbackToV1Only=false, EnableClinicalValidationV21, EnableV3ConceptGraph, EnableV35RecallEngine/FastPipeline, enterprise discovery/expansion/KG/monitoring/learning, **EnableV6=false**, **EnableV7=true**, ECI V8 options (min/max rubrics, latency, ranking weights).

### OpenAI / Azure / AiEmbeddingInfrastructure

Whisper, gpt-4o, text-embedding-3-small; Azure optional; V4 embedding infra Enabled with versioning, queue retries, auto-resume builds, incremental refresh.

**Security:** Do not commit live API keys; use secrets/env on server.

---

## 16. Admin & benchmarking

- Admin UI: metaphors, aliases, benchmark dashboard  
- GoldCaseLibrary + benchmark APIs (summary, trends, V6 evaluate, V7 accuracy)  
- ECI V8 metrics: Precision, Recall, F1, Top1/3/5/10, MRR, NDCG, AvgRank, latency  
- Learning summary + feedback queue endpoints  
- Rollout status + config GET/PUT for feature flags / rollback to V1-only  

---

## 17. Deployment checklist

### Database

- [ ] Run V1 `AudioCaseTaking_CreateTables.sql`  
- [ ] Run V2 deploy (`000_DEPLOY_ALL_Phases_0_to_6.sql` + Phase 7 / validation)  
- [ ] Run V3 / V3.5 / monitoring / KG as required  
- [ ] Run V4 embedding infrastructure SQL  
- [ ] Verify tables exist; seed metaphors/aliases/repertory sources  

### API (`api1.homeocentrum.com`)

- [ ] Deploy `NigaHomeopathy-API` (`GouravDev_29-6-26` or merge)  
- [ ] Set `OpenAI:ApiKey`; `UseMockWhenNoApiKey: false`; `OutputEnglishOnly: true`  
- [ ] Confirm RubricIntelligence flags for desired engine (V7 on, V6 off, ECI V8 as decided)  
- [ ] Writable `Data/AudioCaseTaking/`  
- [ ] Restart IIS/app pool; Swagger shows AudioCaseTaking + Intelligence endpoints  

### UI

- [ ] Deploy UI from **`AudioCasetaking_29-6-26`** (or merge into current branch)  
- [ ] `config.js` → production API URL  
- [ ] Doctor login → dashboard → patient → Audio mode smoke test  

---

## 18. Testing guide

### Happy path

1. Login doctor → Dashboard → patient → **Audio case taking**  
2. Consent → upload or record 30–60s → Analyze  
3. Verify English transcript, conversation, summary, rubrics, Repertorize count  
4. Append to history note; edit transcript → Re-analyze  
5. (V2+) Review explainability; approve/reject rubrics; check concepts timeline  

### SQL checks

```sql
SELECT TOP 1 AudioCaseSessionId, Status, LEFT(TranscriptRaw, 300), EnteredDate
FROM dbo.AudioCaseSession ORDER BY EnteredDate DESC;

SELECT TOP 5 ServiceType, ModelName, IsSuccess, ErrorMessage, EnteredDate
FROM dbo.AudioCaseAiRequestLog ORDER BY EnteredDate DESC;

SELECT SymptomPhrase, SubSectionName, MatchSource, FinalScore, RankPosition
FROM dbo.AudioCaseRubricMatchLog
WHERE AudioCaseSessionId = 'YOUR-GUID' ORDER BY RankPosition;

SELECT ActionType, TargetType, Notes, EnteredDate
FROM dbo.AudioCaseDoctorActionLog WHERE AudioCaseSessionId = 'YOUR-GUID';
```

### Multilingual

Marathi/Hindi audio → expect **English** outputs with `OutputEnglishOnly=true`.

---

## 19. Known limitations & troubleshooting

### Limitations

1. Azure OpenAI may be registered but must be explicitly preferred/wired.  
2. V1 rubric search = English `SubSectionName` LIKE only (aliases/embeddings added in V2+).  
3. AI suggested rubrics have no remedy counts.  
4. In-memory queue — not multi-server safe without redesign.  
5. Audio on local disk — not Azure Blob (spec mentioned cloud blob as future).  
6. Frontend mock fallback if API unreachable.  
7. Max 20 repertorization rubrics.  
8. Max 50 MB; duration config 45 min (size enforced more strictly than duration).  
9. Re-analyze does not re-run Whisper.  
10. Offline IndexedDB queue — limited auto-retry.  
11. Speaker diarization (Azure) from Phase 2 spec — not dedicated; GPT roles instead.  
12. UI feature code lives on `AudioCasetaking_29-6-26` — merge required for current UI HEAD.

### Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Demo/mock data | API down / mock flag | Deploy API, set key, UseMockWhenNoApiKey=false |
| 0 rubrics | Language mismatch / no EN match | OutputEnglishOnly; check AI suggested; V2+ engines |
| Repertorize 0 | No auto-apply / approval gate / 0 rubrics | Deploy latest UI; approve rubrics; check MatchLog |
| Transcript still Marathi | OutputEnglishOnly false / old API | Set true, redeploy |
| OpenAI errors | Billing/key/rate limit | AiRequestLog.ErrorMessage |
| Upload 401 | JWT expired | Re-login |
| Upload 500 | SQL tables missing | Run SQL scripts |
| Download fails | Retention purged | AudioPurgedAtUtc set; re-upload |
| Import path error | `components` vs `Components` | Use capital `Components` |

---

## 20. Complete file index

### Frontend (branch `AudioCasetaking_29-6-26`)

```
src/Components/CaseTaking/
  CaseTakingModeModal.js
  AudioCasePanel.js
  AudioCaseProcessingStatus.js
  AudioCaseTranscriptEditor.js
  AudioCaseConversationPanel.js
  AudioCaseSummaryPanel.js
  AudioCaseRubricSuggestions.js
  AudioCaseRubricApprovalBar.js
  AudioCaseRubricExplainabilityPanel.js
  AudioCaseConceptTimeline.js
  AudioCaseConfidenceBadge.js

src/hooks/useAudioRecorder.js, useAudioWaveform.js
src/helpers/audioCaseTakingHelper.js, audioCaseDownloadHelper.js, audioCaseOfflineQueueHelper.js
src/helpers/url_helper.js, realbackend_helper.js, patientBoardSessionHelper.js
src/slices/doctor/audioCaseTaking/reducer.js, thunk.js
src/pages/Doctor/Dashboard/BestSellingProducts.js
src/pages/Doctor/PatientBoard/PatientBoard.js
src/pages/Admin/RubricIntelligence/ListRubricMetaphors.js, ListRubricAliases.js, ListRubricBenchmarkDashboard.js
src/Layouts/LayoutMenuData.js, src/Routes/allRoutes.js, src/config.js

docs/ (all companion markdowns + this COMPLETE_REPORT)
```

### Backend (`NigaHomeopathy-API`)

```
Niga-Web/Controllers/
  AudioCaseTakingController.cs
  AudioCaseIntelligenceController.cs
  AudioCaseIntelligenceV3Controller.cs
  AudioCaseIntelligenceAdminController.cs
Niga-Web/appsettings.json

Niga-Domain/
  Repositories/AudioCaseTakingService.cs, AudioCaseIntelligenceRepository.cs, SubSectionRepository.cs
  Services/AudioCaseAiProcessor.cs, AudioCaseTakingBackgroundService.cs,
           AudioCaseRetentionBackgroundService.cs, AudioCaseTakingQueue.cs,
           AudioCaseZombieSessionSweeperBackgroundService.cs, AudioCaseSessionProgressReporter.cs
  Services/AudioCaseIntelligence/** (Engines, Orchestration, Embeddings, Validation, V3, V6,
                                    RepertoryIntelligence, ECI/V8, Learning, Monitoring, …)
  Services/AiEmbeddingInfrastructure/**
  Interfaces/, DTOs/, Configuration/, Master/AudioCase*.cs, Data/NIGACentrumContext.cs
  Extensions/ApplicationServiceExtensions.cs

Database/Scripts/
  AudioCaseTaking_CreateTables.sql
  AudioCaseIntelligenceV2/** (deploy guides, creates, seeds, alters, rollbacks)
  AIV4EmbeddingInfrastructure/**

Niga-Domain.Tests/RubricIntelligence/** (~29 test files)
docs/AIV4_EMBEDDING_INFRASTRUCTURE_PHASE1.md
```

---

## 21. Feature-spec extras (proposed UX / phases)

From `AUDIO_CASE_TAKING_FEATURE_SPEC.md` (status originally “Proposed”; much is now implemented):

### UI/UX (spec §6)

- Modal title “Start case taking”; Manual outline / Audio filled; Esc/focus trap  
- Record controls + elapsed MM:SS + waveform  
- Upload accept audio/* + listed extensions; client+server validation  
- Download naming `{PatientName}_{SessionId}_{YYYYMMDD-HHmm}.{ext}`  
- Processing stepper; allow browsing Repertory while waiting  
- Chat styling (patient left / doctor right); editable messages  
- Summary collapsible sections + copy + append to History Note  
- Rubrics table: score, grade, add, bulk add all, max 20  

### Integration (spec §4)

- Replace direct Patient Board link with mode modal  
- Reuse `handleIntensityChipClick` / 20-limit  
- Extend patient board session snapshot with audio fields  
- Reuse keyword / hotspot / SearchGlobal patterns where applicable  

### Phased rollout (spec §12 — indicative)

- Phase 1: Core record/upload/transcribe/summary/rubrics  
- Phase 2: Re-analyze, diarization polish, offline queue  
- Phase 3: Cost/ops hardening, Azure blob, multi-server queue  

### Acceptance themes (spec §15)

- Modal appears; both audio sources work; consent enforced  
- English results for multilingual audio  
- ≤20 rubrics; repertorization works for DB rubrics  
- Download works; audit tables populated; JWT required  

### Feasibility (spec §2)

Browser capture ✅, multilingual Whisper ✅, Q&A LLM ✅–⚠️, summary ✅, rubric match ✅–⚠️, repertorize ✅, upload ✅, download ✅, offline partial ⚠️. Server-side required for repertory + PHI.

### Cost / providers (spec §8.8–8.9)

Indicative OpenAI Whisper + GPT-4o cost model and provider comparison (OpenAI vs Azure Speech/OpenAI vs Google) — see feature spec for tables.

---

## 22. Appendices

### A — Session status flow

```
Uploaded → Processing → Completed
                ↓
              Failed
```

### B — Supported audio formats

`.mp3`, `.wav`, `.webm`, `.ogg`, `.m4a`, `.aac`, `.mp4`  
Max size 50 MB. Live recording typically webm/opus via MediaRecorder.

### C — GPT extraction JSON schema

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

### D — AI suggested rubric GPT schema

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

### E — Canonical clinical failure → V2/V3 fix

**Patient:** “10 seconds before the fit, vibration starts in my hands.”  
**V1 wrong:** BACK-VIBRATION / CHEST-VIBRATION  
**Expected:** Aura before convulsion — e.g. GENERALITIES-CONVULSIONS-AURA, related mental/extremities rubrics via concept graph + causation, not string `vibration`.

### F — Functionality inventory (checklist)

| Capability | Status |
|------------|--------|
| Live mic record pause/resume/stop | UI branch |
| Upload mp3/wav/m4a/webm/ogg/aac | UI + API |
| Local + server download | Both |
| Consent before analyze | UI + ConsentLog |
| Whisper EN translation/transcription | API |
| GPT Q&A + summary + symptoms | API |
| Progress polling | UI + status API |
| Editable transcript + re-analyze | Both |
| Rubric suggestion ≤20 + intensity | Both |
| Manual approval before repertorize | V2+ flag + UI |
| Push to repertorization | UI + PatientBoard |
| Append summary to history note | UI + doctor-action |
| Resume latest session | GET latest + UI |
| Concepts / causation timeline | concepts API + UI |
| Rubric feedback / learning | feedback API + engines |
| Semantic/hybrid embedding search | V2+ / V4 |
| Metaphors / aliases admin | Admin API + UI |
| Benchmarks V6/V7/ECI V8 | API + admin dashboard |
| Audio retention purge 30d | Background service |
| Zombie/orphan recovery | Sweeper + startup requeue |
| Offline upload queue | UI helper (limited) |
| Waveform visualization | useAudioWaveform |
| Language override | UI + LanguageOverride |
| JWT authorization | All taking endpoints |
| V3 concept graph APIs | Implemented |
| V7 repertory intelligence | Enabled in appsettings |
| ECI V8 multi-module search | Implemented (flag) |
| Azure speaker diarization | Spec only — not dedicated |
| Cloud blob storage | Spec future — local disk today |
| Multi-server durable queue | Not yet — in-memory Channel |

---

## 23. Claude pack — exact DTOs

Source: `Niga-Domain/DTOs/AudioCaseTakingModels.cs` (+ related).

### Upload request

| Property | Type | Notes |
|----------|------|-------|
| AudioFile | IFormFile | required |
| PatientId | long | required |
| CaseId | long? | |
| PatientAppId | long? | |
| DoctorUserId | long? | |
| AudioSource | string | `LiveRecording` \| `FileUpload` (default LiveRecording) |
| OriginalFileName | string? | |
| Language | string? | |
| ConsentGiven | bool | must be true |

### Status / result / messages / summary

- **AudioCaseStatusModel:** SessionId, Status, ProgressStep, Percent, ErrorMessage, ProcessingStartedAt, ElapsedSeconds
- **AudioCaseMessageModel:** Role, Text, Timestamp
- **AudioCaseSummaryModel:** ChiefComplaint, HistoryOfPresentIllness, Mentals[], Generals[], Modalities[], Particulars[], RedFlags[]
- **AudioCaseSymptomModel:** Phrase, SearchTerms[], Category, IntensityHint (default 2)
- **AudioCaseExtractionModel:** EnglishTranscript, Conversation[], Symptoms[], Summary, DetectedLanguage
- **AudioCaseResultModel:** SessionId, Transcript, Messages[], Summary, SuggestedRubrics[], RubricIntelligence
- **AudioCaseUploadResultModel:** SessionId, Status
- **AudioCaseReAnalyzeRequestModel:** Transcript (required)
- **AudioCaseDoctorActionRequestModel:** ActionType, TargetType, TargetId, BeforeJson, AfterJson, Notes
- **AudioCaseTakingJob:** SessionId, CorrelationId, JobType (`ProcessAudio`\|`ReAnalyze`), EditedTranscript
- **AudioCaseLatestSessionModel:** SessionId, Status, ProgressStep, AudioFileName, EnteredDate, ErrorMessage, IsStale, CanResume, Result

### Suggested rubric (full V2+ fields)

| Property | Type |
|----------|------|
| SubSectionId | int (negative = AI suggested / not in DB) |
| SubSectionName | string |
| SectionId | int? |
| MatchScore | decimal |
| SuggestedIntensityNo | int |
| MatchedFrom | string? |
| RemedyCountForSort | int |
| IsAiSuggested | bool |
| MatchSource | string? (`Database`\|`Combined`\|`AiGenerated`|…) |
| ConfidenceScore | decimal? |
| WhySuggested | string? |
| EngineVersion | string? |
| RequiresManualApproval | bool |
| HomeopathicWeight | decimal (default 1) |
| MatchLayer | string? |
| RubricTier | string? |
| RequiresDoctorReview | bool |
| SourceConceptId | Guid? |
| InferenceReason | string? |
| Explainability | RubricExplainabilityModel? |
| RepertorySources | List of string |
| PrimaryRepertorySource | string? |
| EvidenceChain | RubricEvidenceChainModel? |
| QualityScore | decimal? |
| ValidationStatus | string? |
| ValidationFlags | List of string |
| IsPrimarySymptomLinked | bool? |
| EnterpriseValidation | RubricEnterpriseValidationReport? |
| EnterpriseEvidenceChain | RubricEnterpriseEvidenceChainModel? |
| ResultKind | string? (`AiClinicalConcept` = concept only, do not repertorize) |
| RepertoryPath | string? |
| EnterpriseConfidenceScore | decimal? |
| SelectionReason | string? |
| V6Explainability | V6RubricExplainabilityModel? |
| V7Explainability | V7RubricExplainability? |

### Explainability

```
RubricExplainabilityModel:
  PatientStatement, ClinicalMeaning, HomeopathicMeaning, WhySuggested,
  MatchLayer, ConfidenceScore, RubricTier, ReviewRequired,
  CausationChain[], SourceConceptId, EvidenceChain, QualityScore, ValidationFlags[]

RubricEvidenceChainModel:
  PatientStatements[], ClinicalMeanings[], SourceConceptIds[],
  TranscriptExcerpt, EvidenceStrength, MatchedSymptomPhrase
```

### RubricIntelligence meta / analysis

```
RubricIntelligenceMetaModel:
  EngineVersion, RequireManualApprovalForSuggestedRubrics, V2Enabled, RollbackToV1Only

RubricIntelligenceAnalysisResult:
  Rubrics[], Concepts[], EnhancedSymptoms[], EngineVersion,
  RequiresManualApproval, StagesCompleted[], CausationLinks[],
  PrimarySymptom, ValidationRejectedCount
```

### Admin models

```
RubricMetaphorModel: MetaphorId, PatientExpression, ClinicalMeaning, RubricMeaning,
  SubSectionId?, SubSectionName?, Language, ConfidenceWeight, ApprovalStatus,
  UsageCount, AcceptanceRate?, VersionNo, IsActive

RubricAliasModel: RubricAliasId, SubSectionId, SubSectionName?, AliasText,
  Language, AliasType (default patient_phrase), Weight, Source, UsageCount,
  AcceptanceRate?, IsActive, VersionNo

Upsert metaphor: PatientExpression, ClinicalMeaning, RubricMeaning, SubSectionId?, Language, ConfidenceWeight
Upsert alias: SubSectionId, AliasText, Language, AliasType, Weight
```

### ECI V8 ranking weights (defaults)

ClinicalMatch 30 · Evidence 20 · Ontology 15 · Embedding 10 · Hierarchy 10 · SqlExact 5 · Historical 5 · ExpertRules 5 · MaxPenalty −100

---

## 24. Claude pack — exact GPT prompts

Source: `AudioCaseAiProcessor.cs` (production).

### Extraction (temperature 0.1, max_tokens 8192, json_object)

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
      "intensityHint":1-4
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
- symptom.phrase: use concise English reflecting what the patient/doctor actually said.
- searchTerms: 2-6 short English keywords per symptom for homeopathic repertory lookup
  (examples: epilepsy, convulsion, fear, shivering, anticipation, morning, nausea).
- summary.chiefComplaint: single clearest presenting complaint.
- summary.particulars: list each local/particular symptom separately.
- summary.modalities: all aggravations and ameliorations.
- summary.mentals: fears, anxieties, irritability, delusions, etc.
- conversation: include every exchange that contains clinical information; omit greetings/small talk only.
```

User message: `Transcript:\n\n{transcript}`

**Important:** Whisper transcript is source of truth — code sets `extraction.EnglishTranscript = transcript.Trim()` and does **not** trust GPT to rewrite the full transcript.

### AI suggested rubrics (temperature 0.2, json_object)

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

User message includes extracted symptoms, case summary, existing DB rubric names, and max count.

### Whisper

- `OutputEnglishOnly=true` → `POST /v1/audio/translations` (model `whisper-1`)
- Else → `POST /v1/audio/transcriptions`

---

## 25. Claude pack — full V1 SQL DDL

Script: `Database/Scripts/AudioCaseTaking_CreateTables.sql` (IF NOT EXISTS / safe re-run).

### AudioCaseSession

```
AudioCaseSessionId UNIQUEIDENTIFIER PK
PatientId BIGINT NOT NULL
CaseId BIGINT NULL
DoctorUserId BIGINT NOT NULL
PatientAppId BIGINT NULL
AudioSourceType NVARCHAR(20) NOT NULL   -- LiveRecording | FileUpload
Status NVARCHAR(30) NOT NULL
CurrentStep NVARCHAR(50) NULL
AudioFilePath NVARCHAR(500) NULL
AudioFileName NVARCHAR(255) NULL
AudioMimeType NVARCHAR(100) NULL
AudioFileSizeBytes BIGINT NULL
AudioSha256Hash CHAR(64) NULL
AudioDurationSeconds INT NULL
TranscriptRaw NVARCHAR(MAX) NULL
ConversationJson NVARCHAR(MAX) NULL
SummaryJson NVARCHAR(MAX) NULL
ExtractedSymptomsJson NVARCHAR(MAX) NULL
SuggestedRubricsJson NVARCHAR(MAX) NULL
DetectedLanguage NVARCHAR(10) NULL
LanguageOverride NVARCHAR(10) NULL
CorrelationId NVARCHAR(50) NULL
ErrorCode NVARCHAR(50) NULL
ErrorMessage NVARCHAR(2000) NULL
ReAnalysisCount INT NOT NULL DEFAULT 0
EnteredBy INT NULL
EnteredDate DATETIME NOT NULL DEFAULT GETUTCDATE()
ChangedBy INT NULL
ChangedDate DATETIME NULL
CompletedAtUtc DATETIME NULL
AudioPurgedAtUtc DATETIME NULL
DeleteStatus BIT NOT NULL DEFAULT 0
IX: (DoctorUserId, EnteredDate DESC), (PatientId, CaseId, EnteredDate DESC)
```

**V2 ALTERs on session:** `ClinicalConceptsJson NVARCHAR(MAX)`, `IntelligenceEngineVersion NVARCHAR(10)`, plus causation links JSON alter (`103_Alter_AudioCaseSession_CausationLinksJson.sql`).

### AudioCaseSessionEventLog

```
EventLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
EventType NVARCHAR(80), EventStatus NVARCHAR(20)
Message NVARCHAR(1000), DetailsJson NVARCHAR(MAX)
DurationMs INT, CorrelationId NVARCHAR(50), IpAddress NVARCHAR(45)
EnteredBy INT, EnteredDate DATETIME
```

### AudioCaseAiRequestLog

```
AiRequestLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
Provider NVARCHAR(50), ServiceType NVARCHAR(50), ModelName NVARCHAR(100)
RequestId NVARCHAR(100), HttpStatusCode INT
PromptTokens INT, CompletionTokens INT, AudioDurationSeconds INT
EstimatedCostUsd DECIMAL(10,6), LatencyMs INT
RequestPayloadHash CHAR(64), ResponsePayloadHash CHAR(64)
RequestPayloadJson NVARCHAR(MAX), ResponsePayloadJson NVARCHAR(MAX)
IsSuccess BIT, ErrorCode NVARCHAR(50), ErrorMessage NVARCHAR(2000)
CorrelationId NVARCHAR(50), EnteredDate DATETIME
```

### AudioCaseConsentLog

```
ConsentLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
PatientId BIGINT, DoctorUserId BIGINT
ConsentType NVARCHAR(50)           -- AudioRecordingClinical
ConsentTextVersion NVARCHAR(20)    -- v1.0-2026-06-23
ConsentGiven BIT, IpAddress NVARCHAR(45), UserAgent NVARCHAR(500)
EnteredDate DATETIME
```

### AudioCaseRubricMatchLog

```
RubricMatchLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
SymptomPhrase NVARCHAR(500), SubSectionId INT, SubSectionName NVARCHAR(500)
KeywordScore / FullTextScore / SemanticScore / FinalScore DECIMAL(5,4)
RankPosition INT, IsSelectedForUi BIT, SuggestedIntensityNo INT
MatchSource NVARCHAR(50), EnteredDate DATETIME
```

**V2 ALTERs on match log:** ClinicalMeaning, HomeopathicMeaning, WhySuggested, ConfidenceScore, HomeopathicWeight, RubricTier, MatchLayer, CausationJson, ExplainabilityJson.

### AudioCaseDoctorActionLog

```
DoctorActionLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
DoctorUserId BIGINT, ActionType NVARCHAR(80)
TargetType NVARCHAR(50), TargetId NVARCHAR(100)
BeforeJson / AfterJson NVARCHAR(MAX), Notes NVARCHAR(500)
IpAddress NVARCHAR(45), EnteredDate DATETIME
```

### AudioCaseRetentionLog

```
RetentionLogId BIGINT IDENTITY PK
AudioCaseSessionId UNIQUEIDENTIFIER FK
ActionType NVARCHAR(50)   -- e.g. AudioBlobDeleted
Reason NVARCHAR(200), PerformedBy NVARCHAR(50)
DetailsJson NVARCHAR(MAX), EnteredDate DATETIME
```

---

## 26. Claude pack — production appsettings (redacted)

Prefer these **production values** over C# option defaults when they differ.

### AudioCaseTaking

```json
{
  "StoragePath": "Data/AudioCaseTaking",
  "MaxFileSizeBytes": 52428800,
  "MaxAudioDurationMinutes": 45,
  "ConsentTextVersion": "v1.0-2026-06-23",
  "UseMockWhenNoApiKey": false,
  "EnableSemanticRubricMatch": true,
  "OutputEnglishOnly": true,
  "EnableAiSuggestedRubrics": true,
  "MaxAiSuggestedRubrics": 25,
  "AudioRetentionDays": 30,
  "RetentionJobIntervalHours": 24,
  "MaxProcessingMinutes": 20,
  "EnableZombieSessionRecovery": true,
  "ZombieSessionStaleMinutes": 20,
  "ZombieSweeperIntervalMinutes": 5,
  "UploadedStaleMinutes": 15,
  "RequeueOrphanedUploadedOnStartup": true,
  "SemanticCacheMaxWaitMinutes": 20
}
```

### RubricIntelligence (production snapshot)

```json
{
  "EnableV2": true,
  "EnableV2ForAllDoctors": true,
  "RequireManualApprovalForAllAiRubrics": true,
  "AllowAutoApplyHighConfidence": false,
  "AutoApplyMinAcceptanceRateHistorical": 0.95,
  "EnableEmbeddingSearch": true,
  "EmbeddingTopK": 50,
  "EmbeddingIndexerBatchSize": 100,
  "EmbeddingIndexerMaxRubricsPerRun": 500,
  "EmbeddingIndexerIntervalHours": 24,
  "HybridWeights": { "Embedding": 0.40, "Alias": 0.30, "ClinicalMeaning": 0.20, "KeywordLike": 0.10 },
  "EnableClinicalInference": true,
  "MinConceptConfidenceForInference": 0.85,
  "MinRetrievalScoreToSkipInference": 0.70,
  "MinEmbeddingNeighborForInference": 0.65,
  "EnableDoctorFeedbackLearning": true,
  "EnableRepertoryMapping": true,
  "RollbackToV1Only": false,
  "EnableClinicalValidationV21": true,
  "MinRubricQualityScore": 70,
  "MinRubricQualityScoreTier3": 58,
  "MinRubricQualityScoreReviewFallback": 50,
  "EnableV3ReviewFallback": true,
  "MinEmbeddingCosineForCandidate": 0.74,
  "MinEvidenceSimilarityForRubric": 0.40,
  "MinEvidenceSimilarityForInference": 0.52,
  "MinEvidenceStrength": 0.35,
  "EnableV3ConceptGraph": true,
  "EnableV3ShadowMode": false,
  "EnableV35RecallEngine": true,
  "MaxRubricsTier1": 5,
  "MaxRubricsTier2": 10,
  "MaxRubricsTier3": 10,
  "MinTranscriptCoverage": 0.90,
  "MinCaseCompleteness": 0.90,
  "MinEvidenceSimilarityTier3": 0.45,
  "MaxDiscoveryCandidates": 60,
  "MaxRubricsPerPattern": 8,
  "EnableV35FastPipeline": true,
  "DeferGraphPersistence": true,
  "MaxEmbeddingConceptsPerPass": 12,
  "MinRubricsToSkipSecondPass": 6,
  "MinPrimaryMeaningsToSkipMultiSymptom": 10,
  "EnableMultiConceptDiscovery": true,
  "EnableRubricCandidateEngine": true,
  "EnableEnterpriseClinicalValidation": true,
  "EnableEnterpriseRubricEvidenceChain": true,
  "EnableDoctorLearningEngine": true,
  "DoctorLearningAcceptBoost": 0.15,
  "DoctorLearningRejectPenalty": -0.20,
  "DoctorLearningCorrectionBoost": 0.12,
  "DoctorLearningConceptRankingBoost": 0.08,
  "DoctorLearningClinicalRelevanceBoost": 0.10,
  "DoctorLearningMaxAccumulatedWeight": 1.0,
  "EnableAiMonitoringDashboard": true,
  "EnableEnterpriseKnowledgeGraph": true,
  "EnableEnterpriseRubricDiscoveryEngine": true,
  "EnableEnterpriseRubricExpansion": true,
  "EnableEnterpriseRubricReviewFallback": false,
  "MinEnterpriseRubricConfidenceScore": 62,
  "EnableAiClinicalConceptSuggestions": true,
  "EnableRubricValidationAuditLogging": true,
  "EnableHybridCompletionEngine": true,
  "MaxRubricsPerConceptSlots": 4,
  "EnableV6ClinicalReasoningEngine": false,
  "MinValidatedSqlRubrics": 15,
  "MaxAiClinicalConcepts": 5,
  "MaxSqlHitsPerSymptom": 12,
  "EnableV6BenchmarkOnStartup": false,
  "EnableV7RepertoryIntelligenceEngine": true,
  "EnableV7GptStructuredExtraction": true,
  "V7MinDatabaseRubrics": 15,
  "V7MaxVocabularyTermsPerSymptom": 30,
  "V7EmbeddingTopK": 50,
  "V7LatencyBudgetMs": 2000,
  "MaxEnterpriseDiscoveryCandidates": 100,
  "EnableKnowledgeGraphShadowMode": false,
  "KnowledgeGraphMinPathConfidence": 0.55,
  "KnowledgeGraphEmbeddingBlendRatio": 0.35,
  "KnowledgeGraphEnableMultilingual": true,
  "KnowledgeGraphRemedyProjectionSyncHours": 24
}
```

**Also in options class (may need explicit appsettings):** `EnableEciV8Engine` (default false), `EnableEciDatabaseIntelligenceEngine`, `EciV8LatencyBudgetSeconds=5`, `EciV8MinDatabaseRubrics=10`, `EciV8MaxDatabaseRubrics=20`, `EciV8MaxSemanticVariantsPerSymptom=100`, `EciV8RankingWeights`.

### OpenAI / AzureOpenAI

```json
"OpenAI": {
  "ApiKey": "***REDACTED***",
  "BaseUrl": "https://api.openai.com/v1",
  "WhisperModel": "whisper-1",
  "ChatModel": "gpt-4o",
  "EmbeddingModel": "text-embedding-3-small"
}
"AzureOpenAI": {
  "Endpoint": "",
  "ApiKey": "",
  "DeploymentNameGpt4o": "gpt-4o",
  "DeploymentNameEmbedding": "text-embedding-3-small",
  "ApiVersion": "2024-08-01-preview",
  "PreferAzureOverOpenAi": false
}
```

### AiEmbeddingInfrastructure (highlights)

Enabled=true; text-embedding-3-small; dimension 1536; JsonFloatArray; KeepLegacyRubricEmbeddingsActive=true; enterprise builder + auto-resume on startup; incremental refresh every 2 days; semantic search TopConcepts 20 / TopRubricsPerConcept 5 / MaxRubrics 30; MinConceptCosine 0.55; MinRubricCosine 0.50; semantic cache warmup on startup.

Computed helpers: `IsV2Active = EnableV2 && !RollbackToV1Only`; `IsV3Active = EnableV3ConceptGraph && IsV2Active`; `RequiresManualApproval = IsV2Active && RequireManualApprovalForAllAiRubrics && !AllowAutoApplyHighConfidence`.

---

## 27. Claude pack — FE constants, Redux, API wrappers

**Branch:** `AudioCasetaking_29-6-26`

### Constants (`audioCaseTakingHelper.js`)

```
ACCEPTED_AUDIO_MIME_TYPES:
  audio/mpeg, audio/mp3, audio/wav, audio/x-wav, audio/webm,
  audio/ogg, audio/aac, audio/mp4, audio/x-m4a

ACCEPTED_AUDIO_EXTENSIONS: /\.(mp3|wav|webm|ogg|m4a|aac)$/i
MAX_AUDIO_FILE_SIZE_BYTES: 50 * 1024 * 1024
AUDIO_SOURCE_LIVE: 'LiveRecording'
AUDIO_SOURCE_FILE: 'FileUpload'

AUDIO_LANGUAGE_OPTIONS:
  '' Auto-detect | en | hi | mr | gu | ta | te | kn | bn
```

**mapSuggestedRubricToRepertorization:** returns `null` if `resultKind === 'aiclinicalconcept'` OR `!(subSectionId > 0)`.  
**isAiClinicalConceptOnly:** resultKind AI clinical concept OR (isAiSuggested && no positive SubSectionId).

### Polling (`thunk.js`)

- `POLL_INTERVAL_MS = 2500`
- `MAX_POLL_ATTEMPTS = 192` (~8 minutes)
- On timeout: stop auto-poll; try fetch completed result; allow manual resume

### Redux `initialState`

```javascript
{
  sessionId: null, audioSource: null, selectedFileName: null, language: '',
  status: 'idle', progressStep: null, progressPercent: 0,
  elapsedSeconds: null, takingLonger: false,
  transcript: null, messages: [], summary: null, suggestedRubrics: [],
  requireManualApprovalForSuggestedRubrics: false, engineVersion: 'v1',
  concepts: [], causationLinks: [], conceptsLoading: false, conceptsError: null,
  rubricApprovalState: {}, approvedRubricCount: 0,
  usedMockData: false, canDownloadFromServer: false, error: null,
  uploadLoading: false, pollLoading: false, reAnalyzeLoading: false,
  restoredFromServer: false,
  pendingPreviousSession: null,
  pendingPreviousSessionLoading: false,
  pendingPreviousSessionDismissed: false,
}
```

### Thunks

`uploadAndAnalyzeAudioCase`, `pollAudioCaseAnalysis`, `reAnalyzeAudioCase`, `logAudioDoctorAction`, `submitAudioCaseRubricFeedback`, `loadLatestAudioCaseSession`, `checkForPreviousAudioCaseSession`, `resumePreviousAudioCaseSession`, `dismissPreviousAudioCaseSession`, `loadAudioCaseConcepts`, `startNewAudioCaseSession`

### FormData upload fields

`audioFile`, `patientId`, `caseId`, `patientAppId`, `doctorUserId`, `audioSource`, `originalFileName`, `language`, `consentGiven`

### API wrappers (`realbackend_helper.js`)

```
uploadAudioCaseTaking(formData)           // multipart POST upload
getAudioCaseTakingStatus(sessionId)
getAudioCaseTakingResult(sessionId)
downloadAudioCaseRecording(sessionId)     // blob
reAnalyzeAudioCaseTaking(sessionId, data)
logAudioCaseDoctorAction(sessionId, data)
getLatestAudioCaseSession(patientId, caseId)
getAudioCaseConcepts(sessionId)
submitAudioCaseRubricFeedback(sessionId, data)
getRubricBenchmarkSummary / Trends
getRubricFeedbackQueue
getRubricIntelligenceConfig / updateRubricIntelligenceConfig
getRubricIntelligenceRolloutStatus / getRepertoryMappingStatus
get/create/update/delete/approve/reject RubricMetaphors
get/create/update/delete RubricAliases
```

### Folder case warning

Imports must use `Components/CaseTaking/...` (capital **C**), not `components`.

---

## 28. Cost, providers, intensity, security

### Cost (indicative per ~15-min case)

| Step | ~Cost |
|------|-------|
| Whisper | ~$0.09 |
| GPT-4o extraction | ~$0.05–$0.20 |
| Embeddings | ~$0.001 |
| Storage | ~$0.01 |
| **MVP total** | **~$0.15–$0.35** |

Controls: max 45 min, SHA256 dedup (spec), GPT-4o-mini for staging, clinic quotas.

### Provider recommendation

| Phase | Transcription | LLM | Rubric | Storage |
|-------|---------------|-----|--------|---------|
| MVP | OpenAI Whisper | GPT-4o | SQL | Local disk today (spec said Azure Blob) |
| Production target | Azure Speech or Whisper | Azure OpenAI | SQL + embeddings | Azure Blob (future) |
| Phase 3 | + diarization | Same | + feedback | + retention |

### Intensity suggestion (spec)

| Signal | Grade |
|--------|-------|
| Repeated / severe | 3–4 |
| Once, moderate | 2 |
| Brief / uncertain | 1 |

Doctor always confirms via intensity chips.

### Security / privacy / compliance

- Consent before upload → ConsentLog
- HTTPS only; JWT on all endpoints; Doctor role only
- Encrypt at rest (target: blob encryption + SQL TDE)
- Retention: purge audio blob after N days (30); keep audit/transcript per legal policy
- ILogger: session id + step only — **never** transcript or API keys
- Restrict AiRequestLog/transcript access to DBA/compliance
- Mic denial → graceful Manual fallback
- Feature flag (spec): `REACT_APP_ENABLE_AUDIO_CASE_TAKING=true`

### What to log vs NOT

| Data | SQL | ILogger |
|------|-----|---------|
| Session/patient/doctor ids | Yes | ids only |
| Full transcript | Yes | Never |
| LLM request/response JSON | Yes AiRequestLog | Never |
| Audio blob | Disk + path in SQL | Never |
| Tokens/latency/cost | Yes | Yes |
| Rubric scores | Yes | summary |
| Doctor actions | Yes | action type |
| API keys | Never | Never |

---

## 29. Phased rollout, experts, risks, acceptance

### Phase 1 MVP — implemented core

Modal, record+upload, download, Whisper, GPT Q&A+summary, basic rubric match, chat+summary+≤20 rubrics, DB audit tables, consent.

### Phase 2 Quality — largely implemented

Re-analyze, embeddings + MatchLog scores, session restore, history note append, V2+ intelligence (beyond original Azure diarization which remains optional).

### Phase 3 Polish — largely implemented

Waveform, language dropdown, offline queue helper, benchmarks/analytics.

### Expert suggestions (from feature spec)

1. Always land on Patient Board after mode select
2. Hybrid: stop audio & continue manually without losing transcript
3. Confidence indicators / grey low-confidence
4. Keyword preview tick/untick before match
5. Rate limit 45 min / 50 MB
6. Cost control: chunks + transcript hash cache
7. Telemedicine mic placement notes
8. Synonym dictionary (patient → repertory) — evolved into Alias/Metaphor
9. Thumbs up/down feedback loop — implemented
10. **Do not auto-add rubrics silently** — V2 lock: manual approval
11. Questions tab highlight (future)
12. Feature flag staged rollout
13. FileUpload source type
14. Download for clinic records + log server downloads

### Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Poor transcription | Editable transcript + re-analyze + Manual |
| Wrong rubrics | Multi-stage ranking + doctor confirmation; never auto-prescribe |
| PHI leakage | Server-side AI, encrypted storage, retention |
| High AI cost | Max duration, async queue, quotas |
| Browser MediaRecorder gaps | Feature detect; Manual-only fallback |
| 5 patient session limit | Persist audio in board snapshot |
| Long processing | Async + poll (~8 min UI budget) + toast |
| Invalid upload | MIME + extension validation |
| Download after purge | “Recording expired”; transcript remains |

### Acceptance criteria (must hold)

- [ ] Patient name → Manual vs Audio modal (doctors only)
- [ ] Manual path unchanged
- [ ] Audio pause/resume/stop keeps segments
- [ ] Upload tab same pipeline as live
- [ ] Local + server download until retention
- [ ] Invalid/oversize rejected clearly
- [ ] ~10-min recording → chat within ~3 minutes (target)
- [ ] Structured summary sections
- [ ] ≤20 rubric suggestions with scores
- [ ] Repertorization respects 20 limit
- [ ] Mic denial → Manual option
- [ ] Authenticated APIs; no audio/transcript in console
- [ ] EventLog rows upload→complete/fail
- [ ] AiRequestLog for every Whisper/GPT call
- [ ] ConsentLog before upload
- [ ] DoctorActionLog for accept/reject
- [ ] Server downloads logged
- [ ] AudioSourceType stored
- [ ] No transcript/keys in ILogger

---

## 30. What to log / not log + unit tests

See §28 for log policy. Audit service pattern (spec): `LogEventAsync`, `LogAiRequestAsync`, `LogRubricMatchesAsync`, `LogDoctorActionAsync` — before/after each pipeline step; one CorrelationId; same transaction as status where possible.

### Unit tests (`Niga-Domain.Tests/RubricIntelligence/`)

AiMonitoringMetricsCalculatorTests · BenchmarkMetricsCalculatorTests · CausationDetectionEngineTests · ClinicalInferenceEngineTests · ClinicalValidationEngineTests · ConfidenceScoringEngineTests · DoctorLearningTests · EciV8BenchmarkMetricsTests · EciV8PhaseABTests · EciV8PhaseCTests · EmbeddingVectorMathTests · EnterpriseClinicalValidationPipelineTests · EnterpriseRubricDiscoveryTests · EnterpriseRubricEvidenceChainBuilderTests · ExplainabilityEngineTests · GoldCaseConceptTests · HomeopathicWeightEngineTests · HybridRetrievalEngineTests · KnowledgeGraphTests · MetaphorInterpretationEngineTests · MultiConceptDiscoveryTests · PatientMeaningGraphEngineTests · RepertoryTierEngineTests · RubricCandidateScoringTests · RubricIntelligenceOrchestratorTests · RubricResultMergerTests · SymptomExtractionEngineTests · V7RankingAndVocabularyTests · V7RepertoryIntelligenceTests

---

## 31. Instructions for Claude when answering

When this document is uploaded to Claude (or any coding AI):

1. **Treat this report as the primary source of truth** for Audio Case Taking across UI, API, DB, and versions V1–V8.
2. **Prefer production appsettings (§26)** over C# default property values when they disagree (e.g. `MaxAiSuggestedRubrics=25`, `MaxProcessingMinutes=20`, `EnableV7=true`, `EnableV6=false`).
3. **UI code lives on branch `AudioCasetaking_29-6-26`**; current UI HEAD may only have docs — say so if asked to edit UI on wrong branch.
4. **API code lives on `GouravDev_29-6-26`** in `NigaHomeopathy-API` (also called New_API in older docs).
5. **Never invent** tables, endpoints, or feature flags. If unsure, say what is documented vs what needs confirmation in code.
6. **Never auto-repertorize AI/inference rubrics** when V2 manual approval is required; never invent SubSectionMaster rows; AI suggestions use negative SubSectionId / ResultKind `AiClinicalConcept`.
7. **Master repertory tables are READ ONLY** (`SectionMaster`, `SubSectionMaster`) — V2/V3/V4 add satellite tables only.
8. **SQL is manual SSMS deploy only** — no EF auto-migrate for these tables.
9. **OpenAI keys never belong in React** or ILogger.
10. For deep V2/V3 phase design prose, also read companion architecture docs in §0; for implementation details use this file’s §23–§27 first.
11. Component import path is `src/Components/CaseTaking/` (capital C).
12. Poll budget is ~8 minutes (192 × 2.5s), not 5 minutes.
13. English-only pipeline (`OutputEnglishOnly`) is mandatory for Marathi/Hindi → English repertory matching.

---

**Document end — Audio Case Taking Complete Report v2.0 (Claude AI pack).**

For any line-level detail of a specific version architecture, open the companion document in [§0](#0-companion-documents--do-not-skip). For implementation, use API branch `GouravDev_29-6-26` and UI branch `AudioCasetaking_29-6-26`.

**Recommended Claude upload set (in order):**

1. `AUDIO_CASE_TAKING_COMPLETE_REPORT.md` (this file)
2. `AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md`
3. `AUDIO_CASE_TAKING_FEATURE_SPEC.md`
4. `AUDIO_CASE_TAKING_AI_ENGINE_V2_APPROVAL_PACK.md`
5. `AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md`
6. `AUDIO_CASE_TAKING_AI_ENGINE_V3_ARCHITECTURE.md`
7. API `000_MASTER_SQL_DEPLOYMENT_GUIDE.md` + `AIV4_EMBEDDING_INFRASTRUCTURE_PHASE1.md` (if DB/embedding work)

# HomeoCentrum AI Engine V2 — Architecture Approval Pack

**Status:** APPROVED — Phase 0 implementation in progress  
**Version:** 2.0-approved-decisions  
**Date:** June 2026  
**Projects:** New_API + NigaHomeopathy-UI + HomeoCentrum_Production (MSSQL)  
**Companion docs:**
- `AUDIO_CASE_TAKING_FULL_DOCUMENTATION.md` (V1 current state)
- `AUDIO_CASE_TAKING_AI_ENGINE_V2_ARCHITECTURE.md` (detailed phase specs)

---

## Document Index

1. [Locked Implementation Decisions](#1-locked-implementation-decisions)
2. [Solution Analysis Summary](#2-solution-analysis-summary)
3. [Enterprise Architecture (V2)](#3-enterprise-architecture-v2)
4. [Mandatory AI Components](#4-mandatory-ai-components)
5. [Database Design (MSSQL — Manual Deploy Only)](#5-database-design-mssql--manual-deploy-only)
6. [API Design (Backward Compatible)](#6-api-design-backward-compatible)
7. [UI Design (Doctor + Admin)](#7-ui-design-doctor--admin)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Risk Assessment](#9-risk-assessment)
10. [Performance Impact Analysis](#10-performance-impact-analysis)
11. [Production Readiness Checklist](#11-production-readiness-checklist)
12. [Gold Standard Dataset Plan](#12-gold-standard-dataset-plan)
13. [Success Metrics & Go-Live Gates](#13-success-metrics--go-live-gates)
14. [Sign-Off Checklist](#14-sign-off-checklist)

---

## 1. Locked Implementation Decisions

These decisions are **final for V2 implementation** unless explicitly revised by stakeholders.

| # | Topic | Decision |
|---|-------|----------|
| 1 | Auto-apply inference rubrics | **NO** — manual doctor approval only for all AI/inference rubrics before Repertorize. Future optional auto-apply only after ≥95% acceptance at scale + feature flag. |
| 2 | Embedding storage | **JSON embeddings in SQL Server** (`RubricEmbeddings.EmbeddingJson`). No SQL Server native vector type in V2. |
| 3 | Repertory scope Phase 9 | **Phase 9.1:** Kent + Complete. **Phase 9.2:** Boericke + Phatak. **Phase 9.3:** Clinical/remedy relationships. |
| 4 | Rollout scope | **All doctors** with feature flag, monitoring dashboard, rollback mechanism. |
| 5 | Gold test cases | **Internal dataset:** 250+ cases (50 each: epilepsy, psychological, GI, pediatric, chronic). Each with transcript, doctor rubrics, remedy, outcome. |
| 6 | Admin UI | **YES** — full admin UI for metaphors/aliases (not SQL-only). |
| 7 | Success metrics | **Both mandatory:** ≥95% doctor acceptance AND ≥95% primary rubric in top-5. Plus false positive ≤5%, confidence calibration ≥90%. |
| 8 | Accuracy target | **95%+** (stretch **98%**). 100% not expected. |
| 9 | Database deploy | **Manual only** — separate SQL scripts, no auto-migrate. Include rollback scripts. |
| 10 | Backward compatibility | **Zero breaking changes** to existing AudioCaseTaking APIs and V1 pipeline. |

---

## 2. Solution Analysis Summary

### 2.1 Current State (V1)

| Capability | Status | Gap |
|------------|--------|-----|
| Audio upload, consent, audit | Complete | — |
| Whisper English translation | Complete | — |
| GPT symptom/summary extraction | Complete | — |
| LIKE search on `SubSectionMaster` | Complete | Keyword-only; clinically naive |
| Jaccard semantic score | Partial | Not true embedding semantics |
| AI suggested rubrics (no DB id) | Complete | No clinical reasoning chain |
| Auto-apply to Repertorize | Exists | **Must change:** disable for inference; manual approval for V2 |
| Explainability | Minimal | No patient statement → meaning → why chain |
| Benchmark loop | None | No acceptance metrics |
| Alias / metaphor DB | None | Major accuracy blocker |
| Embedding search | None | Major accuracy blocker |

### 2.2 Root Problem

V1 treats rubric matching as **string retrieval**. Homeopathic case analysis requires **clinical + homeopathic reasoning** across metaphors, causation, SRP hierarchy, and repertory language.

**Canonical failure:**  
*"Vibration before fit"* → `BACK-VIBRATION` instead of **aura before convulsion**.

### 2.3 V2 Solution Strategy

Build a **parallel intelligence stack** orchestrated beside V1:

- V1 always executes (fallback + baseline merge)
- V2 adds 13 engines (Section 4)
- Feature flag `RubricIntelligence:EnableV2` controls activation
- All AI rubrics require **explicit doctor approval** before Repertorize
- Feedback loop improves alias/metaphor/admin data over time

---

## 3. Enterprise Architecture (V2)

### 3.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Presentation Layer (React)                                        │
│  Doctor: AudioCasePanel, Explainability, Manual Approve/Reject   │
│  Admin: Metaphor/Alias CRUD, Benchmark Dashboard, Rollback      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JWT
┌────────────────────────────▼────────────────────────────────────┐
│ API Layer (ASP.NET Core Controllers)                            │
│  AudioCaseTakingController (existing — extended DTOs)         │
│  AudioCaseIntelligenceController (new — admin + feedback)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Application Layer                                               │
│  RubricIntelligenceOrchestrator                                 │
│  AudioCaseTakingService (existing — invokes orchestrator)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Domain / Intelligence Engines (13 components — Section 4)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Infrastructure Layer                                            │
│  Repositories, OpenAI HttpClient, Embedding JSON store, Queue    │
│  Structured logging, Polly retry, Audit persistence             │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Data Layer (MSSQL)                                              │
│  Existing: SubSectionMaster, AudioCase*, 7 audit tables         │
│  New: RubricEmbeddings, RubricAlias, MetaphorDictionary, etc.   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Processing Pipeline (V2)

```
Audio Upload
  → Whisper Translation (English)                    [existing]
  → Symptom Extraction (GPT)                         [existing, enhanced]
  → Case Understanding Engine                        [NEW]
  → Metaphor Interpretation Engine                   [NEW]
  → Causation / Modality / Concomitant Engines       [NEW]
  → Clinical Reasoning Engine                        [NEW]
  → Homeopathic Reasoning + Weight Engine             [NEW]
  → Hybrid Retrieval:
       LIKE SubSectionMaster (V1 kept)
       RubricAlias search
       MetaphorDictionary lookup
       JSON Embedding cosine search
  → Clinical Inference Engine (guarded)              [NEW]
  → Confidence Scoring Engine                        [NEW]
  → Explainability Engine                            [NEW]
  → Merge V1 + V2 candidates → Rank top 20
  → Return to UI with full explainability payload
  → Doctor Manual Approve / Reject                   [REQUIRED]
  → Doctor Feedback Learning Engine → benchmark store  [NEW]
```

### 3.3 Clean Architecture / SOLID Mapping

| Principle | Application |
|-----------|-------------|
| SRP | One class per engine (CaseUnderstanding, Metaphor, etc.) |
| OCP | V2 engines added without modifying V1 LIKE retriever internals |
| LSP | All retrievers implement `IRubricCandidateRetriever` |
| ISP | Separate interfaces per engine; orchestrator depends on abstractions |
| DIP | Orchestrator depends on `ICaseUnderstandingEngine`, not concrete GPT calls |

### 3.4 CQRS (Where Applicable)

| Command side | Query side |
|--------------|------------|
| Upload, re-analyze, doctor feedback, admin CRUD | Status, result, concepts, benchmark dashboard |
| Writes to session + intelligence logs | Read models for UI explainability |

No full event sourcing in V2.1 — optional future enhancement.

### 3.5 Feature Flags

```json
"RubricIntelligence": {
  "EnableV2": false,
  "EnableV2ForAllDoctors": true,
  "RequireManualApprovalForAllAiRubrics": true,
  "AllowAutoApplyHighConfidence": false,
  "AutoApplyMinAcceptanceRateHistorical": 0.95,
  "EnableEmbeddingSearch": true,
  "EnableClinicalInference": true,
  "EnableDoctorFeedbackLearning": true,
  "RollbackToV1Only": false
}
```

**Rollback:** Set `RollbackToV1Only=true` or `EnableV2=false` → instant V1-only behavior without code deploy.

### 3.6 Folder Structure (Backend)

```
Niga-Domain/
  Services/AudioCaseIntelligence/
    Orchestration/RubricIntelligenceOrchestrator.cs
    Engines/CaseUnderstandingEngine.cs
    Engines/SymptomExtractionEngine.cs          // wraps/enhances existing GPT step
    Engines/MetaphorInterpretationEngine.cs
    Engines/ClinicalReasoningEngine.cs
    Engines/HomeopathicReasoningEngine.cs
    Engines/CausationDetectionEngine.cs
    Engines/ModalityDetectionEngine.cs
    Engines/ConcomitantDetectionEngine.cs
    Engines/ClinicalInferenceEngine.cs
    Scoring/ConfidenceScoringEngine.cs
    Scoring/HomeopathicWeightEngine.cs
    Explainability/ExplainabilityEngine.cs
    Learning/DoctorFeedbackLearningEngine.cs
    Retrieval/SubSectionLikeRetriever.cs
    Retrieval/RubricAliasRetriever.cs
    Retrieval/MetaphorDictionaryRetriever.cs
    Retrieval/JsonEmbeddingRetriever.cs
    Merging/RubricResultMerger.cs
  Repositories/AudioCaseIntelligence/
  Interfaces/AudioCaseIntelligence/
  DTOs/AudioCaseIntelligence/
  Configuration/RubricIntelligenceOptions.cs
  Prompts/  (versioned .txt templates)
```

---

## 4. Mandatory AI Components

All 13 engines **must** be implemented for V2 production sign-off.

| # | Engine | Responsibility | Primary Output |
|---|--------|----------------|----------------|
| 1 | Case Understanding Engine | Patient meaning, hidden symptoms, sequence | `ClinicalConcept[]` |
| 2 | Symptom Extraction Engine | Structured symptoms + searchTerms (enhance V1 GPT) | `SymptomModel[]` |
| 3 | Metaphor Interpretation Engine | Patient language → repertory meaning | Enriched concepts + dictionary hits |
| 4 | Clinical Reasoning Engine | Medical/clinical interpretation layer | Clinical meaning per concept |
| 5 | Homeopathic Reasoning Engine | SRP, hierarchy, homeopathic significance | Homeopathic meaning + weight |
| 6 | Causation Detection Engine | Cause → effect chains | `CausationLink[]` |
| 7 | Modality Detection Engine | Better/worse, time, weather, etc. | Modality tags on concepts |
| 8 | Concomitant Detection Engine | Co-occurring symptoms | Concomitant links |
| 9 | Rubric Alias Engine | Search `RubricAlias` + admin CRUD | Alias-matched candidates |
| 10 | Semantic Embedding Search Engine | JSON embedding cosine search | Embedding-ranked candidates |
| 11 | Confidence Scoring Engine | Hybrid score + calibration | 0–1 confidence per rubric |
| 12 | Explainability Engine | Why suggested payload for UI | Explainability DTO |
| 13 | Doctor Feedback Learning Engine | Accept/reject → improve alias/metaphor | Benchmark + learning queue |

**Note:** Engines 7–8 may share a base `ConceptEnrichmentEngine` internally but expose separate interfaces for testing and audit stage naming.

---

## 5. Database Design (MSSQL — Manual Deploy Only)

**Policy:** All scripts in `New_API/Database/Scripts/AudioCaseIntelligenceV2/` — executed manually by DBA. **Never auto-applied by application.**

### 5.1 Script Inventory

| Script | Type | Purpose |
|--------|------|---------|
| `001_Create_AudioCaseClinicalConcept.sql` | CREATE | Phase 1 concepts |
| `002_Create_AudioCaseIntelligenceLog.sql` | CREATE | Stage audit |
| `003_Create_RubricMetaphorDictionary.sql` | CREATE | Metaphors EN/HI/MR |
| `004_Create_RubricAlias.sql` | CREATE | Alias mappings |
| `005_Create_RubricEmbeddings.sql` | CREATE | JSON embeddings |
| `006_Create_HomeopathicWeightRule.sql` | CREATE | Configurable weights |
| `007_Create_AudioCaseCausationLink.sql` | CREATE | Causation chains |
| `008_Create_AudioCaseClinicalInferenceLog.sql` | CREATE | Inference audit |
| `009_Create_AudioCaseRubricFeedback.sql` | CREATE | Doctor feedback |
| `010_Create_AudioCaseRubricBenchmark.sql` | CREATE | Session metrics |
| `011_Create_RepertorySource.sql` | CREATE | Phase 9.1 |
| `012_Create_RubricRepertoryMap.sql` | CREATE | Kent/Complete map |
| `013_Create_RubricCrossReference.sql` | CREATE | Phase 9.3 |
| `101_Alter_AudioCaseRubricMatchLog_V2Columns.sql` | ALTER | Explainability columns |
| `102_Alter_AudioCaseSession_V2Columns.sql` | ALTER | EngineVersion, IntelligenceJson |
| `201_Indexes_All.sql` | INDEX | Performance indexes |
| `301_SP_SearchRubricAlias.sql` | PROC | Alias search |
| `302_SP_SearchMetaphorDictionary.sql` | PROC | Metaphor lookup |
| `401_Rollback_All_V2.sql` | ROLLBACK | Drop V2 objects (ordered) |
| `501_Seed_MetaphorDictionary_EN_HI_MR.sql` | SEED | Initial metaphors |
| `502_Seed_RubricAlias_Batch001.sql` | SEED | Initial aliases |
| `503_Seed_HomeopathicWeightRule.sql` | SEED | Default weights |
| `504_Seed_RepertorySource_Kent_Complete.sql` | SEED | Phase 9.1 |

### 5.2 Core Table: `RubricEmbeddings` (Locked Design)

```sql
CREATE TABLE dbo.RubricEmbeddings
(
    Id              BIGINT IDENTITY(1,1) NOT NULL,
    RubricId        INT NOT NULL,              -- SubSectionId FK
    EmbeddingJson   NVARCHAR(MAX) NOT NULL,    -- JSON array of floats [1536 dims]
    ModelName       NVARCHAR(100) NOT NULL,    -- text-embedding-3-small
    TextHash        CHAR(64) NOT NULL,         -- SHA256 of source text embedded
    SourceType      NVARCHAR(30) NOT NULL,    -- SubSectionName | Alias | Metaphor
    CreatedDate     DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedDate     DATETIME NULL,
    CONSTRAINT PK_RubricEmbeddings PRIMARY KEY (Id),
    CONSTRAINT FK_RubricEmbeddings_SubSection
        FOREIGN KEY (RubricId) REFERENCES dbo.SubSectionMaster (SubSectionId)
);
CREATE NONCLUSTERED INDEX IX_RubricEmbeddings_RubricId ON dbo.RubricEmbeddings (RubricId);
CREATE NONCLUSTERED INDEX IX_RubricEmbeddings_TextHash ON dbo.RubricEmbeddings (TextHash);
```

**Cosine similarity:** Computed in application layer (C#). Optional: cache hot index in memory on API startup refresh.

### 5.3 Table: `RubricAlias`

```sql
CREATE TABLE dbo.RubricAlias
(
    RubricAliasId     BIGINT IDENTITY(1,1) NOT NULL,
    SubSectionId      INT NOT NULL,
    AliasText         NVARCHAR(500) NOT NULL,
    NormalizedAlias   NVARCHAR(500) NOT NULL,
    Language          NVARCHAR(10) NOT NULL,       -- en, hi, mr, mixed
    AliasType         NVARCHAR(50) NOT NULL,       -- synonym, patient_phrase, clinical, translated
    Weight            DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    Source            NVARCHAR(50) NOT NULL,       -- manual, imported, ai_suggested, doctor_confirmed
    UsageCount        INT NOT NULL DEFAULT 0,
    AcceptanceRate    DECIMAL(5,4) NULL,
    IsActive          BIT NOT NULL DEFAULT 1,
    VersionNo         INT NOT NULL DEFAULT 1,
    EnteredBy         INT NULL,
    EnteredDate       DATETIME NOT NULL DEFAULT GETUTCDATE(),
    ChangedBy         INT NULL,
    ChangedDate       DATETIME NULL,
    CONSTRAINT PK_RubricAlias PRIMARY KEY (RubricAliasId),
    CONSTRAINT FK_RubricAlias_SubSection FOREIGN KEY (SubSectionId) REFERENCES dbo.SubSectionMaster (SubSectionId)
);
CREATE NONCLUSTERED INDEX IX_RubricAlias_Normalized ON dbo.RubricAlias (NormalizedAlias) WHERE IsActive = 1;
CREATE NONCLUSTERED INDEX IX_RubricAlias_SubSectionId ON dbo.RubricAlias (SubSectionId);
```

### 5.4 Table: `RubricMetaphorDictionary`

```sql
CREATE TABLE dbo.RubricMetaphorDictionary
(
    MetaphorId           BIGINT IDENTITY(1,1) NOT NULL,
    PatientExpression    NVARCHAR(500) NOT NULL,
    NormalizedExpression NVARCHAR(500) NOT NULL,
    ClinicalMeaning      NVARCHAR(1000) NOT NULL,
    RubricMeaning        NVARCHAR(500) NOT NULL,
    SubSectionId         INT NULL,
    Language             NVARCHAR(10) NOT NULL,
    ConfidenceWeight     DECIMAL(5,4) NOT NULL DEFAULT 0.85,
    ApprovalStatus       NVARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Approved, Rejected
    UsageCount           INT NOT NULL DEFAULT 0,
    AcceptanceRate       DECIMAL(5,4) NULL,
    VersionNo            INT NOT NULL DEFAULT 1,
    IsActive             BIT NOT NULL DEFAULT 1,
    EnteredBy            INT NULL,
    EnteredDate          DATETIME NOT NULL DEFAULT GETUTCDATE(),
    ApprovedBy           INT NULL,
    ApprovedDate         DATETIME NULL,
    CONSTRAINT PK_RubricMetaphorDictionary PRIMARY KEY (MetaphorId)
);
CREATE NONCLUSTERED INDEX IX_Metaphor_Normalized ON dbo.RubricMetaphorDictionary (NormalizedExpression, Language) WHERE IsActive = 1;
```

### 5.5 Table: `AudioCaseClinicalConcept`

```sql
CREATE TABLE dbo.AudioCaseClinicalConcept
(
    ConceptId            UNIQUEIDENTIFIER NOT NULL,
    AudioCaseSessionId   UNIQUEIDENTIFIER NOT NULL,
    RawStatement         NVARCHAR(1000) NOT NULL,
    ClinicalMeaning      NVARCHAR(2000) NULL,
    HomeopathicMeaning   NVARCHAR(2000) NULL,
    Category             NVARCHAR(50) NULL,
    IsSRP                BIT NOT NULL DEFAULT 0,
    ModalitiesJson       NVARCHAR(MAX) NULL,
    ConcomitantsJson     NVARCHAR(MAX) NULL,
    SequenceJson         NVARCHAR(MAX) NULL,
    Confidence           DECIMAL(5,4) NOT NULL,
    SourceLanguage       NVARCHAR(10) NULL,
    EnteredDate          DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_AudioCaseClinicalConcept PRIMARY KEY (ConceptId),
    CONSTRAINT FK_Concept_Session FOREIGN KEY (AudioCaseSessionId) REFERENCES dbo.AudioCaseSession (AudioCaseSessionId)
);
```

### 5.6 Table: `AudioCaseRubricFeedback`

```sql
CREATE TABLE dbo.AudioCaseRubricFeedback
(
    FeedbackId           BIGINT IDENTITY(1,1) NOT NULL,
    AudioCaseSessionId   UNIQUEIDENTIFIER NOT NULL,
    SubSectionId         INT NULL,
    RubricName           NVARCHAR(500) NOT NULL,
    FeedbackType         NVARCHAR(30) NOT NULL,  -- Accepted, Rejected, Corrected
    OriginalMatchLayer   NVARCHAR(50) NULL,
    CorrectedSubSectionId INT NULL,
    Reason               NVARCHAR(1000) NULL,
    ConfidenceAtFeedback DECIMAL(5,4) NULL,
    EngineVersion        NVARCHAR(10) NOT NULL,
    DoctorUserId         BIGINT NOT NULL,
    EnteredDate          DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_AudioCaseRubricFeedback PRIMARY KEY (FeedbackId)
);
```

### 5.7 Table: `AudioCaseRubricBenchmark`

```sql
CREATE TABLE dbo.AudioCaseRubricBenchmark
(
    BenchmarkId          BIGINT IDENTITY(1,1) NOT NULL,
    AudioCaseSessionId   UNIQUEIDENTIFIER NOT NULL,
    EngineVersion        NVARCHAR(10) NOT NULL,
    AiSuggestedCount     INT NOT NULL,
    DoctorAcceptedCount  INT NOT NULL,
    DoctorRejectedCount  INT NOT NULL,
    DoctorCorrectedCount INT NOT NULL,
    PrimaryInTop5        BIT NULL,
    PrecisionScore       DECIMAL(5,4) NULL,
    RecallScore          DECIMAL(5,4) NULL,
    F1Score              DECIMAL(5,4) NULL,
    AcceptanceRate       DECIMAL(5,4) NULL,
    FalsePositiveRate    DECIMAL(5,4) NULL,
    ConfidenceCalibration DECIMAL(5,4) NULL,
    CalculatedDate       DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_AudioCaseRubricBenchmark PRIMARY KEY (BenchmarkId)
);
```

### 5.8 Admin Audit: `RubricAdminAuditLog`

```sql
CREATE TABLE dbo.RubricAdminAuditLog
(
    AuditLogId     BIGINT IDENTITY(1,1) NOT NULL,
    EntityType     NVARCHAR(50) NOT NULL,   -- Alias, Metaphor, WeightRule
    EntityId       BIGINT NOT NULL,
    ActionType     NVARCHAR(30) NOT NULL,   -- Create, Update, Delete, Approve, Reject
    BeforeJson     NVARCHAR(MAX) NULL,
    AfterJson      NVARCHAR(MAX) NULL,
    AdminUserId    INT NOT NULL,
    IpAddress      NVARCHAR(45) NULL,
    EnteredDate    DATETIME NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_RubricAdminAuditLog PRIMARY KEY (AuditLogId)
);
```

### 5.9 ALTER Existing: `AudioCaseRubricMatchLog`

Add columns (nullable for backward compat):

- `ClinicalMeaning` NVARCHAR(1000)
- `HomeopathicMeaning` NVARCHAR(1000)
- `WhySuggested` NVARCHAR(2000)
- `ConfidenceScore` DECIMAL(5,4)
- `HomeopathicWeight` DECIMAL(5,2)
- `RubricTier` NVARCHAR(30)
- `MatchLayer` NVARCHAR(50)
- `RequiresManualApproval` BIT DEFAULT 1
- `CausationJson` NVARCHAR(MAX)
- `EngineVersion` NVARCHAR(10)

### 5.10 Gold Dataset Tables (Internal Benchmark)

```sql
CREATE TABLE dbo.GoldCaseLibrary
(
    GoldCaseId       BIGINT IDENTITY(1,1) NOT NULL,
    Category         NVARCHAR(50) NOT NULL,
    Transcript       NVARCHAR(MAX) NOT NULL,
    DoctorRubricsJson NVARCHAR(MAX) NOT NULL,
    PrimaryRubricIdsJson NVARCHAR(MAX) NOT NULL,
    FinalRemedy      NVARCHAR(200) NULL,
    FollowUpOutcome  NVARCHAR(1000) NULL,
    ReviewedBy       INT NULL,
    IsActive         BIT NOT NULL DEFAULT 1,
    EnteredDate      DATETIME NOT NULL DEFAULT GETUTCDATE()
);
```

---

## 6. API Design (Backward Compatible)

### 6.1 Existing Endpoints — UNCHANGED

| Method | Route | Change |
|--------|-------|--------|
| POST | `/api/AudioCaseTaking/upload` | None |
| GET | `/api/AudioCaseTaking/{id}/status` | None |
| GET | `/api/AudioCaseTaking/{id}/result` | **Additive JSON fields only** |
| GET | `/api/AudioCaseTaking/{id}/download` | None |
| POST | `/api/AudioCaseTaking/{id}/reanalyze` | None |
| POST | `/api/AudioCaseTaking/{id}/doctor-action` | None |
| GET | `/api/AudioCaseTaking/latest` | None |

### 6.2 Extended `suggestedRubrics[]` Fields (V2)

```json
{
  "subSectionId": 12345,
  "subSectionName": "GENERALITIES - CONVULSIONS - AURA",
  "matchScore": 0.92,
  "confidenceScore": 0.94,
  "suggestedIntensityNo": 3,
  "isAiSuggested": false,
  "matchSource": "Alias+Embedding",
  "matchLayer": "Hybrid",
  "rubricTier": "Primary",
  "patientStatement": "10 seconds before fit vibration starts in hands",
  "clinicalMeaning": "Prodromal aura before convulsive episode",
  "homeopathicMeaning": "Strange warning symptom before convulsion — SRP",
  "whySuggested": "Matched alias 'vibration before fit' + embedding similarity 0.91 to aura rubrics",
  "causationChain": null,
  "homeopathicWeight": 10.0,
  "requiresManualApproval": true,
  "engineVersion": "v2"
}
```

**Breaking change policy:** Old UI ignores new fields. **Remove auto-apply** for any rubric where `requiresManualApproval=true` (all V2 AI/inference rubrics).

### 6.3 New Endpoints — Doctor

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/AudioCaseTaking/{id}/concepts` | Clinical concepts + causation for timeline UI |
| POST | `/api/AudioCaseTaking/{id}/rubrics/feedback` | Accept / Reject / Correct with reason |
| POST | `/api/AudioCaseTaking/{id}/rubrics/approve-for-repertorize` | Explicit approval → then add to Repertorize |

**Approve flow (locked):**

```
1. GET /result → display suggestions (no auto-add to Repertorize for V2)
2. Doctor clicks Approve on rubric
3. POST /rubrics/approve-for-repertorize { subSectionId, intensityNo }
4. UI calls existing handleIntensityChipClick
5. POST /rubrics/feedback { Accepted }
```

### 6.4 New Endpoints — Admin

Base route: `/api/AudioCaseIntelligence/admin`  
Role: `Admin` or `ClinicalEditor`

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST/PUT/DELETE | `/aliases` | CRUD + version history |
| GET/POST/PUT | `/metaphors` | CRUD |
| POST | `/metaphors/{id}/approve` | Approve pending metaphor |
| POST | `/metaphors/{id}/reject` | Reject |
| GET | `/metaphors/stats` | Usage + accuracy |
| GET | `/benchmark/summary` | Platform metrics |
| GET | `/benchmark/trends` | Weekly acceptance |
| POST | `/embeddings/reindex` | Trigger embedding rebuild |
| GET | `/feedback/queue` | Low acceptance items for review |

### 6.5 New Endpoints — Monitoring / Rollback

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/AudioCaseIntelligence/health` | V2 engine status, last error |
| GET | `/api/AudioCaseIntelligence/config` | Read feature flags (admin) |
| PUT | `/api/AudioCaseIntelligence/config` | Toggle EnableV2 / RollbackToV1Only |

### 6.6 Swagger

- Tag groups: `AudioCaseTaking`, `AudioCaseIntelligence`, `AudioCaseIntelligenceAdmin`
- XML docs on all DTOs
- Example: epilepsy aura case for `/result` and `/concepts`

### 6.7 Retry Policies (Polly)

| Call | Retry |
|------|-------|
| OpenAI GPT | 3 retries, exponential backoff, jitter |
| OpenAI Embeddings | 3 retries |
| DB read | 2 retries transient errors |

Log failures to `AudioCaseIntelligenceLog` + structured Serilog.

---

## 7. UI Design (Doctor + Admin)

### 7.1 Doctor UI Changes

#### 7.1.1 Remove / Change V1 Behavior

| Current V1 | V2 Change |
|------------|-----------|
| Auto-apply rubrics on complete | **REMOVED** — manual approval required |
| Simple rubric table | Enhanced with explainability |

#### 7.1.2 `AudioCaseRubricSuggestions.js` (Redesign)

**Sections:**

1. **Primary Rubrics** (tier=Primary, confidence ≥90% green)
2. **Secondary Rubrics** (tier=Secondary, amber)
3. **Confirmatory Rubrics** (tier=Confirmatory)
4. **AI Inference Rubrics** (badge + requires approval)

**Per row:**

| Column | Content |
|--------|---------|
| Rubric name | SubSectionName |
| Confidence | Progress bar + % |
| Tier | Badge |
| Source | Database / Alias / Metaphor / Embedding / Inference |
| Actions | **Approve** \| **Reject** \| **Correct** (pick alternate rubric) |

**Expand row shows:**

- Patient Statement
- Clinical Meaning
- Homeopathic Meaning
- Why Suggested
- Causation chain (if any)

#### 7.1.3 New Components

| Component | Purpose |
|-----------|---------|
| `AudioCaseRubricExplainabilityPanel.js` | Full detail drawer/modal |
| `AudioCaseConceptTimeline.js` | Concepts + causation visualization |
| `AudioCaseRubricApprovalBar.js` | Approve/Reject/Correct actions |
| `AudioCaseConfidenceBadge.js` | Color-coded confidence |

#### 7.1.4 `AudioCaseProcessingStatus.js`

Show V2 stages when enabled:

```
Translating → Understanding Case → Interpreting Metaphors → Detecting Causation
→ Searching Repertory → Scoring → Ready for Review
```

#### 7.1.5 Repertorize Integration

- Only **approved** rubrics call `handleIntensityChipClick`
- AI/inference rubrics: `skipCommanUncommanRefresh: true`
- Show count: "3 approved / 12 suggested"

### 7.2 Admin UI (New Module)

**Route:** `/admin/rubric-intelligence`  
**Access:** Admin / Clinical Editor role

#### 7.2.1 Metaphor Management

| Feature | Description |
|---------|-------------|
| List | Filter by language, status, usage |
| Add | Patient expression → clinical → rubric meaning |
| Edit | Version increment + audit log |
| Approve/Reject | Pending queue |
| Stats | Usage count, acceptance rate per metaphor |

#### 7.2.2 Alias Management

| Feature | Description |
|---------|-------------|
| List | Search by alias text or SubSectionId |
| Add/Edit/Delete | With audit trail |
| Link to rubric | SubSection picker |
| Import CSV | Bulk alias import |
| Stats | Acceptance rate per alias |

#### 7.2.3 Benchmark Dashboard

| Widget | Metric |
|--------|--------|
| Acceptance rate (7/30 day) | Target ≥95% |
| Primary in top-5 | Target ≥95% |
| False positive rate | Target ≤5% |
| V1 vs V2 comparison | During rollout |
| Top rejected rubrics | Improvement queue |
| Engine latency P95 | Performance |
| OpenAI cost per case | Cost monitoring |

#### 7.2.4 System Controls

- Toggle `EnableV2` (with confirmation)
- **Rollback to V1 only** button (instant flag)
- Trigger embedding reindex
- View intelligence health

### 7.3 Redux State Additions

```javascript
{
  clinicalConcepts: [],
  causationLinks: [],
  rubricApprovalState: {},      // subSectionId → approved|rejected|pending
  approvedRubricsForRepertorize: [],
  engineVersion: 'v1' | 'v2',
  intelligenceProgressStep: null,
}
```

---

## 8. Implementation Roadmap

### Phase 0 — Foundation & Governance (Week 1–2)

- [ ] Final sign-off on this approval pack
- [ ] Create SQL script folder structure (no execution)
- [ ] Feature flags + orchestrator skeleton (V1 passthrough)
- [ ] Remove V1 auto-apply rubrics when V2 flag on (UI)
- [ ] Gold case library schema + import template
- [ ] CI: unit test project scaffold

**Deliverable:** Rollback-capable skeleton, zero regression.

### Phase 1 — Core Understanding (Week 3–5)

- [ ] SQL: ClinicalConcept, IntelligenceLog (manual run by DBA)
- [ ] Case Understanding Engine
- [ ] Symptom Extraction Engine (enhanced)
- [ ] Modality + Concomitant engines
- [ ] Clinical + Homeopathic reasoning engines
- [ ] GET `/concepts` endpoint
- [ ] Unit tests + 10 gold cases automated

### Phase 2 — Metaphor + Alias + Admin UI (Week 6–9)

- [ ] SQL: MetaphorDictionary, RubricAlias, AdminAuditLog
- [ ] Seed scripts EN/HI/MR (500+ metaphors)
- [ ] Metaphor + Alias engines + retrievers
- [ ] Admin UI: metaphor + alias CRUD
- [ ] Integration tests

### Phase 3 — Causation + Weight (Week 10–11)

- [ ] SQL: CausationLink, HomeopathicWeightRule
- [ ] Causation Detection Engine
- [ ] Homeopathic Weight Engine
- [ ] Concept timeline UI

### Phase 4 — JSON Embeddings + Hybrid Search (Week 12–14)

- [ ] SQL: RubricEmbeddings
- [ ] Embedding indexer background job
- [ ] Semantic Embedding Search Engine
- [ ] Hybrid scoring formula (40/30/20/10)
- [ ] Confidence Scoring Engine

### Phase 5 — Inference + Explainability (Week 15–17)

- [ ] Clinical Inference Engine (guarded)
- [ ] Explainability Engine
- [ ] Doctor UI: approve/reject/correct
- [ ] **No auto-apply** — manual approval flow
- [ ] ALTER AudioCaseRubricMatchLog script

### Phase 6 — Feedback + Benchmark (Week 18–20)

- [ ] SQL: Feedback, Benchmark, GoldCaseLibrary
- [ ] Doctor Feedback Learning Engine
- [ ] POST feedback + approve endpoints
- [ ] Admin benchmark dashboard
- [ ] Run 250 gold case evaluation

### Phase 7 — Repertory Phase 9.1 (Week 21–24)

- [ ] SQL: RepertorySource, RubricRepertoryMap
- [ ] Kent + Complete mapping import
- [ ] Primary/Secondary/Confirmatory tiers in UI

### Phase 8 — Production Rollout (Week 25–26)

- [ ] Enable V2 all doctors (flag on)
- [ ] Monitor dashboard 24/7 for 2 weeks
- [ ] Validate ≥95% both metrics on pilot production cases
- [ ] Senior homeopath sign-off

**Total duration:** ~26 weeks (6 months) for full V2 + Phase 9.1

---

## 9. Risk Assessment

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | GPT hallucinated rubrics | Medium | High | Quote anchoring; inference guards; manual approval only |
| R2 | Regression in V1 flow | Low | High | V1 always runs; feature flag rollback |
| R3 | Latency > 2 min unacceptable | Medium | Medium | Progress UI; parallel GPT; stage timeouts |
| R4 | OpenAI cost overrun | Medium | Medium | Per-session caps; embedding batch at night |
| R5 | Poor alias/metaphor seed quality | Medium | High | Admin UI; doctor feedback loop; gold case validation |
| R6 | JSON embedding perf at scale | Medium | Medium | In-memory cache; limit TopK; index by RubricId |
| R7 | Doctor workflow friction (manual approve) | Medium | Low | Good UX; bulk approve primary tier; still safer |
| R8 | Multilingual metaphor gaps | High | Medium | HI/MR seed priority; admin approve queue |
| R9 | False confidence calibration | Medium | High | Benchmark calibration metric; adjust weights |
| R10 | SQL manual deploy errors | Low | High | Rollback scripts; staged DBA review |
| R11 | All-doctor rollout incident | Low | Critical | Instant RollbackToV1Only flag + monitoring |
| R12 | Gold dataset bias | Medium | Medium | 5 categories × 50 cases; diverse reviewers |

**Overall risk rating:** Medium — manageable with feature flags, rollback, and phased gold validation.

---

## 10. Performance Impact Analysis

### 10.1 Latency Budget (V2 Enabled, Single Case)

| Stage | V1 (current) | V2 addition | Cumulative |
|-------|--------------|-------------|------------|
| Upload + save | 1–3s | — | 3s |
| Whisper translation | 15–40s | — | 43s |
| GPT extraction | 10–20s | — | 63s |
| Case understanding | — | 8–15s | 78s |
| Metaphor + causation | — | 8–12s | 90s |
| Hybrid retrieval | 2–5s | +3–8s embedding | 98s |
| Inference (conditional) | — | 5–10s | 108s |
| Scoring + explainability | — | 1–2s | 110s |

**Target P95:** ≤ 120 seconds end-to-end  
**Mitigation:** Parallel GPT calls (understanding + metaphor); cache embeddings in memory

### 10.2 Database Impact

| Operation | Frequency | Load |
|-----------|-----------|------|
| LIKE SubSectionMaster | Per search term | Existing |
| RubricAlias index seek | Per concept | Low–medium |
| Metaphor dictionary lookup | Per concept | Low |
| Load RubricEmbeddings | Per case (cached) | Medium memory |
| Insert intelligence logs | Per stage (~8/case) | Low write |

**Recommendation:** Load full embedding index into `IMemoryCache` refreshed nightly; ~10k rubrics × 1536 floats × 4 bytes ≈ 60MB manageable.

### 10.3 OpenAI Cost Estimate (Per Case)

| Call | Est. cost (USD) |
|------|-----------------|
| Whisper translation (5 min audio) | $0.03 |
| GPT extraction | $0.03–0.06 |
| Case understanding | $0.02–0.04 |
| Metaphor + causation | $0.02–0.04 |
| Inference (50% cases) | $0.01–0.02 |
| **Total per case** | **~$0.11–0.19** |

Embedding indexing: one-time/batch ~$0.50–2.00 per 10k rubrics (amortized nightly delta).

### 10.4 API Server Resources

| Resource | V1 | V2 delta |
|----------|-----|----------|
| CPU | Low | +20% during GPT wait (async) |
| RAM | ~200MB | +100–150MB embedding cache |
| Disk | Audio files | Unchanged |
| Network | OpenAI egress | +3–5 GPT calls per case |

### 10.5 UI Performance

- Explainability panels: lazy render on row expand
- Admin dashboard: paginated queries, aggregated benchmark SPs
- No blocking on Repertorize until explicit approve

---

## 11. Production Readiness Checklist

| Requirement | V2 Plan |
|-------------|---------|
| Clean Architecture | Section 3.5 folder structure |
| SOLID | One engine per responsibility |
| Repository Pattern | All new tables via repositories |
| CQRS | Commands vs queries separated for admin/feedback |
| Dependency Injection | All engines registered in ApplicationServiceExtensions |
| Feature Flags | RubricIntelligenceOptions + rollback flag |
| Structured Logging | Serilog + IntelligenceLog stages |
| Audit Logging | All existing + AdminAuditLog + Feedback |
| Retry Policies | Polly on OpenAI calls |
| Unit Tests | Per engine + gold case library |
| Integration Tests | Full pipeline mocked OpenAI |
| Swagger | All new endpoints documented |
| Performance Monitoring | Admin dashboard P95 latency |
| Exception Tracking | Existing logger + intelligence stage errors |
| Database Migration Scripts | Section 5.1 (manual) |
| Backward Compatibility | Section 6.1 contract |

---

## 12. Gold Standard Dataset Plan

### 12.1 Categories (250 minimum)

| Category | Count | Focus |
|----------|-------|-------|
| Epilepsy / neurological | 50 | Aura, convulsion, dropping things |
| Psychological | 50 | Fear, grief, anger causation |
| Gastrointestinal | 50 | Modalities, food desires |
| Pediatric | 50 | Age-specific expressions |
| Chronic | 50 | Long-term patterns |

### 12.2 Required Fields Per Case

```json
{
  "goldCaseId": 1,
  "category": "Epilepsy",
  "transcript": "English translated consultation...",
  "sourceLanguage": "mr",
  "doctorSelectedRubrics": [
    { "subSectionId": 0, "subSectionName": "...", "tier": "Primary" }
  ],
  "primaryRubricIds": [123, 456, 789],
  "finalRemedy": "Belladonna 1M",
  "followUpOutcome": "Reduced attack frequency 80% at 3 months",
  "reviewedBy": "Senior Homeopath Name",
  "reviewDate": "2026-06-01"
}
```

### 12.3 Evaluation Automation

Nightly job (or CI):

```
For each gold case:
  Run V2 pipeline (mock or live OpenAI)
  Check: primaryRubricIds ∩ top5Suggestions ≥ 95%
  Check: false positives not in rejected list
  Output: benchmark report JSON
```

---

## 13. Success Metrics & Go-Live Gates

### 13.1 Mandatory Metrics (Both Required)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Doctor acceptance rate | **≥ 95%** | Accepted / (Accepted + Rejected) |
| Primary rubric in top-5 | **≥ 95%** | Gold library + production feedback |
| False positive rate | **≤ 5%** | Rejected / Total suggested |
| Confidence calibration | **≥ 90%** | Predicted confidence vs actual acceptance |

### 13.2 Stretch Goal

**98%** acceptance on gold library after 6 months of feedback learning.

### 13.3 Go-Live Gates (EnableV2=true for All Doctors)

| Gate | Criteria |
|------|----------|
| G1 | Gold library automated eval ≥95% both metrics |
| G2 | 30-day pilot on production (all doctors) ≥93% both metrics |
| G3 | Zero P1 bugs in V1 regression tests |
| G4 | Rollback tested successfully in staging |
| G5 | DBA confirmed all V2 SQL scripts applied |
| G6 | Senior homeopath reviews 30 live cases |
| G7 | Admin UI operational for clinical team |
| G8 | Monitoring dashboard live |

---

## 14. Sign-Off Checklist

| Stakeholder | Role | Approve Architecture | Approve DB Scripts | Approve Go-Live |
|-------------|------|---------------------|-------------------|-----------------|
| Product Owner | | ☐ | ☐ | ☐ |
| Senior Homeopath | Clinical accuracy | ☐ | ☐ | ☐ |
| Tech Lead (API) | | ☐ | ☐ | ☐ |
| Tech Lead (UI) | | ☐ | ☐ | ☐ |
| DBA | Manual SQL | ☐ | ☐ | ☐ |
| QA Lead | Test plan | ☐ | ☐ | ☐ |

**Upon all checkboxes:** Implementation begins at **Phase 0** (Section 8).

---

## Appendix A — Hybrid Scoring Formula (Locked)

```
hybridScore =
    0.40 × embeddingCosineScore
  + 0.30 × aliasMatchScore
  + 0.20 × clinicalMeaningSimilarity
  + 0.10 × keywordLikeScore

finalRankScore = hybridScore × homeopathicWeight × causationMultiplier

confidenceScore = calibratedProbability(finalRankScore, historicalAcceptance)
```

## Appendix B — Manual Approval Flow (Locked)

```
Analysis Complete
  → Display suggested rubrics (NO auto-add to Repertorize)
  → Doctor reviews explainability
  → Doctor clicks Approve per rubric (or Reject/Correct)
  → Approved rubrics added to Repertorize via handleIntensityChipClick
  → Feedback stored for learning engine
```

## Appendix C — Rollback Procedure

1. Admin sets `RubricIntelligence:RollbackToV1Only = true`
2. API instantly uses V1 MatchRubrics only
3. UI hides V2 explainability (graceful degrade)
4. No database rollback required for emergency
5. Full DB rollback only if schema issue: run `401_Rollback_All_V2.sql`

---

**END OF APPROVAL PACK**

**Status:** Ready for stakeholder sign-off (Section 14).  
**Next action after approval:** Phase 0 implementation — feature flags, SQL script files (create only, no execute), remove V2 auto-apply, orchestrator skeleton.

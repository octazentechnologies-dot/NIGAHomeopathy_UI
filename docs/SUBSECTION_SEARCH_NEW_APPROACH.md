# Subsection / Rubric Search — New Approach

This document describes **only the new search approach** currently used by Patient Board.

It covers:

- Old API repertory search (`SearchNormalized` + SQL Server full-text + ancestor tree)
- New API keyword rubric search (`SearchRubricsByKeyword` contains + optional `sectionIds`)
- Frontend tabs/modules that call these APIs
- Database objects that make repertory search work

It does **not** document:

- Old `GET /api/mastersAPI/SubSectionsBySearch/{keyword}` (`SubSectionName.Contains`)
- Old `GetRubricByKeywordID` (mapped diagnosis-rubric tables)
- Audio Case / ECI / embedding / hotspot search (scripts 725/726)

---

## 1. Hosts and dual-API split

| Host | Codebase | Role in this search |
|---|---|---|
| `https://api.homeocentrum.com/api` | `Old-API/NIGA_OldAPI` | Repertory subsection search |
| `https://api1.homeocentrum.com/api` | `New-API/NIGA_NewAPI` | Clinical Pattern / Questions keyword rubric search |

UI wiring (`NIGAHomeopathy_UI/src/config.js` + `helpers/realbackend_helper.js`):

- `API_URL` → Old API client (`api.get`)
- `API_URL_NIGAHOMEOPATHY` → New API client (`nigahomeoAPI.get`)

Production comments in `config.js`:

- Old: `https://api.homeocentrum.com/api`
- New: `https://api1.homeocentrum.com/api`

Repertory tree search stays on Old API. Keyword rubric search was moved to New API.

---

## 2. API map (new approach only)

| Method | Path | Host | Patient Board tab | UI control |
|---|---|---|---|---|
| GET | `/api/subsection/SearchGlobal` | Old API | **Repertory** | Top toolbar: `Search subsection...` (autocomplete) |
| GET | `/api/subsection/SearchGlobalPaged` | Old API | **Repertory** | Same top search; fills SUB SECTION tree |
| GET | `/api/subsection/SearchBySection` | Old API | **Repertory** | SUB SECTION `Search...` (autocomplete) |
| GET | `/api/subsection/SearchBySectionPaged` | Old API | **Repertory** | SUB SECTION `Search...` (tree + infinite scroll) |
| GET | `/api/subsection/SearchRubricsByKeyword` | New API | **Clinical Pattern** | Keyword chip → RUBRICS WITH REMEDIES |
| GET | `/api/subsection/SearchRubricsByKeyword` | New API | **Questions** | Sub-group click → rubric list |

Companion APIs `SearchBySection` and `SearchGlobalPaged` are part of the same new Repertory engine. The UI always dual-calls:

- autocomplete API (`top=20`)
- paged tree API (`pageSize=40`)

---

## 3. New Repertory search (Old API)

### 3.1 Why this exists

The previous Repertory search scanned `SubSectionName` with `LIKE`/`Contains` and returned a flat list. That was slow on a large repertory and could not rebuild the parent tree.

The new approach:

1. Stores a normalized searchable copy of each rubric name
2. Uses SQL Server full-text (`CONTAINSTABLE`) ranked by `RANK`
3. Falls back to EF `LIKE` if full-text is empty/unavailable
4. Walks `ParentSubSectionID` and returns the ancestor chain so the UI can rebuild a tree

### 3.2 Database objects

Script: `Old-API/NIGA_OldAPI/Database/Scripts/SubSection_SearchNormalized_Setup.sql`  
Database: `HomeoCentrum_Production`  
Safe to re-run (existence checks on every step).

| Object | Type | Purpose |
|---|---|---|
| `dbo.fn_NormalizeSubSectionSearch` | scalar function | Same rules as C# `NormalizeSubSectionSearchText` |
| `SubSectionMaster.SearchNormalized` | `NVARCHAR(MAX)` | Indexed searchable copy of `SubSectionName` |
| `TR_SubSectionMaster_SearchNormalized` | AFTER INSERT/UPDATE trigger | Keeps `SearchNormalized` in sync |
| `FT_SubSectionCatalog` | full-text catalog | Catalog for the index |
| Full-text index on `SearchNormalized` | FTS index, `CHANGE_TRACKING AUTO` | Powers `CONTAINSTABLE` |

Normalization rules (SQL function **and** C# **and** frontend highlighter):

1. Lowercase
2. Replace `- , . : ;` with space
3. Split glued time tokens: `3pm` → `3 pm`, `3am` → `3 am`
4. Collapse extra whitespace
5. Trim

Backfill:

```sql
UPDATE dbo.SubSectionMaster
SET SearchNormalized = dbo.fn_NormalizeSubSectionSearch(SubSectionName)
WHERE DeleteStatus = 0
  AND (
        SearchNormalized IS NULL
        OR SearchNormalized <> dbo.fn_NormalizeSubSectionSearch(SubSectionName)
      );
```

Entity mapping:

- `NIGA.Centrum.Entity.DataModels.SubSectionMaster.SearchNormalized`
- EF context: `NIGACentrumContext` maps the column and registers query type `SubSectionSearchMatchRow`

### 3.3 Shared C# pipeline

Files:

- Controller: `Old-API/NIGA_OldAPI/NIGA.Centrum.API/Controllers/SubSectionController.cs` (`[Authorize]`)
- Service: `Old-API/NIGA_OldAPI/NIGA.Centrum.Business/Implementation/SubSectionService.cs`
- Interface: `ISubSectionService`
- Models: `SubSectionSearchResultModel`, `SubSectionSearchPagedResultModel`, `SubSectionLevelModel`
- Match row: `SubSectionSearchMatchRow`

All four Repertory APIs share:

- Non-paged: `SearchSubSectionsInternalAsync(sectionId?, query, top, scope)`
- Paged: `SearchSubSectionsPagedInternalAsync(sectionId?, query, pageNumber, pageSize, scope)`

`SearchGlobal*` passes `sectionId = null`.  
`SearchBySection*` requires `sectionId > 0`.

#### Step A — validate

- Empty / whitespace → empty result
- Trim; length must be **≥ 2**
- `SearchGlobal` `top` clamped to **5–20**
- `SearchBySection` `top` clamped to **5–100**
- Paged: `pageNumber ≥ 1`, `pageSize` clamped **10–100**
- `SearchBySectionPaged` with `sectionId ≤ 0` → HTTP 400 `"sectionId is required"`
- Search exceptions return **empty list/object**, not 500
- Global search command timeout = **45s**; section-scoped = **30s**

#### Step B — tokenize

C# helpers:

- `NormalizeSubSectionSearchText(query)`
- `GetSearchWords(normalizedQuery)`

Stop words dropped:

```text
a an the of in on at for to from and or is are with by as be was were
```

Rules after normalize:

- Split on space
- Keep words with length ≥ 2
- Drop stop words
- Distinct

Example: `mind fear`

1. Normalize → `mind fear`
2. Words → `["mind", "fear"]`
3. Full-text query → `"mind*" OR "fear*"`

#### Step C — memory cache (5 minutes)

`IMemoryCache`. Only **non-empty** results are stored.

| Scope | Key shape |
|---|---|
| Global autocomplete | `subsection_search_global_{query}_{top}` |
| Section autocomplete | `subsection_search_section_{sectionId}_{query}_{top}` |
| Global paged | `subsection_search_paged_global_{query}_{page}_{pageSize}` |
| Section paged | `subsection_search_paged_section_{sectionId}_{query}_{page}_{pageSize}` |

Query in the key is `ToLowerInvariant()`.

#### Step D — primary search: `CONTAINSTABLE`

```sql
SELECT TOP (@Top)                          -- non-paged
    s.SubSectionID AS SubSectionId,
    s.SubSectionName AS SubSectionName,
    s.ParentSubSectionID AS ParentSubSectionId,
    ft.RANK AS Rank
FROM dbo.SubSectionMaster s
INNER JOIN CONTAINSTABLE(dbo.SubSectionMaster, SearchNormalized, @SearchQuery) ft
    ON s.SubSectionID = ft.[KEY]
WHERE s.DeleteStatus = 0
  AND s.SectionID = @SectionId             -- section-scoped only
ORDER BY ft.RANK DESC
OFFSET {offset} ROWS FETCH NEXT {pageSize} ROWS ONLY   -- paged only
```

Notes:

- Prefix match: `"mind*"` matches `mind`, `minded`, `mind-fear` after normalization
- Multi-word FTS uses **OR**, not AND
- Ranked by SQL Server `RANK` descending
- `OFFSET/FETCH` values are **inlined**, not SQL parameters, because EF Core 2.2 `FromSql` does not bind `@Offset/@PageSize` correctly
- Count query uses the same join and `COUNT(*)` via a raw `DbCommand` (not `FromSql`)

#### Step E — fallback: EF LIKE (AND)

Used when:

- `CONTAINSTABLE` throws (FTS missing / syntax)
- FTS count is 0
- FTS count > 0 but the OFFSET page returns no rows (known EF Core 2.2 `FromSql` issue)

For **each** word:

```text
SearchNormalized LIKE '%word%'
OR SubSectionName LIKE '%word%'
```

Words are combined with **AND**. So LIKE fallback for `mind fear` requires **both** tokens.

LIKE orders by `SubSectionName`, not rank. `Rank` is returned as `0`.

This is stricter than FTS OR. A query that hits on FTS as “mind **or** fear” may return fewer (or zero) rows on LIKE fallback.

#### Step F — ancestor tree

`BuildSearchResultsWithAncestorsAsync`:

1. Take match IDs (seed)
2. `LoadSubSectionTreeNodesAsync` loads those rows, then walks `ParentSubSectionId` upward
3. Batch size 200, max 50 hops, cycle-safe (`HashSet`)
4. Seed load is capped at **50** distinct IDs (page size 40 fits)
5. Child counts: group non-deleted children whose parent is in the loaded set
6. For each match, insert ancestors from root → parent

Response item:

```json
{
  "subSectionId": 123,
  "subSectionName": "MIND - FEAR - DEATH",
  "parentSubSectionId": 45,
  "childCount": 3,
  "ancestors": [
    { "subSectionId": 10, "subSectionName": "MIND", "childCount": 80 },
    { "subSectionId": 45, "subSectionName": "MIND - FEAR", "childCount": 12 }
  ]
}
```

If ancestor walk fails, the match is still returned with `ancestors: []` and `childCount: 0`.

Paged wrapper:

```json
{
  "items": [ /* SubSectionSearchResultModel */ ],
  "totalCount": 123,
  "pageNumber": 1,
  "pageSize": 40,
  "hasMore": true
}
```

`hasMore` = `pageNumber * pageSize < totalCount`.

---

## 4. `GET /api/subsection/SearchBySectionPaged`

Example:

```text
GET https://api.homeocentrum.com/api/subsection/SearchBySectionPaged
    ?sectionId=1
    &query=mind%20fear
    &pageNumber=1
    &pageSize=40
```

### Backend

1. `sectionId` required (`> 0`)
2. `SearchBySectionPagedAsync(1, "mind fear", 1, 40)`
3. Shared paged pipeline with `scope = "section"`
4. FTS + section filter `s.SectionID = 1`
5. Page 1 → `OFFSET 0 FETCH NEXT 40`
6. Attach ancestors
7. Cache key: `subsection_search_paged_section_1_mind fear_1_40`

### Frontend

**Module:** Patient Board  
**Tab:** Repertory  
**File:** `src/pages/Doctor/PatientBoard/PatientBoard.js`  
**Helpers:** `src/utils/subSectionSearchUtils.js`  
**HTTP:** `searchSubSectionsBySectionPaged` → Old API

UI:

- SUB SECTION column search box (`placeholder="Search..."`)
- Disabled until a SECTION is selected
- Tooltip: “Please select section first”

On debounce (300ms, min 2 characters), UI fires **both**:

```text
SearchBySection?sectionId=1&query=mind fear&top=20
SearchBySectionPaged?sectionId=1&query=mind fear&pageNumber=1&pageSize=40
```

| Call | UI use |
|---|---|
| `SearchBySection` | Suggestion dropdown (max 20 unique) |
| `SearchBySectionPaged` | Rebuilds SUB SECTION tree from `ancestors` |

Infinite scroll (`InfiniteScrollContainer`) loads page 2, 3, … of `SearchBySectionPaged` and merges by `subSectionId` (`mergeSubSectionSearchResultPages`).

Global search and section search **cannot run together**. Typing in one clears the other and restores the baseline main-parent tree when the query drops below 2 characters.

---

## 5. `GET /api/subsection/SearchGlobal`

Example:

```text
GET https://api.homeocentrum.com/api/subsection/SearchGlobal
    ?query=mind%20fear
    &top=20
```

### Backend

1. `SearchGlobalAsync("mind fear", 20)`
2. Shared non-paged pipeline with `sectionId = null`, `scope = "global"`
3. `top` clamped to max **20**
4. FTS `"mind*" OR "fear*"` across **all** non-deleted subsections
5. `TOP 20` ordered by `RANK DESC`
6. Ancestor chains attached
7. Timeout 45s
8. Cache key: `subsection_search_global_mind fear_20`

Returns `List<SubSectionSearchResultModel>` (not paged). On exception: empty list.

### Frontend

**Module:** Patient Board  
**Tab:** Repertory  
**Control:** top toolbar `Search subsection...`

On debounce the UI fires **both**:

```text
SearchGlobal?query=mind fear&top=20
SearchGlobalPaged?query=mind fear&pageNumber=1&pageSize=40
```

| Call | UI use |
|---|---|
| `SearchGlobal` | Floating suggestion portal (highlighted tokens) |
| `SearchGlobalPaged` | Replaces the whole SUB SECTION tree with matches from **any** section |

If this fails, SweetAlert:

> Global subsection search timed out or failed. Please ensure SearchNormalized is configured on the server, or try a more specific term.

Clicking a suggestion calls `handleSubSectionClick` → Old API `getRubricDetails/{subSectionId}`.

---

## 6. Repertory frontend tree rebuild

File: `src/utils/subSectionSearchUtils.js`

Constants:

| Constant | Value | Used by |
|---|---|---|
| `MIN_SUBSECTION_SEARCH_LENGTH` | 2 | Both Repertory boxes |
| `SUBSECTION_SEARCH_DEBOUNCE_MS` | 300 | Debounce |
| `SUBSECTION_SEARCH_TOP` | 20 | Autocomplete APIs |
| `SUBSECTION_SUGGESTION_DISPLAY` | 20 | Dropdown cap |
| `SUBSECTION_TREE_PAGE_SIZE` | 40 | Paged tree APIs |
| `MAX_SUBSECTION_TREE_DEPTH` | 50 | Cycle guard |

`buildSubSectionSearchTree(searchResults)`:

1. For each hit, chain = `ancestors[]` + match
2. First node in chain becomes a tree root
3. Link parent → child; skip cycles
4. Auto-expand every node on a matching path
5. Display name strips parent prefix (`MIND - FEAR` under `MIND` shows as `FEAR`)
6. Highlighter uses the same normalize/token rules as the API

Baseline tree (no search) still comes from Old API `getMainParentSubSectionsWithChildCount(sectionId)`. Search results replace that tree until the query is cleared.

---

## 7. New keyword rubric search (New API)

This is a **different** new approach from Repertory FTS.

It does **not** use `SearchNormalized`, `CONTAINSTABLE`, rank, or ancestors.

It replaced Clinical Pattern’s mapped lookup `GetRubricByKeywordID` (Old API joins diagnosis-rubric mapping tables). The new API searches **live** `SubSectionMaster` by keyword text.

New API `SubSectionMaster` entity has **no** `SearchNormalized` column mapped.

### 7.1 Endpoint

```text
GET /api/subsection/SearchRubricsByKeyword
    ?keyword={text}
    &pageNumber=1
    &pageSize=10
    &sectionIds=1
    &sectionIds=41
```

Files:

- Controller: `New-API/NIGA_NewAPI/Niga-Web/Controllers/SubSectionController.cs`
- Repository: `New-API/NIGA_NewAPI/Niga-Domain/Repositories/SubSectionRepository.cs`  
  class name is `SubSectionService : ISubSectionRepository`
- DTOs: `RubricKeywordSearchPagedResponse`, `RubricKeywordModel`

Controller notes:

- Keyword required; blank → HTTP 400 `"Keyword is required."`
- `[Authorize]` is commented out on this controller
- ACL still lists this as a doctor-read API (`AdminAclController` W1)

Frontend serializes arrays as repeated keys (ASP.NET Core `List<int>` binding):

```text
sectionIds=1&sectionIds=41
```

Implemented in `src/helpers/api_helper.js` `createAPIHelpers.get`.

### 7.2 Query logic

```text
FROM SubSectionMaster sub
JOIN SectionMaster sec ON sub.SectionId = sec.SectionId
WHERE sub.DeleteStatus = false
  AND sec.DeleteStatus = false
  AND sub.SectionId IS NOT NULL
  AND (
        sub.SubSectionName.ToLower().Contains(keyword.ToLower())
     OR sec.SectionName.ToLower().Contains(keyword.ToLower())
      )
  AND (no sectionIds OR sub.SectionId IN sectionIds)
ORDER BY sub.SubSectionName
```

Then `PagedList<T>.CreateAsync`:

1. `COUNT(*)`
2. `Skip((pageNumber-1)*pageSize).Take(pageSize)`

`sectionIds` handling:

- Null / empty → no section filter (all sections)
- Values `≤ 0` dropped
- Distinct

Match type is **substring**, not word-boundary and not FTS prefix.  
`Father` also matches `Grandfather`.  
`Convulsion` matches any rubric or section name containing that string.

No ranking. Alphabetical by `SubSectionName`.

Remedies are **not** loaded here (`tabRubricRemedyData` is empty). Clicking a result calls Old API `getRubricDetails/{subSectionId}`.

### 7.3 Response

```json
{
  "items": [
    {
      "keywordID": 0,
      "sectionID": 1,
      "subSectionID": 12345,
      "sectionName": "MIND",
      "sectionNameAlias": "...",
      "subSectionName": "MIND - FEAR - FATHER",
      "subSectionNameAlias": "...",
      "tabRubricRemedyData": []
    }
  ],
  "pageNumber": 2,
  "pageSize": 10,
  "totalCount": 87,
  "hasMore": true
}
```

`hasMore` = `CurrentPage < TotalPages`.

Frontend normalizer: `normalizeClinicalPatternRubricPagedResponse` (accepts camelCase or PascalCase).  
Merge helper: `mergeClinicalPatternRubricPages` keyed by `subSectionID` / `subSectionId`.

Page size constant: `CLINICAL_PATTERN_RUBRIC_PAGE_SIZE = 10`.

---

## 8. `GET SearchRubricsByKeyword?keyword=Father&pageNumber=2&pageSize=10`

No `sectionIds` → search **all** sections.

Contains `"father"` in **either** rubric name **or** section name.  
Page 2 = skip 10, take 10.

### Clinical Pattern tab

**Module:** Patient Board → tab `Clinical Pattern`  
**File:** `PatientBoard.js` → `handleKeywordClick`  
**Redux thunk:** `src/slices/doctor/patientdashboard/thunk.js` → `searchRubricsByKeyword`  
**HTTP:** `nigahomeoAPI.get(SEARCH_RUBRICS_BY_KEYWORD)`

Flow:

1. Doctor selects a diagnosis
2. Selects a keyword tab (Causations, Symptoms, Pathology, …)
3. Old API `GetDiagnosisKeywordByTab` returns keywords **plus** `SectionIds` from table `DiagnosisKeywordSection`
4. Click keyword chip: `handleKeywordClick(keyword, sectionIds)`
5. If that keyword has **no** linked sections, this unfiltered call is used
6. Results render in **RUBRICS WITH REMEDIES**
7. Infinite scroll loads page 2, 3, … (`append: true`)

### Questions tab

**Module:** Patient Board → tab `Questions`  
**File:** `PatientBoard.js` → `fetchQuestionsRubricsBySubgroup` / `handleSubGroupClick`

Flow:

1. Question Section → Question Group → Sub Group
2. Sub-group **name** is the keyword (`"Father"`)
3. Click sub-group → `searchRubricsByKeyword({ keyword, pageSize: 10, sectionIds })`
4. If the sub-group has no mapped sections, same unfiltered call
5. Same infinite scroll (`pageSize=10`)

---

## 9. `GET SearchRubricsByKeyword?keyword=Convulsion&pageNumber=3&pageSize=10&sectionIds=1&sectionIds=41`

Same contains search, plus:

```text
SectionId IN (1, 41)
```

Page 3 = skip 20, take 10, still only inside those sections.

### Where `sectionIds` come from

| Tab | Source | Admin mapping |
|---|---|---|
| Clinical Pattern | `DiagnosisKeywordSection` (Old API) | Each diagnosis keyword can be linked to one or more repertory sections |
| Questions | Question-subgroup ↔ section link (`QuestionSubGroup.SectionIds`) | Each sub-group can be linked to one or more sections |

UI:

- Clinical Pattern: `handleKeywordClick("Convulsion", [1, 41])`
- Questions: `handleSubGroupClick(..., "Convulsion", [1, 41])`

Invalid/empty arrays are omitted (`undefined`), which produces the unfiltered form in section 8.

---

## 10. Frontend HTTP helpers

`src/helpers/url_helper.js`:

```text
SEARCH_SUBSECTION_GLOBAL            = /subsection/SearchGlobal
SEARCH_SUBSECTION_BY_SECTION_PAGED  = /subsection/SearchBySectionPaged
SEARCH_SUBSECTION_GLOBAL_PAGED      = /subsection/SearchGlobalPaged
SEARCH_SUBSECTION_BY_SECTION        = /subsection/SearchBySection
SEARCH_RUBRICS_BY_KEYWORD           = /subsection/SearchRubricsByKeyword
```

`src/helpers/realbackend_helper.js`:

```text
searchSubSectionsGlobal            → api.get            (Old API)
searchSubSectionsBySection         → api.get            (Old API)
searchSubSectionsBySectionPaged    → api.get            (Old API)
searchSubSectionsGlobalPaged       → api.get            (Old API)
searchRubricsByKeyword             → nigahomeoAPI.get   (New API)
```

Bearer token is attached from `sessionStorage.authUser` on both clients.

---

## 11. End-to-end

### `mind fear` on Repertory

1. Doctor types in top box or SUB SECTION box (min 2 chars, 300ms debounce)
2. Old API normalizes, drops stop words, builds `"mind*" OR "fear*"`
3. `CONTAINSTABLE` on `SearchNormalized` (LIKE AND fallback)
4. Ranked hits + ancestor path
5. Dropdown from `SearchGlobal` / `SearchBySection` (20)
6. Tree from paged API (40, infinite scroll)
7. Click suggestion/tree node → Old API `getRubricDetails`

### `Father` / `Convulsion` on Clinical Pattern or Questions

1. Keyword chip or sub-group click
2. New API `Contains` on `SubSectionName` **or** `SectionName`
3. Optional `sectionIds` from admin mapping
4. Page size 10, infinite scroll
5. Click rubric → Old API `getRubricDetails`

---

## 12. Code index

### Old API (Repertory FTS)

- `NIGA.Centrum.API/Controllers/SubSectionController.cs` — `Search`, `SearchBySection`, `SearchGlobal`, `SearchGlobalPaged`, `SearchBySectionPaged`
- `NIGA.Centrum.Business/Implementation/SubSectionService.cs` — normalize, FTS, LIKE, cache, ancestor walk
- `NIGA.Centrum.Business/Interface/ISubSectionService.cs`
- `NIGA.Centrum.Model/SubSectionModel.cs` — search DTOs
- `NIGA.Centrum.Entity/DataModels/SubSectionMaster.cs` — `SearchNormalized`
- `NIGA.Centrum.Entity/DataModels/SubSectionSearchMatchRow.cs`
- `Database/Scripts/SubSection_SearchNormalized_Setup.sql`

### New API (keyword contains)

- `Niga-Web/Controllers/SubSectionController.cs` — `SearchRubricsByKeyword`
- `Niga-Domain/Repositories/SubSectionRepository.cs` — `SearchRubricsByKeywordAsync`
- `Niga-Domain/Interfaces/ISubSectionRepository.cs`
- `Niga-Domain/DTOs/RubricKeywordModel.cs`
- `Niga-Domain/DTOs/RubricKeywordSearchPagedResponse.cs`
- `Niga-Domain/Helpers/PagedList.cs`

### UI

- `src/pages/Doctor/PatientBoard/PatientBoard.js` — Repertory / Clinical Pattern / Questions
- `src/utils/subSectionSearchUtils.js` — normalize, tree, paging, highlight
- `src/slices/doctor/patientdashboard/thunk.js` — `searchRubricsByKeyword`
- `src/helpers/url_helper.js`
- `src/helpers/realbackend_helper.js`
- `src/helpers/api_helper.js` — array query serialization
- `src/config.js` — dual host

### Related mapping sources (not search itself)

- `DiagnosisKeywordSection` — Clinical Pattern keyword → section filter
- `QuestionSubGroup.SectionIds` — Questions sub-group → section filter

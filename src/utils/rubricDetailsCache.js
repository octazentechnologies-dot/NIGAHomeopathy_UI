const STORAGE_KEY = 'rubricDetailsCache:v8';
const MAX_ENTRIES = 1000;
const CACHE_VERSION = 'v8';
export const INITIAL_RUBRIC_PREFETCH_LIMIT = 15;
export const SCROLL_RUBRIC_PREFETCH_BATCH = 8;

export const getRubricDetailsCacheKey = (subSectionId) =>
  `${CACHE_VERSION}:${subSectionId}`;

const memoryCache = new Map();
let storageLoaded = false;

const normalizeSubSectionId = (subSectionId) => {
  const id = Number(subSectionId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const pruneCache = (cacheObject) => {
  const entries = Object.entries(cacheObject);
  if (entries.length <= MAX_ENTRIES) {
    return cacheObject;
  }
  entries.sort((a, b) => (b[1]?._cachedAt ?? 0) - (a[1]?._cachedAt ?? 0));
  return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
};

const loadFromSessionStorage = () => {
  if (storageLoaded || typeof window === 'undefined') {
    return;
  }
  storageLoaded = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    Object.entries(parsed).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        memoryCache.set(key, value);
      }
    });
  } catch {
    /* ignore corrupt cache */
  }
};

const persistToSessionStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    const payload = Object.fromEntries(memoryCache.entries());
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pruneCache(payload)));
  } catch {
    /* quota exceeded — memory cache still works */
  }
};

export const getCachedRubricDetails = (subSectionId) => {
  const id = normalizeSubSectionId(subSectionId);
  if (!id) return null;
  loadFromSessionStorage();
  return memoryCache.get(getRubricDetailsCacheKey(id)) ?? null;
};

export const setCachedRubricDetails = (subSectionId, data) => {
  const id = normalizeSubSectionId(subSectionId);
  if (!id || !data) return;
  loadFromSessionStorage();
  const entry = { ...data, _cachedAt: Date.now() };
  memoryCache.set(getRubricDetailsCacheKey(id), entry);
  persistToSessionStorage();
};

export const prefetchRubricDetailsIds = new Set();

export const markPrefetchQueued = (subSectionId) => {
  const id = normalizeSubSectionId(subSectionId);
  if (!id) return false;
  const key = getRubricDetailsCacheKey(id);
  if (memoryCache.has(key) || prefetchRubricDetailsIds.has(id)) {
    return false;
  }
  prefetchRubricDetailsIds.add(id);
  return true;
};

export const unmarkPrefetchQueued = (subSectionId) => {
  const id = normalizeSubSectionId(subSectionId);
  if (id) prefetchRubricDetailsIds.delete(id);
};

export const collectSubSectionIdsFromTree = (nodes, limit = INITIAL_RUBRIC_PREFETCH_LIMIT) => {
  if (!Array.isArray(nodes) || !nodes.length) return [];
  const ids = [];
  const queue = [...nodes];
  while (queue.length > 0 && ids.length < limit) {
    const node = queue.shift();
    const id = normalizeSubSectionId(node?.subSectionId ?? node?.SubSectionId);
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
    const children = node?.subSectionList ?? node?.children;
    if (Array.isArray(children)) {
      queue.push(...children);
    }
  }
  return ids;
};

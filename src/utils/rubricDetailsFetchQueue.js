const MAX_CONCURRENT_PREFETCH = 4;

const inFlightById = new Map();
const pendingPrefetches = [];
let activePrefetchCount = 0;

const normalizeSubSectionId = (subSectionId) => {
  const id = Number(subSectionId);
  return Number.isFinite(id) && id > 0 ? id : null;
};

const startFetch = (subSectionId, execute, { countsAgainstPrefetch = false } = {}) => {
  const existing = inFlightById.get(subSectionId);
  if (existing) {
    return existing;
  }

  const promise = Promise.resolve()
    .then(() => execute())
    .finally(() => {
      inFlightById.delete(subSectionId);
      if (countsAgainstPrefetch && activePrefetchCount > 0) {
        activePrefetchCount -= 1;
      }
      drainPrefetchQueue();
    });

  inFlightById.set(subSectionId, promise);
  return promise;
};

const drainPrefetchQueue = () => {
  while (activePrefetchCount < MAX_CONCURRENT_PREFETCH && pendingPrefetches.length > 0) {
    const task = pendingPrefetches.shift();
    const id = normalizeSubSectionId(task.subSectionId);
    if (!id) {
      task.reject(new Error('Invalid subsection id'));
      continue;
    }
    if (inFlightById.has(id)) {
      inFlightById.get(id).then(task.resolve).catch(task.reject);
      continue;
    }
    activePrefetchCount += 1;
    startFetch(id, task.execute, { countsAgainstPrefetch: true }).then(task.resolve).catch(task.reject);
  }
};

export const getQueuedRubricDetailsFetch = (subSectionId) => {
  const id = normalizeSubSectionId(subSectionId);
  if (!id) return null;
  return inFlightById.get(id) ?? null;
};

export const fetchRubricDetailsWithPriority = (subSectionId, execute, { priority = 'low' } = {}) => {
  const id = normalizeSubSectionId(subSectionId);
  if (!id) {
    return Promise.reject(new Error('Invalid subsection id'));
  }

  const existing = inFlightById.get(id);
  if (existing) {
    return existing;
  }

  if (priority === 'high') {
    const pendingIndex = pendingPrefetches.findIndex((task) => task.subSectionId === id);
    if (pendingIndex >= 0) {
      pendingPrefetches.splice(pendingIndex, 1);
    }
    return startFetch(id, execute);
  }

  return new Promise((resolve, reject) => {
    if (pendingPrefetches.some((task) => task.subSectionId === id)) {
      resolve(null);
      return;
    }
    pendingPrefetches.push({ subSectionId: id, execute, resolve, reject });
    drainPrefetchQueue();
  });
};

export const cancelPendingPrefetches = () => {
  pendingPrefetches.length = 0;
};

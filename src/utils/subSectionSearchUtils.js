export const MIN_SUBSECTION_SEARCH_LENGTH = 2;
/** Shorter debounce = snappier typeahead (Google-style). */
export const SUBSECTION_SEARCH_DEBOUNCE_MS = 180;
/** Suggestion request size — smaller TOP keeps SQL + payload fast. */
export const SUBSECTION_SEARCH_TOP = 12;
export const SUBSECTION_SUGGESTION_DISPLAY = 12;
export const SUBSECTION_TREE_PAGE_SIZE = 30;
export const CLINICAL_PATTERN_RUBRIC_PAGE_SIZE = 10;
export const MAX_SUBSECTION_TREE_DEPTH = 50;

function wouldCreateSubSectionTreeCycle(parentId, childId, childrenMap) {
  if (parentId == null || childId == null) return true;
  if (String(parentId) === String(childId)) return true;

  const stack = [childId];
  const seen = new Set();
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId == null || seen.has(String(currentId))) continue;
    if (String(currentId) === String(parentId)) return true;
    seen.add(String(currentId));
    const children = childrenMap.get(currentId) || [];
    children.forEach((child) => {
      if (child?.subSectionId != null) {
        stack.push(child.subSectionId);
      }
    });
  }
  return false;
}

/**
 * Suggestions are shown when ALL of the following are true:
 * - Query has at least MIN_SUBSECTION_SEARCH_LENGTH characters (after trim)
 * - Only one search mode is active: global OR section-scoped (never both)
 * - Section-scoped search also requires a selected section
 * - Debounced API returned at least one match
 * - Dropdown stays open while typing/focused; closes on outside click or selection
 */

export function normalizeSubSectionSearchText(input) {
  if (!input) return '';
  let normalized = String(input).toLowerCase();
  normalized = normalized.replace(/[-,.\:;]/g, ' ');
  normalized = normalized.replace(/(\d)\s*pm\b/g, '$1 pm');
  normalized = normalized.replace(/(\d)\s*am\b/g, '$1 am');
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized.trim();
}

export function getSubSectionTreeDisplayName(fullName, parentFullName) {
  const name = String(fullName || '').trim();
  const parent = String(parentFullName || '').trim();
  if (!name) return '';
  if (!parent) return name;

  const parentPrefix = `${parent}-`;
  if (name.startsWith(parentPrefix)) {
    return name.slice(parentPrefix.length);
  }

  return name;
}

export function highlightSubSectionTreeLabel(fullName, parentFullName, query) {
  const name = String(fullName || '');
  const displayName = getSubSectionTreeDisplayName(name, parentFullName);
  if (!query?.trim()) return displayName;

  const highlighted = highlightSubSectionSuggestion(name, query);
  if (!Array.isArray(highlighted)) return displayName;

  const parent = String(parentFullName || '').trim();
  const parentPrefix = parent ? `${parent}-` : '';
  const sliceStart = parent && name.startsWith(parentPrefix) ? parentPrefix.length : 0;

  if (sliceStart === 0) {
    return highlighted;
  }

  const slicedParts = [];
  let cursor = 0;

  highlighted.forEach((part) => {
    const partStart = cursor;
    const partEnd = cursor + part.text.length;
    cursor = partEnd;

    if (partEnd <= sliceStart) return;

    let text = part.text;
    const highlight = part.highlight;
    if (partStart < sliceStart) {
      text = part.text.slice(sliceStart - partStart);
    }
    if (!text) return;

    const last = slicedParts[slicedParts.length - 1];
    if (last && last.highlight === highlight) {
      last.text += text;
      return;
    }
    slicedParts.push({ text, highlight });
  });

  return slicedParts.length ? slicedParts : displayName;
}

export function buildSubSectionSearchTree(searchResults) {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return { treeData: [], childrenMap: new Map(), expandedIds: new Set() };
  }

  const nodeById = new Map();
  const childrenMap = new Map();
  const rootIds = new Set();
  const expandedIds = new Set();

  const upsertNode = (id, name, childCount) => {
    if (!nodeById.has(id)) {
      nodeById.set(id, {
        subSectionId: id,
        subSectionName: name,
        childCount: childCount ?? 0,
      });
    }
    return nodeById.get(id);
  };

  const linkParentChild = (parentId, childNode) => {
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    const list = childrenMap.get(parentId);
    if (!list.some((node) => node.subSectionId === childNode.subSectionId)) {
      list.push(childNode);
    }
    expandedIds.add(parentId);
  };

  searchResults.forEach((result) => {
    const chain = [
      ...(Array.isArray(result.ancestors) ? result.ancestors : []).map((ancestor) => ({
        subSectionId: ancestor.subSectionId,
        subSectionName: ancestor.subSectionName,
        childCount: ancestor.childCount,
      })),
      {
        subSectionId: result.subSectionId,
        subSectionName: result.subSectionName,
        childCount: result.childCount,
      },
    ];

    if (!chain.length) return;

    rootIds.add(chain[0].subSectionId);
    chain.forEach((item) => {
      upsertNode(item.subSectionId, item.subSectionName, item.childCount);
    });

    for (let index = 0; index < chain.length - 1; index += 1) {
      const parent = upsertNode(
        chain[index].subSectionId,
        chain[index].subSectionName,
        chain[index].childCount
      );
      const child = upsertNode(
        chain[index + 1].subSectionId,
        chain[index + 1].subSectionName,
        chain[index + 1].childCount
      );
      const childAppearsEarlierInChain = chain
        .slice(0, index + 1)
        .some((item) => String(item.subSectionId) === String(child.subSectionId));
      if (
        childAppearsEarlierInChain
        || wouldCreateSubSectionTreeCycle(parent.subSectionId, child.subSectionId, childrenMap)
      ) {
        continue;
      }
      linkParentChild(parent.subSectionId, child);
    }

    expandedIds.add(chain[chain.length - 1].subSectionId);
  });

  const treeData = [...rootIds].map((id) => nodeById.get(id)).filter(Boolean);
  return { treeData, childrenMap, expandedIds };
}

/**
 * Rank suggestions locally so the shortest full path match stays on top
 * (e.g. PAIN › urination › after › agg. before deep "Neck of bladder … pressing pain").
 */
export function scoreSubSectionSearchResult(item, query) {
  if (item == null) return 0;

  const rawQuery = normalizeSubSectionSearchText(query);
  const tokens = getSubSectionSearchTokens(query);
  if (!tokens.length) {
    const apiScore = Number(item.score ?? item.Score);
    return Number.isFinite(apiScore) ? apiScore : 0;
  }

  const hay = normalizeSubSectionSearchText(
    item.displayPath || item.DisplayPath || item.subSectionName || item.SubSectionName || ''
  );
  if (!hay) return 0;

  const hayTokens = hay.split(' ').filter(Boolean);
  let matched = 0;
  let firstIndex = -1;
  let lastIndex = -1;
  let orderBonus = 0;

  tokens.forEach((token) => {
    let foundAt = -1;
    for (let i = 0; i < hayTokens.length; i += 1) {
      if (hayTokens[i].startsWith(token) || hayTokens[i] === token) {
        foundAt = i;
        break;
      }
    }
    if (foundAt < 0) {
      const idx = hay.indexOf(token);
      if (idx < 0) return;
      foundAt = hay.slice(0, idx).split(' ').length - 1;
    }
    matched += 1;
    if (firstIndex < 0) firstIndex = foundAt;
    if (foundAt >= lastIndex) {
      orderBonus += 120;
      lastIndex = foundAt;
    } else {
      orderBonus += 20;
    }
  });

  const allMatchedBonus = matched === tokens.length ? 1200 : 0;
  const phraseBonus =
    matched >= 3 && matched === tokens.length && orderBonus >= 120 * matched ? 500 : 0;
  let genericPenalty = 0;
  if (hay.includes('complaints of') && matched < tokens.length && matched <= 2) {
    genericPenalty = 400;
  }

  let pathShape = 0;
  if (matched === tokens.length && lastIndex >= 0) {
    const trailingExtra = Math.max(0, hayTokens.length - 1 - lastIndex);
    pathShape -= trailingExtra * 220;
    const matchSpan = Math.max(0, lastIndex - Math.max(0, firstIndex) + 1);
    const extraMiddle = Math.max(0, matchSpan - tokens.length);
    pathShape -= extraMiddle * 90;
    pathShape += Math.max(0, 14 - hayTokens.length) * 35;
    if (trailingExtra === 0) pathShape += 900;
  } else {
    pathShape += Math.min(hayTokens.length, 12) * 8;
  }

  // "after a" → boost agg. (trailing stop-word / short prefix)
  const rawParts = rawQuery.split(' ').filter(Boolean);
  const lastRaw = rawParts[rawParts.length - 1] || '';
  const trailingPrefix =
    lastRaw &&
    lastRaw.length <= 6 &&
    !tokens.includes(lastRaw)
      ? lastRaw
      : '';
  if (trailingPrefix && lastIndex >= 0) {
    for (let i = lastIndex; i < hayTokens.length && i <= lastIndex + 2; i += 1) {
      if (hayTokens[i].startsWith(trailingPrefix)) {
        pathShape += i <= lastIndex + 1 ? 850 : 250;
        break;
      }
    }
  }

  // Prefer compact paths when scores tie — ignore stale API deep-leaf scores for ordering.
  return (
    matched * 1000 +
    orderBonus +
    pathShape +
    allMatchedBonus +
    phraseBonus -
    genericPenalty -
    hayTokens.length
  );
}

export function formatSubSectionDisplayPath(fullName) {
  const name = String(fullName || '').trim();
  if (!name) return '';
  return name.replace(/\s*-\s*/g, ' › ');
}

export function getSubSectionSuggestionLabel(item) {
  if (!item) return '';
  const display =
    item.displayPath ||
    item.DisplayPath ||
    formatSubSectionDisplayPath(item.subSectionName || item.SubSectionName);
  return display || String(item.subSectionName || item.SubSectionName || '');
}

export function getSubSectionSearchSuggestions(
  searchResults,
  minCount = SUBSECTION_SUGGESTION_DISPLAY,
  query = ''
) {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return [];
  }
  const unique = [];
  const seen = new Set();
  searchResults.forEach((item) => {
    const id = item?.subSectionId ?? item?.SubSectionId;
    if (id == null || seen.has(id)) return;
    seen.add(id);
    unique.push(item);
  });

  unique.sort((a, b) => {
    const scoreDiff = scoreSubSectionSearchResult(b, query) - scoreSubSectionSearchResult(a, query);
    if (scoreDiff !== 0) return scoreDiff;
    const matchDiff =
      Number(b.matchedTokenCount ?? b.MatchedTokenCount ?? 0) -
      Number(a.matchedTokenCount ?? a.MatchedTokenCount ?? 0);
    if (matchDiff !== 0) return matchDiff;
    const nameA = String(a.subSectionName || a.SubSectionName || '');
    const nameB = String(b.subSectionName || b.SubSectionName || '');
    // Shorter path first when otherwise equal.
    if (nameA.length !== nameB.length) return nameA.length - nameB.length;
    return nameA.localeCompare(nameB);
  });

  return unique.slice(0, Math.max(minCount, SUBSECTION_SUGGESTION_DISPLAY));
}

/**
 * Infinite-scroll guard: only continue when this page was full and (optionally) new rows were added.
 * Prevents continuous bottom spinner when totalCount >> actual ranked rows returned.
 */
export function resolveSubSectionPagedHasMore({
  items,
  pageSize = SUBSECTION_TREE_PAGE_SIZE,
  apiHasMore = false,
  addedCount = null,
} = {}) {
  const count = Array.isArray(items) ? items.length : 0;
  if (count < pageSize) return false;
  if (typeof addedCount === 'number' && addedCount <= 0) return false;
  return Boolean(apiHasMore);
}

export function normalizeSubSectionSearchPagedResponse(response, query = '') {
  const payload = response?.data ?? response?.resultObject ?? response ?? {};
  const items = Array.isArray(payload)
    ? payload
    : (payload.items || payload.Items || []);
  const totalCount = payload.totalCount ?? payload.TotalCount ?? items.length;
  const pageNumber = payload.pageNumber ?? payload.PageNumber ?? 1;
  const pageSize = payload.pageSize ?? payload.PageSize ?? SUBSECTION_TREE_PAGE_SIZE;
  const apiHasMore = payload.hasMore ?? payload.HasMore
    ?? (pageNumber * pageSize < totalCount);
  const rankedItems = [...(items || [])].sort((a, b) => {
    const scoreDiff = scoreSubSectionSearchResult(b, query) - scoreSubSectionSearchResult(a, query);
    if (scoreDiff !== 0) return scoreDiff;
    return Number(b.matchedTokenCount ?? b.MatchedTokenCount ?? 0)
      - Number(a.matchedTokenCount ?? a.MatchedTokenCount ?? 0);
  });
  const hasMore = resolveSubSectionPagedHasMore({
    items: rankedItems,
    pageSize,
    apiHasMore,
  });
  return { items: rankedItems, totalCount, pageNumber, pageSize, hasMore };
}

/**
 * Prefer suggestion-ranked hits first, then fill with tree page rows (no duplicates).
 * Keeps the best match at the top of the expanded tree seed.
 */
export function mergeSuggestionAndTreeSearchResults(suggestionItems, treeItems, query = '') {
  const merged = mergeSubSectionSearchResultPages(suggestionItems || [], treeItems || []);
  return [...merged].sort((a, b) => {
    const scoreDiff = scoreSubSectionSearchResult(b, query) - scoreSubSectionSearchResult(a, query);
    if (scoreDiff !== 0) return scoreDiff;
    return Number(b.matchedTokenCount ?? b.MatchedTokenCount ?? 0)
      - Number(a.matchedTokenCount ?? a.MatchedTokenCount ?? 0);
  });
}

export function mergeSubSectionSearchResultPages(existingItems, newItems) {
  const idOf = (item) => item?.subSectionId ?? item?.SubSectionId;
  const seen = new Set((existingItems || []).map(idOf).filter((id) => id != null));
  const merged = [...(existingItems || [])];
  (newItems || []).forEach((item) => {
    const id = idOf(item);
    if (id != null && !seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  });
  return merged;
}

export function getClinicalPatternRubricId(item) {
  return item?.subSectionID ?? item?.subSectionId ?? item?.SubSectionID ?? null;
}

export function normalizeClinicalPatternRubricPagedResponse(response) {
  const payload = response?.data ?? response?.resultObject ?? response ?? {};
  const items = Array.isArray(payload)
    ? payload
    : (payload.items || payload.Items || []);
  const totalCount = payload.totalCount ?? payload.TotalCount ?? items.length;
  const pageNumber = payload.pageNumber ?? payload.PageNumber ?? 1;
  const pageSize = payload.pageSize ?? payload.PageSize ?? CLINICAL_PATTERN_RUBRIC_PAGE_SIZE;
  const hasMore = payload.hasMore ?? payload.HasMore ?? (pageNumber * pageSize < totalCount);
  return { items, totalCount, pageNumber, pageSize, hasMore };
}

export function mergeClinicalPatternRubricPages(existingItems, newItems) {
  const seen = new Set((existingItems || []).map(getClinicalPatternRubricId));
  const merged = [...(existingItems || [])];
  (newItems || []).forEach((item) => {
    const id = getClinicalPatternRubricId(item);
    if (id != null && !seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  });
  return merged;
}

export function getSubSectionSuggestionDropdownLayout(anchorRect) {
  if (!anchorRect || typeof window === 'undefined') {
    return null;
  }

  const VIEWPORT_PADDING = 10;
  const GAP = 6;
  const HEADER_HEIGHT = 32;
  const PREFERRED_LIST_HEIGHT = 400;
  const MIN_LIST_HEIGHT = 96;

  const minWidth = Math.max(anchorRect.width, 340);
  const maxWidth = Math.min(520, window.innerWidth - VIEWPORT_PADDING * 2);
  const width = Math.min(Math.max(minWidth, 340), maxWidth);
  const left = Math.max(
    VIEWPORT_PADDING,
    Math.min(anchorRect.right - width, window.innerWidth - width - VIEWPORT_PADDING)
  );

  const spaceAbove = anchorRect.top - VIEWPORT_PADDING;
  const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_PADDING;

  let placement = 'above';
  let listMaxHeight = Math.min(PREFERRED_LIST_HEIGHT, spaceAbove - GAP - HEADER_HEIGHT);

  if (listMaxHeight < MIN_LIST_HEIGHT && spaceBelow > spaceAbove) {
    placement = 'below';
    listMaxHeight = Math.min(PREFERRED_LIST_HEIGHT, spaceBelow - GAP - HEADER_HEIGHT);
  }

  listMaxHeight = Math.max(MIN_LIST_HEIGHT, listMaxHeight);

  let top;
  if (placement === 'above') {
    top = anchorRect.top - GAP - listMaxHeight - HEADER_HEIGHT;
    if (top < VIEWPORT_PADDING) {
      top = VIEWPORT_PADDING;
      listMaxHeight = Math.max(
        MIN_LIST_HEIGHT,
        anchorRect.top - GAP - HEADER_HEIGHT - VIEWPORT_PADDING
      );
    }
  } else {
    top = anchorRect.bottom + GAP;
    const availableBelow = window.innerHeight - VIEWPORT_PADDING - top - HEADER_HEIGHT;
    listMaxHeight = Math.max(MIN_LIST_HEIGHT, Math.min(listMaxHeight, availableBelow));
  }

  return {
    placement,
    listMaxHeight,
    style: {
      position: 'fixed',
      top,
      left,
      width,
      zIndex: 10600,
    },
  };
}

export function getSubSectionSearchTokens(query) {
  const normalized = normalizeSubSectionSearchText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter((token) => token.length >= 2);
}

export function highlightSubSectionSuggestion(text, query) {
  const source = String(text || '');
  const tokens = getSubSectionSearchTokens(query);
  if (!tokens.length) return source;

  const lowerSource = source.toLowerCase();
  const ranges = [];

  tokens.forEach((token) => {
    let start = 0;
    while (start < lowerSource.length) {
      const index = lowerSource.indexOf(token, start);
      if (index === -1) break;
      ranges.push({ start: index, end: index + token.length });
      start = index + token.length;
    }
  });

  if (!ranges.length) return source;

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged = [];
  ranges.forEach((range) => {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
      return;
    }
    last.end = Math.max(last.end, range.end);
  });

  const parts = [];
  let cursor = 0;
  merged.forEach((range) => {
    if (cursor < range.start) {
      parts.push({ text: source.slice(cursor, range.start), highlight: false });
    }
    parts.push({ text: source.slice(range.start, range.end), highlight: true });
    cursor = range.end;
  });
  if (cursor < source.length) {
    parts.push({ text: source.slice(cursor), highlight: false });
  }

  return parts;
}

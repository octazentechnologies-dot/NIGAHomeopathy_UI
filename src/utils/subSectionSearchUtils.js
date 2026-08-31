export const MIN_SUBSECTION_SEARCH_LENGTH = 2;
export const SUBSECTION_SEARCH_DEBOUNCE_MS = 300;
export const SUBSECTION_SEARCH_TOP = 20;
export const SUBSECTION_SUGGESTION_DISPLAY = 20;
export const SUBSECTION_TREE_PAGE_SIZE = 40;
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

export function getSubSectionSearchSuggestions(searchResults, minCount = SUBSECTION_SUGGESTION_DISPLAY) {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return [];
  }
  const unique = [];
  const seen = new Set();
  searchResults.forEach((item) => {
    const id = item?.subSectionId;
    if (id == null || seen.has(id)) return;
    seen.add(id);
    unique.push(item);
  });
  return unique.slice(0, Math.max(minCount, SUBSECTION_SUGGESTION_DISPLAY));
}

export function normalizeSubSectionSearchPagedResponse(response) {
  const payload = response?.data ?? response?.resultObject ?? response ?? {};
  const items = Array.isArray(payload)
    ? payload
    : (payload.items || payload.Items || []);
  const totalCount = payload.totalCount ?? payload.TotalCount ?? items.length;
  const pageNumber = payload.pageNumber ?? payload.PageNumber ?? 1;
  const pageSize = payload.pageSize ?? payload.PageSize ?? SUBSECTION_TREE_PAGE_SIZE;
  const hasMore = payload.hasMore ?? payload.HasMore ?? (pageNumber * pageSize < totalCount);
  return { items, totalCount, pageNumber, pageSize, hasMore };
}

export function mergeSubSectionSearchResultPages(existingItems, newItems) {
  const seen = new Set((existingItems || []).map((item) => item.subSectionId));
  const merged = [...(existingItems || [])];
  (newItems || []).forEach((item) => {
    if (item?.subSectionId != null && !seen.has(item.subSectionId)) {
      seen.add(item.subSectionId);
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

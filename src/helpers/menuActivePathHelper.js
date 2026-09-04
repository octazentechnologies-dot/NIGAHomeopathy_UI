/**
 * Sidebar / horizontal menu active-state helpers.
 * Keeps the list-menu item highlighted on related add / edit / view routes.
 */

function normalizePath(path) {
  if (!path) return '';
  let s = String(path).split('?')[0].split('#')[0];
  if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
  return s.toLowerCase();
}

/** Simple plural to singular variants for listX vs addX/editX naming (e.g. users -> user). */
function getResourceVariants(resource) {
  const r = String(resource || '').toLowerCase();
  const variants = new Set([r]);
  if (
    r.length > 1 &&
    r.endsWith('s') &&
    !r.endsWith('ss') &&
    !r.endsWith('us') &&
    !r.endsWith('is') &&
    !r.endsWith('ies')
  ) {
    variants.add(r.slice(0, -1));
  }
  return [...variants];
}

/**
 * True when `currentPath` is an add/edit/view (etc.) route for the list menu at `menuPath`.
 * Example: menu `/admin/listexistance` matches `/admin/addexistance`, `/admin/editexistance`.
 */
export function isRelatedAdminCrudPath(menuPath, currentPath) {
  const menu = normalizePath(menuPath);
  const current = normalizePath(currentPath);
  if (!menu || !current) return false;
  if (menu === current) return true;

  const listMatch = menu.match(/^(.+\/)list([^/]+)$/i);
  if (!listMatch) return false;

  const prefix = listMatch[1].toLowerCase();
  const resource = listMatch[2];
  if (!current.startsWith(prefix)) return false;

  const actions = ['add', 'edit', 'view', 'new', 'create', 'update'];
  for (const action of actions) {
    for (const res of getResourceVariants(resource)) {
      const base = `${prefix}${action}${res}`;
      if (current === base || current.startsWith(`${base}/`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Pick the `<a>` menu node that should be active for `pathName`.
 * Prefers exact match, then related list CRUD match (longest list resource wins).
 */
export function findActiveMenuAnchor(itemsArray, pathName) {
  if (!itemsArray?.length || !pathName) return null;

  const current = normalizePath(pathName);

  const exact = itemsArray.find((x) => normalizePath(x.pathname) === current);
  if (exact) return exact;

  let best = null;
  let bestLen = -1;
  itemsArray.forEach((item) => {
    const menuPath = normalizePath(item.pathname);
    if (!isRelatedAdminCrudPath(menuPath, current)) return;
    const listMatch = menuPath.match(/\/list([^/]+)$/i);
    const len = listMatch ? listMatch[1].length : 0;
    if (len > bestLen) {
      bestLen = len;
      best = item;
    }
  });

  return best;
}

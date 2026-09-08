/**
 * Splits horizontal nav items into main bar vs overflow ("More") items.
 * Main bar includes admin modules through Rubric Intelligence (after Adverse Effect).
 * Dashboard is intentionally omitted from the horizontal nav.
 */
const HORIZONTAL_MAIN_MENU_IDS = new Set([
  'existancequestions',
  'clinicalpatterns',
  'repertory',
  'materiamedica',
  'adverseeffect',
  'deepanalytics',
  'businessmanagement',
  '3dbodypart',
  'rubricintelligence',
]);

const HORIZONTAL_HIDDEN_IDS = new Set([
  'admindashboard',
]);

const toMoreItem = (value) => {
  const val = { ...value };
  if (value.subItems) {
    val.childItems = value.subItems;
    val.isChildItem = true;
    delete val.subItems;
  }
  return val;
};

export const getHorizontalMenuSplit = (navChildren) => {
  const menuItems = [];
  const moreMenuItems = [];
  let passedMainSection = false;

  (navChildren || []).forEach((value) => {
    if (!value.isHeader && HORIZONTAL_HIDDEN_IDS.has(value.id)) {
      return;
    }

    // Keep the leading "Admin Side" header with the main bar (hidden in horizontal CSS)
    if (value.isHeader && !passedMainSection && value.label === 'Admin Side') {
      menuItems.push(value);
      return;
    }

    if (!value.isHeader && HORIZONTAL_MAIN_MENU_IDS.has(value.id)) {
      menuItems.push(value);
      if (value.id === 'rubricintelligence') {
        passedMainSection = true;
      }
      return;
    }

    moreMenuItems.push(toMoreItem(value));
  });

  return { menuItems, moreMenuItems };
};

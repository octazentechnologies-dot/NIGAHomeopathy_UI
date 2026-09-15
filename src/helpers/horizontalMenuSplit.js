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

/** Flat Account portal nav matching FND-02.01 Account Dashboard. */
export const getAccountHorizontalMenuItems = () => [
  {
    id: 'accounthome',
    label: 'Home',
    icon: 'ri-home-4-line',
    link: '/accountdashboard',
  },
  {
    id: 'accountledger',
    label: 'Ledger',
    icon: 'ri-book-2-line',
    link: '/account/ledger',
  },
  {
    id: 'accountearnings',
    label: 'Doctor Earnings',
    icon: 'ri-user-smile-line',
    link: '/account/doctor-earnings',
  },
  {
    id: 'accountpayouts',
    label: 'Payouts',
    icon: 'ri-exchange-dollar-line',
    link: '/account/payouts',
  },
  {
    id: 'accountinvoices',
    label: 'Invoices',
    icon: 'ri-file-list-3-line',
    link: '/account/invoices',
  },
  {
    id: 'accountreports',
    label: 'Reports',
    icon: 'ri-bar-chart-box-line',
    link: '/account/reports',
  },
];

/** Flat Pharmacy portal nav (Home / Onboarding / Orders / Quotes). */
export const getPharmacyHorizontalMenuItems = () => [
  {
    id: 'pharmacyhome',
    label: 'Home',
    icon: 'ri-home-4-line',
    link: '/pharmacydashboard',
  },
  {
    id: 'pharmacyonboarding',
    label: 'Onboarding',
    icon: 'ri-user-add-line',
    link: '/pharmacy/onboarding',
  },
  {
    id: 'pharmacyorders',
    label: 'Orders',
    icon: 'ri-shopping-bag-3-line',
    link: '/pharmacy/orders',
  },
  {
    id: 'pharmacyquotes',
    label: 'Quotes',
    icon: 'ri-file-list-3-line',
    link: '/pharmacy/quotes',
  },
];

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

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import Navdata from './LayoutMenuData';
import {
  getAccountHorizontalMenuItems,
  getAccountOverflowMenuItems,
  getPharmacyHorizontalMenuItems,
  getReceptionHorizontalMenuItems,
  getHorizontalMenuSplit,
  splitAccountNavItems,
} from '../helpers/horizontalMenuSplit';
import {
  getAuthUserId,
  mapMenuMasterToNavItems,
  keepSpaNavItem,
  splitAdminApiNavItems,
  PATIENT_FALLBACK_MENU,
  RECEPTION_FALLBACK_MENU,
  DOCTOR_FALLBACK_MENU,
  ADMIN_WEEK4_MENU,
  isHiddenAdminNavItem,
  mergeMissingMenuItems,
  splitPatientNavItems,
  receptionChromeFromApi,
  isDoctorSpaLink,
  isAdminEnquiriesNavItem,
} from '../helpers/menuByRole';
import { getMenuByRole } from '../helpers/realbackend_helper';
import { resolveUserRole, UserRole } from '../Components/constants/roles';

const LayoutMenuContext = createContext({
  navChildren: [],
  menuItems: [],
  moreMenuItems: [],
});

/** Calls Navdata hooks once per layout tree — shared by sidebar + header menus. */
export const LayoutMenuProvider = ({ children }) => {
  const navChildren = Navdata().props.children;
  const role = resolveUserRole();
  const [apiNavItems, setApiNavItems] = useState(null);
  // idle = not loaded; ok = GetMenuByRole succeeded (including empty []); error = request failed.
  const [apiMenuStatus, setApiMenuStatus] = useState('idle');
  const [openIds, setOpenIds] = useState({});

  useEffect(() => {
    let cancelled = false;
    const userId = getAuthUserId();
    if (!userId && role !== UserRole.RECEPTION) {
      setApiNavItems([]);
      setApiMenuStatus('idle');
      return undefined;
    }

    (async () => {
      try {
        const raw = await getMenuByRole(userId || 0);
        const mapped = mapMenuMasterToNavItems(raw);
        if (!cancelled) {
          setApiNavItems(mapped);
          setApiMenuStatus('ok');
        }
      } catch {
        if (!cancelled) {
          setApiNavItems([]);
          setApiMenuStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const withDropdownState = (items) =>
    (items || []).map((item) => {
      if (!item.subItems?.length) return item;
      const id = item.id;
      return {
        ...item,
        stateVariables: !!openIds[id],
        click: (e) => {
          e.preventDefault();
          setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
        },
        subItems: withDropdownState(item.subItems),
      };
    });

  const { menuItems, moreMenuItems } = useMemo(() => {
    const hardcodedFallback = () => {
      if (role === UserRole.ACCOUNT) {
        // Navbar = primary menus only. Overflow lives on dashboard Quick Actions (not More / Quick Links).
        return {
          menuItems: getAccountHorizontalMenuItems(),
          moreMenuItems: [],
        };
      }
      if (role === UserRole.PHARMACY || role === UserRole.PHARMACY_PARTNER) {
        return {
          menuItems: getPharmacyHorizontalMenuItems(),
          moreMenuItems: [],
        };
      }
      if (role === UserRole.PATIENT) {
        const split = splitPatientNavItems(PATIENT_FALLBACK_MENU);
        return {
          menuItems: split.menuItems,
          moreMenuItems: split.moreMenuItems,
        };
      }
      if (role === UserRole.RECEPTION) {
        return {
          menuItems: getReceptionHorizontalMenuItems(),
          moreMenuItems: [],
        };
      }
      if (role === UserRole.DOCTOR) {
        return {
          menuItems: DOCTOR_FALLBACK_MENU,
          moreMenuItems: [],
        };
      }
      return getHorizontalMenuSplit(navChildren);
    };

    const fallback = hardcodedFallback();

    // Source of truth is GetMenuByRole when it succeeds (including empty []).
    // Hardcoded nav is only a resilience fallback when the API is down or idle.
    if (apiMenuStatus === 'ok') {
      const spaItems = (apiNavItems || []).map(keepSpaNavItem).filter(Boolean);
      if (role === UserRole.RECEPTION) {
        const receptionItems =
          typeof receptionChromeFromApi === "function"
            ? receptionChromeFromApi(spaItems)
            : spaItems.length
              ? spaItems
              : RECEPTION_FALLBACK_MENU;
        return {
          menuItems: withDropdownState(receptionItems),
          moreMenuItems: [],
        };
      }
      const isAdminRole = role === UserRole.ADMIN || role === UserRole.MANAGEMENT;
      if (isAdminRole) {
        const split = splitAdminApiNavItems(spaItems);
        if (!split.menuItems.length) {
          const mainLinks = new Set(spaItems.map((item) => String(item.link || '').toLowerCase()));
          return {
            menuItems: withDropdownState(
              spaItems.filter((item) => !isAdminEnquiriesNavItem(item) && !isHiddenAdminNavItem(item))
            ),
            moreMenuItems: withDropdownState(
              ADMIN_WEEK4_MENU.filter(
                (item) =>
                  !mainLinks.has(String(item.link || '').toLowerCase()) &&
                  !isAdminEnquiriesNavItem(item) &&
                  !isHiddenAdminNavItem(item)
              )
            ),
          };
        }
        return {
          menuItems: withDropdownState(split.menuItems.filter((item) => !isHiddenAdminNavItem(item))),
          moreMenuItems: withDropdownState(
            mergeMissingMenuItems(split.moreMenuItems, ADMIN_WEEK4_MENU).filter(
              (item) => !isAdminEnquiriesNavItem(item) && !isHiddenAdminNavItem(item)
            )
          ),
        };
      }
      if (role === UserRole.ACCOUNT) {
        const split = splitAccountNavItems(
          mergeMissingMenuItems(spaItems, [
            ...getAccountHorizontalMenuItems(),
            ...getAccountOverflowMenuItems(),
          ])
        );
        return {
          menuItems: withDropdownState(split.menuItems),
          moreMenuItems: [],
        };
      }
      if (role === UserRole.PHARMACY || role === UserRole.PHARMACY_PARTNER) {
        return {
          menuItems: withDropdownState(mergeMissingMenuItems(spaItems, getPharmacyHorizontalMenuItems())),
          moreMenuItems: [],
        };
      }
      if (role === UserRole.PATIENT) {
        const merged = mergeMissingMenuItems(spaItems, PATIENT_FALLBACK_MENU);
        const split = splitPatientNavItems(merged);
        return {
          menuItems: withDropdownState(split.menuItems),
          moreMenuItems: withDropdownState(split.moreMenuItems),
        };
      }
      // Doctor chrome hides the sidebar. Extra UserDetails menus (Tufan_Doctor
      // has every ShowInMainMenu item) use the existing topbar More dropdown.
      if (role === UserRole.DOCTOR) {
        const coreLinks = new Set([
          '/doctordashboard',
          '/doctor/patientboard',
          '/doctor/anatomy',
          '/doctor/tele',
          '/doctor/telemedicine',
          '/doctor/tele-consultation',
          '/doctor/teleconsultation',
          '/doctor/reception-staff',
          '/doctor/consult-fees',
          '/doctor/erx',
          '/doctor/waitlist',
          '/doctor/schedule',
          '/doctor/carelink',
          '/doctor/appointment-requests',
          '/doctor/pharmacy-queries',
          '/doctor/practice',
          '/doctor/support',
          '/doctor/mobile/videoroom',
          '/doctor/mobile/refill',
          '/profile',
        ]);
        const core = [];
        const extra = [];
        const seenExtra = new Set();
        const seenCore = new Set();
        const doctorOnly = (spaItems || []).filter((item) => isDoctorSpaLink(item.link));
        doctorOnly.forEach((item) => {
          const link = String(item.link || '').toLowerCase();
          if (coreLinks.has(link)) {
            core.push(item);
            seenCore.add(link);
            return;
          }
          if (seenExtra.has(link)) return;
          seenExtra.add(link);
          extra.push(item);
        });
        DOCTOR_FALLBACK_MENU.forEach((item) => {
          const link = String(item.link || '').toLowerCase();
          if (coreLinks.has(link)) {
            if (seenCore.has(link)) return;
            core.push(item);
            seenCore.add(link);
            return;
          }
          if (seenExtra.has(link) || seenCore.has(link)) return;
          seenExtra.add(link);
          extra.push(item);
        });
        return {
          menuItems: withDropdownState(core.length ? core : DOCTOR_FALLBACK_MENU),
          moreMenuItems: withDropdownState(extra),
        };
      }
      return { menuItems: withDropdownState(spaItems), moreMenuItems: [] };
    }
    return {
      menuItems: withDropdownState(fallback.menuItems),
      moreMenuItems: withDropdownState(fallback.moreMenuItems),
    };
  }, [navChildren, role, apiNavItems, apiMenuStatus, openIds]);

  return (
    <LayoutMenuContext.Provider value={{ navChildren, menuItems, moreMenuItems }}>
      {children}
    </LayoutMenuContext.Provider>
  );
};

export const useLayoutMenu = () => useContext(LayoutMenuContext);

export default LayoutMenuContext;

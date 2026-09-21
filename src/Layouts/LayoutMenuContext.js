import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import Navdata from './LayoutMenuData';
import {
  getAccountHorizontalMenuItems,
  getPharmacyHorizontalMenuItems,
  getHorizontalMenuSplit,
} from '../helpers/horizontalMenuSplit';
import {
  getAuthUserId,
  mapMenuMasterToNavItems,
  keepSpaNavItem,
  splitAdminApiNavItems,
  PATIENT_FALLBACK_MENU,
  RECEPTION_FALLBACK_MENU,
  DOCTOR_FALLBACK_MENU,
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
        return {
          menuItems: PATIENT_FALLBACK_MENU,
          moreMenuItems: [],
        };
      }
      if (role === UserRole.RECEPTION) {
        return {
          menuItems: RECEPTION_FALLBACK_MENU,
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
      const isAdminRole = role === UserRole.ADMIN || role === UserRole.MANAGEMENT;
      if (isAdminRole) {
        const split = splitAdminApiNavItems(spaItems);
        const main = split.menuItems.length ? split.menuItems : spaItems;
        const more = split.menuItems.length ? split.moreMenuItems : [];
        return {
          menuItems: withDropdownState(main),
          moreMenuItems: withDropdownState(more),
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

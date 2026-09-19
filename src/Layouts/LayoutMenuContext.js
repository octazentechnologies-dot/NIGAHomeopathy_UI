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
  PATIENT_FALLBACK_MENU,
  isSpaMenuLink,
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

  useEffect(() => {
    let cancelled = false;
    const userId = getAuthUserId();
    if (!userId) {
      setApiNavItems([]);
      return undefined;
    }

    (async () => {
      try {
        const raw = await getMenuByRole(userId);
        const mapped = mapMenuMasterToNavItems(raw);
        if (!cancelled) setApiNavItems(mapped);
      } catch {
        if (!cancelled) setApiNavItems([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [role]);

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
      return getHorizontalMenuSplit(navChildren);
    };

    const fallback = hardcodedFallback();
    const apiReady = Array.isArray(apiNavItems) && apiNavItems.length > 0;
    const consumeApiForRole =
      role === UserRole.ACCOUNT ||
      role === UserRole.PHARMACY ||
      role === UserRole.PHARMACY_PARTNER ||
      role === UserRole.PATIENT ||
      role === UserRole.ADMIN ||
      role === UserRole.MANAGEMENT;

    if (apiReady && consumeApiForRole) {
      const isAdminRole = role === UserRole.ADMIN || role === UserRole.MANAGEMENT;
      const menuItems = isAdminRole
        ? apiNavItems.filter((item) => isSpaMenuLink(item.link))
        : apiNavItems;
      const minItems = isAdminRole ? 3 : 1;
      if (menuItems.length >= minItems) {
        return { menuItems, moreMenuItems: [] };
      }
    }
    return fallback;
  }, [navChildren, role, apiNavItems]);

  return (
    <LayoutMenuContext.Provider value={{ navChildren, menuItems, moreMenuItems }}>
      {children}
    </LayoutMenuContext.Provider>
  );
};

export const useLayoutMenu = () => useContext(LayoutMenuContext);

export default LayoutMenuContext;

import React, { createContext, useContext, useMemo } from 'react';

import Navdata from './LayoutMenuData';
import {
  getAccountHorizontalMenuItems,
  getPharmacyHorizontalMenuItems,
  getReceptionHorizontalMenuItems,
  getHorizontalMenuSplit,
} from '../helpers/horizontalMenuSplit';
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

  const { menuItems, moreMenuItems } = useMemo(() => {
    if (role === UserRole.ACCOUNT) {
      return {
        menuItems: getAccountHorizontalMenuItems(),
        moreMenuItems: [],
      };
    }
    if (role === UserRole.PHARMACY) {
      return {
        menuItems: getPharmacyHorizontalMenuItems(),
        moreMenuItems: [],
      };
    }
    if (role === UserRole.RECEPTION) {
      return {
        menuItems: getReceptionHorizontalMenuItems(),
        moreMenuItems: [],
      };
    }
    return getHorizontalMenuSplit(navChildren);
  }, [navChildren, role]);

  return (
    <LayoutMenuContext.Provider value={{ navChildren, menuItems, moreMenuItems }}>
      {children}
    </LayoutMenuContext.Provider>
  );
};

export const useLayoutMenu = () => useContext(LayoutMenuContext);

export default LayoutMenuContext;

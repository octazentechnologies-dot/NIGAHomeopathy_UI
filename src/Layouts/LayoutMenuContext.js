import React, { createContext, useContext } from 'react';

import Navdata from './LayoutMenuData';
import { getHorizontalMenuSplit } from '../helpers/horizontalMenuSplit';

const LayoutMenuContext = createContext({
  navChildren: [],
  menuItems: [],
  moreMenuItems: [],
});

/** Calls Navdata hooks once per layout tree — shared by sidebar + header menus. */
export const LayoutMenuProvider = ({ children }) => {
  const navChildren = Navdata().props.children;
  const { menuItems, moreMenuItems } = getHorizontalMenuSplit(navChildren);

  return (
    <LayoutMenuContext.Provider value={{ navChildren, menuItems, moreMenuItems }}>
      {children}
    </LayoutMenuContext.Provider>
  );
};

export const useLayoutMenu = () => useContext(LayoutMenuContext);

export default LayoutMenuContext;

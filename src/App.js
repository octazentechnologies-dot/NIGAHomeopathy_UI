import React, { useEffect } from 'react';

//import Scss
import './assets/scss/themes.scss';
import { installDocumentTitleBrand } from './common/brand';

installDocumentTitleBrand();

//imoprt Route
import Route from './Routes';
import { ensureMultiSelectGrowStyles } from './helpers/neutralSelectStyles';
import { getLoggedinUser } from './helpers/api_helper';

ensureMultiSelectGrowStyles();

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth',
  '/find-doctor',
  '/book',
  '/privacy',
  '/terms',
  '/landing',
];

function isPublicPath(pathname) {
  const path = String(pathname || '/').toLowerCase();
  if (path === '/' || path === '') return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function App() {
  useEffect(() => {
    const bounceIfLoggedOut = () => {
      const token = getLoggedinUser()?.token;
      if (token) return;
      if (isPublicPath(window.location.pathname)) return;
      window.location.replace('/login');
    };
    window.addEventListener('pageshow', bounceIfLoggedOut);
    window.addEventListener('popstate', bounceIfLoggedOut);
    return () => {
      window.removeEventListener('pageshow', bounceIfLoggedOut);
      window.removeEventListener('popstate', bounceIfLoggedOut);
    };
  }, []);

  return (
    <React.Fragment>
      <Route />
    </React.Fragment>
  );
}

export default App;

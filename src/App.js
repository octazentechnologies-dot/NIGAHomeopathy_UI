import React, { useEffect } from 'react';

//import Scss
import './assets/scss/themes.scss';
import { installDocumentTitleBrand } from './common/brand';

installDocumentTitleBrand();

//imoprt Route
import Route from './Routes';
import { ensureMultiSelectGrowStyles } from './helpers/neutralSelectStyles';
import { bootToLoginIfSignedOut, mustLeaveClinic } from './helpers/signedOutHistory';

ensureMultiSelectGrowStyles();

function App() {
  useEffect(() => {
    const bounceIfLoggedOut = () => {
      bootToLoginIfSignedOut();
    };
    const blankClinicOnLeave = () => {
      if (!mustLeaveClinic()) return;
      try {
        document.documentElement.style.visibility = "hidden";
        if (document.body) document.body.textContent = "";
      } catch (e) { /* document is unloading */ }
    };
    bootToLoginIfSignedOut();
    window.addEventListener('pageshow', bounceIfLoggedOut);
    window.addEventListener('popstate', bounceIfLoggedOut);
    window.addEventListener('pagehide', blankClinicOnLeave);
    return () => {
      window.removeEventListener('pageshow', bounceIfLoggedOut);
      window.removeEventListener('popstate', bounceIfLoggedOut);
      window.removeEventListener('pagehide', blankClinicOnLeave);
    };
  }, []);

  return (
    <React.Fragment>
      <Route />
    </React.Fragment>
  );
}

export default App;

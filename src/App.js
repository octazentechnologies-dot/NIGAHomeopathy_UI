import React from 'react';

//import Scss
import './assets/scss/themes.scss';
import { installDocumentTitleBrand } from './common/brand';

installDocumentTitleBrand();

//imoprt Route
import Route from './Routes';

// Production uses real classic + New-API backends only (SEC-01.03).
// Do not call fakeBackend() — it intercepts axios with Velzon dummy users.

function App() {
  return (
    <React.Fragment>
      <Route />
    </React.Fragment>
  );
}

export default App;

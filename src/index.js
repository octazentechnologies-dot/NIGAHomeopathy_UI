import './silenceConsole';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './helpers/swalMessageIcon';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Fade } from "reactstrap";
import rootReducer from "./slices";
import ErrorBoundary from "./Components/Common/ErrorBoundary";
import { reportClientIssue } from "./helpers/client_error_reporter";

window.onerror = function (message, source, lineno, colno, error) {
  reportClientIssue({
    source: "window",
    url: source || window.location.href,
    status: 500,
    method: "CLIENT",
    message: String(message || "window.onerror"),
    stack: error && error.stack ? error.stack : "line " + lineno + " col " + colno,
  });
};

window.addEventListener("unhandledrejection", function (event) {
  const reason = event && event.reason;
  reportClientIssue({
    source: "window",
    url: window.location.href,
    status: 500,
    method: "CLIENT",
    message: reason && reason.message ? reason.message : String(reason || "unhandledrejection"),
    stack: reason && reason.stack ? reason.stack : "",
  });
});

// reactstrap 9.2.3 Alert and PopperContent build their default transition from Fade.defaultProps, which Fade no
// longer sets, so they hand Fade timeout={undefined}. Fade falls back to its own 150 ms default; only the prop-type
// check runs before that fallback. Patched in place because PopperContent validates against this same object.
if (Fade.propTypes && typeof Fade.propTypes.timeout === "function") {
  const checkTimeout = Fade.propTypes.timeout;
  Fade.propTypes.timeout = (props, ...rest) => (props.timeout === undefined ? null : checkTimeout(props, ...rest));
}

// Repertory sub-section lists in the store run to several MB, so the dev-only checks need more than the default 32 ms.
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: { warnAfter: 300 },
      serializableCheck: { warnAfter: 300 },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

const rootElement = document.getElementById("root");

const root = ReactDOM.createRoot(rootElement);

root.render(
  <ErrorBoundary>
    <Provider store={store}>
      <React.Fragment>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.Fragment>
    </Provider>
  </ErrorBoundary>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
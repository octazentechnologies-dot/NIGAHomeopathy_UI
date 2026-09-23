import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./slices";
import ErrorBoundary from "./Components/Common/ErrorBoundary";

console.log("🚀 Initializing Niga Homeopathy App...");
console.log("Environment:", process.env.NODE_ENV);

const store = configureStore({ reducer: rootReducer, devTools: true });

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
} else {
  console.log("✅ Root element found, creating React root...");
}

const root = ReactDOM.createRoot(rootElement);

console.log("✅ Rendering React app...");
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
// Must be the first import in index.js. Keeps tokens, OTPs and patient data out of the browser console.
// Set REACT_APP_DEBUG_CONSOLE=true in a local .env to get console output back while developing.
if (process.env.REACT_APP_DEBUG_CONSOLE !== "true" && typeof window !== "undefined" && window.console) {
  const noop = function () {};
  ["log", "info", "debug", "warn", "error", "table", "trace", "dir", "dirxml", "group", "groupCollapsed", "groupEnd", "time", "timeEnd", "timeLog", "count", "assert"].forEach(function (method) {
    try {
      window.console[method] = noop;
    } catch (e) {
      // read-only console in some embedded browsers
    }
  });
}

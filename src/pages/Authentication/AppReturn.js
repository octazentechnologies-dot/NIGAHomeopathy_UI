import React, { useEffect } from "react";

/**
 * HTTPS landing for the Doctor app. The in-app browser closes when it reaches
 * nigadoctor://portal-return. This page is the allow-listed https fallback.
 */
const AppReturn = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("result") || "opened";
    const patientAppId = params.get("patientAppId") || "";
    const query = new URLSearchParams();
    if (result) query.set("result", result);
    if (/^\d+$/.test(patientAppId)) query.set("patientAppId", patientAppId);
    const suffix = query.toString();
    window.location.replace(`nigadoctor://portal-return${suffix ? `?${suffix}` : ""}`);
  }, []);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <div className="bg-white shadow-sm rounded-3 p-4 text-center" style={{ maxWidth: 420, width: "calc(100% - 32px)" }}>
        <h1 className="h5 mb-2">Return to the Doctor app</h1>
        <p className="text-muted mb-0">You can close this window. The appointment will refresh in the app.</p>
      </div>
    </div>
  );
};

export default AppReturn;

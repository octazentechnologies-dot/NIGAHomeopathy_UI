import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Spinner } from "reactstrap";
import { loginSuccess } from "../../slices/auth/login/reducer";
import { changeLayout, changeSidebarVisibility, fetchPatientBoardBackupSummary } from "../../slices/thunks";
import { layoutTypes, sidebarVisibilitytypes } from "../../Components/constants/layout";
import { navigateHidden } from "../../helpers/hiddenRouteParams";
import { clearSignedOut } from "../../helpers/signedOutHistory";
import { exchangeWebHandoff, returnToDoctorApp } from "../../helpers/webHandoffSession";

/**
 * Public page. The Doctor app opens this with a one-time code.
 * The code is removed from the address bar before it is sent to the API.
 */
let handoffCode = "";

const MobileHandoff = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("code");
    if (fromUrl) {
      handoffCode = fromUrl;
      window.history.replaceState({}, "", "/auth/mobile-handoff");
    }
    const code = handoffCode;

    if (!code) {
      setFailed(true);
      return undefined;
    }

    let cancelled = false;
    exchangeWebHandoff(code)
      .then((auth) => {
        if (cancelled) return;
        handoffCode = "";
        clearSignedOut();
        dispatch(loginSuccess(auth));
        dispatch(changeSidebarVisibility(sidebarVisibilitytypes.HIDDEN));
        dispatch(changeLayout(layoutTypes.SEMIBOX));
        dispatch(fetchPatientBoardBackupSummary());
        const landing = auth.landingPath || "/doctordashboard";
        navigateHidden(navigate, landing);
      })
      .catch(() => {
        if (cancelled) return;
        handoffCode = "";
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate]);

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh", background: "#f5f6f7" }}>
      <div className="bg-white shadow-sm rounded-3 p-4 text-center" style={{ maxWidth: 420, width: "calc(100% - 32px)" }}>
        {failed ? (
          <>
            <h1 className="h5 mb-2">This link has expired</h1>
            <p className="text-muted mb-4">
              Return to the Doctor app and open the portal again. Your case is not lost if it was already saved.
            </p>
            <button type="button" className="btn btn-primary w-100" onClick={() => returnToDoctorApp("failed")}>
              Return to the Doctor app
            </button>
          </>
        ) : (
          <>
            <Spinner color="primary" className="mb-3" />
            <h1 className="h5 mb-1">Opening the portal</h1>
            <p className="text-muted mb-0">Taking you to this patient. You will not be asked to sign in.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileHandoff;

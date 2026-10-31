import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { savePatientBoardBackupFromSessions } from "../../slices/doctor/patientBoardBackup/thunk";
import { sessionsHaveBackupWork } from "../../helpers/patientBoardBackupHelper";
import {
  formatHandoffRemaining,
  isWebHandoffSession,
  returnToDoctorApp,
  startWebHandoffKeeper,
  webHandoffEndedReason,
} from "../../helpers/webHandoffSession";

const endedCopy = (reason) => {
  if (reason === "IDLE") {
    return "The portal paused because it was not used for 20 minutes. Your saved work is kept. Open the portal again from the Doctor app to continue.";
  }
  if (reason === "ABSOLUTE") {
    return "This portal session has reached 5 hours. Save is already on the server when the case was backed up. Open the portal again from the Doctor app to continue the same patient.";
  }
  if (reason === "REUSE") {
    return "This portal session was used from two places, so it was closed. Open it again from the Doctor app.";
  }
  return "This portal session has ended. Open it again from the Doctor app.";
};

const WebHandoffSessionHost = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  const [warningMs, setWarningMs] = useState(null);
  const [ended, setEnded] = useState(() => webHandoffEndedReason());

  useEffect(() => {
    if (!isWebHandoffSession() && !webHandoffEndedReason()) return undefined;

    const saveWork = () => {
      const current = sessionsRef.current;
      if (!sessionsHaveBackupWork(current)) return Promise.resolve();
      return dispatch(savePatientBoardBackupFromSessions(current));
    };
    return startWebHandoffKeeper({
      onWarning: (ms) => setWarningMs(ms != null && ms <= 15 * 60 * 1000 ? ms : null),
      onEnded: (reason) => setEnded(reason || "ended"),
      saveWork,
    });
  }, [dispatch]);

  if (!isWebHandoffSession() && !ended) return null;

  return (
    <>
      {warningMs != null && !ended ? (
        <div
          className="alert alert-warning mb-0 rounded-0 text-center"
          role="status"
          style={{ position: "sticky", top: 0, zIndex: 1040 }}
        >
          This portal session ends in {formatHandoffRemaining(warningMs)}. Keep working, or return to the app and open the portal again. Your case backup is saved while you work.
        </div>
      ) : null}
      {ended ? (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", zIndex: 2000 }}
        >
          <div className="bg-white shadow rounded-3 p-4" style={{ maxWidth: 440, width: "calc(100% - 32px)" }}>
            <h2 className="h5 mb-2">Return to the Doctor app</h2>
            <p className="text-muted">{endedCopy(String(ended).toUpperCase())}</p>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => returnToDoctorApp(String(ended).toLowerCase() === "idle" ? "idle" : "expired")}
            >
              Return to the Doctor app
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default WebHandoffSessionHost;

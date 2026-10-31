import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { savePatientBoardBackupFromSessions } from "../../slices/doctor/patientBoardBackup/thunk";
import { sessionsHaveBackupWork } from "../../helpers/patientBoardBackupHelper";
import { isWebHandoffSession, returnToDoctorApp, webHandoffEndedReason } from "../../helpers/webHandoffSession";

/** Shown only while the portal was opened from the Doctor app. */
const WebHandoffReturnButton = () => {
  const dispatch = useDispatch();
  const sessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
  if (!isWebHandoffSession() || webHandoffEndedReason()) return null;

  const goBack = async () => {
    try {
      if (sessionsHaveBackupWork(sessions)) {
        await dispatch(savePatientBoardBackupFromSessions(sessions));
      }
    } catch {
      /* No board work to save. Still return. */
    }
    await returnToDoctorApp("opened");
  };

  return (
    <button type="button" className="btn btn-sm btn-primary ms-2" onClick={goBack}>
      Return to app
    </button>
  );
};

export default WebHandoffReturnButton;

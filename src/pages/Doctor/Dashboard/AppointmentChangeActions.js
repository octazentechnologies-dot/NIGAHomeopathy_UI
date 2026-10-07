import React, { useState } from "react";
import { Button } from "reactstrap";
import RescheduleModal from "../../../Components/Common/RescheduleModal";
import CancelAppointmentModal from "../../../Components/Common/CancelAppointmentModal";
import {
  COMPLETED_APPOINTMENT_LOCKED_MESSAGE,
  isAppointmentCancelled,
  isAppointmentCompleted,
} from "../../../helpers/appointmentStatus";

const AppointmentChangeActions = ({ patientAppId, doctorId, appointmentDate, appointmentTime, status, onChanged }) => {
  const [open, setOpen] = useState(null);

  if (!patientAppId || isAppointmentCancelled(status)) return null;

  const locked = isAppointmentCompleted(status);

  return (
    <div
      className="dashboard-appointment-change-actions d-inline-flex align-items-center gap-1"
      title={locked ? COMPLETED_APPOINTMENT_LOCKED_MESSAGE : undefined}
    >
      <Button
        size="sm"
        color="soft-info"
        className="dashboard-appointment-text-btn"
        disabled={locked}
        onClick={() => setOpen("reschedule")}
      >
        Reschedule
      </Button>
      <Button
        size="sm"
        color="soft-danger"
        className="dashboard-appointment-text-btn"
        disabled={locked}
        onClick={() => setOpen("cancel")}
      >
        Cancel
      </Button>
      {!locked ? (
        <>
          <RescheduleModal
            isOpen={open === "reschedule"}
            toggle={() => setOpen(null)}
            patientAppId={patientAppId}
            doctorId={doctorId}
            appointmentDate={appointmentDate}
            appointmentTime={appointmentTime}
            onSaved={onChanged}
          />
          <CancelAppointmentModal
            isOpen={open === "cancel"}
            toggle={() => setOpen(null)}
            patientAppId={patientAppId}
            onSaved={onChanged}
          />
        </>
      ) : null}
    </div>
  );
};

export default AppointmentChangeActions;

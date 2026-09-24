import React, { useState } from "react";
import { Button } from "reactstrap";
import RescheduleModal from "../../../Components/Common/RescheduleModal";
import CancelAppointmentModal from "../../../Components/Common/CancelAppointmentModal";

const AppointmentChangeActions = ({ patientAppId, doctorId, appointmentDate, appointmentTime, status, onChanged }) => {
  const [open, setOpen] = useState(null);
  const alreadyCancelled = String(status || "").trim().toUpperCase() === "CANCELLED";

  if (!patientAppId || alreadyCancelled) return null;

  return (
    <>
      <Button size="sm" color="soft-info" className="dashboard-appointment-text-btn" onClick={() => setOpen("reschedule")}>Reschedule</Button>
      <Button size="sm" color="soft-danger" className="dashboard-appointment-text-btn" onClick={() => setOpen("cancel")}>Cancel</Button>
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
  );
};

export default AppointmentChangeActions;

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container } from "reactstrap";
import { getPublicFee, unwrapS4 } from "../../../helpers/s4Week4Api";
import { readReceptionDoctorId } from "../receptionSession";
import SummaryWidgets from "../components/SummaryWidgets";
import TodaysAppointments from "../components/TodaysAppointments";
import ReceptionCheckInFlow from "../components/ReceptionCheckInFlow";
import "../components/receptionDashboard.css";

/** Reception overview — designer Quick Actions desk + live queue KPIs. */
const ReceptionDashboard = () => {
  document.title = "Reception | Homeocentrum";
  const navigate = useNavigate();
  const doctorId = readReceptionDoctorId();
  const [selectedRow, setSelectedRow] = useState(null);
  const [checkInRow, setCheckInRow] = useState(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [paymentPatch, setPaymentPatch] = useState(null);
  const [feeByType, setFeeByType] = useState({ inClinic: null, tele: null });

  const clearCheckIn = useCallback(() => setCheckInRow(null), []);

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    getPublicFee(doctorId)
      .then((response) => {
        if (cancelled) return;
        const fee = unwrapS4(response) || {};
        const data = fee.data || fee.Data || fee;
        setFeeByType({
          inClinic: data.inClinicFee ?? data.InClinicFee ?? null,
          tele: data.teleFee ?? data.TeleFee ?? data.inClinicFee ?? data.InClinicFee ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setFeeByType({ inClinic: null, tele: null });
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const consultationFee = useMemo(() => {
    const row = selectedRow || checkInRow;
    if (!row) return feeByType.inClinic;
    const tele = String(row.type || "").toLowerCase().includes("tele");
    const fromRow = Number(String(row.payment || "").replace(/[^\d.]/g, ""));
    if (Number.isFinite(fromRow) && fromRow > 0) return fromRow;
    return tele ? feeByType.tele : feeByType.inClinic;
  }, [selectedRow, checkInRow, feeByType]);

  return (
    <div className="page-content admin-dashboard-page doctor-dashboard-page reception-dashboard-page clinic-workspace-page">
      <Container fluid>
        <h2 className="clinic-page-title">Reception</h2>
        <p className="clinic-page-subtitle">
          Waiting and unpaid counts come from today&apos;s queue. Use Quick Actions for check-in steps on a selected visit.
        </p>
        <SummaryWidgets />
        <ReceptionCheckInFlow
          selectedRow={selectedRow}
          checkInRow={checkInRow}
          consultationFee={consultationFee}
          onSelectRow={setSelectedRow}
          onCheckInHandled={clearCheckIn}
          onOpenNewPatient={() => navigate("/reception#reception-new-patient")}
          onOpenBookAppointment={() => navigate("/reception#reception-assisted")}
          onPaymentConfirmed={(details, row) => {
            const patientAppId = row?.patientAppId || details?.patientAppId;
            if (!patientAppId) return;
            setPaymentPatch({
              patientAppId,
              paymentStatus: "PAID",
              paymentMethod: details?.paymentMethod,
              at: Date.now(),
            });
            setListRefreshKey((n) => n + 1);
          }}
        />
        <TodaysAppointments
          refreshKey={listRefreshKey}
          paymentPatch={paymentPatch}
          onCheckInEdit={(row) => {
            setSelectedRow(row);
            setCheckInRow(row);
          }}
        />
      </Container>
    </div>
  );
};

export default ReceptionDashboard;

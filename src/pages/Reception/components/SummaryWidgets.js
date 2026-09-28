import React, { useEffect, useState } from "react";
import CountUp from "react-countup";
import { Card, CardBody, Col, Row } from "reactstrap";
import { Link } from "react-router-dom";
import { getAppointmentQueue } from "../../../helpers/realbackend_helper";
import { readReceptionDoctorId, unwrap } from "../receptionSession";
import ReceptionKpiListModal from "./ReceptionKpiListModal";
import { RECEPTION_KPI_MODALS } from "./receptionKpiListData";

const SummaryWidgets = () => {
  const [activeModalId, setActiveModalId] = useState(null);
  const [counts, setCounts] = useState({
    today: 0,
    waiting: 0,
    unpaid: 0,
    patients: 0,
  });
  const activeModal = activeModalId ? RECEPTION_KPI_MODALS[activeModalId] : null;
  const doctorId = readReceptionDoctorId();

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    getAppointmentQueue(doctorId)
      .then((response) => {
        if (cancelled) return;
        const body = unwrap(response);
        const rows = body.queue || body.Queue || body.data || body;
        const list = Array.isArray(rows) ? rows : [];
        const waiting = list.filter((row) =>
          String(row.status || row.Status || "").toUpperCase() === "WAITING"
        ).length;
        const unpaid = list.filter((row) => {
          const raw = String(row.paymentStatus || row.PaymentStatus || "UNPAID").toUpperCase();
          return raw !== "PAID";
        }).length;
        const patientIds = new Set(
          list.map((row) => row.patientId || row.PatientId).filter(Boolean)
        );
        setCounts({
          today: list.length,
          waiting,
          unpaid,
          patients: patientIds.size || list.length,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const cards = [
    { id: "today-appointments", label: "Today's Appointments", value: counts.today, icon: "mdi mdi-calendar-clock" },
    { id: "waiting-patients", label: "Waiting Patients", value: counts.waiting, icon: "mdi mdi-account-clock" },
    { id: "pending-payments", label: "Pending Payments", value: counts.unpaid, icon: "mdi mdi-cash-multiple" },
    { id: "today-patients", label: "Total Patients", value: counts.patients, icon: "mdi mdi-account-group" },
  ];

  return (
    <>
      <Row className="g-2 reception-dashboard-widgets">
        {cards.map((item) => (
          <Col xs={12} sm={6} xl={3} className="reception-kpi-col" key={item.id}>
            <Card className="card-animate admin-dash-card doctor-action-card">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-bold text-truncate mb-0 reception-kpi-label">
                      {item.label}
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                      <span className="counter-value">
                        <CountUp start={0} end={item.value} duration={1} />
                      </span>
                    </h4>
                    <Link
                      to="/reception"
                      className="reception-kpi-link doctor-dashboard-action-link"
                    >
                      View queue
                    </Link>
                  </div>
                  <div className="avatar-sm flex-shrink-0">
                    <span className="avatar-title rounded fs-3 doctor-action-icon">
                      <i className={item.icon} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
      <ReceptionKpiListModal
        isOpen={Boolean(activeModal)}
        toggle={() => setActiveModalId(null)}
        title={activeModal?.title}
        rows={activeModal?.rows}
      />
    </>
  );
};

export default SummaryWidgets;

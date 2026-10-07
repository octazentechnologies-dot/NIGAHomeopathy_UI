import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { Card, CardBody, Col, Row } from "reactstrap";
import { getAppointmentQueue } from "../../../helpers/realbackend_helper";
import { readReceptionDoctorId, unwrap } from "../receptionSession";
import ReceptionKpiListModal from "./ReceptionKpiListModal";
import { RECEPTION_KPI_MODALS, mapQueueKpiRow } from "./receptionKpiListData";

const CARDS = [
  { id: "today-appointments", label: "Today's Appointments", icon: "mdi mdi-calendar-clock" },
  { id: "waiting-patients", label: "Waiting Patients", icon: "mdi mdi-account-clock" },
  { id: "pending-payments", label: "Pending Payments", icon: "mdi mdi-cash-multiple" },
  { id: "today-patients", label: "Total Patients", icon: "mdi mdi-account-group" },
];

const SummaryWidgets = () => {
  const [activeModalId, setActiveModalId] = useState(null);
  const [rows, setRows] = useState([]);
  const doctorId = readReceptionDoctorId();

  useEffect(() => {
    if (!doctorId) return undefined;
    let cancelled = false;
    getAppointmentQueue(doctorId)
      .then((response) => {
        if (cancelled) return;
        const body = unwrap(response);
        const list = body.queue || body.Queue || body.data || body;
        setRows((Array.isArray(list) ? list : []).map(mapQueueKpiRow).sort((a, b) => a.sortTime - b.sortTime));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const lists = useMemo(() => {
    const out = {};
    Object.entries(RECEPTION_KPI_MODALS).forEach(([id, cfg]) => {
      out[id] = cfg.select(rows);
    });
    return out;
  }, [rows]);

  const activeModal = activeModalId ? RECEPTION_KPI_MODALS[activeModalId] : null;

  return (
    <>
      <Row className="g-2 reception-dashboard-widgets">
        {CARDS.map((item) => (
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
                        <CountUp start={0} end={lists[item.id]?.length || 0} duration={1} />
                      </span>
                    </h4>
                    <button
                      type="button"
                      className="btn btn-link p-0 reception-kpi-link doctor-dashboard-action-link"
                      onClick={() => setActiveModalId(item.id)}
                    >
                      View list
                    </button>
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
        icon={activeModal?.icon}
        searchPlaceholder={activeModal?.searchPlaceholder}
        entityLabel={activeModal?.entityLabel}
        emptyMessage={activeModal?.emptyMessage}
        columns={activeModal?.columns || []}
        rows={activeModalId ? lists[activeModalId] : []}
      />
    </>
  );
};

export default SummaryWidgets;

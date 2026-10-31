import React, { useEffect, useMemo, useState } from "react";
import CountUp from "react-countup";
import { Card, CardBody, Col, Row } from "reactstrap";
import { getAppointmentQueue } from "../../../../helpers/realbackend_helper";
import { readReceptionDoctorId, unwrap } from "../../receptionSession";
import ReceptionKpiListModal from "./ReceptionKpiListModal";
import { RECEPTION_KPI_MODALS, mapQueueKpiRow } from "./receptionKpiListData";

const KPI_CARDS = [
  {
    id: "today-appointments",
    label: "Today's Appointments",
    icon: "ri-calendar-event-line",
    linkLabel: "View All",
  },
  {
    id: "waiting-patients",
    label: "Waiting Patients",
    icon: "ri-time-line",
    linkLabel: "View All",
  },
  {
    id: "pending-payments",
    label: "Pending Payments",
    icon: "ri-wallet-3-line",
    linkLabel: "View All",
  },
  {
    id: "today-patients",
    label: "Total Patients",
    icon: "ri-group-line",
    linkLabel: "View All",
  },
];

const localIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const asList = (response) => {
  const body = unwrap(response);
  const list = body.queue || body.Queue || body.data || body.Data || body;
  return Array.isArray(list) ? list : [];
};

const SummaryWidgets = ({ refreshKey = 0 }) => {
  const [activeModalId, setActiveModalId] = useState(null);
  const [rows, setRows] = useState([]);
  const doctorId = readReceptionDoctorId();

  useEffect(() => {
    if (!doctorId) {
      setRows([]);
      return undefined;
    }
    let cancelled = false;
    Promise.all([
      getAppointmentQueue(doctorId, { date: localIso(), scope: "day" }),
      getAppointmentQueue(doctorId),
    ])
      .then(([dayRes, waitRes]) => {
        if (cancelled) return;
        const merged = [];
        const seen = new Set();
        [...asList(dayRes), ...asList(waitRes)].forEach((row) => {
          const id = row.patientAppId ?? row.PatientAppId;
          if (id == null || seen.has(String(id))) return;
          seen.add(String(id));
          merged.push(row);
        });
        setRows(merged.map(mapQueueKpiRow).sort((a, b) => a.sortTime - b.sortTime));
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [doctorId, refreshKey]);

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
        {KPI_CARDS.map((item) => (
          <Col xs={12} sm={6} xl={3} className="reception-kpi-col" key={item.id}>
            <Card className="card-animate admin-dash-card admin-kpi-card reception-kpi-card mb-0 h-100">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-bold text-truncate mb-0 reception-kpi-label">
                      {item.label}
                    </p>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-3">
                  <div className="overflow-hidden pe-2">
                    <h4 className="fs-20 fw-semibold ff-secondary mb-2 reception-kpi-count">
                      <span className="counter-value">
                        <CountUp start={0} end={lists[item.id]?.length || 0} duration={1} />
                      </span>
                    </h4>
                    <button
                      type="button"
                      className="reception-kpi-view"
                      title="View"
                      aria-label={`View ${item.label}`}
                      onClick={() => setActiveModalId(item.id)}
                    >
                      <i className="ri-eye-line" aria-hidden="true" />
                    </button>
                  </div>
                  <i className={`${item.icon} kpi-tile-icon`} aria-hidden="true" />
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>

      {activeModal ? (
        <ReceptionKpiListModal
          isOpen={Boolean(activeModalId)}
          toggle={() => setActiveModalId(null)}
          title={activeModal.title}
          icon={activeModal.icon}
          searchPlaceholder={activeModal.searchPlaceholder}
          entityLabel={activeModal.entityLabel}
          emptyMessage={activeModal.emptyMessage}
          columns={activeModal.columns}
          rows={lists[activeModalId] || []}
        />
      ) : null}
    </>
  );
};

export default SummaryWidgets;

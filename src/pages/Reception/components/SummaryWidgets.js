import React, { useState } from "react";
import CountUp from "react-countup";
import { Card, CardBody, Col, Row } from "reactstrap";
import ReceptionKpiListModal from "./ReceptionKpiListModal";
import { RECEPTION_KPI_MODALS } from "./receptionKpiListData";

const KPI_CARDS = [
  {
    id: "today-appointments",
    label: "Today's Appointments",
    value: 24,
    icon: "mdi mdi-calendar-clock",
    linkLabel: "View All",
  },
  {
    id: "waiting-patients",
    label: "Waiting Patients",
    value: 5,
    icon: "mdi mdi-account-clock",
    linkLabel: "View All",
  },
  {
    id: "pending-payments",
    label: "Pending Payments",
    value: 3,
    icon: "mdi mdi-cash-multiple",
    linkLabel: "View All",
  },
  {
    id: "today-patients",
    label: "Total Patients",
    value: 28,
    icon: "mdi mdi-account-group",
    linkLabel: "View All",
  },
];

const SummaryWidgets = () => {
  const [activeModalId, setActiveModalId] = useState(null);
  const activeModal = activeModalId ? RECEPTION_KPI_MODALS[activeModalId] : null;

  return (
    <>
      <Row className="g-2 reception-dashboard-widgets">
        {KPI_CARDS.map((item) => (
          <Col xs={12} sm={6} xl={3} className="reception-kpi-col" key={item.id}>
            <Card className="card-animate admin-dash-card doctor-action-card">
              <CardBody>
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1 overflow-hidden">
                    <p className="text-uppercase fw-bold text-truncate mb-0 reception-kpi-label">
                      {item.label}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <h5 className="fs-14 mb-0 text-muted">—</h5>
                  </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                  <div>
                    <h4 className="fs-20 fw-semibold ff-secondary mb-4">
                      <span className="counter-value">
                        <CountUp start={0} end={item.value} duration={2} />
                      </span>
                    </h4>
                    <button
                      type="button"
                      className="reception-kpi-link doctor-dashboard-action-link border-0 bg-transparent p-0"
                      onClick={() => setActiveModalId(item.id)}
                    >
                      {item.linkLabel}
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
          rows={activeModal.rows}
        />
      ) : null}
    </>
  );
};

export default SummaryWidgets;

import React from "react";
import { Card, CardHeader, Col, Spinner } from "reactstrap";
import { ConsultModeChart } from "./DashboardEcommerceCharts";

const StoreVisits = ({ summary, loading }) => {
  const modes = summary?.consultModes || [];

  return (
    <Col xl={4}>
      <Card className="card-height-100 admin-dash-card">
        <CardHeader className="align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Consultation Mode</h4>
        </CardHeader>

        <div className="card-body">
          {loading && !summary ? (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> Loading…
            </div>
          ) : modes.length === 0 ? (
            <p className="text-muted mb-0">No appointments in this period.</p>
          ) : (
            <ConsultModeChart modes={modes} dataColors='["--vz-info", "--vz-primary", "--vz-success", "--vz-warning"]' />
          )}
        </div>
      </Card>
    </Col>
  );
};

export default StoreVisits;

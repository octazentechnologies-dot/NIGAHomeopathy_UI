import React from "react";
import { Card, CardBody, CardHeader, Col, Spinner } from "reactstrap";
import { downloadCsv } from "./adminDashboardFormat";

const SalesByLocations = ({ summary, loading }) => {
  const locations = summary?.locations || [];
  const total = summary?.locationTotal || 0;

  const handleExport = () => {
    downloadCsv(`patients-by-state-${summary?.from?.slice(0, 10) || ""}-${summary?.to?.slice(0, 10) || ""}.csv`, [
      ["State", "Patients", "Share %"],
      ...locations.map((row) => [row.name, row.patients, row.share]),
      ["Total", total, 100],
    ]);
  };

  return (
    <Col xl={4}>
      <Card className="card-height-100 admin-dash-card">
        <CardHeader className="align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Patients by Location</h4>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm doctor-dashboard-toolbar-btn"
              disabled={!locations.length}
              onClick={handleExport}
            >
              Export Report
            </button>
          </div>
        </CardHeader>

        <CardBody>
          {loading && !summary ? (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> Loading…
            </div>
          ) : locations.length === 0 ? (
            <p className="text-muted mb-0">No patient visits in this period.</p>
          ) : (
            <div className="px-2 py-2">
              <p className="text-muted mb-3">
                {total.toLocaleString("en-IN")} patients visited, by state on their profile.
              </p>
              {locations.map((row, index) => (
                <div key={row.name} className={index ? "mt-3" : ""}>
                  <p className="mb-1">
                    {row.name}
                    <span className="float-end">
                      {row.patients} · {row.share}%
                    </span>
                  </p>
                  <div className="progress mt-2" style={{ height: "6px" }}>
                    <div
                      className="progress-bar progress-bar-striped bg-info"
                      role="progressbar"
                      style={{ width: `${row.share}%` }}
                      aria-valuenow={row.share}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

export default SalesByLocations;

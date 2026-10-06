import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Col, Spinner } from "reactstrap";
import { formatRupees } from "./adminDashboardFormat";

const initials = (name) =>
  String(name || "")
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "DR";

const TopSellers = ({ summary, loading }) => {
  const doctors = summary?.topDoctors || [];
  const total = summary?.kpis?.appointments || 0;

  return (
    <Col xl={6}>
      <Card className="card-height-100 admin-dash-card">
        <CardHeader className="align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Top Performing Doctors</h4>
          <div className="flex-shrink-0">
            <Link to="/admin/consult-payments" className="btn btn-sm doctor-dashboard-toolbar-btn">
              View Report
            </Link>
          </div>
        </CardHeader>

        <CardBody>
          {loading && !summary ? (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> Loading…
            </div>
          ) : doctors.length === 0 ? (
            <p className="text-muted mb-0">No appointments in this period.</p>
          ) : (
            <div className="table-responsive table-card">
              <table className="table table-centered table-hover align-middle table-nowrap mb-0">
                <tbody>
                  {doctors.map((item) => (
                    <tr key={item.doctorId}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar-sm flex-shrink-0 me-2">
                            <span className="avatar-title rounded-circle bg-primary-subtle text-primary fw-semibold">
                              {initials(item.doctorName)}
                            </span>
                          </div>
                          <div>
                            <h5 className="fs-14 my-1 fw-medium">{item.doctorName || `Doctor #${item.doctorId}`}</h5>
                            <span className="text-muted">{item.clinicName || "Clinic not set"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="mb-0">{item.appointments}</p>
                        <span className="text-muted">Visits</span>
                      </td>
                      <td>
                        <p className="mb-0">{item.patients}</p>
                        <span className="text-muted">Patients</span>
                      </td>
                      <td>
                        <p className="mb-0">{formatRupees(item.revenue)}</p>
                        <span className="text-muted">Collected</span>
                      </td>
                      <td>
                        <h5 className="fs-14 mb-0">
                          {total ? Math.round((item.appointments / total) * 1000) / 10 : 0}%
                          <i className="ri-bar-chart-fill text-success fs-16 align-middle ms-2" />
                        </h5>
                        <span className="text-muted">Share</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </Col>
  );
};

export default TopSellers;

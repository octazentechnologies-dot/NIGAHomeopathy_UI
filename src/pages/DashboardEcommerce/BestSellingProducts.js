import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Col, Spinner } from "reactstrap";

const BestSellingProducts = ({ summary, loading }) => {
  const remedies = summary?.topRemedies || [];
  const top = remedies[0]?.count || 0;

  return (
    <Col xl={6}>
      <Card className="card-height-100 admin-dash-card">
        <CardHeader className="align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Top Remedies Ordered</h4>
          <div className="flex-shrink-0">
            <Link to="/admin/medicine-report" className="btn btn-sm doctor-dashboard-toolbar-btn">
              Medicine report
            </Link>
          </div>
        </CardHeader>

        <CardBody>
          {loading && !summary ? (
            <div className="text-muted d-flex align-items-center gap-2">
              <Spinner size="sm" /> Loading…
            </div>
          ) : remedies.length === 0 ? (
            <p className="text-muted mb-0">No medicine orders in this period.</p>
          ) : (
            <div className="table-responsive table-card">
              <table className="table table-hover table-centered align-middle table-nowrap mb-0">
                <tbody>
                  {remedies.map((item, index) => (
                    <tr key={item.name}>
                      <td style={{ width: 48 }}>
                        <div className="avatar-xs">
                          <span className="avatar-title rounded-circle bg-info-subtle text-info fw-semibold">{index + 1}</span>
                        </div>
                      </td>
                      <td>
                        <h5 className="fs-14 my-1">{item.name}</h5>
                        <span className="text-muted">Remedy</span>
                      </td>
                      <td style={{ width: "40%" }}>
                        <div className="progress" style={{ height: "6px" }}>
                          <div
                            className="progress-bar bg-info"
                            role="progressbar"
                            style={{ width: `${top ? (item.count / top) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="text-end">
                        <h5 className="fs-14 my-1 fw-normal">{item.count}</h5>
                        <span className="text-muted">Orders</span>
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

export default BestSellingProducts;

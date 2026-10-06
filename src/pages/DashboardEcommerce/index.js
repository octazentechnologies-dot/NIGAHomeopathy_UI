import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { Alert, Col, Container, Row } from "reactstrap";
import Widget from "./Widgets";
import AdminPeopleLists from "./AdminPeopleLists";
import AdminOverviewHeader from "./AdminOverviewHeader";
import BestSellingProducts from "./BestSellingProducts";
import RecentOrders from "./RecentOrders";
import Revenue from "./Revenue";
import SalesByLocations from "./SalesByLocations";
import StoreVisits from "./StoreVisits";
import TopSellers from "./TopSellers";
import { adminDashboardSummary, s4Message } from "../../helpers/s5Week5Api";

const defaultRange = () => [moment().subtract(29, "days").startOf("day").toDate(), moment().startOf("day").toDate()];

const DashboardEcommerce = () => {
  document.title = "Dashboard | Niga Homeocentrum";

  const [range, setRange] = useState(defaultRange);
  const [doctorId, setDoctorId] = useState("");
  const [summary, setSummary] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await adminDashboardSummary({
        from: moment(range[0]).format("YYYY-MM-DD"),
        to: moment(range[1]).format("YYYY-MM-DD"),
        ...(doctorId ? { doctorId } : {}),
      });
      const data = response?.data || null;
      setSummary(data);
      if (Array.isArray(data?.doctors)) setDoctors(data.doctors);
    } catch (err) {
      setSummary(null);
      setError(s4Message(err));
    } finally {
      setLoading(false);
    }
  }, [range, doctorId]);

  useEffect(() => {
    load();
  }, [load]);

  const cardProps = { summary, loading };

  return (
    <React.Fragment>
      <div className="page-content admin-dashboard-page">
        <Container fluid>
          <Row>
            <Col>
              <div className="h-100">
                <AdminOverviewHeader
                  range={range}
                  onRangeChange={setRange}
                  doctorId={doctorId}
                  onDoctorChange={setDoctorId}
                  doctors={doctors}
                  summary={summary}
                />
                {error ? (
                  <Alert color="danger" className="d-flex align-items-center justify-content-between">
                    <span>{error}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={load}>
                      Retry
                    </button>
                  </Alert>
                ) : null}
                <Row className="g-2">
                  <Widget {...cardProps} />
                </Row>
                <Row className="g-2">
                  <AdminPeopleLists />
                </Row>
                <Row className="g-2">
                  <Col xl={8}>
                    <Revenue {...cardProps} />
                  </Col>
                  <SalesByLocations {...cardProps} />
                </Row>
                <Row className="g-2">
                  <BestSellingProducts {...cardProps} />
                  <TopSellers {...cardProps} />
                </Row>
                <Row className="g-2">
                  <StoreVisits {...cardProps} />
                  <RecentOrders {...cardProps} />
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default DashboardEcommerce;

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Col, Row } from "reactstrap";
import { RevenueCharts } from "./DashboardEcommerceCharts";
import CountUp from "react-countup";
import { useSelector, useDispatch } from "react-redux";
import { getRevenueChartsData } from "../../slices/thunks";
import { createSelector } from "reselect";
import AdminPeriodFilter from "./AdminPeriodFilter";

const periodApiMap = {
  all: "all",
  month: "month",
  quarter: "halfyear",
  halfyear: "halfyear",
};

const Revenue = () => {
  const dispatch = useDispatch();
  const [chartData, setchartData] = useState([]);
  const [activePeriod, setActivePeriod] = useState("all");

  const selectDashboardData = createSelector(
    (state) => state.DashboardEcommerce,
    (revenueData) => revenueData.revenueData
  );
  const revenueData = useSelector(selectDashboardData);

  useEffect(() => {
    setchartData(revenueData);
  }, [revenueData]);

  const onChangeChartPeriod = (pType) => {
    setActivePeriod(pType);
    dispatch(getRevenueChartsData(periodApiMap[pType] || "all"));
  };

  useEffect(() => {
    dispatch(getRevenueChartsData("all"));
  }, [dispatch]);

  return (
    <React.Fragment>
      <Card className="admin-dash-card">
        <CardHeader className="border-0 align-items-center d-flex admin-dash-card-header">
          <h4 className="card-title mb-0 flex-grow-1">Patient Visits</h4>
          <AdminPeriodFilter activePeriod={activePeriod} onChange={onChangeChartPeriod} />
        </CardHeader>

        <CardHeader className="p-0 border-0 bg-light-subtle">
          <Row className="g-0 text-center">
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  <CountUp start={0} end={1284} duration={3} separator="," />
                </h5>
                <p className="text-muted mb-0">Appointments</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  <CountUp
                    suffix="L"
                    prefix="₹"
                    start={0}
                    decimals={2}
                    end={8.42}
                    duration={3}
                  />
                </h5>
                <p className="text-muted mb-0">Revenue</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0">
                <h5 className="mb-1">
                  <CountUp start={0} end={86} duration={3} />
                </h5>
                <p className="text-muted mb-0">New Patients</p>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="p-3 border border-dashed border-start-0 border-end-0">
                <h5 className="mb-1 text-success">
                  <CountUp
                    start={0}
                    end={78.5}
                    decimals={1}
                    duration={3}
                    suffix="%"
                  />
                </h5>
                <p className="text-muted mb-0">Follow-up Rate</p>
              </div>
            </Col>
          </Row>
        </CardHeader>

        <CardBody className="p-0 pb-2">
          <div className="w-100">
            <div dir="ltr">
              <RevenueCharts series={chartData} dataColors='["--vz-info",  "--vz-primary", "--vz-secondary"]' />
            </div>
          </div>
        </CardBody>
      </Card>
    </React.Fragment>
  );
};

export default Revenue;

import React, { useState } from 'react';
import { Card, CardHeader, Col } from 'reactstrap';
import { StoreVisitsCharts } from './DashboardEcommerceCharts';
import AdminPeriodFilter from './AdminPeriodFilter';

const StoreVisits = () => {
    const [activePeriod, setActivePeriod] = useState('all');

    return (
        <React.Fragment>
            <Col xl={4}>
                <Card className="card-height-100 admin-dash-card">
                    <CardHeader className="align-items-center d-flex admin-dash-card-header">
                        <h4 className="card-title mb-0 flex-grow-1">Patient Registration Sources</h4>
                        <AdminPeriodFilter activePeriod={activePeriod} onChange={setActivePeriod} />
                    </CardHeader>

                    <div className="card-body">
                        <StoreVisitsCharts dataColors='["--vz-info", "--vz-primary", "--vz-success", "--vz-warning", "--vz-secondary"]' />
                    </div>
                </Card>
            </Col>
        </React.Fragment>
    );
};

export default StoreVisits;

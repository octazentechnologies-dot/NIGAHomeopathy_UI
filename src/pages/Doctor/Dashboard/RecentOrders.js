import React, { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { BarLabelChart } from './DashboardEcommerceCharts';
import PatientStatsEmptyState from './PatientStatsEmptyState';
import PatientStatsPeriodFilter from './PatientStatsPeriodFilter';
import usePatientStats from './usePatientStats';
import {
    createDefaultPatientStatsFilter,
    mapBarChartSeries,
    PATIENT_STATS_CHART_COLORS,
} from './patientStatsChartsHelper';

const RecentOrders = () => {
    const [filter, setFilter] = useState(createDefaultPatientStatsFilter);
    const { stats, loading, error, refresh } = usePatientStats(filter);

    const currentSeries = useMemo(() => mapBarChartSeries(stats?.barChart), [stats]);
    const hasData = (stats?.pieChart?.total ?? 0) > 0;

    const renderContent = () => {
        if (loading && !stats) {
            return <div className="text-center text-muted py-5">Loading patient stats...</div>;
        }

        if (error && !stats) {
            return (
                <PatientStatsEmptyState
                    filter={filter}
                    icon="ri-error-warning-line"
                    isError
                    onRetry={refresh}
                />
            );
        }

        if (!hasData || !currentSeries?.months?.length) {
            return <PatientStatsEmptyState filter={filter} icon="ri-bar-chart-grouped-line" onRetry={refresh} />;
        }

        return <BarLabelChart seriesData={currentSeries} colors={PATIENT_STATS_CHART_COLORS} />;
    };

    return (
        <Col xl={8} className="d-flex">
            <Card className="card-height-100 flex-grow-1 w-100 doctor-stats-card">
                <CardHeader className="align-items-center d-flex flex-wrap gap-2 doctor-dashboard-card-header">
                    <h4 className="card-title mb-0 flex-grow-1">Monthly Patient Stats</h4>
                    <PatientStatsPeriodFilter filter={filter} onFilterChange={setFilter} />
                </CardHeader>
                <CardBody className="patient-stats-card-body patient-stats-card-body--bar">{renderContent()}</CardBody>
            </Card>
        </Col>
    );
};

export default RecentOrders;

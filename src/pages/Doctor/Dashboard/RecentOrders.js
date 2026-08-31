import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Col } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { BarLabelChart } from './DashboardEcommerceCharts';
import PatientStatsEmptyState from './PatientStatsEmptyState';
import PatientStatsPeriodFilter from './PatientStatsPeriodFilter';
import { fetchPatientStatsCharts } from '../../../slices/doctor/dashboard/thunk';
import {
    buildPatientStatsCacheKey,
    createDefaultPatientStatsFilter,
    mapBarChartSeries,
    PATIENT_STATS_CHART_COLORS,
} from './patientStatsChartsHelper';

const RecentOrders = () => {
    const dispatch = useDispatch();
    const [filter, setFilter] = useState(createDefaultPatientStatsFilter);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cacheKey = buildPatientStatsCacheKey(filter);
    const statsByKey = useSelector((state) => state?.DoctorDashboard?.patientStatsChartsByKey) || {};
    const stats = statsByKey[cacheKey];

    useEffect(() => {
        let cancelled = false;

        const loadStats = async () => {
            setLoading(true);
            setError(null);
            try {
                await dispatch(fetchPatientStatsCharts({
                    period: filter.period,
                    fromDate: filter.fromDate,
                    toDate: filter.toDate,
                    cacheKey,
                }));
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadStats();

        return () => {
            cancelled = true;
        };
    }, [dispatch, filter, cacheKey]);

    const currentSeries = useMemo(() => mapBarChartSeries(stats?.barChart), [stats]);
    const hasData = (stats?.pieChart?.total ?? 0) > 0;

    const handleRefresh = async () => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(fetchPatientStatsCharts({
                period: filter.period,
                fromDate: filter.fromDate,
                toDate: filter.toDate,
                cacheKey,
                force: true,
            }));
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

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
                    onRetry={handleRefresh}
                />
            );
        }

        if (!hasData || !currentSeries?.months?.length) {
            return <PatientStatsEmptyState filter={filter} icon="ri-bar-chart-grouped-line" onRetry={handleRefresh} />;
        }

        return <BarLabelChart seriesData={currentSeries} colors={PATIENT_STATS_CHART_COLORS} />;
    };

    return (
        <Col xl={8} className="d-flex">
            <Card className="card-height-100 flex-grow-1 w-100 doctor-stats-card">
                <CardHeader className="align-items-center d-flex doctor-dashboard-card-header">
                    <h4 className="card-title mb-0 flex-grow-1">Patient Stats</h4>
                    <PatientStatsPeriodFilter filter={filter} onFilterChange={setFilter} />
                </CardHeader>
                <CardBody className="patient-stats-card-body patient-stats-card-body--bar">{renderContent()}</CardBody>
            </Card>
        </Col>
    );
};

export default RecentOrders;

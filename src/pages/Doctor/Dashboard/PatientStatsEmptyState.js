import React from 'react';
import { getPatientStatsPeriodLabel } from './patientStatsChartsHelper';

const PatientStatsEmptyState = ({ filter, icon = 'ri-pie-chart-2-line', onRetry, isError = false }) => {
    const periodLabel = getPatientStatsPeriodLabel(filter);

    return (
        <div
            className="text-center text-muted d-flex flex-column align-items-center justify-content-center px-3"
            style={{ minHeight: 280 }}
        >
            <i className={`${icon} fs-1 mb-3 opacity-50`} />
            <h6 className="text-muted mb-2">
                {isError ? 'Unable to load patient stats' : 'No patient stats to show'}
            </h6>
            <p className="mb-0 small" style={{ maxWidth: 320 }}>
                {isError
                    ? 'Something went wrong while loading the chart. Please try again.'
                    : `No appointments were found for ${periodLabel}. Patient stats will appear here once appointments are recorded.`}
            </p>
            {onRetry ? (
                <button type="button" className="btn btn-sm btn-soft-primary mt-3" onClick={onRetry}>
                    Refresh
                </button>
            ) : null}
        </div>
    );
};

export default PatientStatsEmptyState;

export const PATIENT_STATS_STATUS_COUNT = 6;

export const PATIENT_STATS_STATUS_LABELS = [
    'WAITING',
    'WALK-IN',
    'NOT ARRIVED',
    'E-CONSULT',
    'REMAINING',
    'COMPLETED',
];

// Shared minimal palette — distinct per status, readable on white (Velzon minimal tokens).
export const PATIENT_STATS_CHART_COLORS = [
    '#25a0e2', // primary / cyan
    '#32ccff', // info / blue
    '#00bd9d', // success / teal
    '#FFBC0A', // warning / amber
    '#f06548', // danger / coral
    '#94a3b8', // slate — visible vs white (replaces near-invisible #f3f6f9)
];

export const PATIENT_STATS_DOUGHNUT_COLORS = PATIENT_STATS_CHART_COLORS;
export const PATIENT_STATS_BAR_COLORS = PATIENT_STATS_CHART_COLORS;

export const getYearToDateRange = () => {
    const today = new Date();
    const from = new Date(today.getFullYear(), 0, 1);
    return {
        fromDate: formatDateInput(from),
        toDate: formatDateInput(today),
    };
};

export const formatDateInput = (date) => {
    if (!date) {
        return '';
    }
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) {
        return '';
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const buildPatientStatsCacheKey = ({ period, fromDate, toDate }) => {
    if (period === 'ALL' && fromDate && toDate) {
        return `ALL|${fromDate}|${toDate}`;
    }
    return period || 'ALL';
};

export const mapBarChartSeries = (barChart) => {
    if (!barChart) {
        return null;
    }

    return {
        waiting: barChart.waiting || [],
        walkIn: barChart.walkIn || barChart.walkin || [],
        notArrived: barChart.notArrived || barChart.notarrived || [],
        eConsult: barChart.eConsult || barChart.econsult || [],
        remaining: barChart.remaining || [],
        completed: barChart.completed || [],
        months: barChart.months || [],
    };
};

export const getPatientStatsPeriodLabel = (filter) => {
    if (filter?.period === 'ALL' && filter?.fromDate && filter?.toDate) {
        return `${filter.fromDate} to ${filter.toDate}`;
    }

    const labels = {
        ALL: 'this year',
        '1M': 'the last month',
        '3M': 'the last 3 months',
        '6M': 'the last 6 months',
    };

    return labels[filter?.period] || 'the selected period';
};

export const createDefaultPatientStatsFilter = () => ({
    period: 'ALL',
    fromDate: null,
    toDate: null,
});

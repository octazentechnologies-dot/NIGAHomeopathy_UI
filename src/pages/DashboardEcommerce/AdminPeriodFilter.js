import React from 'react';

/**
 * Minimal-theme period filter buttons (doctor dashboard pattern).
 * Active = solid #25a0e2 / white; idle = soft blue.
 */
const AdminPeriodFilter = ({ activePeriod = 'all', onChange }) => {
  const periods = [
    { key: 'all', label: 'ALL' },
    { key: 'month', label: '1M' },
    { key: 'quarter', label: '3M' },
    { key: 'halfyear', label: '6M' },
  ];

  return (
    <div className="d-flex gap-1 flex-shrink-0 admin-period-filter">
      {periods.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`btn btn-sm doctor-dashboard-toolbar-btn admin-period-btn${activePeriod === key ? ' active' : ''}`}
          onClick={() => onChange?.(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default AdminPeriodFilter;

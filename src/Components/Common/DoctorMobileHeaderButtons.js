import React from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../constants/roles';
import DoctorReportsDropdown from '../../pages/Doctor/Reports/DoctorReportsDropdown';
import DoctorAppointmentRequestsHeaderButton from './DoctorAppointmentRequestsHeaderButton';

const DoctorMobileHeaderButtons = ({ userRole }) => {
  if (userRole !== UserRole.DOCTOR) return null;

  return (
    <>
      <DoctorAppointmentRequestsHeaderButton userRole={userRole} />
      <div className="ms-1 header-item">
        <Link
          to="/doctor/erx"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="eRx — Sign & download PDF"
          aria-label="eRx — Sign and download PDF"
        >
          <i className="ri-file-text-line fs-20" />
        </Link>
      </div>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/mobile/refill"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Refill inbox"
          aria-label="Refill inbox"
        >
          <i className="ri-medicine-bottle-line fs-20" />
        </Link>
      </div>
      <DoctorReportsDropdown />
    </>
  );
};

export default DoctorMobileHeaderButtons;

import React from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../constants/roles';

const DoctorMobileHeaderButtons = ({ userRole }) => {
  if (userRole !== UserRole.DOCTOR) return null;

  return (
    <>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/mobile/videoroom"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Video room"
          aria-label="Video room"
        >
          <i className="ri-vidicon-line fs-20" />
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
    </>
  );
};

export default DoctorMobileHeaderButtons;

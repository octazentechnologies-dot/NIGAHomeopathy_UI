import React from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../constants/roles';

const ReceptionStaffHeaderButton = ({ userRole }) => {
  if (userRole !== UserRole.DOCTOR) return null;

  return (
    <div className="ms-1 header-item">
      <Link
        to="/doctor/reception-staff"
        className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
        title="Receptionist Staff"
        aria-label="Receptionist Staff"
      >
        <i className="ri-user-star-line fs-20" />
      </Link>
    </div>
  );
};

export default ReceptionStaffHeaderButton;

import React from 'react';
import { Link } from 'react-router-dom';
import { UserRole } from '../constants/roles';

const DoctorMobileHeaderButtons = ({ userRole }) => {
  if (userRole !== UserRole.DOCTOR) return null;

  return (
    <>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/tele"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Teleconsult"
          aria-label="Teleconsult"
        >
          <i className="ri-vidicon-line fs-20" />
        </Link>
      </div>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/consult-fees"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Consult fees"
          aria-label="Consult fees"
        >
          <i className="ri-money-dollar-circle-line fs-20" />
        </Link>
      </div>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/earnings"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Earnings"
          aria-label="Earnings"
        >
          <i className="ri-wallet-3-line fs-20" />
        </Link>
      </div>
      <div className="ms-1 header-item">
        <Link
          to="/doctor/erx"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Sign eRx"
          aria-label="Sign eRx"
        >
          <i className="ri-file-text-line fs-20" />
        </Link>
      </div>
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

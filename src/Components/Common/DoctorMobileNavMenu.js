import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownMenu, DropdownToggle } from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import { UserRole } from "../constants/roles";
import { useLayoutMenu } from "../../Layouts/LayoutMenuContext";
import { groupMoreMenuFlyoutItems, isAdminEnquiriesNavItem } from "../../helpers/menuByRole";
import { DOCTOR_REPORTS } from "../../pages/Doctor/Reports/DoctorReportsDropdown";
import {
  dispatchOpenDoctorScheduleCalendar,
  dispatchOpenLastWorkBackup,
} from "../../helpers/dashboard_helper";
import { HiddenLink } from "../../helpers/hiddenRouteParams";
import {
  getPatientAvatarColor,
  getPatientInitials,
  getSortedPatientSessions,
} from "../../helpers/patientBoardSessionHelper";
import {
  isWebHandoffSession,
  returnToDoctorApp,
  webHandoffEndedReason,
} from "../../helpers/webHandoffSession";
import { savePatientBoardBackupFromSessions } from "../../slices/doctor/patientBoardBackup/thunk";
import { sessionsHaveBackupWork } from "../../helpers/patientBoardBackupHelper";

const withoutEnquiries = (items) =>
  (items || [])
    .filter((item) => !isAdminEnquiriesNavItem(item))
    .map((item) => {
      const kids = item.subItems || item.childItems;
      if (!kids?.length) return item;
      const filtered = withoutEnquiries(kids);
      return item.subItems
        ? { ...item, subItems: filtered }
        : { ...item, childItems: filtered };
    });

/**
 * Phone / handoff overflow: one Menu control for tools that the compact topbar hides.
 * Desktop keeps the icon rail; this control is CSS-shown only under ~500px.
 */
const DoctorMobileNavMenu = ({ userRole, onOpenHelp, onOpenWhatsApp }) => {
  const dispatch = useDispatch();
  const { moreMenuItems: rawMoreMenuItems } = useLayoutMenu();
  const moreMenuItems = useMemo(
    () => groupMoreMenuFlyoutItems(withoutEnquiries(rawMoreMenuItems)),
    [rawMoreMenuItems]
  );
  const sessions = useSelector((state) => state?.PatientBoardSession?.sessions ?? []);
  const activePatientKey = useSelector((state) => state?.PatientBoardSession?.activePatientKey);
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  const sortedSessions = useMemo(() => {
    const uniqueByKey = new Map();
    getSortedPatientSessions(sessions).forEach((session) => {
      if (session?.patientKey) uniqueByKey.set(session.patientKey, session);
    });
    return Array.from(uniqueByKey.values());
  }, [sessions]);

  if (userRole !== UserRole.DOCTOR) return null;

  const close = () => {
    setIsOpen(false);
    setOpenGroup(null);
  };

  const toggleGroup = (key) => {
    setOpenGroup((current) => (current === key ? null : key));
  };

  const goBackToApp = async () => {
    close();
    try {
      if (sessionsHaveBackupWork(sessions)) {
        await dispatch(savePatientBoardBackupFromSessions(sessions));
      }
    } catch {
      /* still return */
    }
    await returnToDoctorApp("opened");
  };

  const showReturn = isWebHandoffSession() && !webHandoffEndedReason();

  const renderMoreLeaves = (items, depth = 0) =>
    (items || []).map((item, index) => {
      const key = item.id || `${item.label}-${depth}-${index}`;
      if (item.isHeader) {
        return (
          <div key={key} className="dropdown-header text-muted text-uppercase fs-11">
            {item.label}
          </div>
        );
      }
      const children = item.childItems || item.subItems;
      if (children?.length) {
        const open = openGroup === key;
        return (
          <div key={key} className="doctor-mobile-nav__group">
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center justify-content-between${open ? " active" : ""}`}
              aria-expanded={open}
              onClick={() => toggleGroup(key)}
            >
              <span className="d-flex align-items-center gap-2">
                {item.icon ? <i className={item.icon} /> : null}
                <span>{item.label}</span>
              </span>
              <i className={`ri-arrow-${open ? "up" : "down"}-s-line`} aria-hidden="true" />
            </button>
            {open ? (
              <div className="doctor-mobile-nav__subgroup" role="group">
                {children.map((child) => (
                  <Link
                    key={child.id || child.link || child.label}
                    to={child.link || "/#"}
                    className="dropdown-item doctor-mobile-nav__sublink"
                    onClick={close}
                  >
                    {child.icon ? <i className={`${child.icon} me-2`} /> : null}
                    {child.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      }
      return (
        <Link
          key={key}
          to={item.link || "/#"}
          className="dropdown-item"
          onClick={close}
        >
          {item.icon ? <i className={`${item.icon} me-2`} /> : null}
          {item.label}
        </Link>
      );
    });

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen((v) => !v)}
      className="topbar-head-dropdown ms-1 header-item header-doctor-mobile-nav"
    >
      <DropdownToggle
        tag="button"
        type="button"
        className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
        title="Menu"
        aria-label="Open menu"
      >
        <i className="ri-menu-line fs-22" />
      </DropdownToggle>
      <DropdownMenu
        container="body"
        strategy="fixed"
        className="dropdown-menu-lg doctor-mobile-nav-panel"
      >
        <div className="doctor-mobile-nav-body">
          {showReturn ? (
            <>
              <button type="button" className="dropdown-item text-primary fw-semibold" onClick={goBackToApp}>
                <i className="ri-smartphone-line me-2" />
                Return to Doctor app
              </button>
              <div className="dropdown-divider" />
            </>
          ) : null}

          <div className="dropdown-header text-muted text-uppercase fs-11">Clinic tools</div>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              close();
              dispatchOpenLastWorkBackup();
            }}
          >
            <i className="ri-history-line me-2" />
            Last work backup
          </button>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              close();
              dispatchOpenDoctorScheduleCalendar();
            }}
          >
            <i className="ri-calendar-2-line me-2" />
            My schedule
          </button>
          <Link to="/doctor/reception-staff" className="dropdown-item" onClick={close}>
            <i className="ri-user-star-line me-2" />
            Reception staff
          </Link>
          <Link to="/doctor/appointment-requests" className="dropdown-item" onClick={close}>
            <i className="ri-mail-check-line me-2" />
            Appointment requests
          </Link>
          <Link to="/doctor/erx" className="dropdown-item" onClick={close}>
            <i className="ri-file-text-line me-2" />
            eRx — Sign &amp; download
          </Link>
          <Link to="/doctor/mobile/refill" className="dropdown-item" onClick={close}>
            <i className="ri-medicine-bottle-line me-2" />
            Refill inbox
          </Link>

          {sortedSessions.length ? (
            <>
              <div className="dropdown-divider" />
              <div className="dropdown-header text-muted text-uppercase fs-11">Open patients</div>
              {sortedSessions.map((session) => {
                const name = String(session.patientName || "Patient").trim();
                const active = session.patientKey === activePatientKey;
                return (
                  <HiddenLink
                    key={session.patientKey}
                    to={session.resumePath || "/doctor/patientboard"}
                    className={`dropdown-item d-flex align-items-center gap-2${active ? " active" : ""}`}
                    onClick={close}
                  >
                    <span
                      className="doctor-mobile-nav__avatar"
                      style={{ backgroundColor: getPatientAvatarColor(name) }}
                      aria-hidden="true"
                    >
                      {getPatientInitials(name)}
                    </span>
                    <span>{name}</span>
                  </HiddenLink>
                );
              })}
            </>
          ) : null}

          <div className="dropdown-divider" />
          <div className="dropdown-header text-muted text-uppercase fs-11">Reports</div>
          {DOCTOR_REPORTS.map((report) => (
            <Link key={report.path} to={report.path} className="dropdown-item" onClick={close}>
              <i className={`${report.icon} me-2`} />
              {report.label}
            </Link>
          ))}

          {moreMenuItems.length ? (
            <>
              <div className="dropdown-divider" />
              <div className="dropdown-header text-muted text-uppercase fs-11">More</div>
              {renderMoreLeaves(moreMenuItems)}
            </>
          ) : null}

          <div className="dropdown-divider" />
          <div className="dropdown-header text-muted text-uppercase fs-11">Help</div>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              close();
              if (typeof onOpenHelp === "function") onOpenHelp();
            }}
          >
            <i className="ri-question-line me-2" />
            Help &amp; Support
          </button>
          <button
            type="button"
            className="dropdown-item"
            onClick={() => {
              close();
              if (typeof onOpenWhatsApp === "function") onOpenWhatsApp();
            }}
          >
            <i className="ri-whatsapp-line me-2" style={{ color: "#25D366" }} />
            WhatsApp messaging
          </button>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default DoctorMobileNavMenu;

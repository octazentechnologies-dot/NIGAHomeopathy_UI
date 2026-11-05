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
import { completePatientBoardSession } from "../../slices/doctor/patientBoardSession/reducer";

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

const normalizeLink = (link) => String(link || "").split("?")[0].toLowerCase();

const toMenuCase = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === "erx" || lower === "e-rx") return "eRx";
      if (lower === "sms") return "SMS";
      if (lower === "whatsapp") return "WhatsApp";
      if (word === "—" || word === "-") return word;
      if (/^[A-Z0-9]+$/.test(word) && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const PRACTICE_LINKS = [
  {
    id: "doctor-earnings",
    label: "Earnings",
    icon: "ri-line-chart-line",
    link: "/doctor/earnings",
    aliases: ["/doctor/earnings"],
  },
  {
    id: "doctor-followups-due",
    label: "Follow-Ups Due",
    icon: "ri-calendar-check-line",
    link: "/doctor/follow-ups",
    aliases: ["/doctor/follow-ups", "/doctor/followups"],
  },
  {
    id: "doctor-sms",
    label: "SMS Events",
    icon: "ri-chat-3-line",
    link: "/doctor/sms",
    aliases: ["/doctor/sms"],
  },
];

const ItemIcon = ({ icon }) =>
  icon ? <i className={`doctor-hamburger-menu__icon ${icon}`} aria-hidden="true" /> : null;

const ItemLabel = ({ children }) => (
  <span className="doctor-hamburger-menu__label">{children}</span>
);

/**
 * Phone overflow menu — same sections / labels as the desktop hamburger.
 * Extra: handoff return + open patient sessions (mobile-only).
 */
const DoctorMobileNavMenu = ({ userRole, onOpenWhatsApp }) => {
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

  const practiceItems = useMemo(
    () =>
      PRACTICE_LINKS.map((entry) => {
        const byLink = new Map();
        (moreMenuItems || []).forEach((item) => {
          const link = normalizeLink(item.link);
          if (link) byLink.set(link, item);
        });
        const matched =
          entry.aliases.map((alias) => byLink.get(alias)).find(Boolean) || null;
        return {
          ...entry,
          link: matched?.link || entry.link,
        };
      }),
    [moreMenuItems]
  );

  const extraMoreItems = useMemo(() => {
    const practiceSet = new Set(PRACTICE_LINKS.flatMap((item) => item.aliases));
    practiceSet.add("/doctor/support");
    practiceSet.add("/doctor/reports");
    return (moreMenuItems || []).filter((item) => {
      if (item.isHeader) return false;
      const link = normalizeLink(item.link);
      if (link && practiceSet.has(link)) return false;
      if (link && link.startsWith("/doctor/reports")) return false;
      const label = String(item.label || "").trim().toLowerCase();
      if (label === "reports" || label === "support") return false;
      return true;
    });
  }, [moreMenuItems]);

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

  const renderLeaf = (item, depth = 0) => (
    <Link
      key={item.id || `${item.label}-${depth}`}
      to={item.link || "/#"}
      className="dropdown-item doctor-hamburger-menu__item"
      onClick={close}
    >
      <ItemIcon icon={item.icon} />
      <ItemLabel>{toMenuCase(item.label)}</ItemLabel>
    </Link>
  );

  const renderGroup = (key, label, icon, children) => {
    const open = openGroup === key;
    return (
      <div key={key} className="doctor-mobile-nav__group">
        <button
          type="button"
          className={`dropdown-item doctor-hamburger-menu__item doctor-hamburger-menu__parent${open ? " active" : ""}`}
          aria-expanded={open}
          onClick={() => toggleGroup(key)}
        >
          <ItemIcon icon={icon} />
          <ItemLabel>{toMenuCase(label)}</ItemLabel>
          <i className={`ri-arrow-${open ? "up" : "down"}-s-line doctor-hamburger-menu__caret`} aria-hidden="true" />
        </button>
        {open ? (
          <div className="doctor-mobile-nav__subgroup" role="group">
            {children}
          </div>
        ) : null}
      </div>
    );
  };

  const renderMoreLeaves = (items, depth = 0) =>
    (items || []).map((item, index) => {
      const key = item.id || `${item.label}-${depth}-${index}`;
      if (item.isHeader) {
        return (
          <div key={key} className="doctor-hamburger-menu__section">
            {toMenuCase(item.label)}
          </div>
        );
      }
      const children = item.childItems || item.subItems;
      if (children?.length) {
        return renderGroup(
          key,
          item.label,
          item.icon,
          children.map((child) => renderLeaf(child, depth + 1))
        );
      }
      return renderLeaf(item, depth);
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
        className="dropdown-menu-lg doctor-mobile-nav-panel doctor-hamburger-menu-panel"
      >
        <div className="doctor-mobile-nav-body doctor-hamburger-menu-body">
          {showReturn ? (
            <>
              <button
                type="button"
                className="dropdown-item doctor-hamburger-menu__item"
                onClick={goBackToApp}
              >
                <ItemIcon icon="ri-smartphone-line" />
                <ItemLabel>Return To Doctor App</ItemLabel>
              </button>
              <div className="doctor-hamburger-menu__divider" />
            </>
          ) : null}

          <div className="doctor-hamburger-menu__section">Clinic Tools</div>
          <button
            type="button"
            className="dropdown-item doctor-hamburger-menu__item"
            onClick={() => {
              close();
              dispatchOpenLastWorkBackup();
            }}
          >
            <ItemIcon icon="ri-history-line" />
            <ItemLabel>Last Work Backup</ItemLabel>
          </button>
          <button
            type="button"
            className="dropdown-item doctor-hamburger-menu__item"
            onClick={() => {
              close();
              dispatchOpenDoctorScheduleCalendar();
            }}
          >
            <ItemIcon icon="ri-calendar-2-line" />
            <ItemLabel>My Schedule</ItemLabel>
          </button>
          <Link to="/doctor/reception-staff" className="dropdown-item doctor-hamburger-menu__item" onClick={close}>
            <ItemIcon icon="ri-user-star-line" />
            <ItemLabel>Reception Staff</ItemLabel>
          </Link>
          <Link to="/doctor/appointment-requests" className="dropdown-item doctor-hamburger-menu__item" onClick={close}>
            <ItemIcon icon="ri-mail-check-line" />
            <ItemLabel>Appointment Requests</ItemLabel>
          </Link>
          <Link to="/doctor/erx" className="dropdown-item doctor-hamburger-menu__item" onClick={close}>
            <ItemIcon icon="ri-file-text-line" />
            <ItemLabel>eRx — Sign &amp; Download</ItemLabel>
          </Link>
          <Link to="/doctor/mobile/refill" className="dropdown-item doctor-hamburger-menu__item" onClick={close}>
            <ItemIcon icon="ri-medicine-bottle-line" />
            <ItemLabel>Refill Inbox</ItemLabel>
          </Link>
          {renderGroup(
            "doctor-reports",
            "Reports",
            "ri-bar-chart-box-line",
            DOCTOR_REPORTS.map((report) => (
              <Link
                key={report.path}
                to={report.path}
                className="dropdown-item doctor-hamburger-menu__item"
                onClick={close}
              >
                <ItemIcon icon={report.icon} />
                <ItemLabel>{toMenuCase(report.label)}</ItemLabel>
              </Link>
            ))
          )}

          {sortedSessions.length ? (
            <>
              <div className="doctor-hamburger-menu__divider" />
              <div className="doctor-hamburger-menu__section">Open Patients</div>
              {sortedSessions.map((session) => {
                const name = String(session.patientName || "Patient").trim();
                const active = session.patientKey === activePatientKey;
                return (
                  <div
                    key={session.patientKey}
                    className={`dropdown-item doctor-hamburger-menu__item doctor-mobile-nav__session${active ? " active" : ""}`}
                  >
                    <HiddenLink
                      to={session.resumePath || "/doctor/patientboard"}
                      className="d-flex align-items-center gap-2 flex-grow-1 text-decoration-none text-body min-w-0"
                      onClick={close}
                    >
                      <span
                        className="doctor-mobile-nav__avatar"
                        style={{ backgroundColor: getPatientAvatarColor(name) }}
                        aria-hidden="true"
                      >
                        {getPatientInitials(name)}
                      </span>
                      <ItemLabel>{name}</ItemLabel>
                    </HiddenLink>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0 doctor-mobile-nav__session-remove"
                      title={`Remove ${name} from open cases`}
                      aria-label={`Remove ${name} from open cases`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        dispatch(completePatientBoardSession(session.patientKey));
                        close();
                      }}
                    >
                      <i className="ri-close-circle-line fs-16" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </>
          ) : null}

          <div className="doctor-hamburger-menu__divider" />
          <div className="doctor-hamburger-menu__section">Practice</div>
          {practiceItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="dropdown-item doctor-hamburger-menu__item"
              onClick={close}
            >
              <ItemIcon icon={item.icon} />
              <ItemLabel>{item.label}</ItemLabel>
            </Link>
          ))}
          {extraMoreItems.length ? renderMoreLeaves(extraMoreItems) : null}

          <div className="doctor-hamburger-menu__divider" />
          <div className="doctor-hamburger-menu__section">Support</div>
          <Link to="/doctor/support" className="dropdown-item doctor-hamburger-menu__item" onClick={close}>
            <ItemIcon icon="ri-customer-service-2-line" />
            <ItemLabel>Support &amp; Tickets</ItemLabel>
          </Link>
          <button
            type="button"
            className="dropdown-item doctor-hamburger-menu__item"
            onClick={() => {
              close();
              if (typeof onOpenWhatsApp === "function") onOpenWhatsApp();
            }}
          >
            <ItemIcon icon="ri-whatsapp-line" />
            <ItemLabel>WhatsApp Messaging</ItemLabel>
          </button>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default DoctorMobileNavMenu;

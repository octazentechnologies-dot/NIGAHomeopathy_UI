import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Dropdown, DropdownMenu, DropdownToggle } from "reactstrap";
import { UserRole } from "../constants/roles";
import { useLayoutMenu } from "../../Layouts/LayoutMenuContext";
import { groupMoreMenuFlyoutItems, isAdminEnquiriesNavItem } from "../../helpers/menuByRole";
import { DOCTOR_REPORTS } from "../../pages/Doctor/Reports/DoctorReportsDropdown";
import {
  dispatchOpenDoctorScheduleCalendar,
  dispatchOpenLastWorkBackup,
} from "../../helpers/dashboard_helper";

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

/** Title Case for menu labels (eRx / SMS / WhatsApp kept as brand tokens). */
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

const ItemIcon = ({ icon, style }) =>
  icon ? <i className={`doctor-hamburger-menu__icon ${icon}`} style={style} aria-hidden="true" /> : null;

const ItemLabel = ({ children }) => (
  <span className="doctor-hamburger-menu__label">{children}</span>
);

/**
 * Desktop doctor topbar overflow: hamburger sits where Settings was.
 * Opens on hover and lists clinic tools, practice menus, and Support.
 */
const DoctorHamburgerMenu = ({ userRole, onOpenWhatsApp }) => {
  const { moreMenuItems: rawMoreMenuItems } = useLayoutMenu();
  const moreMenuItems = useMemo(
    () => groupMoreMenuFlyoutItems(withoutEnquiries(rawMoreMenuItems)),
    [rawMoreMenuItems]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const closeTimerRef = useRef(null);
  const groupCloseTimerRef = useRef(null);
  const flyoutAnchorRef = useRef(null);

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
          label: entry.label,
          icon: entry.icon,
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

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (groupCloseTimerRef.current) clearTimeout(groupCloseTimerRef.current);
    },
    []
  );

  const placeFlyoutFromEl = (el) => {
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    const parentPanel =
      el.closest(".doctor-hamburger-menu-panel") ||
      document.querySelector(".doctor-hamburger-menu-panel.show") ||
      document.querySelector(".doctor-hamburger-menu-panel");
    const parentRect = parentPanel?.getBoundingClientRect() || rect;
    const panelWidth = 264;
    // Flush to the hamburger panel; 1px overlap removes the hairline gap.
    const left = Math.max(8, parentRect.left - panelWidth + 1);
    const estimatedHeight = 240;
    const top = Math.min(
      Math.max(8, rect.top - 6),
      Math.max(8, window.innerHeight - estimatedHeight - 12)
    );
    setFlyoutPos({ top, left });
  };

  useEffect(() => {
    if (!openGroup || !flyoutAnchorRef.current) return undefined;
    const placeFlyout = () => placeFlyoutFromEl(flyoutAnchorRef.current);
    placeFlyout();
    window.addEventListener("resize", placeFlyout);
    window.addEventListener("scroll", placeFlyout, true);
    return () => {
      window.removeEventListener("resize", placeFlyout);
      window.removeEventListener("scroll", placeFlyout, true);
    };
  }, [openGroup, isOpen]);

  if (userRole !== UserRole.DOCTOR) return null;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setOpenGroup(null);
    }, 200);
  };

  const closeNow = () => {
    clearCloseTimer();
    if (groupCloseTimerRef.current) clearTimeout(groupCloseTimerRef.current);
    setIsOpen(false);
    setOpenGroup(null);
  };

  const openGroupNow = (key, anchorEl) => {
    if (groupCloseTimerRef.current) {
      clearTimeout(groupCloseTimerRef.current);
      groupCloseTimerRef.current = null;
    }
    clearCloseTimer();
    setIsOpen(true);
    if (anchorEl) {
      flyoutAnchorRef.current = anchorEl;
      placeFlyoutFromEl(anchorEl);
    }
    setOpenGroup(key);
  };

  const scheduleGroupClose = (key) => {
    if (groupCloseTimerRef.current) clearTimeout(groupCloseTimerRef.current);
    groupCloseTimerRef.current = setTimeout(() => {
      setOpenGroup((current) => (current === key ? null : current));
    }, 260);
  };

  const renderLeaf = (item, depth = 0) => (
    <Link
      key={item.id || `${item.label}-${depth}`}
      to={item.link || "/#"}
      className="dropdown-item doctor-hamburger-menu__item"
      onClick={closeNow}
    >
      <ItemIcon icon={item.icon} />
      <ItemLabel>{toMenuCase(item.label)}</ItemLabel>
    </Link>
  );

  const renderGroup = (key, label, icon, children) => {
    const open = openGroup === key;
    return (
      <div key={key} className={`doctor-hamburger-menu-flyout${open ? " is-open" : ""}`}>
        <button
          type="button"
          className={`dropdown-item doctor-hamburger-menu__item doctor-hamburger-menu__parent${open ? " active" : ""}`}
          aria-expanded={open}
          aria-haspopup="true"
          onMouseEnter={(e) => openGroupNow(key, e.currentTarget)}
          onMouseLeave={() => scheduleGroupClose(key)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (openGroup === key) {
              setOpenGroup(null);
              return;
            }
            openGroupNow(key, e.currentTarget);
          }}
        >
          <ItemIcon icon={icon} />
          <ItemLabel>{toMenuCase(label)}</ItemLabel>
          <i className="ri-arrow-left-s-line doctor-hamburger-menu__caret" aria-hidden="true" />
        </button>
        {open && typeof document !== "undefined"
          ? createPortal(
              <div
                className="doctor-hamburger-menu-flyout-panel is-open"
                role="menu"
                style={{ top: flyoutPos.top, left: flyoutPos.left }}
                onMouseEnter={() => openGroupNow(key, flyoutAnchorRef.current)}
                onMouseLeave={() => scheduleGroupClose(key)}
              >
                {children}
              </div>,
              document.body
            )
          : null}
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
      toggle={() => setIsOpen((open) => !open)}
      className="topbar-head-dropdown ms-1 header-item header-doctor-hamburger-menu"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <DropdownToggle
        tag="button"
        type="button"
        className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
        title="Menu"
        aria-label="Open menu"
        aria-expanded={isOpen}
        onFocus={openMenu}
      >
        <i className="ri-menu-line fs-22" />
      </DropdownToggle>
      <DropdownMenu
        end
        container="body"
        strategy="fixed"
        className="dropdown-menu-end doctor-hamburger-menu-panel"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="doctor-hamburger-menu-body">
          <div className="doctor-hamburger-menu__section">Clinic Tools</div>
          <button
            type="button"
            className="dropdown-item doctor-hamburger-menu__item"
            onClick={() => {
              closeNow();
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
              closeNow();
              dispatchOpenDoctorScheduleCalendar();
            }}
          >
            <ItemIcon icon="ri-calendar-2-line" />
            <ItemLabel>My Schedule</ItemLabel>
          </button>
          <Link to="/doctor/reception-staff" className="dropdown-item doctor-hamburger-menu__item" onClick={closeNow}>
            <ItemIcon icon="ri-user-star-line" />
            <ItemLabel>Reception Staff</ItemLabel>
          </Link>
          <Link to="/doctor/appointment-requests" className="dropdown-item doctor-hamburger-menu__item" onClick={closeNow}>
            <ItemIcon icon="ri-mail-check-line" />
            <ItemLabel>Appointment Requests</ItemLabel>
          </Link>
          <Link to="/doctor/erx" className="dropdown-item doctor-hamburger-menu__item" onClick={closeNow}>
            <ItemIcon icon="ri-file-text-line" />
            <ItemLabel>eRx — Sign &amp; Download</ItemLabel>
          </Link>
          <Link to="/doctor/mobile/refill" className="dropdown-item doctor-hamburger-menu__item" onClick={closeNow}>
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
                onClick={closeNow}
              >
                <ItemIcon icon={report.icon} />
                <ItemLabel>{toMenuCase(report.label)}</ItemLabel>
              </Link>
            ))
          )}

          <div className="doctor-hamburger-menu__divider" />
          <div className="doctor-hamburger-menu__section">Practice</div>
          {practiceItems.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="dropdown-item doctor-hamburger-menu__item"
              onClick={closeNow}
            >
              <ItemIcon icon={item.icon} />
              <ItemLabel>{item.label}</ItemLabel>
            </Link>
          ))}
          {extraMoreItems.length ? renderMoreLeaves(extraMoreItems) : null}

          <div className="doctor-hamburger-menu__divider" />
          <div className="doctor-hamburger-menu__section">Support</div>
          <Link to="/doctor/support" className="dropdown-item doctor-hamburger-menu__item" onClick={closeNow}>
            <ItemIcon icon="ri-customer-service-2-line" />
            <ItemLabel>Support &amp; Tickets</ItemLabel>
          </Link>
          <button
            type="button"
            className="dropdown-item doctor-hamburger-menu__item"
            onClick={() => {
              closeNow();
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

export default DoctorHamburgerMenu;

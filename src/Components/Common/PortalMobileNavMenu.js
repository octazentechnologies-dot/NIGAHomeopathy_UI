import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dropdown, DropdownMenu, DropdownToggle } from "reactstrap";
import { UserRole } from "../constants/roles";
import { useLayoutMenu } from "../../Layouts/LayoutMenuContext";
import { groupMoreMenuFlyoutItems, isAdminEnquiriesNavItem } from "../../helpers/menuByRole";
import { getAccountOverflowMenuItems } from "../../helpers/horizontalMenuSplit";

const PHARMACY_EXTRAS = [
  { id: "pharmacy-inventory", label: "Stock confirmation", icon: "ri-archive-line", link: "/pharmacy/inventory" },
  { id: "pharmacy-prescriptions", label: "Prescriptions", icon: "ri-file-paper-2-line", link: "/pharmacy/prescriptions" },
];

const linkKey = (link) => String(link || "").split("?")[0].toLowerCase();

const mergeMissing = (items, extras) => {
  const seen = new Set((items || []).map((item) => linkKey(item.link)).filter(Boolean));
  const next = [...(items || [])];
  (extras || []).forEach((item) => {
    const key = linkKey(item.link);
    if (!key || seen.has(key)) return;
    seen.add(key);
    next.push(item);
  });
  return next;
};

const PORTAL_ROLES = new Set([
  UserRole.ADMIN,
  UserRole.ACCOUNT,
  UserRole.PHARMACY,
  UserRole.PHARMACY_PARTNER,
  UserRole.PATIENT,
  UserRole.RECEPTION,
]);

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
 * Phone overflow for Admin, Account, Pharmacy, Patient (including Caregiver), and Reception.
 * Desktop keeps the horizontal bar; this control is shown only under ~500px.
 */
const PortalMobileNavMenu = ({ userRole, onOpenHelp }) => {
  const { menuItems: rawMenuItems, moreMenuItems: rawMoreMenuItems } = useLayoutMenu();
  const menuItems = useMemo(() => {
    const cleaned = withoutEnquiries(rawMenuItems);
    if (userRole === UserRole.PHARMACY || userRole === UserRole.PHARMACY_PARTNER) {
      return mergeMissing(cleaned, PHARMACY_EXTRAS);
    }
    return cleaned;
  }, [rawMenuItems, userRole]);
  const moreMenuItems = useMemo(() => {
    const grouped = groupMoreMenuFlyoutItems(withoutEnquiries(rawMoreMenuItems));
    if (userRole === UserRole.ACCOUNT) {
      return mergeMissing(grouped, getAccountOverflowMenuItems());
    }
    return grouped;
  }, [rawMoreMenuItems, userRole]);
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  if (!PORTAL_ROLES.has(userRole)) return null;

  const close = () => {
    setIsOpen(false);
    setOpenGroup(null);
  };

  const toggleGroup = (key) => {
    setOpenGroup((current) => (current === key ? null : key));
  };

  const renderItems = (items, depth = 0) =>
    (items || []).map((item, index) => {
      const key = item.id || `${item.label}-${depth}-${index}`;
      if (item.isHeader) {
        if (String(item.label || "").trim().toLowerCase() === "menu") return null;
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
                {renderItems(children, depth + 1)}
              </div>
            ) : null}
          </div>
        );
      }
      if (!item.link || item.link === "/#") return null;
      return (
        <Link key={key} to={item.link} className="dropdown-item" onClick={close}>
          {item.icon ? <i className={`${item.icon} me-2`} /> : null}
          {item.label}
        </Link>
      );
    });

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen((open) => !open)}
      className="topbar-head-dropdown header-item header-portal-mobile-nav"
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
          {renderItems(menuItems)}
          {moreMenuItems.length ? (
            <>
              <div className="dropdown-divider" />
              <div className="dropdown-header text-muted text-uppercase fs-11">More</div>
              {renderItems(moreMenuItems)}
            </>
          ) : null}
          <div className="dropdown-divider" />
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
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default PortalMobileNavMenu;

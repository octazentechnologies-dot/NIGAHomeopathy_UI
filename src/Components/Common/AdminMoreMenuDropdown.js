import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Link } from 'react-router-dom';

import { useLayoutMenu } from '../../Layouts/LayoutMenuContext';
import { groupMoreMenuFlyoutItems, isAdminEnquiriesNavItem } from '../../helpers/menuByRole';
import { resolveUserRole, UserRole } from '../constants/roles';
import { useProfile } from '../Hooks/UserHooks';

const COMPACT_NAV_MQ = '(max-width: 1024px)';

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

/** Title Case for menu labels (SMS / WhatsApp kept as brand tokens). */
const toMenuCase = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'sms') return 'SMS';
      if (lower === 'whatsapp') return 'WhatsApp';
      if (word === '—' || word === '-') return word;
      if (/^[A-Z0-9]+$/.test(word) && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const ItemIcon = ({ icon }) =>
  icon ? <i className={`doctor-hamburger-menu__icon ${icon}`} aria-hidden="true" /> : null;

const ItemLabel = ({ children }) => (
  <span className="doctor-hamburger-menu__label">{children}</span>
);

/**
 * Portal topbar hamburger — same pattern as doctor.
 * Desktop (admin): overflow tools only (bottom horizontal nav stays).
 * Small screen: bottom nav is hidden; its items move into this menu with submenus
 * (Account / Pharmacy / Reception / Admin / Patient).
 */
const AdminMoreMenuDropdown = () => {
  const { userProfile } = useProfile();
  const userRole = resolveUserRole(userProfile);
  const { menuItems: rawMenuItems, moreMenuItems: rawMoreMenuItems } = useLayoutMenu();
  const menuItems = useMemo(() => withoutEnquiries(rawMenuItems), [rawMenuItems]);
  const moreMenuItems = useMemo(
    () => groupMoreMenuFlyoutItems(withoutEnquiries(rawMoreMenuItems)),
    [rawMoreMenuItems]
  );
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_NAV_MQ).matches : false
  );
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
  const closeTimerRef = useRef(null);
  const groupCloseTimerRef = useRef(null);
  const flyoutAnchorRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia(COMPACT_NAV_MQ);
    const sync = () => setIsCompact(media.matches);
    sync();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', sync);
      return () => media.removeEventListener('change', sync);
    }
    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (groupCloseTimerRef.current) clearTimeout(groupCloseTimerRef.current);
    },
    []
  );

  const placeFlyoutFromEl = (el) => {
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const parentPanel =
      el.closest('.doctor-hamburger-menu-panel') ||
      document.querySelector('.doctor-hamburger-menu-panel.show') ||
      document.querySelector('.doctor-hamburger-menu-panel');
    const parentRect = parentPanel?.getBoundingClientRect() || rect;
    const panelWidth = 264;
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
    window.addEventListener('resize', placeFlyout);
    window.addEventListener('scroll', placeFlyout, true);
    return () => {
      window.removeEventListener('resize', placeFlyout);
      window.removeEventListener('scroll', placeFlyout, true);
    };
  }, [openGroup, isOpen]);

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

  const renderLeaf = (item, depth = 0) => {
    if (!item.link || item.link === '/#') return null;
    return (
      <Link
        key={item.id || `${item.label}-${depth}`}
        to={item.link}
        className="dropdown-item doctor-hamburger-menu__item"
        onClick={closeNow}
      >
        <ItemIcon icon={item.icon} />
        <ItemLabel>{toMenuCase(item.label)}</ItemLabel>
      </Link>
    );
  };

  const renderGroup = (key, label, icon, children) => {
    const open = openGroup === key;
    return (
      <div key={key} className={`doctor-hamburger-menu-flyout${open ? ' is-open' : ''}`}>
        <button
          type="button"
          className={`dropdown-item doctor-hamburger-menu__item doctor-hamburger-menu__parent${open ? ' active' : ''}`}
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
        {open && typeof document !== 'undefined'
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

  const renderMenuItems = (items, depth = 0) =>
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
          children.map((child, childIndex) => {
            const nested = child.childItems || child.subItems;
            if (nested?.length) {
              return renderGroup(
                `${key}-${child.id || child.label}-${childIndex}`,
                child.label,
                child.icon,
                nested.map((leaf) => renderLeaf(leaf, depth + 2)).filter(Boolean)
              );
            }
            return renderLeaf(child, depth + 1);
          }).filter(Boolean)
        );
      }

      return renderLeaf(item, depth);
    });

  // Desktop: overflow "More" / Admin Tools when the horizontal bar has primary links only.
  // Compact / mobile: primary bar is hidden — also put those bottom-nav links here.
  // Account has no top-bar More — overflow stays on dashboard Quick Actions only.
  const isAdminRole = userRole === UserRole.ADMIN || userRole === UserRole.MANAGEMENT;
  const showMainInHamburger = isCompact && menuItems.length > 0;
  // Patient/Caregiver, Reception, Admin: keep hamburger on desktop for overflow items.
  // Account / Pharmacy: no More / Quick Links — horizontal nav is enough.
  const showOverflowInHamburger =
    userRole !== UserRole.ACCOUNT &&
    userRole !== UserRole.PHARMACY &&
    userRole !== UserRole.PHARMACY_PARTNER &&
    moreMenuItems.length > 0;
  const hasContent = showMainInHamburger || showOverflowInHamburger;
  const overflowSectionLabel = isAdminRole ? 'Admin Tools' : 'More';

  if (!hasContent) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={() => setIsOpen((open) => !open)}
      className="topbar-head-dropdown ms-1 header-item header-doctor-hamburger-menu admin-more-menu-dropdown"
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
        className="dropdown-menu-end doctor-hamburger-menu-panel admin-more-menu-panel"
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="doctor-hamburger-menu-body admin-more-menu-body">
          {showMainInHamburger ? (
            <>
              <div className="doctor-hamburger-menu__section">Menu</div>
              {renderMenuItems(menuItems)}
              {showOverflowInHamburger ? <div className="doctor-hamburger-menu__divider" /> : null}
            </>
          ) : null}
          {showOverflowInHamburger ? (
            <>
              <div className="doctor-hamburger-menu__section">{overflowSectionLabel}</div>
              {renderMenuItems(moreMenuItems)}
            </>
          ) : null}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default AdminMoreMenuDropdown;

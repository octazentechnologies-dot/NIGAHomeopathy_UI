import React, { useMemo, useState } from 'react';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Link } from 'react-router-dom';

import { useLayoutMenu } from '../../Layouts/LayoutMenuContext';
import { groupMoreMenuFlyoutItems, isAdminEnquiriesNavItem } from '../../helpers/menuByRole';

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

const AdminMoreMenuDropdown = ({ showLabel = false }) => {
  const { moreMenuItems: rawMoreMenuItems } = useLayoutMenu();
  const moreMenuItems = useMemo(
    () => groupMoreMenuFlyoutItems(withoutEnquiries(rawMoreMenuItems)),
    [rawMoreMenuItems]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  const toggle = () => setIsOpen((open) => !open);

  const closeDropdown = () => {
    setIsOpen(false);
    setHoveredKey(null);
  };

  const renderLeaf = (item, depth = 0) => (
    <Link
      key={item.id || `${item.label}-${depth}`}
      to={item.link || '/#'}
      className="dropdown-item admin-more-menu-link"
      onClick={closeDropdown}
    >
      {item.icon ? <i className={`${item.icon} me-2`} /> : null}
      {item.label}
    </Link>
  );

  const renderMenuItems = (items, depth = 0) =>
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
        const open = hoveredKey === key;
        return (
          <div
            key={key}
            className={`admin-more-menu-flyout${open ? ' is-open' : ''}`}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey((current) => (current === key ? null : current))}
            onFocus={() => setHoveredKey(key)}
          >
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center justify-content-between admin-more-menu-parent${open ? ' active' : ''}`}
              aria-expanded={open}
              aria-haspopup="true"
              onClick={(e) => {
                e.preventDefault();
                setHoveredKey((current) => (current === key ? null : key));
              }}
            >
              <span className="d-flex align-items-center gap-2">
                {item.icon ? <i className={item.icon} /> : null}
                <span>{item.label}</span>
              </span>
              <i className="ri-arrow-right-s-line" aria-hidden="true" />
            </button>
            <div className="admin-more-menu-flyout-panel" role="menu">
              {children.map((child) => renderLeaf(child, depth + 1))}
            </div>
          </div>
        );
      }

      return renderLeaf(item, depth);
    });

  if (!moreMenuItems.length) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={toggle}
      className="topbar-head-dropdown ms-1 header-item admin-more-menu-dropdown"
      onMouseLeave={() => setHoveredKey(null)}
    >
      <DropdownToggle
        tag="button"
        type="button"
        className={
          showLabel
            ? "btn btn-topbar btn-ghost-secondary admin-more-menu-toggle"
            : "btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
        }
        title="More"
        aria-label="More menu"
      >
        {showLabel ? (
          <>
            <i className="ri-briefcase-2-line" />
            <span>More</span>
            <i className="ri-arrow-down-s-line admin-more-menu-toggle__caret" />
          </>
        ) : (
          <i className="ri-briefcase-2-line fs-22" />
        )}
      </DropdownToggle>
      <DropdownMenu end container="body" strategy="fixed" className="dropdown-menu-lg dropdown-menu-end admin-more-menu-panel">
        <div className="admin-more-menu-body">
          {renderMenuItems(moreMenuItems)}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default AdminMoreMenuDropdown;

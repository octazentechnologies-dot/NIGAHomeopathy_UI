import React, { useState } from 'react';
import { Collapse, Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import { Link } from 'react-router-dom';

import { useLayoutMenu } from '../../Layouts/LayoutMenuContext';

const AdminMoreMenuDropdown = () => {
  const { moreMenuItems } = useLayoutMenu();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);

  const toggle = () => setIsOpen((open) => !open);

  const toggleExpanded = (key) => {
    setExpandedKey((current) => (current === key ? null : key));
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setExpandedKey(null);
  };

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
        return (
          <div key={key} className="admin-more-menu-group">
            <button
              type="button"
              className={`dropdown-item d-flex align-items-center justify-content-between admin-more-menu-parent${expandedKey === key ? ' active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(key);
              }}
            >
              <span className="d-flex align-items-center gap-2">
                {item.icon ? <i className={item.icon} /> : null}
                <span>{item.label}</span>
              </span>
              <i className="ri-arrow-right-s-line" />
            </button>
            <Collapse isOpen={expandedKey === key}>
              <div className="admin-more-submenu">
                {renderMenuItems(children, depth + 1)}
              </div>
            </Collapse>
          </div>
        );
      }

      return (
        <Link
          key={key}
          to={item.link || '/#'}
          className="dropdown-item admin-more-menu-link"
          style={depth > 0 ? { paddingLeft: `${0.75 + depth * 0.75}rem` } : undefined}
          onClick={closeDropdown}
        >
          {item.icon ? <i className={`${item.icon} me-2`} /> : null}
          {item.label}
        </Link>
      );
    });

  if (!moreMenuItems.length) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      toggle={toggle}
      className="topbar-head-dropdown ms-1 header-item admin-more-menu-dropdown"
    >
      <DropdownToggle
        tag="button"
        type="button"
        className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
        title="More"
        aria-label="More menu"
      >
        <i className="ri-briefcase-2-line fs-22" />
      </DropdownToggle>
      <DropdownMenu className="dropdown-menu-lg dropdown-menu-end admin-more-menu-panel">
        <div className="dropdown-header d-flex align-items-center gap-2">
          <i className="ri-briefcase-2-line" />
          <span>More</span>
        </div>
        <div className="admin-more-menu-body">
          {renderMenuItems(moreMenuItems)}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default AdminMoreMenuDropdown;

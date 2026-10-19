import React from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Row } from "reactstrap";
import { getAccountOverflowMenuItems } from "../../../helpers/horizontalMenuSplit";

/** Shorter card labels — top-bar menus (Collection, Invoices, Earnings, Settlements, Reports) are omitted here. */
const CARD_LABELS = {
  accountledger: "Ledger",
  accountrecon: "Recon",
  accountmedicineledger: "Medicine",
  accountexceptions: "Exceptions",
  accounttax: "GST & tax",
  accountpayees: "Payees",
  accounttrail: "Trail",
};

/**
 * Account dashboard Quick Actions — same card style as Reception.
 * Skips top-sub-menu items and Notifications (top-bar bell).
 */
const AccountQuickActions = () => {
  const actions = getAccountOverflowMenuItems();

  return (
    <Row className="g-2 mt-2 account-quick-actions">
      <Col xs={12}>
        <h5 className="account-section-title mb-2">Quick Actions</h5>
      </Col>
      {actions.map((action) => (
        <Col xs={6} sm={4} md={3} lg={2} key={action.id} className="account-action-col">
          <Card className="card-animate admin-dash-card doctor-action-card mb-0 h-100 account-quick-action-card">
            <CardBody className="text-center py-3">
              <Link
                to={action.link}
                className="account-quick-action-btn text-decoration-none d-block w-100"
              >
                <div className="avatar-sm mx-auto mb-2">
                  <span className="avatar-title rounded fs-3 doctor-action-icon">
                    <i className={action.icon} aria-hidden="true" />
                  </span>
                </div>
                <p className="mb-0 fw-semibold account-action-label">
                  {CARD_LABELS[action.id] || action.label}
                </p>
              </Link>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default AccountQuickActions;

import React from "react";
import { Link } from "react-router-dom";
import { Container } from "reactstrap";
import { getHomeDashboardPath } from "../../helpers/dashboard_helper";

/** Signed-in fallback when a menu item or address has no page. Session stays. */
const PageNotAvailable = () => {
  const home = getHomeDashboardPath();

  return (
    <div className="page-content">
      <Container fluid>
        <div className="text-center py-5">
          <h2 className="mb-2">Page not available</h2>
          <p className="text-muted mb-4">This menu does not open a page yet.</p>
          <Link to={home} className="btn btn-primary">
            Back to home
          </Link>
        </div>
      </Container>
    </div>
  );
};

export default PageNotAvailable;

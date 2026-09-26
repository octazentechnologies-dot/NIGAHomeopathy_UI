import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";
import PageBanner from "../../Minimaltheme/components/PageBanner";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { listPublicHelp } from "../../../../helpers/publicBookingApi";

const HelpCentrePage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${SITE.name} | Help`;
    listPublicHelp()
      .then((list) => setRows(list))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageBanner title="Help centre" breadcrumb="Help" />
      <section className="section">
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-muted py-5">No published help articles yet.</div>
          ) : (
            <Row className="g-4">
              {rows.map((article) => {
                const slug = article.slug || article.Slug;
                const title = article.title || article.Title;
                return (
                  <Col lg={4} md={6} key={slug}>
                    <Card className="h-100 border-0 shadow-sm">
                      <CardBody>
                        <h5>{title}</h5>
                        <Link to={landingPath(`help/${slug}`)}>Read</Link>
                      </CardBody>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </section>
    </>
  );
};

export default HelpCentrePage;

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import PageBanner from "../../Minimaltheme/components/PageBanner";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPublicHelpArticle } from "../../../../helpers/publicBookingApi";

const HelpArticlePage = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${SITE.name} | Help`;
    setError("");
    getPublicHelpArticle(slug)
      .then((row) => setArticle(row))
      .catch(() => {
        setArticle(null);
        setError("Article not found.");
      });
  }, [slug]);

  const title = article?.title || article?.Title || "Help";
  const body = article?.body || article?.Body || "";

  return (
    <>
      <PageBanner title={title} breadcrumb="Help" />
      <section className="section">
        <Container>
          <p>
            <Link to={landingPath("help")}>All help articles</Link>
          </p>
          {!article && !error ? (
            <Spinner color="primary" />
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: body }} />
          )}
        </Container>
      </section>
    </>
  );
};

export default HelpArticlePage;

import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Container, Spinner } from "reactstrap";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { getPublicHelpArticle } from "../../../../helpers/publicBookingApi";
import LandingPageHero from "../components/LandingPageHero";

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
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    align="start"
                    breadcrumb="Help"
                    eyebrow="Support"
                    title={title}
                    subtitle="Help article"
                />
                <p>
                    <Link to={landingPath("help")} className="homeojob-page__cta homeojob-page__cta--ghost">
                        <i className="ri-arrow-left-line" aria-hidden="true" /> All help articles
                    </Link>
                </p>
                {!article && !error ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : error ? (
                    <p className="text-danger">{error}</p>
                ) : (
                    <article className="homeojob-page__article" dangerouslySetInnerHTML={{ __html: body }} />
                )}
            </Container>
        </section>
    );
};

export default HelpArticlePage;

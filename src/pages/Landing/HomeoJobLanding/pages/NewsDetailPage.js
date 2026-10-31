import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import LandingPageHero from "../components/LandingPageHero";
import { getNewsById } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

const NewsDetailPage = () => {
    const { newsId } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getNewsById(newsId)
            .then((item) => {
                if (!item) {
                    setError("News article not found.");
                    return;
                }
                setNews(item);
                document.title = `${item.newsHeading || "News"} | ${SITE.name}`;
            })
            .catch(() => setError("News article not found."))
            .finally(() => setLoading(false));
    }, [newsId]);

    const images = news
        ? [news.newsImage1, news.newsImage2, news.newsImage3, news.newsImage4].filter(Boolean)
        : [];

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    align="start"
                    breadcrumb="News"
                    eyebrow="News"
                    title={news?.newsHeading || "News"}
                    subtitle={news?.newsSubHeading || news?.newsDate || "Updates from Homeocentrum."}
                />
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-danger py-5">
                            {error}{" "}
                            <Link to={landingPath("news")} className="ms-2">
                                Back to News
                            </Link>
                        </div>
                    ) : (
                        <Row className="justify-content-center">
                            <Col lg={10}>
                                <article className="homeojob-page__article">
                                {news.newsDate ? <p className="homeojob-page__article-date">{news.newsDate}</p> : null}
                                {images.length > 0 && (
                                    <Row className="g-3 mb-4">
                                        {images.map((img, i) => (
                                            <Col md={images.length > 1 ? 6 : 12} key={i}>
                                                <img src={img} alt="" className="img-fluid rounded w-100" />
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                                {news.newsContent && (
                                    <div
                                        className="text-muted ff-secondary"
                                        dangerouslySetInnerHTML={{ __html: news.newsContent }}
                                    />
                                )}
                                <div className="mt-4">
                                    <Link to={landingPath("news")} className="homeojob-page__cta homeojob-page__cta--ghost">
                                        <i className="ri-arrow-left-line" aria-hidden="true" /> Back to news
                                    </Link>
                                </div>
                                </article>
                            </Col>
                        </Row>
                    )}
            </Container>
        </section>
    );
};

export default NewsDetailPage;

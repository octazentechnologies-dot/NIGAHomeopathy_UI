import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { getNewsById } from "../helpers/marketingApi";
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
                setNews(item);
                document.title = `${item?.newsHeading || "News"} | ${SITE.name}`;
            })
            .catch(() => setError("News article not found."))
            .finally(() => setLoading(false));
    }, [newsId]);

    const images = news ? [news.newsImage1, news.newsImage2, news.newsImage3, news.newsImage4].filter(Boolean) : [];

    return (
        <>
            <PageBanner title={news?.newsHeading || "News Detail"} breadcrumb="News Detail" />
            <section className="section">
                <Container>
                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : error ? (
                        <div className="text-center text-danger py-5">
                            {error} <Link to={landingPath("news")} className="ms-2">Back to News</Link>
                        </div>
                    ) : (
                        <Row className="justify-content-center">
                            <Col lg={10}>
                                <small className="text-muted">{news.newsDate}</small>
                                <h2 className="mt-2 mb-4">{news.newsHeading}</h2>
                                {news.newsSubHeading && <p className="lead text-muted ff-secondary">{news.newsSubHeading}</p>}
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
                                    <Link to={landingPath("news")} className="btn btn-soft-success">
                                        <i className="ri-arrow-left-line me-1"></i> Back to News
                                    </Link>
                                </div>
                            </Col>
                        </Row>
                    )}
                </Container>
            </section>
        </>
    );
};

export default NewsDetailPage;

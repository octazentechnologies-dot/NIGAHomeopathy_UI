import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row, Card, CardBody, Spinner, Nav, NavItem, NavLink } from "reactstrap";
import classnames from "classnames";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { getNewsCategories, getNewsByCategory } from "../helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

const NewsPage = () => {
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);
    const [newsList, setNewsList] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [loadingNews, setLoadingNews] = useState(false);

    useEffect(() => {
        document.title = `${SITE.name} | News`;
        getNewsCategories()
            .then((cats) => {
                setCategories(cats);
                if (cats.length > 0) setActiveCategory(cats[0].newsCategoryId);
            })
            .catch(() => setCategories([]))
            .finally(() => setLoadingCats(false));
    }, []);

    useEffect(() => {
        if (!activeCategory) return;
        setLoadingNews(true);
        getNewsByCategory(activeCategory)
            .then((list) => setNewsList(list))
            .catch(() => setNewsList([]))
            .finally(() => setLoadingNews(false));
    }, [activeCategory]);

    return (
        <>
            <PageBanner title="News" breadcrumb="News" />
            <section className="section">
                <Container>
                    {loadingCats ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : categories.length === 0 ? (
                        <div className="text-center text-muted py-5">No news categories available.</div>
                    ) : (
                        <>
                            <Nav pills className="nav-pills-custom justify-content-center mb-5 flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <NavItem key={cat.newsCategoryId}>
                                        <NavLink
                                            className={classnames({ active: activeCategory === cat.newsCategoryId })}
                                            onClick={() => setActiveCategory(cat.newsCategoryId)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {cat.newsCategory1}
                                        </NavLink>
                                    </NavItem>
                                ))}
                            </Nav>
                            {loadingNews ? (
                                <div className="text-center py-5"><Spinner color="primary" /></div>
                            ) : newsList.length === 0 ? (
                                <div className="text-center text-muted py-5">No news in this category.</div>
                            ) : (
                                <Row className="g-4">
                                    {newsList.map((news) => (
                                        <Col lg={4} md={6} key={news.newsId}>
                                            <Card className="h-100 border shadow-sm">
                                                {news.newsImage1 && (
                                                    <img src={news.newsImage1} alt={news.newsHeading} className="card-img-top" style={{ height: 220, objectFit: "cover" }} />
                                                )}
                                                <CardBody>
                                                    <small className="text-muted">{news.newsDate}</small>
                                                    <h5 className="mt-2">
                                                        <Link to={landingPath(`news/${news.newsId}`)}>{news.newsHeading}</Link>
                                                    </h5>
                                                    <p className="text-muted ff-secondary">{news.newsSubHeading}</p>
                                                    <Link to={landingPath(`news/${news.newsId}`)} className="text-success fw-medium">
                                                        Read More <i className="ri-arrow-right-line"></i>
                                                    </Link>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            )}
                        </>
                    )}
                </Container>
            </section>
        </>
    );
};

export default NewsPage;

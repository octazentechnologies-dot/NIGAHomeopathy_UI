import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Nav, NavItem, NavLink, Row, Spinner } from "reactstrap";
import classnames from "classnames";

import PageBanner from "../../Minimaltheme/components/PageBanner";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { getNewsCategories, getNewsByCategory } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

import img8 from "../../../../assets/images/small/img-8.jpg";

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
                if (cats.length > 0) {
                    setActiveCategory(cats[0].newsCategoryId);
                }
            })
            .catch(() => setCategories([]))
            .finally(() => setLoadingCats(false));
    }, []);

    useEffect(() => {
        if (!activeCategory) {
            return;
        }
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
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
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
                                <div className="text-center py-5">
                                    <Spinner color="primary" />
                                </div>
                            ) : newsList.length === 0 ? (
                                <div className="text-center text-muted py-5">No news in this category.</div>
                            ) : (
                                <Row className="g-4">
                                    {newsList.map((news) => (
                                        <Col lg={4} md={6} key={news.newsId}>
                                            <Card className="h-100 border-0 shadow-sm">
                                                <CardBody>
                                                    <img
                                                        src={news.newsImage1 || img8}
                                                        alt={news.newsHeading}
                                                        className="img-fluid rounded"
                                                        style={{ height: 220, width: "100%", objectFit: "cover" }}
                                                    />
                                                </CardBody>
                                                <CardBody>
                                                    {news.newsDate && (
                                                        <ul className="list-inline fs-14 text-muted mb-2">
                                                            <li className="list-inline-item">
                                                                <i className="ri-calendar-line align-bottom me-1"></i>
                                                                {news.newsDate}
                                                            </li>
                                                        </ul>
                                                    )}
                                                    <h5>
                                                        <Link to={landingPath(`news/${news.newsId}`)}>
                                                            {news.newsHeading}
                                                        </Link>
                                                    </h5>
                                                    <p className="text-muted fs-14 ff-secondary">
                                                        {news.newsSubHeading || ""}
                                                    </p>
                                                    <Link
                                                        to={landingPath(`news/${news.newsId}`)}
                                                        className="link-success"
                                                    >
                                                        Read More <i className="ri-arrow-right-line align-bottom ms-1"></i>
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

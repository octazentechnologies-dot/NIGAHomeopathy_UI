import React, { useEffect, useState } from "react";
import { Col, Container, Row, Spinner } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { getNewsCategories, getNewsByCategory } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";
import StoryCard from "../components/StoryCard";

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
                const list = Array.isArray(cats) ? cats : [];
                setCategories(list);
                if (list.length > 0) setActiveCategory(list[0].newsCategoryId);
            })
            .catch(() => setCategories([]))
            .finally(() => setLoadingCats(false));
    }, []);

    useEffect(() => {
        if (!activeCategory) return undefined;
        let cancelled = false;
        setLoadingNews(true);
        getNewsByCategory(activeCategory)
            .then((list) => {
                if (!cancelled) setNewsList(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setNewsList([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingNews(false);
            });
        return () => {
            cancelled = true;
        };
    }, [activeCategory]);

    const activeName =
        categories.find((cat) => cat.newsCategoryId === activeCategory)?.newsCategory1 || "News";

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    breadcrumb="News"
                    eyebrow="Stay informed"
                    title="Clinic"
                    highlight="News"
                    subtitle={`Announcements and updates from ${SITE.name}, grouped by topic.`}
                />

                {loadingCats ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : categories.length === 0 ? (
                    <p className="homeojob-page__empty">No news categories available.</p>
                ) : (
                    <>
                        <div className="homeojob-page__filters" role="tablist" aria-label="News categories">
                            {categories.map((cat) => (
                                <button
                                    key={cat.newsCategoryId}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeCategory === cat.newsCategoryId}
                                    className={activeCategory === cat.newsCategoryId ? "is-active" : undefined}
                                    onClick={() => setActiveCategory(cat.newsCategoryId)}
                                >
                                    {cat.newsCategory1}
                                </button>
                            ))}
                        </div>
                        {loadingNews ? (
                            <div className="text-center py-5">
                                <Spinner color="primary" />
                            </div>
                        ) : newsList.length === 0 ? (
                            <p className="homeojob-page__empty">No news in this category.</p>
                        ) : (
                            <Row className="g-4">
                                {newsList.map((news, index) => (
                                    <Col lg={6} md={6} key={news.newsId || index}>
                                        <StoryCard
                                            index={index}
                                            image={news.newsImage1 || img8}
                                            imageAlt={news.newsHeading}
                                            category={activeName}
                                            categoryIcon="ri-newspaper-line"
                                            date={news.newsDate}
                                            title={news.newsHeading}
                                            excerpt={news.newsSubHeading || ""}
                                            href={landingPath(`news/${news.newsId}`)}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </>
                )}
            </Container>
        </section>
    );
};

export default NewsPage;

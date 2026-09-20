import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";

import { getAllBlogs } from "../Minimaltheme/helpers/marketingApi";
import { SITE } from "../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../constants/landingRoutes";

import img8 from "../../../assets/images/small/img-8.jpg";
import img6 from "../../../assets/images/small/img-6.jpg";

const FALLBACK_IMAGES = [img8, img6];

const CATEGORY_THEMES = [
    { label: "Practice Tips", icon: "ri-leaf-line", theme: "green" },
    { label: "Clinic Updates", icon: "ri-book-open-line", theme: "purple" },
];

const FALLBACK_BLOGS = [
    {
        blogHead: "Welcome to Homeocentrum",
        blogSubHead: "Cloud based homeopathic health management for modern practitioners.",
        blogDate: "13/12/2025",
    },
    {
        blogHead: "Practice insights & updates",
        blogSubHead: "Tips and clinic news to help you grow a healthier practice.",
        blogDate: "10/12/2025",
    },
];

const formatBlogDate = (value) => {
    if (!value) return "";
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(value).trim())) {
        return String(value).trim();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const HomeBlogSection = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllBlogs()
            .then((list) => setBlogs(list.slice(0, 2)))
            .catch(() => setBlogs([]))
            .finally(() => setLoading(false));
    }, []);

    const displayBlogs = blogs.length ? blogs : FALLBACK_BLOGS;

    return (
        <section className="section homeojob-news" id="blog">
            <div className="homeojob-news__blob homeojob-news__blob--tl" aria-hidden="true" />
            <div className="homeojob-news__blob homeojob-news__blob--br" aria-hidden="true" />
            <div className="homeojob-news__dots" aria-hidden="true" />
            <div className="homeojob-news__leaf" aria-hidden="true">
                <i className="ri-leaf-fill" />
            </div>

            <div className="homeojob-news__note homeojob-news__note--tl" aria-hidden="true">
                <span>Knowledge for a Healthier Tomorrow</span>
            </div>
            <div className="homeojob-news__note homeojob-news__note--br" aria-hidden="true">
                <span>Stay Informed Stay Healthy</span>
            </div>

            <Container className="position-relative">
                <div className="homeojob-news__top">
                    <div className="homeojob-news__header">
                        <p className="homeojob-news__eyebrow">
                            <i className="ri-file-text-line" aria-hidden="true" />
                            Blog &amp; Updates
                        </p>
                        <h2 className="homeojob-news__title">
                            Our Latest <span className="text-primary">News</span>
                        </h2>
                        <p className="homeojob-news__subtitle">
                            Updates, insights, and homeopathy practice tips from {SITE.name}.
                        </p>
                    </div>
                    <Link to={landingPath("blog")} className="homeojob-news__view-all">
                        View All News
                        <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : (
                    <Row className="g-4 homeojob-news__grid justify-content-center">
                        {displayBlogs.map((blog, idx) => {
                            const category = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
                            const href = blog.blogId ? landingPath(`blog/${blog.blogId}`) : null;
                            const dateLabel = formatBlogDate(blog.blogDate);

                            return (
                                <Col lg={6} md={10} key={blog.blogId || idx}>
                                    <article
                                        className={`homeojob-news-card homeojob-news-card--${category.theme}`}
                                    >
                                        <div className="homeojob-news-card__media">
                                            <img
                                                src={
                                                    blog.blogImage1 ||
                                                    FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]
                                                }
                                                alt={blog.blogHead || ""}
                                            />
                                            <span className="homeojob-news-card__category">
                                                <i className={category.icon} aria-hidden="true" />
                                                {category.label}
                                            </span>
                                        </div>

                                        <div className="homeojob-news-card__body">
                                            {dateLabel && (
                                                <p className="homeojob-news-card__date">
                                                    <i
                                                        className="ri-calendar-line"
                                                        aria-hidden="true"
                                                    />
                                                    {dateLabel}
                                                </p>
                                            )}

                                            <h3 className="homeojob-news-card__title">
                                                <Link to={href || landingPath("blog")}>
                                                    {blog.blogHead}
                                                </Link>
                                            </h3>

                                            <p className="homeojob-news-card__excerpt">
                                                {blog.blogSubHead || blog.blogDescription || ""}
                                            </p>

                                            <div className="homeojob-news-card__footer">
                                                <Link
                                                    to={href || landingPath("blog")}
                                                    className="homeojob-news-card__more"
                                                >
                                                    Learn More
                                                    <i
                                                        className="ri-arrow-right-line"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                                <Link
                                                    to={href || landingPath("blog")}
                                                    className="homeojob-news-card__arrow"
                                                    aria-label={`Read ${blog.blogHead}`}
                                                >
                                                    <i
                                                        className="ri-arrow-right-line"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            </div>

                                            <i
                                                className="ri-leaf-fill homeojob-news-card__flourish"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    </article>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Container>
        </section>
    );
};

export default HomeBlogSection;

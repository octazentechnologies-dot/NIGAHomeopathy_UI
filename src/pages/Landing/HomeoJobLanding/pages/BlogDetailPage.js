import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import LandingPageHero from "../components/LandingPageHero";
import { getBlogById } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

const BlogDetailPage = () => {
    const { blogId } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        getBlogById(blogId)
            .then((item) => {
                if (!item) {
                    setError("Blog post not found.");
                    return;
                }
                setBlog(item);
                document.title = `${item.blogHead || "Blog"} | ${SITE.name}`;
            })
            .catch(() => setError("Blog post not found."))
            .finally(() => setLoading(false));
    }, [blogId]);

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    align="start"
                    breadcrumb="Blog"
                    eyebrow="Blog"
                    title={blog?.blogHead || "Blog"}
                    subtitle={blog?.blogSubHead || blog?.blogDate || "Practice notes from Homeocentrum."}
                />
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-danger py-5">
                            {error}{" "}
                            <Link to={landingPath("blog")} className="ms-2">
                                Back to Blogs
                            </Link>
                        </div>
                    ) : (
                        <Row className="justify-content-center">
                            <Col lg={10}>
                                <article className="homeojob-page__article">
                                {blog.blogDate ? <p className="homeojob-page__article-date">{blog.blogDate}</p> : null}
                                <Row className="g-3 mb-4">
                                    {blog.blogImage1 && (
                                        <Col md={blog.blogImage2 ? 6 : 12}>
                                            <img src={blog.blogImage1} alt="" className="img-fluid rounded w-100" />
                                        </Col>
                                    )}
                                    {blog.blogImage2 && (
                                        <Col md={6}>
                                            <img src={blog.blogImage2} alt="" className="img-fluid rounded w-100" />
                                        </Col>
                                    )}
                                </Row>
                                {blog.blogDetails1 && (
                                    <div
                                        className="text-muted ff-secondary blog-content"
                                        dangerouslySetInnerHTML={{ __html: blog.blogDetails1 }}
                                    />
                                )}
                                <div className="mt-4">
                                    <Link to={landingPath("blog")} className="homeojob-page__cta homeojob-page__cta--ghost">
                                        <i className="ri-arrow-left-line" aria-hidden="true" /> Back to blogs
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

export default BlogDetailPage;

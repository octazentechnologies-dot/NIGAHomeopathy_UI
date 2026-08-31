import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Col, Container, Row, Spinner } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { getBlogById } from "../helpers/marketingApi";
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
                setBlog(item);
                document.title = `${item?.blogHead || "Blog"} | ${SITE.name}`;
            })
            .catch(() => setError("Blog post not found."))
            .finally(() => setLoading(false));
    }, [blogId]);

    return (
        <>
            <PageBanner title={blog?.blogHead || "Blog Detail"} breadcrumb="Blog Detail" />
            <section className="section">
                <Container>
                    {loading ? (
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : error ? (
                        <div className="text-center text-danger py-5">
                            {error} <Link to={landingPath("blog")} className="ms-2">Back to Blogs</Link>
                        </div>
                    ) : (
                        <Row className="justify-content-center">
                            <Col lg={10}>
                                <small className="text-muted">{blog.blogDate}</small>
                                <h2 className="mt-2 mb-4">{blog.blogHead}</h2>
                                {blog.blogSubHead && <p className="lead text-muted ff-secondary">{blog.blogSubHead}</p>}
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
                                    <Link to={landingPath("blog")} className="btn btn-soft-success">
                                        <i className="ri-arrow-left-line me-1"></i> Back to Blogs
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

export default BlogDetailPage;

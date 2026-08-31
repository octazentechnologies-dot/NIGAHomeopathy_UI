import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";

import PageBanner from "../../Minimaltheme/components/PageBanner";
import { SITE } from "../../Minimaltheme/constants/siteContent";
import { getAllBlogs } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

import img8 from "../../../../assets/images/small/img-8.jpg";

const BlogPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = `${SITE.name} | Blog`;
        getAllBlogs()
            .then((list) => setBlogs(list))
            .catch(() => setBlogs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <PageBanner title="Our Blogs" breadcrumb="Blogs" />
            <section className="section">
                <Container>
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center text-muted py-5">No blog posts found.</div>
                    ) : (
                        <Row className="g-4">
                            {blogs.map((blog) => (
                                <Col lg={4} md={6} key={blog.blogId}>
                                    <Card className="h-100 border-0 shadow-sm">
                                        <CardBody>
                                            <img
                                                src={blog.blogImage1 || img8}
                                                alt={blog.blogHead}
                                                className="img-fluid rounded"
                                                style={{ height: 220, width: "100%", objectFit: "cover" }}
                                            />
                                        </CardBody>
                                        <CardBody>
                                            {blog.blogDate && (
                                                <ul className="list-inline fs-14 text-muted mb-2">
                                                    <li className="list-inline-item">
                                                        <i className="ri-calendar-line align-bottom me-1"></i>
                                                        {blog.blogDate}
                                                    </li>
                                                </ul>
                                            )}
                                            <h5>
                                                <Link to={landingPath(`blog/${blog.blogId}`)}>{blog.blogHead}</Link>
                                            </h5>
                                            <p className="text-muted fs-14 ff-secondary">
                                                {blog.blogSubHead || blog.blogDescription || ""}
                                            </p>
                                            <Link to={landingPath(`blog/${blog.blogId}`)} className="link-success">
                                                Learn More <i className="ri-arrow-right-line align-bottom ms-1"></i>
                                            </Link>
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Container>
            </section>
        </>
    );
};

export default BlogPage;

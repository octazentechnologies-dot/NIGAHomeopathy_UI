import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Card, CardBody, Spinner } from "reactstrap";
import PageBanner from "../components/PageBanner";
import { SITE } from "../constants/siteContent";
import { getAllBlogs } from "../helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";

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
                        <div className="text-center py-5"><Spinner color="primary" /></div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center text-muted py-5">No blog posts found.</div>
                    ) : (
                        <Row className="g-4">
                            {blogs.map((blog) => (
                                <Col lg={4} md={6} key={blog.blogId}>
                                    <Card className="h-100 border shadow-sm">
                                        {blog.blogImage1 && (
                                            <img src={blog.blogImage1} alt={blog.blogHead} className="card-img-top" style={{ height: 250, objectFit: "cover" }} />
                                        )}
                                        <CardBody>
                                            <small className="text-muted">{blog.blogDate}</small>
                                            <h5 className="mt-2">
                                                <Link to={landingPath(`blog/${blog.blogId}`)}>{blog.blogHead}</Link>
                                            </h5>
                                            <p className="text-muted ff-secondary">{blog.blogSubHead}</p>
                                            <Link to={landingPath(`blog/${blog.blogId}`)} className="text-success fw-medium">
                                                Read More <i className="ri-arrow-right-line"></i>
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

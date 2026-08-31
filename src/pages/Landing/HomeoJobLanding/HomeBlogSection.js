import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardBody, Col, Container, Row, Spinner } from "reactstrap";

import { getAllBlogs } from "../Minimaltheme/helpers/marketingApi";
import { SITE } from "../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../constants/landingRoutes";

import img8 from "../../../assets/images/small/img-8.jpg";
import img6 from "../../../assets/images/small/img-6.jpg";
import img9 from "../../../assets/images/small/img-9.jpg";

const FALLBACK_IMAGES = [img8, img6, img9];

const HomeBlogSection = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllBlogs()
            .then((list) => setBlogs(list.slice(0, 3)))
            .catch(() => setBlogs([]))
            .finally(() => setLoading(false));
    }, []);

    const displayBlogs = blogs.length
        ? blogs
        : [
              {
                  blogHead: "Welcome to Homeo Centrum",
                  blogSubHead: "Cloud based homeopathic health management for modern practitioners.",
              },
          ];

    return (
        <>
            <section className="section" id="blog">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h1 className="mb-3 ff-secondary fw-semibold text-capitalize lh-base">
                                    Our Latest <span className="text-primary">News</span>
                                </h1>
                                <p className="text-muted mb-4">
                                    Updates, insights, and homeopathy practice tips from {SITE.name}.
                                </p>
                            </div>
                        </Col>
                    </Row>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner color="primary" />
                        </div>
                    ) : (
                        <Row>
                            {displayBlogs.map((blog, idx) => (
                                <Col lg={4} md={6} key={blog.blogId || idx}>
                                    <Card>
                                        <CardBody>
                                            <img
                                                src={blog.blogImage1 || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                                                alt={blog.blogHead || ""}
                                                className="img-fluid rounded"
                                                style={{ height: 200, width: "100%", objectFit: "cover" }}
                                            />
                                        </CardBody>
                                        <CardBody>
                                            {blog.blogDate && (
                                                <ul className="list-inline fs-14 text-muted">
                                                    <li className="list-inline-item">
                                                        <i className="ri-calendar-line align-bottom me-1"></i>
                                                        {blog.blogDate}
                                                    </li>
                                                </ul>
                                            )}
                                            <h5>
                                                {blog.blogId ? (
                                                    <Link to={landingPath(`blog/${blog.blogId}`)}>{blog.blogHead}</Link>
                                                ) : (
                                                    blog.blogHead
                                                )}
                                            </h5>
                                            <p className="text-muted fs-14">
                                                {blog.blogSubHead || blog.blogDescription || ""}
                                            </p>
                                            {blog.blogId && (
                                                <Link to={landingPath(`blog/${blog.blogId}`)} className="link-success">
                                                    Learn More{" "}
                                                    <i className="ri-arrow-right-line align-bottom ms-1"></i>
                                                </Link>
                                            )}
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}

                    <div className="text-center mt-4">
                        <Link to={landingPath("blog")} className="btn btn-soft-primary">
                            View All Blogs <i className="ri-arrow-right-line align-bottom ms-1"></i>
                        </Link>
                    </div>
                </Container>
            </section>
            <section className="py-5 bg-primary position-relative">
                <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col sm>
                            <h4 className="text-white fw-semibold">Get New Jobs Notification!</h4>
                            <p className="text-white text-opacity-75 mb-0">
                                Subscribe & get all related updates from {SITE.name}.
                            </p>
                        </Col>
                        <Col sm="auto">
                            <Link to={landingPath("contact")}>
                                <Button className="btn btn-danger" type="button">
                                    Contact Us <i className="ri-arrow-right-line align-bottom"></i>
                                </Button>
                            </Link>
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default HomeBlogSection;

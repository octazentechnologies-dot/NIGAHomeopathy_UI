import React, { useEffect, useState } from "react";
import { Col, Container, Row, Spinner } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { getAllBlogs } from "../../Minimaltheme/helpers/marketingApi";
import { landingPath } from "../../../../constants/landingRoutes";
import LandingPageHero from "../components/LandingPageHero";
import StoryCard from "../components/StoryCard";

import img8 from "../../../../assets/images/small/img-8.jpg";
import img6 from "../../../../assets/images/small/img-6.jpg";

const FALLBACK_IMAGES = [img8, img6];

const BlogPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = `${SITE.name} | Blog`;
        getAllBlogs()
            .then((list) => setBlogs(Array.isArray(list) ? list : []))
            .catch(() => setBlogs([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="homeojob-page">
            <Container>
                <LandingPageHero
                    breadcrumb="Blog"
                    eyebrow="Blog & Updates"
                    title="Our Latest"
                    highlight="News"
                    subtitle={`Practice notes, clinic updates, and homeopathy insights from ${SITE.name}.`}
                />

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner color="primary" />
                    </div>
                ) : blogs.length === 0 ? (
                    <p className="homeojob-page__empty">No blog posts yet.</p>
                ) : (
                    <Row className="g-4">
                        {blogs.map((blog, index) => (
                            <Col lg={6} md={6} key={blog.blogId || index}>
                                <StoryCard
                                    index={index}
                                    image={blog.blogImage1 || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
                                    imageAlt={blog.blogHead}
                                    date={blog.blogDate}
                                    title={blog.blogHead}
                                    excerpt={blog.blogSubHead || blog.blogDescription || ""}
                                    href={landingPath(`blog/${blog.blogId}`)}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </section>
    );
};

export default BlogPage;

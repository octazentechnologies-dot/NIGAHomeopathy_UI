import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay, Pagination } from "swiper/modules";
import CountUp from "react-countup";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

import imgpattern from "../../../../assets/images/landing/img-pattern.png";
import hallImage from "../../../../assets/nigahospitalimages/Hall_Image.webp";
import insideImage from "../../../../assets/nigahospitalimages/InsideImage.webp";
import mainImage from "../../../../assets/nigahospitalimages/MainImage.webp";
import nightView from "../../../../assets/nigahospitalimages/NightView.webp";
import pharmsy from "../../../../assets/nigahospitalimages/Pharmsy.webp";
import rooms from "../../../../assets/nigahospitalimages/Rooms.webp";
import sideView from "../../../../assets/nigahospitalimages/SideView.webp";
import sideView1 from "../../../../assets/nigahospitalimages/SideView1.webp";
import staffImage from "../../../../assets/nigahospitalimages/StaffImage.webp";
// Trusted clients section — uncomment imports + CLIENT_LOGOS + JSX block below to re-enable
// import amazon from "../../../../assets/images/clients/amazon.svg";
// import walmart from "../../../../assets/images/clients/walmart.svg";
// import lenovo from "../../../../assets/images/clients/lenovo.svg";
// import paypal from "../../../../assets/images/clients/paypal.svg";
// import shopify from "../../../../assets/images/clients/shopify.svg";
// import verizon from "../../../../assets/images/clients/verizon.svg";

import {
    HERO,
    WHY_CHOOSE,
    HOME_SERVICES,
    COUNTERS,
    TESTIMONIALS,
    SITE,
} from "../constants/siteContent";
import { getAllBlogs } from "../helpers/marketingApi";
import ContactForm from "../components/ContactForm";
import { landingPath } from "../../../../constants/landingRoutes";

const HERO_SLIDES = [
    { src: mainImage, alt: "Homeo Centrum main building" },
    { src: hallImage, alt: "Homeo Centrum hall" },
    { src: insideImage, alt: "Homeo Centrum interior" },
    { src: rooms, alt: "Homeo Centrum rooms" },
    { src: pharmsy, alt: "Homeo Centrum pharmacy" },
    { src: staffImage, alt: "Homeo Centrum staff" },
    { src: sideView, alt: "Homeo Centrum side view" },
    { src: sideView1, alt: "Homeo Centrum side view" },
    { src: nightView, alt: "Homeo Centrum night view" },
];
// const CLIENT_LOGOS = [amazon, walmart, lenovo, paypal, shopify, verizon];

const HomePage = () => {
    const [latestBlogs, setLatestBlogs] = useState([]);
    const [loadingBlogs, setLoadingBlogs] = useState(true);
    const [reviewSwiper, setReviewSwiper] = useState(null);

    useEffect(() => {
        document.title = `${SITE.name} | Home`;
        getAllBlogs()
            .then((list) => setLatestBlogs(list.slice(0, 3)))
            .catch(() => setLatestBlogs([]))
            .finally(() => setLoadingBlogs(false));
    }, []);

    return (
        <>
            {/* Hero — matches OnePage home.js */}
            <section className="section pb-0 hero-section" id="hero">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8} sm={10}>
                            <div className="text-center mt-lg-5 pt-5">
                                <h1 className="display-6 fw-semibold mb-3 lh-base">
                                    {HERO.title}{" "}
                                    <span className="text-success">{HERO.highlight}</span>
                                </h1>
                                <p className="lead text-muted lh-base">{HERO.subtitle}</p>
                                <div className="d-flex gap-2 justify-content-center mt-4">
                                    <Link to="/register" className="btn btn-primary">
                                        Get Started <i className="ri-arrow-right-line align-middle ms-1"></i>
                                    </Link>
                                    <Link to={landingPath("pricing")} className="btn btn-danger">
                                        View Plans <i className="ri-eye-line align-middle ms-1"></i>
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-4 mt-sm-5 pt-sm-5 mb-sm-n5 demo-carousel">
                                <div className="demo-img-patten-top d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <div className="demo-img-patten-bottom d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <Swiper
                                    spaceBetween={30}
                                    effect="fade"
                                    loop
                                    pagination={{ clickable: true }}
                                    autoplay={{ delay: 2000, disableOnInteraction: false }}
                                    modules={[EffectFade, Autoplay, Pagination]}
                                    className="mySwiper"
                                >
                                    {HERO_SLIDES.map((slide, idx) => (
                                        <SwiperSlide key={idx} className="carousel-inner shadow-lg p-2 bg-white rounded">
                                            <img src={slide.src} className="d-block w-100 rounded" alt={slide.alt} style={{ maxHeight: 420, objectFit: "cover" }} />
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </Col>
                    </Row>
                </Container>
                <div className="position-absolute start-0 end-0 bottom-0 hero-shape-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120">
                        <path d="M 0,118 C 288,98.6 1152,40.4 1440,21L1440 140L0 140z" fill="currentColor"></path>
                    </svg>
                </div>
            </section>

            {/* Trusted clients — hidden; uncomment block below to show "Trusted by practitioners worldwide" */}
            {/*
            <div className="pt-5 mt-5">
                <Container>
                    <Row>
                        <Col lg={12}>
                            <div className="text-center mt-5">
                                <h5 className="fs-20">
                                    Trusted <span className="text-primary text-decoration-underline">by</span> practitioners worldwide
                                </h5>
                                <Swiper
                                    slidesPerView={4}
                                    spaceBetween={30}
                                    pagination={{ clickable: true }}
                                    breakpoints={{
                                        576: { slidesPerView: 2 },
                                        768: { slidesPerView: 3 },
                                        1024: { slidesPerView: 4 },
                                    }}
                                    loop
                                    autoplay={{ delay: 1000, disableOnInteraction: false }}
                                    modules={[Pagination, Autoplay]}
                                    className="mySwiper swiper trusted-client-slider mt-sm-5 mt-4 mb-sm-5 mb-4"
                                >
                                    {CLIENT_LOGOS.map((logo, idx) => (
                                        <SwiperSlide key={idx}>
                                            <div className="client-images">
                                                <img src={logo} alt="client" className="mx-auto img-fluid d-block" />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            */}

            {/* Why Choose — matches OnePage services.js layout */}
            <section className="section" id="why-choose">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h1 className="mb-3 ff-secondary fw-semibold lh-base">{WHY_CHOOSE.title}</h1>
                                <p className="text-muted ff-secondary">{WHY_CHOOSE.description}</p>
                            </div>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        {WHY_CHOOSE.items.map((item) => (
                            <Col lg={4} key={item.title}>
                                <div className="d-flex p-3">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm icon-effect">
                                            <div className="avatar-title bg-transparent text-success rounded-circle">
                                                <i className={`${item.icon} fs-36`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="fs-18">{item.title}</h5>
                                        <p className="text-muted my-3 ff-secondary">{item.text}</p>
                                        <Link to={landingPath("features")} className="fs-13 fw-medium">
                                            Learn More <i className="ri-arrow-right-s-line align-bottom"></i>
                                        </Link>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Services — matches OnePage services grid */}
            <section className="section bg-light" id="services">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h1 className="mb-3 ff-secondary fw-semibold lh-base">
                                    Cloud based homeopathy modules for modern practice
                                </h1>
                                <p className="text-muted ff-secondary">
                                    Case taking, repertorization, diagnosis master, materia medica, and deep analytics — all in one platform.
                                </p>
                            </div>
                        </Col>
                    </Row>
                    <Row className="g-3">
                        {HOME_SERVICES.map((s) => (
                            <Col lg={4} key={s.title}>
                                <div className="d-flex p-3">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm icon-effect">
                                            <div className="avatar-title bg-transparent text-success rounded-circle">
                                                <i className={`${s.icon} fs-36`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="fs-18">{s.title}</h5>
                                        <p className="text-muted my-3 ff-secondary">{s.text}</p>
                                        <Link to={landingPath("features")} className="fs-13 fw-medium">
                                            Learn More <i className="ri-arrow-right-s-line align-bottom"></i>
                                        </Link>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* CTA strip — matches OnePage features.js */}
            <section className="py-5 bg-primary position-relative">
                <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col sm>
                            <h4 className="text-white mb-0 fw-semibold">
                                Build your homeopathic practice with Homeo Centrum
                            </h4>
                        </Col>
                        <Col sm="auto">
                            <Link to={landingPath("pricing")} className="btn bg-gradient btn-danger">
                                <i className="ri-eye-line align-middle me-1"></i> View Plans
                            </Link>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Counters — matches OnePage counter.js (bg-light) */}
            <section className="py-5 position-relative bg-light">
                <Container>
                    <Row className="text-center gy-4">
                        {COUNTERS.map((c) => (
                            <Col lg={3} md={6} key={c.label}>
                                <h2 className="mb-2">
                                    <CountUp start={0} end={c.end} duration={3} decimals={c.decimal || 0} />
                                    {c.suffix}
                                </h2>
                                <div className="text-muted">{c.label}</div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Testimonials */}
            <section className="section bg-primary minimaltheme-reviews-section" id="reviews">
                <div className="bg-overlay bg-overlay-pattern opacity-50"></div>
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={10}>
                            <div className="text-center position-relative">
                                <div className="minimaltheme-review-quote-icon mx-auto">
                                    <i className="ri-double-quotes-l"></i>
                                </div>
                                <h4 className="text-white fw-semibold mb-5">
                                    <span className="minimaltheme-review-highlight">100+</span>
                                    Satisfied practitioners
                                </h4>
                                <div className="minimaltheme-review-slider-wrap">
                                    <Swiper
                                        onSwiper={setReviewSwiper}
                                        modules={[Pagination, Autoplay]}
                                        pagination={{ clickable: true }}
                                        loop
                                        autoplay={{ delay: 2500, disableOnInteraction: false }}
                                        className="minimaltheme-review-swiper pb-2"
                                    >
                                        {TESTIMONIALS.map((t) => (
                                            <SwiperSlide key={t.name}>
                                                <div className="row justify-content-center">
                                                    <div className="col-lg-9 col-md-10 px-lg-5">
                                                        <p className="minimaltheme-review-text ff-secondary mb-4">
                                                            &ldquo;{t.text}&rdquo;
                                                        </p>
                                                        <h5 className="minimaltheme-review-author mb-1">{t.name}</h5>
                                                        <p className="minimaltheme-review-location mb-0">{t.location}</p>
                                                    </div>
                                                </div>
                                            </SwiperSlide>
                                        ))}
                                    </Swiper>
                                    <button
                                        type="button"
                                        className="minimaltheme-review-nav minimaltheme-review-nav-prev"
                                        aria-label="Previous testimonial"
                                        onClick={() => reviewSwiper?.slidePrev()}
                                    >
                                        <i className="ri-arrow-left-s-line"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="minimaltheme-review-nav minimaltheme-review-nav-next"
                                        aria-label="Next testimonial"
                                        onClick={() => reviewSwiper?.slideNext()}
                                    >
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Latest Blog */}
            <section className="section bg-light">
                <Container>
                    <Row className="justify-content-center mb-5">
                        <Col lg={8} className="text-center">
                            <h3 className="fw-semibold mb-3">Latest News</h3>
                            <p className="text-muted ff-secondary">Stay updated with homeopathy insights and announcements.</p>
                        </Col>
                    </Row>
                    {loadingBlogs ? (
                        <div className="text-center text-muted">Loading...</div>
                    ) : latestBlogs.length === 0 ? (
                        <div className="text-center text-muted">No blog posts available.</div>
                    ) : (
                        <Row className="g-4">
                            {latestBlogs.map((blog) => (
                                <Col lg={4} md={6} key={blog.blogId}>
                                    <Card className="h-100 border-0 shadow-sm">
                                        {blog.blogImage1 && (
                                            <img src={blog.blogImage1} className="card-img-top" alt={blog.blogHead} style={{ height: 200, objectFit: "cover" }} />
                                        )}
                                        <CardBody>
                                            <small className="text-muted">{blog.blogDate}</small>
                                            <h5 className="mt-2">
                                                <Link to={landingPath(`blog/${blog.blogId}`)} className="text-dark">{blog.blogHead}</Link>
                                            </h5>
                                            <p className="text-muted ff-secondary">{blog.blogSubHead}</p>
                                            <Link to={landingPath(`blog/${blog.blogId}`)} className="fs-13 fw-medium">
                                                Read More <i className="ri-arrow-right-s-line align-bottom"></i>
                                            </Link>
                                        </CardBody>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
                    <div className="text-center mt-4">
                        <Link to={landingPath("blog")} className="btn btn-soft-success">View All Blogs</Link>
                    </div>
                </Container>
            </section>

            {/* Contact */}
            <section className="section bg-light" id="contact">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Get In Touch</h3>
                                <p className="text-muted mb-0 ff-secondary">
                                    Please find below contact details and reach out for a callback or enquiry.
                                </p>
                            </div>
                        </Col>
                    </Row>
                    <Row className="gy-4 align-items-start">
                        <Col lg={4}>
                            <div className="vstack gap-3">
                                {[
                                    { icon: "ri-map-pin-line", label: "Office Address", value: SITE.address },
                                    { icon: "ri-phone-line", label: "Phone", value: SITE.phone },
                                    { icon: "ri-time-line", label: "Working Hours", value: SITE.hoursShort },
                                    { icon: "ri-mail-line", label: "Email", value: SITE.email },
                                ].map((item) => (
                                    <div className="minimaltheme-contact-info" key={item.label}>
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="minimaltheme-contact-info-icon flex-shrink-0">
                                                <i className={`${item.icon} fs-18`}></i>
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-semibold">{item.label}</h6>
                                                <p className="text-muted ff-secondary mb-0">{item.value}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>
                        <Col lg={8}>
                            <ContactForm />
                        </Col>
                    </Row>
                </Container>
            </section>
        </>
    );
};

export default HomePage;

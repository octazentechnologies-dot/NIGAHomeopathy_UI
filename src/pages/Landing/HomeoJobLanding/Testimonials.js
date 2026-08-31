import React from "react";
import { Col, Container, Row, Card, CardBody } from "reactstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { TESTIMONIALS } from "../Minimaltheme/constants/siteContent";

import "swiper/css";

const Testimonials = () => (
    <section className="section bg-light" id="candidates">
        <div className="bg-overlay bg-overlay-pattern"></div>
        <Container>
            <Row className="justify-content-center">
                <Col lg={8}>
                    <div className="text-center mb-5">
                        <h1 className="mb-3 ff-secondary fw-semibold text-capitalize lh-base">
                            Trusted <span className="text-primary">Practitioners</span>
                        </h1>
                        <p className="text-muted mb-4">
                            Hiring experts costs more per hour than entry-level freelancers, but they can usually get the work done faster — and better.
                        </p>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col lg={12}>
                    <Swiper
                        modules={[Autoplay]}
                        slidesPerView={3}
                        spaceBetween={20}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        loop
                        breakpoints={{
                            320: { slidesPerView: 1 },
                            768: { slidesPerView: 2 },
                            1024: { slidesPerView: 3 },
                        }}
                        className="candidate-swiper"
                    >
                        {TESTIMONIALS.map((item) => (
                            <SwiperSlide key={item.name}>
                                <Card className="text-center h-100">
                                    <CardBody className="p-4">
                                        <div className="avatar-md mx-auto mb-3">
                                            <div className="avatar-title bg-primary-subtle text-primary rounded-circle fs-20">
                                                {item.name.charAt(0)}
                                            </div>
                                        </div>
                                        <h5 className="fs-17 mt-1 mb-2">{item.name}</h5>
                                        <p className="text-muted fs-13 mb-3">{item.location}</p>
                                        <p className="text-muted mb-0 fs-14">{item.text}</p>
                                    </CardBody>
                                </Card>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Col>
            </Row>
        </Container>
    </section>
);

export default Testimonials;

import React from "react";
import { Container } from "reactstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import usePublicHighlights from "./usePublicHighlights";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const THEMES = ["blue", "green", "purple"];

const Testimonials = () => {
    const highlights = usePublicHighlights();
    const reviews = Array.isArray(highlights?.reviews) ? highlights.reviews : [];

    if (reviews.length === 0) return null;

    const loop = reviews.length > 3;

    return (
        <section className="section homeojob-testimonials" id="candidates">
            <div className="homeojob-testimonials__quote-bg" aria-hidden="true">
                <i className="ri-double-quotes-l" />
            </div>

            <Container className="position-relative">
                <div className="homeojob-testimonials__header">
                    <p className="homeojob-testimonials__eyebrow">
                        <span className="homeojob-testimonials__eyebrow-dot" aria-hidden="true" />
                        Testimonials
                    </p>
                    <h2 className="homeojob-testimonials__title">
                        What <span className="text-primary">Patients</span> Say
                    </h2>
                    <p className="homeojob-testimonials__subtitle">
                        Approved reviews from patients after a completed consultation.
                    </p>
                </div>

                <Swiper
                    modules={[Autoplay, Navigation, Pagination]}
                    slidesPerView={3}
                    spaceBetween={22}
                    autoplay={loop ? { delay: 4000, disableOnInteraction: false } : false}
                    loop={loop}
                    navigation={{
                        prevEl: ".homeojob-testimonials__nav-btn--prev",
                        nextEl: ".homeojob-testimonials__nav-btn--next",
                    }}
                    pagination={{
                        el: ".homeojob-testimonials__dots",
                        clickable: true,
                    }}
                    breakpoints={{
                        0: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1200: { slidesPerView: 3 },
                    }}
                    className="homeojob-testimonials__swiper"
                >
                    {reviews.map((item, index) => {
                        const rating = Math.max(0, Math.min(5, Number(item.rating) || 0));
                        return (
                            <SwiperSlide key={item.reviewId}>
                                <article
                                    className={`homeojob-testimonial-card homeojob-testimonial-card--${THEMES[index % THEMES.length]}`}
                                >
                                    <i
                                        className="ri-double-quotes-r homeojob-testimonial-card__quote"
                                        aria-hidden="true"
                                    />

                                    <div className="homeojob-testimonial-card__head">
                                        <span
                                            className="homeojob-testimonial-card__avatar d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary"
                                            aria-hidden="true"
                                        >
                                            <i className="ri-user-heart-line fs-4" />
                                        </span>
                                        <div>
                                            <h3 className="homeojob-testimonial-card__name">Verified patient</h3>
                                            {item.city ? (
                                                <p className="homeojob-testimonial-card__location">
                                                    <i className="ri-map-pin-line" aria-hidden="true" />
                                                    {item.city}
                                                </p>
                                            ) : null}
                                            <div
                                                className="homeojob-testimonial-card__stars"
                                                aria-label={`${rating} star rating`}
                                            >
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <i key={i} className={i < rating ? "ri-star-fill" : "ri-star-line"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="homeojob-testimonial-card__text">{item.text}</p>

                                    {item.doctorName ? (
                                        <span className="homeojob-testimonial-card__role">
                                            <i className="ri-stethoscope-line" aria-hidden="true" />
                                            Consulted {item.doctorName}
                                        </span>
                                    ) : null}
                                </article>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <div className="homeojob-testimonials__footer">
                    <div className="homeojob-testimonials__nav">
                        <button
                            type="button"
                            className="homeojob-testimonials__nav-btn homeojob-testimonials__nav-btn--prev"
                            aria-label="Previous testimonials"
                        >
                            <i className="ri-arrow-left-s-line" />
                        </button>
                        <div className="homeojob-testimonials__dots" />
                        <button
                            type="button"
                            className="homeojob-testimonials__nav-btn homeojob-testimonials__nav-btn--next"
                            aria-label="Next testimonials"
                        >
                            <i className="ri-arrow-right-s-line" />
                        </button>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default Testimonials;

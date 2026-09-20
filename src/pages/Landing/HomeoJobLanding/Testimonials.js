import React from "react";
import { Container } from "reactstrap";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

import Avatar1 from "../../../assets/images/users/avatar-1.jpg";
import Avatar2 from "../../../assets/images/users/avatar-2.jpg";
import Avatar3 from "../../../assets/images/users/avatar-3.jpg";
import Avatar4 from "../../../assets/images/users/avatar-4.jpg";
import Avatar5 from "../../../assets/images/users/avatar-5.jpg";
import Avatar6 from "../../../assets/images/users/avatar-6.jpg";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PRACTITIONERS = [
    {
        name: "Jenifer Hearly",
        location: "Newyork",
        text: "Fortune has helped us to just have a better handle on everything in our business — to actually make decisions and move forward to grow.",
        image: Avatar2,
        theme: "blue",
        roleIcon: "ri-stethoscope-line",
    },
    {
        name: "Mitchel Harward",
        location: "San Fransisco",
        text: "They bring a wealth of knowledge as well as a personal touch so often missing from other firms, helped us to just have better handle on everything.",
        image: Avatar1,
        theme: "green",
        roleIcon: "ri-leaf-line",
    },
    {
        name: "Beally Russel",
        location: "Newyork",
        text: "It involves an examination of operations which allows their team discuss the art of the possible. They bring a wealth of knowledge, we believe fortune.",
        image: Avatar3,
        theme: "purple",
        roleIcon: "ri-group-line",
    },
    {
        name: "Dr. Priya Shah",
        location: "Mumbai",
        text: "Homeocentrum has made my practice faster and more effective with structured case taking and clear remedy scoring every day.",
        image: Avatar4,
        theme: "blue",
        roleIcon: "ri-stethoscope-line",
    },
    {
        name: "Dr. Arjun Mehta",
        location: "Delhi",
        text: "The repertorization and materia medica tools give me clinical confidence, especially when differentiating close remedies.",
        image: Avatar5,
        theme: "green",
        roleIcon: "ri-leaf-line",
    },
    {
        name: "Dr. Sara Khan",
        location: "Hyderabad",
        text: "I can manage cases, follow-ups and prescriptions in one place. It truly feels built for modern homeopathy practice.",
        image: Avatar6,
        theme: "purple",
        roleIcon: "ri-group-line",
    },
];

const Testimonials = () => (
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
                    Trusted <span className="text-primary">Practitioners</span>
                </h2>
                <p className="homeojob-testimonials__subtitle">
                    Hiring experts costs more per hour than entry-level freelancers, but they can
                    usually get the work done faster — and better.
                </p>
            </div>

            <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                slidesPerView={3}
                spaceBetween={22}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                loop
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
                {PRACTITIONERS.map((item) => (
                    <SwiperSlide key={item.name}>
                        <article
                            className={`homeojob-testimonial-card homeojob-testimonial-card--${item.theme}`}
                        >
                            <i
                                className="ri-double-quotes-r homeojob-testimonial-card__quote"
                                aria-hidden="true"
                            />

                            <div className="homeojob-testimonial-card__head">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="homeojob-testimonial-card__avatar"
                                />
                                <div>
                                    <h3 className="homeojob-testimonial-card__name">{item.name}</h3>
                                    <p className="homeojob-testimonial-card__location">
                                        <i className="ri-map-pin-line" aria-hidden="true" />
                                        {item.location}
                                    </p>
                                    <div
                                        className="homeojob-testimonial-card__stars"
                                        aria-label="5 star rating"
                                    >
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                        <i className="ri-star-fill" />
                                    </div>
                                </div>
                            </div>

                            <p className="homeojob-testimonial-card__text">{item.text}</p>

                            <span className="homeojob-testimonial-card__role">
                                <i className={item.roleIcon} aria-hidden="true" />
                                Homeopathic Practitioner
                            </span>
                        </article>
                    </SwiperSlide>
                ))}
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

export default Testimonials;

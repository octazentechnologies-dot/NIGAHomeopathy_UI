import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Container } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";

const BookPayResultPage = ({ outcome }) => {
    const { bookingId } = useParams();
    const ok = outcome === "success";

    useEffect(() => {
        document.title = `${SITE.name} | Payment ${ok ? "success" : "failure"}`;
    }, [ok]);

    return (
        <section className="homeojob-doctor-detail">
            <Container className="py-5" style={{ maxWidth: 640 }}>
                <h1 className="h3 mb-3">{ok ? "Payment recorded" : "Payment not completed"}</h1>
                <p className="text-muted">
                    Booking {bookingId || ""}. {ok
                        ? "Clinic hold stays PENDING until classic Razorpay or front-desk collection."
                        : "You can retry from the pay page or book another slot."}
                </p>
                {ok ? (
                    <Link className="btn btn-primary" to={landingPath()}>
                        Back to home
                    </Link>
                ) : (
                    <Link className="btn btn-primary" to={landingPath(`book/pay/${encodeURIComponent(bookingId || "")}`)}>
                        Try pay again
                    </Link>
                )}
            </Container>
        </section>
    );
};

export default BookPayResultPage;

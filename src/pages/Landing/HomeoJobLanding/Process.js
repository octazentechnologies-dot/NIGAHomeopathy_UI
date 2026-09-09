import React from "react";
import { Card, CardBody, Col, Container, Row } from "reactstrap";
import { JOB_PROCESS } from "./constants/jobLandingContent";

const Process = () => (
    <section className="section" id="process">
        <Container>
            <Row className="justify-content-center">
                <Col lg={8}>
                    <div className="text-center mb-5">
                        <h1 className="mb-3 fw-semibold lh-base">
                            How <span className="text-primary">it's work</span> — Homeo Centrum workflow
                        </h1>
                        <p className="text-muted">
                            From registration to prescription — a creative, efficient workflow for modern homeopathic practice.
                        </p>
                    </div>
                </Col>
            </Row>
            <Row className="homeojob-process-row g-3">
                {JOB_PROCESS.map((item) => (
                    <Col lg={3} md={6} key={item.id} className="d-flex">
                        <Card className="homeojob-process-card card w-100 h-100">
                            <CardBody className="p-4 d-flex flex-column">
                                <h1 className="fw-bold display-5 ff-secondary mb-4 text-success position-relative">
                                    <div className="job-icon-effect"></div>
                                    <span>{item.id}</span>
                                </h1>
                                <h6 className="fs-17 mb-2">{item.label}</h6>
                                <p className="text-muted mb-0 fs-15 flex-grow-1">{item.desc}</p>
                            </CardBody>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    </section>
);

export default Process;

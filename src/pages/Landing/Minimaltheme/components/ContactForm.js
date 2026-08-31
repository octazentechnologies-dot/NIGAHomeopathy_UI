import React, { useState } from "react";
import { Col, Row, Card, CardBody, Modal, ModalBody, ModalFooter, Button } from "reactstrap";
import { submitEnquiry } from "../helpers/marketingApi";

const FIELDS = [
    { name: "enquiryName", label: "Name", type: "text", placeholder: "Your Name *", required: true, col: 6 },
    { name: "emailId", label: "Email", type: "email", placeholder: "Your Mail *", required: true, col: 6 },
    { name: "mobileNo", label: "Phone", type: "text", placeholder: "Phone", required: false, col: 12 },
];

const ContactForm = ({ showTitle = false, title = "Send Your Message Us" }) => {
    const [form, setForm] = useState({
        enquiryName: "",
        emailId: "",
        mobileNo: "",
        enquiryDetails1: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await submitEnquiry({
                enquiryName: form.enquiryName,
                emailId: form.emailId,
                mobileNo: form.mobileNo,
                enquiryDetails1: form.enquiryDetails1,
                enquiryDate: new Date().toISOString(),
            });
            setModal(true);
            setForm({ enquiryName: "", emailId: "", mobileNo: "", enquiryDetails1: "" });
        } catch {
            setError("Failed to submit your message. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Card className="minimaltheme-contact-form border shadow-sm">
                <CardBody className="p-4 p-md-5">
                    {showTitle && <h4 className="mb-4 fw-semibold">{title}</h4>}
                    <form id="contact-form" onSubmit={handleSubmit}>
                        <Row className="g-3">
                            {FIELDS.map((field) => (
                                <Col md={field.col} key={field.name}>
                                    <label htmlFor={field.name} className="form-label minimaltheme-form-label">
                                        {field.label}
                                        {field.required && <span className="text-danger ms-1">*</span>}
                                    </label>
                                    <input
                                        id={field.name}
                                        name={field.name}
                                        type={field.type}
                                        className="form-control minimaltheme-form-control"
                                        placeholder={field.placeholder}
                                        value={form[field.name]}
                                        onChange={handleChange}
                                        required={field.required}
                                    />
                                </Col>
                            ))}
                            <Col md={12}>
                                <label htmlFor="enquiryDetails1" className="form-label minimaltheme-form-label">
                                    Message
                                </label>
                                <textarea
                                    id="enquiryDetails1"
                                    name="enquiryDetails1"
                                    rows={5}
                                    className="form-control minimaltheme-form-control"
                                    placeholder="Your Message...."
                                    value={form.enquiryDetails1}
                                    onChange={handleChange}
                                ></textarea>
                            </Col>
                            <Col md={12}>
                                {error && (
                                    <div className="alert alert-danger py-2 mb-3" role="alert">
                                        {error}
                                    </div>
                                )}
                                <div className="text-end">
                                    <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Please wait...
                                            </>
                                        ) : (
                                            <>
                                                Send Message <i className="ri-send-plane-line ms-1"></i>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Col>
                        </Row>
                    </form>
                </CardBody>
            </Card>
            <Modal isOpen={modal} toggle={() => setModal(false)} centered>
                <ModalBody className="text-center p-4">
                    <i className="ri-checkbox-circle-fill text-success display-4"></i>
                    <p className="mt-3 mb-0 ff-secondary">
                        Thank You For Your Interest. Your data Submitted Successfully. We Will Contact Soon.
                    </p>
                </ModalBody>
                <ModalFooter className="justify-content-center">
                    <Button color="primary" onClick={() => setModal(false)}>Close</Button>
                </ModalFooter>
            </Modal>
        </>
    );
};

export default ContactForm;

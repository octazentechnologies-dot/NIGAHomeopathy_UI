import React from "react";
import { Col, Input, Row } from "reactstrap";
import Flatpickr from "react-flatpickr";
import WhatsAppFormLabel from "./WhatsAppFormLabel";

export default function WhatsAppCommonFields({ compose, onChange, showMessageDate = true }) {
  const twoFieldCol = showMessageDate ? 4 : 6;

  return (
    <Row className="g-3">
      <Col md={twoFieldCol}>
        <WhatsAppFormLabel icon="ri-stethoscope-line">Doctor Name</WhatsAppFormLabel>
        <Input
          value={compose.doctorName || ""}
          onChange={(e) => onChange({ doctorName: e.target.value })}
          placeholder="Enter doctor name"
        />
      </Col>
      <Col md={twoFieldCol}>
        <WhatsAppFormLabel icon="ri-hospital-line">Hospital Name</WhatsAppFormLabel>
        <Input
          value={compose.hospitalName || ""}
          onChange={(e) => onChange({ hospitalName: e.target.value })}
          placeholder="Enter hospital name"
        />
      </Col>
      {showMessageDate ? (
        <Col md={4}>
          <WhatsAppFormLabel icon="ri-calendar-event-line">Date</WhatsAppFormLabel>
          <Flatpickr
            className="form-control"
            value={compose.messageDate || ""}
            options={{ dateFormat: "d-m-Y" }}
            onChange={(dates) => onChange({ messageDate: dates?.[0] || null })}
            placeholder="Select date"
          />
        </Col>
      ) : null}
    </Row>
  );
}

import React from "react";
import { Col, Input, Label, Row } from "reactstrap";
import Flatpickr from "react-flatpickr";

export default function WhatsAppCommonFields({ compose, onChange, showMessageDate = true }) {
  return (
    <Row className="g-3 mb-2">
      <Col md={4}>
        <Label className="form-label">Doctor Name</Label>
        <Input
          value={compose.doctorName || ""}
          onChange={(e) => onChange({ doctorName: e.target.value })}
          placeholder="Enter doctor name"
        />
      </Col>
      <Col md={4}>
        <Label className="form-label">Hospital Name</Label>
        <Input
          value={compose.hospitalName || ""}
          onChange={(e) => onChange({ hospitalName: e.target.value })}
          placeholder="Enter hospital name"
        />
      </Col>
      {showMessageDate ? (
        <Col md={4}>
          <Label className="form-label">Date</Label>
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

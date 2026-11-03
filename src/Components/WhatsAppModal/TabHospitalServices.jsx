import React from "react";
import { Col, Input, Row } from "reactstrap";
import MessageBodyField from "./MessageBodyField";
import WhatsAppFormLabel from "./WhatsAppFormLabel";
export default function TabHospitalServices({
  compose,
  onChange,
  recipientSelector,
  onEditorReady,
  isMarathi = false,
}) {
  return (
    <Row className="g-3">
        {/* Template Name — disabled for now
        <Col md={6}>
          <Label className="form-label">Template Name</Label>
          <Input ... />
        </Col>
        <Col md={6}>
          <Label className="form-label">Select Service</Label>
          <Select ... services dropdown ... />
        </Col>
        */}
        <Col md={12}>{recipientSelector}</Col>
        <MessageBodyField
          compose={compose}
          onChange={onChange}
          onEditorReady={onEditorReady}
          label="Message for {{Message}}"
          labelIcon="ri-message-3-line"          hint={
            isMarathi
              ? "मराठी भाषेत फक्त अतिरिक्त संदेश लिहा — संपूर्ण पत्र नाही (डुप्लिकेट टाळण्यासाठी)."
              : "Enter only the extra text for the template — not the full letter (avoids duplicate content)."
          }
          placeholder={
            isMarathi
              ? "उदा. रुग्णांसाठी महत्वाची माहिती..."
              : "e.g. This is a test message for our patients..."
          }
        />
        <Col md={12}>
          <WhatsAppFormLabel icon="ri-file-upload-line">Attach PDF/Image (optional)</WhatsAppFormLabel>          <Input
            type="file"
            onChange={(e) => onChange({ attachment: e.target.files?.[0] || null })}
          />
        </Col>
    </Row>
  );
}

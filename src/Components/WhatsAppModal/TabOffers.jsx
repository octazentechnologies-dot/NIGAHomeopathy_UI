import React from "react";
import { Col, Input, Label, Row } from "reactstrap";
import Flatpickr from "react-flatpickr";
import MessageBodyField from "./MessageBodyField";

export default function TabOffers({
  compose,
  onChange,
  recipientSelector,
  onEditorReady,
  isMarathi = false,
}) {
  return (
    <div>
      <Row className="g-3">
        {/* Template Name — disabled for now
        <Col md={6}>
          <Label className="form-label">Template Name</Label>
          <Input ... />
        </Col>
        */}
        <Col md={6}>
          <Label className="form-label">
            Offer <span className="text-danger">*</span>
          </Label>
          <Input
            value={compose.offerTitle || ""}
            onChange={(e) => onChange({ offerTitle: e.target.value })}
            placeholder={
              isMarathi
                ? "{{Offer}} साठी — उदा. २०% सूट"
                : "Maps to {{Offer}} — e.g. 20% off first consultation"
            }
          />
        </Col>
        <Col md={6}>
          <Label className="form-label">Valid Until</Label>
          <Flatpickr
            className="form-control"
            value={compose.validUntil || ""}
            options={{ dateFormat: "d-m-Y", altInput: true, altFormat: "d-M-Y" }}
            onChange={(dates) => onChange({ validUntil: dates?.[0] || null })}
            placeholder="Select offer expiry date"
          />
          <div className="text-muted small mt-1">Used in template as {"{{Date}}"} or {"{{ValidUntil}}"}</div>
        </Col>
        <Col md={6}>
          <Label className="form-label">Coupon Code (optional)</Label>
          <Input
            value={compose.couponCode || ""}
            onChange={(e) => onChange({ couponCode: e.target.value })}
            placeholder="e.g. HEALTH50"
          />
        </Col>
        <Col md={12}>{recipientSelector}</Col>
        <MessageBodyField
          compose={compose}
          onChange={onChange}
          onEditorReady={onEditorReady}
          hint={
            isMarathi
              ? "मराठी भाषेत ऑफर संदेश लिहा — टेम्पलेटशी समान भाषा वापरा."
              : "Type your offer message in the same language as the selected template."
          }
          placeholder={isMarathi ? "ऑफर संदेश लिहा..." : "Write offer message..."}
        />
        <Col md={12}>
          <Label className="form-label">Offer Banner Image (optional)</Label>
          <Input
            type="file"
            onChange={(e) => onChange({ attachment: e.target.files?.[0] || null })}
          />
        </Col>
      </Row>
    </div>
  );
}


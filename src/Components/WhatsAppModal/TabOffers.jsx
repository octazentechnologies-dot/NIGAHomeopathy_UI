import React from "react";
import { Col, Input, Row } from "reactstrap";
import Flatpickr from "react-flatpickr";
import MessageBodyField from "./MessageBodyField";
import WhatsAppFormLabel from "./WhatsAppFormLabel";
export default function TabOffers({
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
        */}
        <Col md={6}>
          <WhatsAppFormLabel icon="ri-price-tag-3-line">
            Offer <span className="text-danger">*</span>
          </WhatsAppFormLabel>          <Input
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
          <WhatsAppFormLabel icon="ri-calendar-check-line">Valid Until</WhatsAppFormLabel>          <Flatpickr
            className="form-control"
            value={compose.validUntil || ""}
            options={{ dateFormat: "d-m-Y", altInput: true, altFormat: "d-M-Y" }}
            onChange={(dates) => onChange({ validUntil: dates?.[0] || null })}
            placeholder="Select offer expiry date"
          />
          <div className="text-muted small mt-1">Used in template as {"{{Date}}"} or {"{{ValidUntil}}"}</div>
        </Col>
        <Col md={6}>
          <WhatsAppFormLabel icon="ri-coupon-3-line">Coupon Code (optional)</WhatsAppFormLabel>          <Input
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
          <WhatsAppFormLabel icon="ri-image-line">Offer Banner Image (optional)</WhatsAppFormLabel>          <Input
            type="file"
            onChange={(e) => onChange({ attachment: e.target.files?.[0] || null })}
          />
        </Col>
    </Row>
  );
}


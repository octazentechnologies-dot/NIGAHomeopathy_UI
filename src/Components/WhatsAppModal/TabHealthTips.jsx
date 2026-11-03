import React from "react";
import { Col, Input, Row } from "reactstrap";
import Select from "react-select";
import { neutralSelectProps } from "../../helpers/neutralSelectStyles";
import MessageBodyField from "./MessageBodyField";
import WhatsAppFormLabel from "./WhatsAppFormLabel";
export default function TabHealthTips({
  compose,
  onChange,
  recipientSelector,
  onEditorReady,
  isMarathi = false,
}) {
  const tipCategoryOptions = [
    { value: "General Wellness", label: "General Wellness" },
    { value: "Post-Op Care", label: "Post-Op Care" },
    { value: "Seasonal Alert", label: "Seasonal Alert" },
    { value: "Medicine Reminder", label: "Medicine Reminder" },
    { value: "Diet Advice", label: "Diet Advice" },
  ];

  return (
    <Row className="g-3">
        {/* Template Name — disabled for now
        <Col md={6}>
          <Label className="form-label">Template Name</Label>
          <Input ... />
        </Col>
        */}
        <Col md={6}>
          <WhatsAppFormLabel icon="ri-lightbulb-flash-line">Tip Category</WhatsAppFormLabel>          <Select
            value={compose.tipCategory || null}
            onChange={(v) => onChange({ tipCategory: v })}
            options={tipCategoryOptions}
            isClearable
            placeholder="Select category..."
            {...neutralSelectProps}
          />
        </Col>
        <Col md={12}>{recipientSelector}</Col>
        <MessageBodyField
          compose={compose}
          onChange={onChange}
          onEditorReady={onEditorReady}
          label="Health Tip (required)"
          labelIcon="ri-heart-pulse-line"          hint={
            isMarathi
              ? "मराठी भाषेत आरोग्य टिप लिहा — {{HealthTip}} साठी."
              : "Type the health tip in the same language as the selected template."
          }
          placeholder={
            isMarathi
              ? "आरोग्य टिप लिहा — {{HealthTip}}..."
              : "Write health tip — maps to {{HealthTip}}..."
          }
        />
        <Col md={12}>
          <WhatsAppFormLabel icon="ri-image-add-line">Attach Image/Infographic (optional)</WhatsAppFormLabel>          <Input
            type="file"
            onChange={(e) => onChange({ attachment: e.target.files?.[0] || null })}
          />
        </Col>
        {/* Recurring — hidden for now
        <Col md={6}>...</Col>
        */}
    </Row>
  );
}


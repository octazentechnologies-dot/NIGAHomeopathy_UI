import React from "react";
import { Col, Label } from "reactstrap";
import WhatsAppMessageEditor from "./WhatsAppMessageEditor";

export default function MessageBodyField({
  compose,
  onChange,
  onEditorReady,
  placeholder,
  label = "Message Body",
  hint,
}) {
  return (
    <Col md={12}>
      <Label className="form-label">{label}</Label>
      {hint ? <div className="text-muted small mb-1">{hint}</div> : null}
      <WhatsAppMessageEditor
        value={compose.messageBody || ""}
        onChange={(messageBody) => onChange({ messageBody })}
        onEditorReady={onEditorReady}
        placeholder={placeholder}
      />
    </Col>
  );
}

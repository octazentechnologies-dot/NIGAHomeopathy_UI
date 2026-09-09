import React from "react";
import { Col } from "reactstrap";
import WhatsAppFormLabel from "./WhatsAppFormLabel";
import WhatsAppMessageEditor from "./WhatsAppMessageEditor";

export default function MessageBodyField({
  compose,
  onChange,
  onEditorReady,
  placeholder,
  label = "Message Body",
  labelIcon = "ri-message-2-line",
  hint,
}) {
  return (
    <Col md={12}>
      <WhatsAppFormLabel icon={labelIcon}>{label}</WhatsAppFormLabel>
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

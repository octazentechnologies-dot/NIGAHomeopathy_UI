import React from "react";
import { Label } from "reactstrap";

export default function WhatsAppFormLabel({ icon, children, htmlFor, className = "" }) {
  return (
    <Label className={`form-label whatsapp-modal__label ${className}`.trim()} htmlFor={htmlFor}>
      {icon ? <i className={icon} aria-hidden="true" /> : null}
      {children}
    </Label>
  );
}

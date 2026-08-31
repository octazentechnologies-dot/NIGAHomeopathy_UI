/**
 * React integration example — copy patterns into your screen.
 *
 * import { formatForWhatsApp, buildWhatsAppOutboundContent } from '../utils/formatForWhatsApp';
 */

import React, { useMemo } from 'react';
import { buildWhatsAppOutboundContent } from './formatForWhatsApp';

export function WhatsAppMessagePreviewExample({ compose, patient, activeTab }) {
  const outbound = useMemo(
    () =>
      buildWhatsAppOutboundContent({
        html: compose.templateBody,
        compose,
        patient,
        activeTab,
      }),
    [compose, patient, activeTab]
  );

  const handleSend = async () => {
    const payload = {
      doctorID: compose.doctorID,
      templateID: compose.templateID,
      individual: true,
      bulk: false,
      message: outbound.message,
      offer: outbound.variables.Offer,
      healthTip: outbound.variables.HealthTip,
      doctorName: outbound.variables.DoctorName,
      hospitalName: outbound.variables.HospitalName,
      date: outbound.variables.Date,
      imageBase64: null,
    };
    await fetch('/api/WhatsApp/SendHospitalServiceMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  };

  return (
    <div>
      <h6>Final WhatsApp preview</h6>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{outbound.message}</pre>
      <button type="button" onClick={handleSend}>
        Send
      </button>
    </div>
  );
}

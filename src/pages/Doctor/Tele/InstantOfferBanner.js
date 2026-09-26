import React, { useEffect, useState } from "react";
import { Alert, Button } from "reactstrap";
import { acceptInstantConsult, listInstantConsultOffers } from "../../../helpers/realbackend_helper";

/** Set true to show Instant consult offers on the doctor dashboard again. */
const SHOW_INSTANT_OFFERS = false;

const InstantOfferBanner = () => {
  const [offers, setOffers] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await listInstantConsultOffers();
      const body = response?.data ?? response;
      const list = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : Array.isArray(body?.offers) ? body.offers : [];
      setOffers(list);
      setError("");
    } catch {
      setOffers([]);
    }
  };

  useEffect(() => {
    if (!SHOW_INSTANT_OFFERS) return undefined;
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!SHOW_INSTANT_OFFERS || !offers.length) return null;

  return (
    <Alert color="warning" className="mb-3">
      <div className="fw-medium mb-2">Instant consult offers</div>
      {error ? <div className="text-danger small mb-2">{error}</div> : null}
      {offers.map((row) => {
        const id = row.requestId || row.RequestId || row.id;
        return (
          <div key={id} className="d-flex justify-content-between align-items-center gap-2 mb-1">
            <span>
              #{id} {row.contactName || row.ContactName || "Patient"} {row.contactMobile || row.ContactMobile || ""}
            </span>
            <Button
              size="sm"
              color="success"
              disabled={busy === id}
              onClick={async () => {
                setBusy(id);
                try {
                  await acceptInstantConsult(id);
                  await load();
                } catch (err) {
                  setError(err?.message || "Could not accept offer.");
                } finally {
                  setBusy(null);
                }
              }}
            >
              Accept
            </Button>
          </div>
        );
      })}
    </Alert>
  );
};

export default InstantOfferBanner;

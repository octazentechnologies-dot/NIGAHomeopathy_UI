import React, { useCallback, useEffect, useState } from "react";
import { Col, FormGroup, Input, Label, Row } from "reactstrap";
import {
  getRegistrationCities,
  getRegistrationCountries,
  getRegistrationDistricts,
  getRegistrationPinCodes,
  getRegistrationStates,
} from "../../helpers/realbackend_helper";

const idOf = (row, ...keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && value !== "") return String(value);
  }
  return "";
};

const nameOf = (row, ...keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
};

const toOptions = (list, idKeys, nameKeys) =>
  (Array.isArray(list) ? list : [])
    .map((row) => {
      const value = idOf(row, ...idKeys);
      const label = nameOf(row, ...nameKeys) || value;
      return value ? { value, label } : null;
    })
    .filter(Boolean);

/**
 * Signup-style Country → State → District → City → PIN cascade + address lines.
 * Layout: 4 columns per row (md={3}).
 * Controlled via `value` / `onChange` object fields.
 */
const AddressCascadeFields = ({ value, onChange, disabled = false, requiredCountry = true }) => {
  const form = value || {};
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [pins, setPins] = useState([]);

  const patch = useCallback(
    (partial) => {
      onChange?.({ ...form, ...partial });
    },
    [form, onChange]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getRegistrationCountries();
        if (!cancelled) setCountries(toOptions(list, ["countryId", "CountryId", "id"], ["countryName", "CountryName", "name"]));
      } catch {
        if (!cancelled) setCountries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!form.countryId) {
      setStates([]);
      return undefined;
    }
    (async () => {
      try {
        const list = await getRegistrationStates(form.countryId);
        if (!cancelled) setStates(toOptions(list, ["stateId", "StateId", "id"], ["stateName", "StateName", "name"]));
      } catch {
        if (!cancelled) setStates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.countryId]);

  useEffect(() => {
    let cancelled = false;
    if (!form.stateId) {
      setDistricts([]);
      return undefined;
    }
    (async () => {
      try {
        const list = await getRegistrationDistricts(form.stateId);
        if (!cancelled) setDistricts(toOptions(list, ["districtId", "DistrictId", "id"], ["districtName", "DistrictName", "name"]));
      } catch {
        if (!cancelled) setDistricts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.stateId]);

  useEffect(() => {
    let cancelled = false;
    if (!form.districtId) {
      setCities([]);
      return undefined;
    }
    (async () => {
      try {
        const list = await getRegistrationCities(form.districtId);
        if (!cancelled) setCities(toOptions(list, ["cityId", "CityId", "id"], ["cityName", "CityName", "name"]));
      } catch {
        if (!cancelled) setCities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.districtId]);

  useEffect(() => {
    let cancelled = false;
    if (!form.cityId) {
      setPins([]);
      return undefined;
    }
    (async () => {
      try {
        const list = await getRegistrationPinCodes(form.cityId);
        if (!cancelled) {
          setPins(
            toOptions(list, ["pinCodeId", "PinCodeId", "id"], ["pinCode", "PinCode", "name"]).map((opt) => ({
              ...opt,
              label: opt.label || opt.value,
            }))
          );
        }
      } catch {
        if (!cancelled) setPins([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.cityId]);

  const onCountry = (countryId) =>
    patch({
      countryId,
      stateId: "",
      districtId: "",
      cityId: "",
      pinCodeId: "",
      postalCode: "",
    });
  const onState = (stateId) =>
    patch({ stateId, districtId: "", cityId: "", pinCodeId: "", postalCode: "" });
  const onDistrict = (districtId) => patch({ districtId, cityId: "", pinCodeId: "", postalCode: "" });
  const onCity = (cityId) => patch({ cityId, pinCodeId: "", postalCode: "" });
  const onPin = (pinCodeId) => {
    const selected = pins.find((p) => String(p.value) === String(pinCodeId));
    patch({
      pinCodeId,
      postalCode: selected?.label || form.postalCode || "",
    });
  };

  return (
    <>
      <Row className="g-3">
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>
              Country{requiredCountry ? " *" : ""}
            </Label>
            <Input
              type="select"
              disabled={disabled}
              value={form.countryId || ""}
              onChange={(e) => onCountry(e.target.value)}
            >
              <option value="">Select country</option>
              {countries.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>State</Label>
            <Input
              type="select"
              disabled={disabled || !form.countryId}
              value={form.stateId || ""}
              onChange={(e) => onState(e.target.value)}
            >
              <option value="">{form.countryId ? "Select state (optional)" : "Select country first"}</option>
              {states.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>District</Label>
            <Input
              type="select"
              disabled={disabled || !form.stateId}
              value={form.districtId || ""}
              onChange={(e) => onDistrict(e.target.value)}
            >
              <option value="">{form.stateId ? "Select district" : "Select state first"}</option>
              {districts.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>City</Label>
            <Input
              type="select"
              disabled={disabled || !form.districtId}
              value={form.cityId || ""}
              onChange={(e) => onCity(e.target.value)}
            >
              <option value="">{form.districtId ? "Select city" : "Select district first"}</option>
              {cities.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
      </Row>
      <Row className="g-3">
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>Address line 1 *</Label>
            <Input
              disabled={disabled}
              placeholder="Building / clinic name, street"
              value={form.addressLine1 || ""}
              onChange={(e) => patch({ addressLine1: e.target.value })}
            />
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>Address line 2</Label>
            <Input
              disabled={disabled}
              placeholder="Area / locality, apartment / floor"
              value={form.addressLine2 || ""}
              onChange={(e) => patch({ addressLine2: e.target.value })}
            />
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>Landmark</Label>
            <Input
              disabled={disabled}
              placeholder="Nearby identifiable landmark"
              value={form.landmark || ""}
              onChange={(e) => patch({ landmark: e.target.value })}
            />
          </FormGroup>
        </Col>
        <Col md={3} sm={6} xs={12}>
          <FormGroup>
            <Label>ZIP / PIN code</Label>
            <Input
              type="select"
              disabled={disabled || !form.cityId}
              value={form.pinCodeId || ""}
              onChange={(e) => onPin(e.target.value)}
            >
              <option value="">{form.cityId ? "Select PIN" : "Select city first"}</option>
              {pins.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>
      </Row>
    </>
  );
};

export default AddressCascadeFields;

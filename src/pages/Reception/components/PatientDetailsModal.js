import React, { useMemo, useState } from "react";
import classnames from "classnames";
import {
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
} from "reactstrap";
import Select from "react-select";
import moment from "moment";
import DateOfBirthPicker, { DOB_DISPLAY_FORMAT } from "../../../Components/Common/DateOfBirthPicker";
import ModalActionButton from "../../../Components/Common/ModalActionButton";

const DEMO_PATIENTS = [
  { id: 1, firstName: "Rohan", lastName: "Mehta", gender: 0, dateOfBirth: "15/03/1992", address: "Kolhapur", mobileNo: "9876543210" },
  { id: 2, firstName: "Sneha", lastName: "Patil", gender: 1, dateOfBirth: "22/08/1996", address: "Pune", mobileNo: "9123456780" },
  { id: 3, firstName: "Amit", lastName: "Shah", gender: 0, dateOfBirth: "10/01/1979", address: "Mumbai", mobileNo: "9988776655" },
  { id: 4, firstName: "Priya", lastName: "Desai", gender: 1, dateOfBirth: "05/11/1988", address: "Sangli", mobileNo: "9090909090" },
  { id: 5, firstName: "Vikram", lastName: "Joshi", gender: 0, dateOfBirth: "30/06/1973", address: "Nashik", mobileNo: "9811122233" },
];

const COUNTRY_OPTIONS = [{ value: "IN", label: "India" }];
const STATE_OPTIONS = [
  { value: "MH", label: "Maharashtra" },
  { value: "KA", label: "Karnataka" },
  { value: "GJ", label: "Gujarat" },
];

const EMPTY_NEW_PATIENT = {
  firstName: "",
  lastName: "",
  gender: 0,
  dateOfBirth: "",
  address: "",
  countryId: "IN",
  stateId: "MH",
  mobileNo: "",
  phoneNo: "",
  email: "",
  referBy: "",
};

const DOCTOR_MODAL_SELECT_MENU_Z = 10600;
const selectPortalProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : null,
  menuPosition: "fixed",
  className: "react-select-container",
  classNamePrefix: "react-select",
};
const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: DOCTOR_MODAL_SELECT_MENU_Z }),
  indicatorSeparator: () => ({ display: "none" }),
};

const calcAgeLabel = (dobDisplay) => {
  const parsed = moment(dobDisplay, [DOB_DISPLAY_FORMAT, "DD/MM/YYYY", "M/D/YYYY", "MM/DD/YYYY"], true);
  if (!parsed.isValid()) return "—";
  const years = moment().diff(parsed, "years");
  return `${years}y`;
};

const genderLabel = (gender) => (gender === 1 ? "Female" : "Male");

const buildPatientSummary = ({ id, firstName, lastName, gender, dateOfBirth, mobileNo, address }) => ({
  id: id ?? null,
  fullName: `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim(),
  age: calcAgeLabel(dateOfBirth),
  sex: genderLabel(gender),
  mobileNo: mobileNo || "—",
  address: address || "—",
});

const FieldError = ({ show, message }) => (
  <div className="new-patient-modal__error" role={show ? "alert" : undefined}>
    {show ? message : null}
  </div>
);

const PatientDetailsModal = ({ isOpen, toggle, onPatientConfirmed }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [newPatient, setNewPatient] = useState(EMPTY_NEW_PATIENT);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const resetModalState = () => {
    setActiveTab("1");
    setSearchTerm("");
    setSelectedPatientId(null);
    setNewPatient(EMPTY_NEW_PATIENT);
    setTouched({});
    setSubmitAttempted(false);
  };

  const handleClose = () => {
    resetModalState();
    toggle();
  };

  const filteredPatients = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return DEMO_PATIENTS;
    return DEMO_PATIENTS.filter((patient) => {
      const haystack = [
        patient.firstName,
        patient.lastName,
        patient.mobileNo,
        patient.address,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [searchTerm]);

  const updateNewPatient = (field, value) => {
    setNewPatient((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const newPatientErrors = useMemo(() => {
    const errors = {};
    if (!String(newPatient.firstName || "").trim()) errors.firstName = "First name is required";
    if (!String(newPatient.lastName || "").trim()) errors.lastName = "Last name is required";
    if (newPatient.gender !== 0 && newPatient.gender !== 1) errors.gender = "Gender is required";
    if (!String(newPatient.dateOfBirth || "").trim()) errors.dateOfBirth = "Date of birth is required";
    if (!String(newPatient.address || "").trim()) errors.address = "Address is required";
    if (!newPatient.countryId) errors.countryId = "Country is required";
    if (!newPatient.stateId) errors.stateId = "State is required";
    if (!String(newPatient.mobileNo || "").trim()) errors.mobileNo = "Mobile number is required";
    return errors;
  }, [newPatient]);

  const showError = (field) =>
    Boolean(newPatientErrors[field] && (touched[field] || submitAttempted));

  const confirmPatient = (summary, source) => {
    onPatientConfirmed?.({
      ...summary,
      source,
    });
    handleClose();
  };

  const handleExistingNext = () => {
    const selected = DEMO_PATIENTS.find((patient) => patient.id === selectedPatientId);
    if (!selected) return;
    confirmPatient(buildPatientSummary(selected), "existing");
  };

  const handleNewPatientNext = () => {
    setSubmitAttempted(true);
    if (Object.keys(newPatientErrors).length > 0) return;
    confirmPatient(buildPatientSummary(newPatient), "new");
  };

  return (
    <Modal
      size="xl"
      isOpen={isOpen}
      toggle={handleClose}
      className="patient-list-modal new-patient-modal reception-patient-details-modal"
    >
      <ModalHeader className="patient-list-modal__header" toggle={handleClose}>
        <span className="patient-list-modal__title patient-list-modal__title--simple">
          <i className="ri-user-heart-line" style={{ color: "#25a0e2", fontSize: 15 }} aria-hidden="true" />
          <span className="patient-list-modal__title-text">Patient Details</span>
        </span>
      </ModalHeader>

      <ModalBody>
        <div className="doctor-patient-nav-tabs mb-3">
          <Nav pills className="nav-customs doctor-patient-custom-nav mb-0 reception-patient-details-tabs">
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "1" })}
                onClick={() => setActiveTab("1")}
              >
                <span className="doctor-patient-tab-label">Existing Patient List</span>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                style={{ cursor: "pointer" }}
                className={classnames({ active: activeTab === "2" })}
                onClick={() => setActiveTab("2")}
              >
                <span className="doctor-patient-tab-label">New Patient Information</span>
              </NavLink>
            </NavItem>
          </Nav>
        </div>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="1">
            <div className="search-box mb-3 reception-patient-details-search">
              <Input
                type="text"
                className="form-control form-control-sm search"
                placeholder="Search patient by name, mobile, or place..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="ri-search-line search-icon" aria-hidden="true" />
            </div>

            <div className="table-responsive reception-patient-details-list">
              <table className="table table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: "4%" }} />
                    <th scope="col">Patient Name</th>
                    <th scope="col">Age / Sex</th>
                    <th scope="col">Mobile</th>
                    <th scope="col">Place</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => {
                    const selected = selectedPatientId === patient.id;
                    return (
                      <tr
                        key={patient.id}
                        className={selected ? "reception-patient-row is-selected" : "reception-patient-row"}
                        onClick={() => setSelectedPatientId(patient.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPatientId(patient.id);
                          }
                        }}
                      >
                        <td className="text-center">
                          <Input
                            type="radio"
                            name="existingPatient"
                            checked={selected}
                            onChange={() => setSelectedPatientId(patient.id)}
                            aria-label={`Select ${patient.firstName} ${patient.lastName}`}
                          />
                        </td>
                        <td className="fw-semibold">
                          {patient.firstName} {patient.lastName}
                        </td>
                        <td>
                          {calcAgeLabel(patient.dateOfBirth)} / {genderLabel(patient.gender)[0]}
                        </td>
                        <td>{patient.mobileNo}</td>
                        <td>{patient.address}</td>
                      </tr>
                    );
                  })}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No patients found matching your search
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabPane>

          <TabPane tabId="2">
            <div className="row g-2 new-patient-modal__fields">
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-user-line" aria-hidden="true" />
                  First Name <span className="text-danger">*</span>
                </Label>
                <Input
                  placeholder="Enter first name"
                  value={newPatient.firstName}
                  onChange={(e) => updateNewPatient("firstName", e.target.value)}
                  onBlur={() => markTouched("firstName")}
                  className={showError("firstName") ? "is-invalid" : ""}
                />
                <FieldError show={showError("firstName")} message={newPatientErrors.firstName} />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-user-3-line" aria-hidden="true" />
                  Last Name <span className="text-danger">*</span>
                </Label>
                <Input
                  placeholder="Enter last name"
                  value={newPatient.lastName}
                  onChange={(e) => updateNewPatient("lastName", e.target.value)}
                  onBlur={() => markTouched("lastName")}
                  className={showError("lastName") ? "is-invalid" : ""}
                />
                <FieldError show={showError("lastName")} message={newPatientErrors.lastName} />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-group-line" aria-hidden="true" />
                  Gender <span className="text-danger">*</span>
                </Label>
                <div className="new-patient-modal__gender" role="radiogroup" aria-label="Gender">
                  <label className={`new-patient-modal__gender-option${newPatient.gender === 0 ? " is-active" : ""}`}>
                    <Input
                      type="radio"
                      name="receptionGender"
                      className="new-patient-modal__gender-input"
                      checked={newPatient.gender === 0}
                      onChange={() => updateNewPatient("gender", 0)}
                    />
                    <span className="new-patient-modal__gender-text">
                      <i className="ri-men-line" aria-hidden="true" />
                      Male
                    </span>
                  </label>
                  <label className={`new-patient-modal__gender-option${newPatient.gender === 1 ? " is-active" : ""}`}>
                    <Input
                      type="radio"
                      name="receptionGender"
                      className="new-patient-modal__gender-input"
                      checked={newPatient.gender === 1}
                      onChange={() => updateNewPatient("gender", 1)}
                    />
                    <span className="new-patient-modal__gender-text">
                      <i className="ri-women-line" aria-hidden="true" />
                      Female
                    </span>
                  </label>
                </div>
                <FieldError show={showError("gender")} message={newPatientErrors.gender} />
              </div>

              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-calendar-event-line" aria-hidden="true" />
                  Date of Birth <span className="text-danger">*</span>
                </Label>
                <DateOfBirthPicker
                  name="receptionPatientDob"
                  value={newPatient.dateOfBirth}
                  className="doctor-modal-date-picker"
                  hasError={showError("dateOfBirth")}
                  placeholder={DOB_DISPLAY_FORMAT}
                  onChange={(dateStr) => {
                    updateNewPatient("dateOfBirth", dateStr);
                    markTouched("dateOfBirth");
                  }}
                  onBlur={() => markTouched("dateOfBirth")}
                />
                <FieldError show={showError("dateOfBirth")} message={newPatientErrors.dateOfBirth} />
              </div>
              <div className="col-md-8 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-map-pin-line" aria-hidden="true" />
                  Address <span className="text-danger">*</span>
                </Label>
                <Input
                  placeholder="Enter address"
                  value={newPatient.address}
                  onChange={(e) => updateNewPatient("address", e.target.value)}
                  onBlur={() => markTouched("address")}
                  className={showError("address") ? "is-invalid" : ""}
                />
                <FieldError show={showError("address")} message={newPatientErrors.address} />
              </div>

              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-global-line" aria-hidden="true" />
                  Country <span className="text-danger">*</span>
                </Label>
                <div className="search-box">
                  <Select
                    value={COUNTRY_OPTIONS.find((o) => o.value === newPatient.countryId) || null}
                    onChange={(option) => {
                      updateNewPatient("countryId", option?.value || null);
                      updateNewPatient("stateId", null);
                      markTouched("countryId");
                    }}
                    onBlur={() => markTouched("countryId")}
                    options={COUNTRY_OPTIONS}
                    placeholder="Select country..."
                    isSearchable
                    {...selectPortalProps}
                    styles={selectStyles}
                  />
                  <i className="ri-search-line search-icon" aria-hidden="true" />
                </div>
                <FieldError show={showError("countryId")} message={newPatientErrors.countryId} />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-map-2-line" aria-hidden="true" />
                  State <span className="text-danger">*</span>
                </Label>
                <div className="search-box">
                  <Select
                    value={STATE_OPTIONS.find((o) => o.value === newPatient.stateId) || null}
                    onChange={(option) => {
                      updateNewPatient("stateId", option?.value || null);
                      markTouched("stateId");
                    }}
                    onBlur={() => markTouched("stateId")}
                    options={STATE_OPTIONS}
                    placeholder="Select state..."
                    isSearchable
                    {...selectPortalProps}
                    styles={selectStyles}
                  />
                  <i className="ri-search-line search-icon" aria-hidden="true" />
                </div>
                <FieldError show={showError("stateId")} message={newPatientErrors.stateId} />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-bookmark-line" aria-hidden="true" />
                  Mobile No. <span className="text-danger">*</span>
                </Label>
                <Input
                  placeholder="Enter mobile number"
                  value={newPatient.mobileNo}
                  onChange={(e) => updateNewPatient("mobileNo", e.target.value)}
                  onBlur={() => markTouched("mobileNo")}
                  className={showError("mobileNo") ? "is-invalid" : ""}
                />
                <FieldError show={showError("mobileNo")} message={newPatientErrors.mobileNo} />
              </div>

              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-phone-line" aria-hidden="true" />
                  Phone No.
                </Label>
                <Input
                  placeholder="Enter phone number"
                  value={newPatient.phoneNo}
                  onChange={(e) => updateNewPatient("phoneNo", e.target.value)}
                />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-mail-line" aria-hidden="true" />
                  Email
                </Label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={newPatient.email}
                  onChange={(e) => updateNewPatient("email", e.target.value)}
                />
              </div>
              <div className="col-md-4 new-patient-modal__field">
                <Label className="form-label new-patient-modal__label">
                  <i className="ri-user-shared-line" aria-hidden="true" />
                  Refer By
                </Label>
                <Input
                  placeholder="Enter reference"
                  value={newPatient.referBy}
                  onChange={(e) => updateNewPatient("referBy", e.target.value)}
                />
              </div>
            </div>
          </TabPane>
        </TabContent>
      </ModalBody>

      <ModalFooter className="reception-patient-details-footer">
        <ModalActionButton action="cancel" type="button" onClick={handleClose}>
          Cancel
        </ModalActionButton>
        {activeTab === "1" ? (
          <ModalActionButton
            action="update"
            type="button"
            iconClassName="ri-arrow-right-line"
            disabled={!selectedPatientId}
            onClick={handleExistingNext}
          >
            Next
          </ModalActionButton>
        ) : (
          <ModalActionButton
            action="update"
            type="button"
            iconClassName="ri-arrow-right-line"
            onClick={handleNewPatientNext}
          >
            Next
          </ModalActionButton>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default PatientDetailsModal;

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import classnames from "classnames";
import Swal from "sweetalert2";
import {
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Nav,
  NavItem,
  NavLink,
  Row,
} from "reactstrap";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";

import ModalActionButton from "../Common/ModalActionButton";
import { neutralSelectProps } from "../../helpers/neutralSelectStyles";
import "./WhatsAppModal.css";
import RecipientSelector from "./RecipientSelector";
import WhatsAppCommonFields from "./WhatsAppCommonFields";
import TabHospitalServices from "./TabHospitalServices";
import TabOffers from "./TabOffers";
import TabHealthTips from "./TabHealthTips";
import WhatsAppFormLabel from "./WhatsAppFormLabel";
import { getMessageBodyPlainLength } from "./WhatsAppMessageEditor";
import { getPatientList } from "../../slices/doctor/dashboard/thunk";
import {
  WHATSAPP_PLACEHOLDER_CHIPS,
  WHATSAPP_TAB_TO_CATEGORY,
  buildHealthTipSendPayload,
  buildHospitalSendPayload,
  buildOfferSendPayload,
  fetchWhatsAppLanguages,
  fetchWhatsAppTemplateDetail,
  fetchWhatsAppTemplatesForCategory,
  formatSendResultHtml,
  isMarathiLanguage,
  isWhatsAppLanguageMismatchError,
  WHATSAPP_LANGUAGE_MISMATCH_MESSAGE,
  patientHasWhatsAppOptIn,
  resolveDefaultLanguage,
  resolveDoctorID,
  buildWhatsAppOutboundContent,
  sendWhatsAppForTab,
} from "../../helpers/whatsapp_helper";
import { dedupeRepeatedBlocks } from "../../utils/formatForWhatsApp";

const TABS = {
  SERVICES: "services",
  OFFERS: "offers",
  TIPS: "tips",
};

const defaultComposeState = () => ({
  doctorName: "",
  hospitalName: "Homeo Centrum",
  messageDate: new Date(),
  templateID: null,
  templateOption: null,
  templateBody: "",
  offerTitle: "",
  validUntil: null,
  couponCode: "",
  tipCategory: null,
  healthTipNote: "",

  recipientMode: "individual",
  selectedPatient: null,
  bulkFilter: "all",

  messageBody: "",
  attachment: null,
});

export default function WhatsAppModal({ isOpen, toggle }) {
  const dispatch = useDispatch();
  const patientList = useSelector((state) => state?.DoctorDashboard?.patientList) || [];
  const doctorList = useSelector((state) => state?.DoctorDashboard?.doctorList) || [];

  const [activeTab, setActiveTab] = useState(TABS.SERVICES);
  const [composeByTab, setComposeByTab] = useState(() => ({
    [TABS.SERVICES]: defaultComposeState(),
    [TABS.OFFERS]: defaultComposeState(),
    [TABS.TIPS]: defaultComposeState(),
  }));
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [sending, setSending] = useState(false);

  const editorApiRef = useRef(null);
  const compose = composeByTab[activeTab] || defaultComposeState();

  const { doctorID, doctorName: defaultDoctorName } = useMemo(
    () => resolveDoctorID(doctorList),
    [doctorList]
  );

  const handleEditorReady = useCallback((api) => {
    editorApiRef.current = api;
  }, []);

  const patientOptions = useMemo(() => {
    return (patientList || []).map((p) => {
      const optedIn = patientHasWhatsAppOptIn(p);
      return {
        value: p.patientID ?? p.patientId,
        label: `${p.patientName || "Patient"}${p.mobileNo ? ` — ${p.mobileNo}` : ""}${
          optedIn ? " · WhatsApp ✓" : " · No WhatsApp opt-in"
        }`,
        raw: p,
        isDisabled: false,
      };
    });
  }, [patientList]);

  const languageOptions = useMemo(
    () =>
      languages.map((lang) => ({
        value: lang.languageId,
        label: lang.languageName,
        raw: lang,
      })),
    [languages]
  );

  const templateOptions = useMemo(
    () =>
      templates.map((t) => ({
        value: t.templateID,
        label: t.templateName,
        raw: t,
      })),
    [templates]
  );

  const isMarathiSelected = useMemo(
    () => isMarathiLanguage(selectedLanguage),
    [selectedLanguage]
  );

  const placeholderChips = useMemo(() => {
    let base = [...WHATSAPP_PLACEHOLDER_CHIPS];
    if (activeTab === TABS.OFFERS) {
      base = base.filter((t) => t !== "{{Date}}");
      if (!base.includes("{{ValidUntil}}")) base.push("{{ValidUntil}}");
      if (!base.includes("{{Offer}}")) base.push("{{Offer}}");
    }
    if (activeTab === TABS.TIPS && !base.includes("{{HealthTip}}")) base.push("{{HealthTip}}");
    return base;
  }, [activeTab]);

  const setComposePatch = useCallback(
    (patch) => {
      setComposeByTab((prev) => ({
        ...prev,
        [activeTab]: { ...(prev[activeTab] || defaultComposeState()), ...patch },
      }));
    },
    [activeTab]
  );

  const initComposeDefaults = useCallback(() => {
    setComposeByTab((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[key] = {
          ...defaultComposeState(),
          ...next[key],
          doctorName: next[key].doctorName || defaultDoctorName || "",
          hospitalName: next[key].hospitalName || "Homeo Centrum",
        };
      });
      return next;
    });
  }, [defaultDoctorName]);

  const clearTemplateSelection = useCallback(() => {
    setComposePatch({
      templateOption: null,
      templateID: null,
      templateBody: "",
    });
  }, [setComposePatch]);

  const loadLanguages = useCallback(async () => {
    setLanguagesLoading(true);
    try {
      const list = await fetchWhatsAppLanguages();
      setLanguages(list);
      const defaultLang = resolveDefaultLanguage(list);
      if (defaultLang) {
        setSelectedLanguage(defaultLang);
      }
    } catch (err) {
      setLanguages([]);
      Swal.fire({
        icon: "error",
        title: "Languages",
        text: err?.message || String(err),
      });
    } finally {
      setLanguagesLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async (tabKey, languageId) => {
    const category = WHATSAPP_TAB_TO_CATEGORY[tabKey];
    if (!category || languageId == null) return;
    setTemplatesLoading(true);
    try {
      const list = await fetchWhatsAppTemplatesForCategory(category, languageId);
      setTemplates(list);
    } catch (err) {
      setTemplates([]);
      Swal.fire({
        icon: "error",
        title: "Templates",
        text: err?.message || String(err),
      });
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const auth = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const userId = auth?.userId || auth?.user?.userId || auth?.user?.id || auth?.data?.userId;
    if (userId) {
      dispatch(getPatientList({ userId }));
    }
    initComposeDefaults();
    loadLanguages();
  }, [isOpen, dispatch, initComposeDefaults, loadLanguages]);

  useEffect(() => {
    if (!isOpen || selectedLanguage?.languageId == null) return;
    loadTemplates(activeTab, selectedLanguage.languageId);
  }, [isOpen, activeTab, selectedLanguage?.languageId, loadTemplates]);

  const handleLanguageChange = (option) => {
    const nextLanguage = option?.raw ?? null;
    setSelectedLanguage(nextLanguage);
    clearTemplateSelection();
    setTemplates([]);
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    clearTemplateSelection();
  };

  const insertPlaceholder = (token) => {
    if (editorApiRef.current?.insertText) {
      editorApiRef.current.insertText(token);
      return;
    }
    setComposePatch({ messageBody: (compose.messageBody || "") + token });
  };

  const handleTemplateSelect = async (option) => {
    if (!option) {
      setComposePatch({
        templateOption: null,
        templateID: null,
        templateBody: "",
      });
      return;
    }
    setComposePatch({
      templateOption: option,
      templateID: option.value,
    });
    try {
      const detail = await fetchWhatsAppTemplateDetail(option.value);
      setComposePatch({
        templateBody: dedupeRepeatedBlocks(detail?.templateBody || ""),
      });
    } catch (err) {
      Swal.fire({ icon: "warning", title: "Preview", text: err?.message || String(err) });
    }
  };

  const finalWhatsAppPreview = useMemo(() => {
    const patient =
      compose.recipientMode === "individual" ? compose.selectedPatient?.raw ?? null : null;
    const samplePatient = patient || { patientName: "Sample Patient" };
    return buildWhatsAppOutboundContent({
      html: compose.templateBody,
      compose,
      patient: samplePatient,
      activeTab,
    });
  }, [
    compose,
    activeTab,
    compose.templateBody,
    compose.messageBody,
    compose.doctorName,
    compose.hospitalName,
    compose.offerTitle,
    compose.validUntil,
    compose.messageDate,
    compose.recipientMode,
    compose.selectedPatient,
  ]);

  const characterCount = useMemo(
    () => getMessageBodyPlainLength(compose.messageBody),
    [compose.messageBody]
  );
  const maxChars = 1024;

  const tabLabel = useMemo(() => {
    if (activeTab === TABS.SERVICES) return "Hospital Services";
    if (activeTab === TABS.OFFERS) return "Offers & Discounts";
    return "Health Tips";
  }, [activeTab]);

  const validateBeforeSend = () => {
    if (!Number.isFinite(doctorID) || doctorID <= 0) {
      return "Doctor ID is missing. Please sign in again or contact support.";
    }
    if (!selectedLanguage?.languageId) {
      return "Please select a language.";
    }
    if (!compose.templateID) {
      return "Please select a WhatsApp template.";
    }
    const templateBelongsToLanguage = templates.some(
      (t) => t.templateID === compose.templateID
    );
    if (!templateBelongsToLanguage) {
      return "Selected template does not match the chosen language. Please select a template again.";
    }
    const messagePlain = compose.templateID
      ? (finalWhatsAppPreview.variables?.Message || finalWhatsAppPreview.message || "")
      : (finalWhatsAppPreview.previewMessage || finalWhatsAppPreview.message || "");
    if (activeTab === TABS.OFFERS && !(compose.offerTitle || "").trim()) {
      return "Offer is required for Offers & Discounts.";
    }
    if (activeTab === TABS.TIPS && !messagePlain) {
      return "Health tip text is required.";
    }
    if (activeTab === TABS.SERVICES && !messagePlain) {
      return "Message is required for Hospital Services.";
    }
    if (compose.recipientMode === "individual") {
      if (!compose.selectedPatient?.raw) {
        return "Please select a patient for individual send.";
      }
      if (!patientHasWhatsAppOptIn(compose.selectedPatient.raw)) {
        return "This patient has not opted in to WhatsApp messages.";
      }
      const mobile = compose.selectedPatient.raw.mobileNo;
      if (!mobile || String(mobile).replace(/\D/g, "").length < 10) {
        return "Patient must have a valid mobile number (10+ digits).";
      }
    }
    return null;
  };

  const onSaveAndSend = async () => {
    const validationError = validateBeforeSend();
    if (validationError) {
      Swal.fire({ icon: "error", title: "Cannot send", text: validationError });
      return;
    }

    const isBulk = compose.recipientMode === "bulk";
    const recipientText = isBulk
      ? "All WhatsApp opted-in patients for your account"
      : compose.selectedPatient?.label || "Selected patient";

    const confirm = await Swal.fire({
      title: isBulk ? "Confirm bulk send" : "Confirm send",
      html: `
        <div style="text-align:left">
          <div>You are about to send a WhatsApp message to:</div>
          <ul style="margin:10px 0 0 18px;padding:0">
            <li><b>${recipientText}</b></li>
            <li>Language: <b>${selectedLanguage?.languageName || "—"}</b></li>
            <li>Category: <b>${tabLabel}</b></li>
            <li>Template: <b>${compose.templateOption?.label || compose.templateID}</b></li>
          </ul>
          ${
            isBulk
              ? '<p class="mt-2 mb-0 text-muted" style="font-size:13px">Messages will be queued in the background.</p>'
              : ""
          }
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: isBulk ? "Queue bulk send" : "Send now",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#25D366",
    });

    if (!confirm.isConfirmed) return;

    setSending(true);
    try {
      let payload;
      const languageId = selectedLanguage?.languageId;
      if (activeTab === TABS.SERVICES) {
        payload = await buildHospitalSendPayload(compose, doctorID, isBulk, languageId);
      } else if (activeTab === TABS.OFFERS) {
        payload = await buildOfferSendPayload(compose, doctorID, isBulk, languageId);
      } else {
        payload = await buildHealthTipSendPayload(compose, doctorID, isBulk, languageId);
      }

      const response = await sendWhatsAppForTab(activeTab, payload);

      if (!response?.success && isWhatsAppLanguageMismatchError(response?.message)) {
        clearTemplateSelection();
        if (selectedLanguage?.languageId != null) {
          await loadTemplates(activeTab, selectedLanguage.languageId);
        }
        await Swal.fire({
          icon: "error",
          title: "Send failed",
          text: response?.message || WHATSAPP_LANGUAGE_MISMATCH_MESSAGE,
        });
        return;
      }

      await Swal.fire({
        icon: response?.success ? "success" : "warning",
        title: response?.success ? (isBulk ? "Queued" : "Sent") : "Send completed with issues",
        html: formatSendResultHtml(response, isBulk),
        confirmButtonColor: "#25D366",
      });

    } catch (err) {
      const message = err?.message || err?.response?.data?.message || String(err);
      if (isWhatsAppLanguageMismatchError(message)) {
        clearTemplateSelection();
        if (selectedLanguage?.languageId != null) {
          await loadTemplates(activeTab, selectedLanguage.languageId);
        }
      }
      Swal.fire({
        icon: "error",
        title: "Send failed",
        text: message,
      });
    } finally {
      setSending(false);
    }
  };

  const recipientSelector = (
    <RecipientSelector
      hideBulkModeDropdown
      recipientMode={compose.recipientMode}
      onChangeRecipientMode={(m) => setComposePatch({ recipientMode: m, selectedPatient: null })}
      patientOptions={patientOptions}
      selectedPatient={compose.selectedPatient}
      onChangeSelectedPatient={(p) => setComposePatch({ selectedPatient: p })}
      bulkFilter={compose.bulkFilter}
      onChangeBulkFilter={(v) => setComposePatch({ bulkFilter: v })}
      departmentOptions={[]}
      departmentFilter={[]}
      onChangeDepartmentFilter={() => {}}
      doctorOptions={[]}
      doctorFilter={null}
      onChangeDoctorFilter={() => {}}
      helperText="Sends to all patients linked to you with WhatsApp opt-in and a valid mobile number."
    />
  );

  const renderTab = () => {
    if (activeTab === TABS.SERVICES) {
      return (
        <TabHospitalServices
          compose={compose}
          onChange={setComposePatch}
          recipientSelector={recipientSelector}
          onEditorReady={handleEditorReady}
          isMarathi={isMarathiSelected}
        />
      );
    }
    if (activeTab === TABS.OFFERS) {
      return (
        <TabOffers
          compose={compose}
          onChange={setComposePatch}
          recipientSelector={recipientSelector}
          onEditorReady={handleEditorReady}
          isMarathi={isMarathiSelected}
        />
      );
    }
    return (
      <TabHealthTips
        compose={compose}
        onChange={setComposePatch}
        recipientSelector={recipientSelector}
        onEditorReady={handleEditorReady}
        isMarathi={isMarathiSelected}
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      centered
      size="lg"
      className="whatsapp-modal"
      backdrop
      fade
      style={{ maxWidth: 780 }}
    >
      <ModalHeader toggle={toggle}>
        <div className="whatsapp-modal__header">
          <div className="whatsapp-modal__title">
            <i className="ri-whatsapp-fill" style={{ color: "#25D366", fontSize: 20 }} />
            WhatsApp Messaging
          </div>
        </div>
      </ModalHeader>

      <div className="whatsapp-modal__tabs">
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === TABS.SERVICES })}
              onClick={() => handleTabChange(TABS.SERVICES)}
              role="button"
            >
              <i className="ri-hospital-line me-2" />
              Hospital Services
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === TABS.OFFERS })}
              onClick={() => handleTabChange(TABS.OFFERS)}
              role="button"
            >
              <i className="ri-price-tag-3-line me-2" />
              Offers & Discounts
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === TABS.TIPS })}
              onClick={() => handleTabChange(TABS.TIPS)}
              role="button"
            >
              <i className="ri-lightbulb-flash-line me-2" />
              Health Tips
            </NavLink>
          </NavItem>
        </Nav>
      </div>

      <ModalBody className="whatsapp-modal__body" style={{ minHeight: 380 }}>
        <div className="whatsapp-modal__form-stack">
        <Row className="g-3">
          <Col md={6}>
            <WhatsAppFormLabel icon="ri-translate-2">Language</WhatsAppFormLabel>
            <Select
              value={
                selectedLanguage
                  ? languageOptions.find((o) => o.value === selectedLanguage.languageId) || null
                  : null
              }
              onChange={handleLanguageChange}
              options={languageOptions}
              isLoading={languagesLoading}
              placeholder={languagesLoading ? "Loading languages..." : "Select language..."}
              {...neutralSelectProps}
            />
          </Col>
          <Col md={6}>
            <WhatsAppFormLabel icon="ri-file-list-3-line">Template</WhatsAppFormLabel>
            <Select
              value={compose.templateOption}
              onChange={handleTemplateSelect}
              options={templateOptions}
              isLoading={templatesLoading}
              placeholder={templatesLoading ? "Loading templates..." : "Select template..."}
              isClearable
              {...neutralSelectProps}
            />
          </Col>
          {(finalWhatsAppPreview.previewMessage || finalWhatsAppPreview.message) ? (
            <Col md={12}>
              <div className="whatsapp-modal__preview border rounded p-2">
                <div className="whatsapp-modal__subtle mb-1">
                  Final WhatsApp preview
                  {compose.templateID ? (
                    <span className="text-muted">
                      {" "}
                      — template + your message in {"{{Message}}"}
                      {isMarathiSelected ? " (मराठी)" : ""}
                    </span>
                  ) : null}
                </div>
                <pre
                  className="mb-0"
                  style={{
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                    fontSize: 13,
                    maxHeight: 180,
                    overflow: "auto",
                  }}
                >
                  {finalWhatsAppPreview.previewMessage || finalWhatsAppPreview.message}
                </pre>
                {finalWhatsAppPreview.unresolvedPlaceholders?.length > 0 ? (
                  <div className="text-warning small mt-1">
                    Unresolved: {finalWhatsAppPreview.unresolvedPlaceholders.join(", ")}
                  </div>
                ) : null}
                {finalWhatsAppPreview.images?.length > 0 ? (
                  <div className="text-muted small mt-1">
                    {finalWhatsAppPreview.images.length} inline image(s) in editor — send via
                    separate media upload (not included in text).
                  </div>
                ) : null}
              </div>
            </Col>
          ) : null}
        </Row>

        <div className="d-flex align-items-center justify-content-end whatsapp-modal__char-count">
          <div className="whatsapp-modal__subtle">
            <span className={characterCount > maxChars ? "text-danger fw-semibold" : ""}>
              {characterCount} / {maxChars}
            </span>
          </div>
        </div>

        <WhatsAppCommonFields
          compose={compose}
          onChange={setComposePatch}
          showMessageDate={activeTab !== TABS.OFFERS}
        />
        {renderTab()}
        </div>
      </ModalBody>

      <ModalFooter className="whatsapp-modal__footer justify-content-end">
        <ModalActionButton action="cancel" onClick={toggle} disabled={sending} />
        <ModalActionButton
          action="send"
          onClick={onSaveAndSend}
          disabled={sending || templatesLoading || languagesLoading}
          loading={sending}
          loadingLabel="Sending..."
        >
          Send Now
        </ModalActionButton>
      </ModalFooter>
    </Modal>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { landingPath } from "../../../../constants/landingRoutes";
import {
    createPublicBooking,
    getPublicPolicy,
    requestPatientAuthOtp,
    slotToHHmm,
    toIsoDate,
    verifyPatientAuthOtp,
} from "../../../../helpers/publicBookingApi";

const INR = "\u20B9";

const STEPS = [
    { id: 1, label: "Patient Details" },
    { id: 2, label: "Verify OTP" },
    { id: 3, label: "Booking hold" },
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const PAYMENT_METHODS = [
    {
        id: "upi",
        label: "UPI (Google Pay, PhonePe, Paytm, etc.)",
        shortLabel: "UPI Payment",
        hint: "Pay easily using any UPI app",
        icon: "ri-qr-code-line",
        brand: "upi",
        tips: [
            { icon: "ri-smartphone-line", text: "You will be redirected to a secure UPI payment page." },
            { icon: "ri-shield-check-line", text: "Supports Google Pay, PhonePe, Paytm, BHIM, and more." },
            { icon: "ri-flashlight-line", text: "Instant confirmation after successful payment." },
        ],
    },
    {
        id: "card",
        label: "Credit / Debit Card",
        shortLabel: "Card Payment",
        hint: "Visa, Mastercard, RuPay and more",
        icon: "ri-bank-card-line",
        brand: "card",
        tips: [
            { icon: "ri-lock-line", text: "Your card details are encrypted and never stored." },
            { icon: "ri-bank-card-line", text: "Supports Visa, Mastercard, RuPay and Amex." },
            { icon: "ri-flashlight-line", text: "Instant confirmation after successful payment." },
        ],
    },
    {
        id: "netbanking",
        label: "Net Banking",
        shortLabel: "Net Banking",
        hint: "All major banks supported",
        icon: "ri-bank-line",
        brand: "bank",
        tips: [
            { icon: "ri-bank-line", text: "You will be redirected to your bank's secure page." },
            { icon: "ri-shield-check-line", text: "All major Indian banks are supported." },
            { icon: "ri-flashlight-line", text: "Instant confirmation after successful payment." },
        ],
    },
    {
        id: "wallet",
        label: "Wallets",
        shortLabel: "Wallet Payment",
        hint: "Pay using Paytm, Amazon Pay, etc.",
        icon: "ri-wallet-3-line",
        brand: "wallet",
        tips: [
            { icon: "ri-wallet-3-line", text: "Pay quickly using your preferred wallet balance." },
            { icon: "ri-shield-check-line", text: "Supports Paytm, Amazon Pay and more." },
            { icon: "ri-flashlight-line", text: "Instant confirmation after successful payment." },
        ],
    },
];

const initialPatient = {
    fullName: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    address: "",
    reason: "",
};

const formatSummaryDate = (date) => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getSlotEnd = (slot) => {
    const hhmm = slotToHHmm(slot);
    const match = String(hhmm).match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return slot;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const total = hour * 60 + minute + 30;
    const endHour24 = Math.floor(total / 60) % 24;
    const endMin = total % 60;
    return `${String(endHour24).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
};

const BookingConfirmModal = ({
    isOpen,
    onClose,
    doctor,
    consultMode,
    bookingDate,
    selectedSlot,
    asPage = false,
}) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [patient, setPatient] = useState(initialPatient);
    const [agreed, setAgreed] = useState(false);
    const [errors, setErrors] = useState({});
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [paying, setPaying] = useState(false);
    const [receiptId, setReceiptId] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [otpHint, setOtpHint] = useState("");
    const [policyVersion, setPolicyVersion] = useState("2026.09");
    const [bookingError, setBookingError] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");

    const fee = consultMode === "tele" ? doctor.tele : doctor.inClinic;
    const platformFee = 0;
    const totalAmount = fee + platformFee;
    const consultLabel =
        consultMode === "tele" ? "Tele Consultation" : "In-Clinic Consultation";
    const timeRange = `${selectedSlot} - ${getSlotEnd(selectedSlot)}`;
    const summaryDate = useMemo(() => formatSummaryDate(bookingDate), [bookingDate]);
    const selectedPayMethod =
        PAYMENT_METHODS.find((m) => m.id === paymentMethod) || PAYMENT_METHODS[0];
    const headerSubtitle =
        step === 1
            ? "Please provide your details to confirm the appointment"
            : step === 2
              ? "Verify OTP and hold the slot (pay at clinic)"
              : "Your appointment receipt is ready";
    const shortSlotTime = selectedSlot;
    const appointmentWhen = `${summaryDate}, ${shortSlotTime}`;
    const clinicShort = `${doctor.clinicName || ""}${doctor.location ? `, ${String(doctor.location).split(",")[0]}` : ""}`;

    useEffect(() => {
        if (!isOpen) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setStep(1);
        setPatient(initialPatient);
        setAgreed(false);
        setErrors({});
        setPaymentMethod("upi");
        setPaying(false);
        setReceiptId("");
        setOtpCode("");
        setOtpHint("");
        setBookingError("");
        setPaymentStatus("");
        getPublicPolicy("Booking")
            .then((policy) => setPolicyVersion(policy.version ?? policy.Version ?? "2026.09"))
            .catch(() => setPolicyVersion("2026.09"));
    }, [isOpen]);

    if (!isOpen) return null;

    const updateField = (key, value) => {
        setPatient((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const validateStep1 = () => {
        const next = {};
        if (!patient.fullName.trim()) next.fullName = "Full name is required";
        if (!/^\d{10}$/.test(patient.phone.trim())) next.phone = "Enter a valid 10-digit mobile number";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email.trim())) {
            next.email = "Enter a valid email address";
        }
        const ageNum = Number(patient.age);
        if (!patient.age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            next.age = "Enter a valid age";
        }
        if (!patient.gender) next.gender = "Select gender";
        if (!agreed) next.agreed = "Please agree to Terms & Privacy Policy";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleProceedPayment = async (e) => {
        e.preventDefault();
        if (!validateStep1()) return;
        setBookingError("");
        setPaying(true);
        try {
            const otp = await requestPatientAuthOtp(patient.phone.trim());
            const hintParts = [`OTP sent to ${otp.destinationMasked || "your mobile"}`];
            if (otp.devCode) hintParts.push(`Dev code: ${otp.devCode}`);
            setOtpHint(hintParts.join(". "));
            if (otp.devCode) setOtpCode(String(otp.devCode));
            setStep(2);
        } catch (err) {
            setBookingError(typeof err === "string" ? err : err?.message || "Could not send OTP.");
        } finally {
            setPaying(false);
        }
    };

    const handlePay = async () => {
        if (!otpCode.trim()) {
            setBookingError("Enter the OTP sent to your mobile.");
            return;
        }
        setPaying(true);
        setBookingError("");
        try {
            const verified = await verifyPatientAuthOtp({
                mobile: patient.phone.trim(),
                code: otpCode.trim(),
            });
            const sessionId = verified.bookingSessionId ?? verified.BookingSessionId;
            const created = await createPublicBooking(doctor.id, {
                mobile: patient.phone.trim(),
                patientName: patient.fullName.trim(),
                email: patient.email.trim(),
                appointmentDate: `${toIsoDate(bookingDate)}T00:00:00`,
                appointmentTime: slotToHHmm(selectedSlot),
                visitType: consultMode === "tele" ? "Tele" : "InClinic",
                consultMode: consultMode === "tele" ? "Tele" : "InClinic",
                isTele: consultMode === "tele",
                bookingSessionId: sessionId,
                consentPolicyVersion: policyVersion,
            });
            setReceiptId(created.bookingToken ?? created.BookingToken ?? "");
            setPaymentStatus(created.paymentStatus ?? created.PaymentStatus ?? "PENDING");
            setStep(3);
            const token = created.bookingToken ?? created.BookingToken;
            if (token) {
                navigate(`${landingPath("book/success")}?token=${encodeURIComponent(token)}`);
            }
        } catch (err) {
            const message =
                typeof err === "string"
                    ? err
                    : err?.response?.data?.message || err?.message || "Could not create booking hold.";
            setBookingError(message);
        } finally {
            setPaying(false);
        }
    };

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className={`homeojob-booking-modal${asPage ? " homeojob-booking-modal--page" : ""}`}
            role="presentation"
            onClick={asPage ? undefined : handleBackdrop}
        >
            <div
                className="homeojob-booking-modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="booking-modal-title"
            >
                <header className="homeojob-booking-modal__header">
                    <div className="homeojob-booking-modal__title-row">
                        <span className="homeojob-booking-modal__title-icon" aria-hidden="true">
                            <i className="ri-calendar-check-fill" />
                        </span>
                        <div>
                            <h2 id="booking-modal-title">Confirm Your Appointment</h2>
                            <p>{headerSubtitle}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="homeojob-booking-modal__close"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <i className="ri-close-line" />
                    </button>
                </header>

                <div className="homeojob-booking-modal__steps" aria-label="Booking steps">
                    {STEPS.map((item, index) => (
                        <React.Fragment key={item.id}>
                            {index > 0 && (
                                <span
                                    className={`homeojob-booking-modal__step-line${
                                        step > index ? " is-done" : ""
                                    }`}
                                    aria-hidden="true"
                                />
                            )}
                            <div
                                className={`homeojob-booking-modal__step${
                                    step === item.id ? " is-active" : ""
                                }${step > item.id ? " is-done" : ""}`}
                            >
                                <span className="homeojob-booking-modal__step-num">
                                    {step > item.id ? <i className="ri-check-line" /> : item.id}
                                </span>
                                <span className="homeojob-booking-modal__step-label">{item.label}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                <div className="homeojob-booking-modal__body">
                    {step === 1 && (
                        <form
                            className="homeojob-booking-modal__form-col"
                            onSubmit={handleProceedPayment}
                            noValidate
                        >
                            <div className="homeojob-booking-modal__section-head">
                                <span aria-hidden="true">
                                    <i className="ri-user-3-fill" />
                                </span>
                                <h3>Patient Details</h3>
                            </div>

                            <div className="homeojob-booking-modal__grid">
                                <label className="homeojob-booking-modal__field">
                                    <span>
                                        Full Name <em>*</em>
                                    </span>
                                    <div
                                        className={`homeojob-booking-modal__box${
                                            errors.fullName ? " is-invalid" : ""
                                        }`}
                                    >
                                        <i className="ri-user-line" aria-hidden="true" />
                                        <input
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={patient.fullName}
                                            onChange={(e) => updateField("fullName", e.target.value)}
                                        />
                                    </div>
                                    {errors.fullName && (
                                        <small className="homeojob-booking-modal__error">
                                            {errors.fullName}
                                        </small>
                                    )}
                                </label>

                                <label className="homeojob-booking-modal__field">
                                    <span>
                                        Phone Number <em>*</em>
                                    </span>
                                    <div
                                        className={`homeojob-booking-modal__phone${
                                            errors.phone ? " is-invalid" : ""
                                        }`}
                                    >
                                        <span className="homeojob-booking-modal__cc" aria-hidden="true">
                                            <span className="homeojob-booking-modal__flag">IN</span>
                                            +91
                                            <i className="ri-arrow-down-s-line" />
                                        </span>
                                        <div className="homeojob-booking-modal__box">
                                            <i className="ri-phone-line" aria-hidden="true" />
                                            <input
                                                type="tel"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="Enter mobile number"
                                                value={patient.phone}
                                                onChange={(e) =>
                                                    updateField(
                                                        "phone",
                                                        e.target.value.replace(/\D/g, "").slice(0, 10)
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    {errors.phone && (
                                        <small className="homeojob-booking-modal__error">
                                            {errors.phone}
                                        </small>
                                    )}
                                </label>

                                <label className="homeojob-booking-modal__field homeojob-booking-modal__field--full">
                                    <span>
                                        Email Address <em>*</em>
                                    </span>
                                    <div
                                        className={`homeojob-booking-modal__box${
                                            errors.email ? " is-invalid" : ""
                                        }`}
                                    >
                                        <i className="ri-mail-line" aria-hidden="true" />
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={patient.email}
                                            onChange={(e) => updateField("email", e.target.value)}
                                        />
                                    </div>
                                    {errors.email && (
                                        <small className="homeojob-booking-modal__error">
                                            {errors.email}
                                        </small>
                                    )}
                                </label>

                                <label className="homeojob-booking-modal__field">
                                    <span>
                                        Age <em>*</em>
                                    </span>
                                    <div
                                        className={`homeojob-booking-modal__box${
                                            errors.age ? " is-invalid" : ""
                                        }`}
                                    >
                                        <i className="ri-calendar-line" aria-hidden="true" />
                                        <input
                                            type="number"
                                            min={1}
                                            max={120}
                                            placeholder="Enter age"
                                            value={patient.age}
                                            onChange={(e) => updateField("age", e.target.value)}
                                        />
                                    </div>
                                    {errors.age && (
                                        <small className="homeojob-booking-modal__error">{errors.age}</small>
                                    )}
                                </label>

                                <label className="homeojob-booking-modal__field">
                                    <span>
                                        Gender <em>*</em>
                                    </span>
                                    <div
                                        className={`homeojob-booking-modal__box homeojob-booking-modal__box--select${
                                            errors.gender ? " is-invalid" : ""
                                        }`}
                                    >
                                        <select
                                            value={patient.gender}
                                            onChange={(e) => updateField("gender", e.target.value)}
                                        >
                                            <option value="">Select gender</option>
                                            {GENDERS.map((g) => (
                                                <option key={g} value={g}>
                                                    {g}
                                                </option>
                                            ))}
                                        </select>
                                        <i className="ri-arrow-down-s-line" aria-hidden="true" />
                                    </div>
                                    {errors.gender && (
                                        <small className="homeojob-booking-modal__error">
                                            {errors.gender}
                                        </small>
                                    )}
                                </label>

                                <label className="homeojob-booking-modal__field homeojob-booking-modal__field--full">
                                    <span>Address (Optional)</span>
                                    <div className="homeojob-booking-modal__box">
                                        <i className="ri-map-pin-line" aria-hidden="true" />
                                        <input
                                            type="text"
                                            placeholder="Enter your address"
                                            value={patient.address}
                                            onChange={(e) => updateField("address", e.target.value)}
                                        />
                                    </div>
                                </label>

                                <label className="homeojob-booking-modal__field homeojob-booking-modal__field--full">
                                    <span>Reason for Consultation (Optional)</span>
                                    <div className="homeojob-booking-modal__textarea-wrap">
                                        <i className="ri-file-text-line" aria-hidden="true" />
                                        <textarea
                                            rows={3}
                                            maxLength={300}
                                            placeholder="Briefly describe your concern..."
                                            value={patient.reason}
                                            onChange={(e) => updateField("reason", e.target.value)}
                                        />
                                        <span className="homeojob-booking-modal__counter">
                                            {patient.reason.length}/300
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="homeojob-booking-modal__pay-step">
                            <div className="homeojob-booking-modal__pay-layout">
                                <div className="homeojob-booking-modal__pay-left">
                                    <div className="homeojob-booking-modal__pay-head">
                                        <span aria-hidden="true">
                                            <i className="ri-bank-card-2-line" />
                                        </span>
                                        <div>
                                            <h3>Select Payment Method</h3>
                                            <p>
                                                Choose a convenient payment method to complete your
                                                booking
                                            </p>
                                        </div>
                                    </div>

                                    <div className="homeojob-booking-modal__pay-list" role="radiogroup">
                                        {PAYMENT_METHODS.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={paymentMethod === method.id}
                                                className={`homeojob-booking-modal__pay-tile${
                                                    paymentMethod === method.id ? " is-active" : ""
                                                }`}
                                                onClick={() => setPaymentMethod(method.id)}
                                            >
                                                <span
                                                    className={`homeojob-booking-modal__pay-brand homeojob-booking-modal__pay-brand--${method.brand}`}
                                                    aria-hidden="true"
                                                >
                                                    {method.brand === "upi" ? (
                                                        <strong>UPI</strong>
                                                    ) : (
                                                        <i className={method.icon} />
                                                    )}
                                                </span>
                                                <span className="homeojob-booking-modal__pay-tile-text">
                                                    <strong>{method.label}</strong>
                                                    <small>{method.hint}</small>
                                                </span>
                                                <span
                                                    className={`homeojob-booking-modal__pay-radio${
                                                        paymentMethod === method.id ? " is-on" : ""
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <aside className="homeojob-booking-modal__pay-right">
                                    <div className="homeojob-booking-modal__pay-details-head">
                                        <div>
                                            <span aria-hidden="true">
                                                <i className="ri-file-list-3-line" />
                                            </span>
                                            <h3>Payment Details</h3>
                                        </div>
                                        <span className="homeojob-booking-modal__secure-badge">
                                            <i className="ri-lock-fill" aria-hidden="true" />
                                            Secure Payment
                                        </span>
                                    </div>

                                    <div className="homeojob-booking-modal__pay-active">
                                        <span
                                            className={`homeojob-booking-modal__pay-brand homeojob-booking-modal__pay-brand--${selectedPayMethod.brand}`}
                                            aria-hidden="true"
                                        >
                                            {selectedPayMethod.brand === "upi" ? (
                                                <strong>UPI</strong>
                                            ) : (
                                                <i className={selectedPayMethod.icon} />
                                            )}
                                        </span>
                                        <div>
                                            <strong>{selectedPayMethod.shortLabel}</strong>
                                            <small>{selectedPayMethod.hint}</small>
                                        </div>
                                    </div>

                                    <ul className="homeojob-booking-modal__pay-tips">
                                        {selectedPayMethod.tips.map((tip) => (
                                            <li key={tip.text}>
                                                <i className={tip.icon} aria-hidden="true" />
                                                <span>{tip.text}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="homeojob-booking-modal__appt-summary">
                                        <h4>Appointment Summary</h4>
                                        <div className="homeojob-booking-modal__appt-doc">
                                            <img src={doctor.image} alt={doctor.name} />
                                            <div>
                                                <strong>{doctor.name}</strong>
                                                <p>
                                                    <i className="ri-user-heart-line" aria-hidden="true" />
                                                    {consultLabel}
                                                </p>
                                                <p>
                                                    <i className="ri-calendar-line" aria-hidden="true" />
                                                    {appointmentWhen}
                                                </p>
                                                <p>
                                                    <i className="ri-map-pin-line" aria-hidden="true" />
                                                    {clinicShort}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="homeojob-booking-modal__price-rows">
                                            <div>
                                                <span>Consultation Fee</span>
                                                <strong>
                                                    {INR} {fee}
                                                </strong>
                                            </div>
                                            <div>
                                                <span>Platform Fee</span>
                                                <strong>
                                                    {INR} {platformFee}
                                                </strong>
                                            </div>
                                            <div className="homeojob-booking-modal__price-total">
                                                <span>Total Amount</span>
                                                <strong>
                                                    {INR} {totalAmount}
                                                </strong>
                                            </div>
                                        </div>
                                        <label className="homeojob-booking-modal__field mt-3">
                                            <span>OTP</span>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                placeholder="6-digit OTP"
                                                aria-label="Booking OTP"
                                            />
                                            {otpHint && <small className="text-muted d-block mt-1">{otpHint}</small>}
                                        </label>
                                        {bookingError && (
                                            <small className="homeojob-booking-modal__error d-block mt-2">
                                                {bookingError}
                                            </small>
                                        )}
                                    </div>
                                </aside>
                            </div>

                            <div className="homeojob-booking-modal__pay-bar">
                                <label className="homeojob-booking-modal__agree">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                    />
                                    <span>
                                        I agree to the{" "}
                                        <Link to={landingPath("terms")} target="_blank">
                                            Terms &amp; Conditions
                                        </Link>{" "}
                                        and{" "}
                                        <Link to={landingPath("privacy")} target="_blank">
                                            Privacy Policy
                                        </Link>
                                        .
                                    </span>
                                </label>

                                <div className="homeojob-booking-modal__pay-bar-actions">
                                    <button
                                        type="button"
                                        className="homeojob-booking-modal__btn homeojob-booking-modal__btn--ghost"
                                        onClick={() => setStep(1)}
                                    >
                                        <i className="ri-arrow-left-s-line" aria-hidden="true" />
                                        Back
                                    </button>
                                    <div className="homeojob-booking-modal__pay-cta">
                                        <button
                                            type="button"
                                            className="homeojob-booking-modal__btn homeojob-booking-modal__btn--primary homeojob-booking-modal__btn--pay"
                                            onClick={handlePay}
                                            disabled={paying || !agreed}
                                        >
                                            {paying ? "Holding slot..." : "Confirm hold (pay at clinic)"}
                                            {!paying && (
                                                <i className="ri-arrow-right-line" aria-hidden="true" />
                                            )}
                                        </button>
                                        <p className="homeojob-booking-modal__razorpay">
                                            <i className="ri-lock-line" aria-hidden="true" />
                                            Clinic hold now. Razorpay stays on classic api.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="homeojob-booking-modal__form-col homeojob-booking-modal__receipt">
                            <div className="homeojob-booking-modal__receipt-hero">
                                <span aria-hidden="true">
                                    <i className="ri-checkbox-circle-fill" />
                                </span>
                                <h3>Booking hold created</h3>
                                <p>Slot held as {paymentStatus || "PENDING"}. Pay at clinic or later on classic Razorpay.</p>
                            </div>

                            <div className="homeojob-booking-modal__receipt-card">
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Booking token</span>
                                    <strong>{receiptId}</strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Payment</span>
                                    <strong>{paymentStatus || "PENDING"}</strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Patient</span>
                                    <strong>{patient.fullName}</strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Doctor</span>
                                    <strong>{doctor.name}</strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Date & Time</span>
                                    <strong>
                                        {summaryDate} · {timeRange}
                                    </strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row">
                                    <span>Consultation</span>
                                    <strong>{consultLabel}</strong>
                                </div>
                                <div className="homeojob-booking-modal__receipt-row homeojob-booking-modal__receipt-row--total">
                                    <span>Amount Paid</span>
                                    <strong>
                                        {INR} {fee}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {step !== 2 && (
                    <aside className="homeojob-booking-modal__summary">
                        <div className="homeojob-booking-modal__section-head">
                            <span aria-hidden="true">
                                <i className="ri-calendar-event-fill" />
                            </span>
                            <h3>Appointment Details</h3>
                        </div>

                        <div className="homeojob-booking-modal__doctor">
                            <img src={doctor.image} alt={doctor.name} />
                            <div>
                                <h4>{doctor.name}</h4>
                                <p>{doctor.degree}</p>
                                <p>{doctor.specialties}</p>
                                <p>{doctor.experience}</p>
                                <p className="homeojob-booking-modal__rating">
                                    <i className="ri-star-fill" aria-hidden="true" />
                                    {Number(doctor.rating || 0).toFixed(1)} ({doctor.reviews || 0} reviews)
                                </p>
                            </div>
                        </div>

                        <ul className="homeojob-booking-modal__meta">
                            <li>
                                <i className="ri-stethoscope-line" aria-hidden="true" />
                                <div>
                                    <span>Consultation Type</span>
                                    <strong>{consultLabel}</strong>
                                </div>
                            </li>
                            <li>
                                <i className="ri-calendar-line" aria-hidden="true" />
                                <div>
                                    <span>Date</span>
                                    <strong>{summaryDate}</strong>
                                </div>
                            </li>
                            <li>
                                <i className="ri-time-line" aria-hidden="true" />
                                <div>
                                    <span>Time</span>
                                    <strong>{timeRange}</strong>
                                </div>
                            </li>
                            <li>
                                <i className="ri-map-pin-line" aria-hidden="true" />
                                <div>
                                    <span>Clinic</span>
                                    <strong>
                                        {doctor.clinicName}, {doctor.location}
                                    </strong>
                                </div>
                            </li>
                            <li>
                                <i className="ri-bank-card-line" aria-hidden="true" />
                                <div>
                                    <span>Consultation Fee</span>
                                    <strong className="homeojob-booking-modal__fee">
                                        {INR} {fee}
                                    </strong>
                                </div>
                            </li>
                        </ul>
                    </aside>
                    )}
                </div>

                {(step === 1 || step === 3) && (
                <footer className="homeojob-booking-modal__footer">
                    {step === 1 && (
                        <>
                            <label className="homeojob-booking-modal__agree">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => {
                                        setAgreed(e.target.checked);
                                        if (errors.agreed) {
                                            setErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.agreed;
                                                return next;
                                            });
                                        }
                                    }}
                                />
                                <span>
                                    I agree to the{" "}
                                    <Link to={landingPath("terms")} target="_blank">
                                        Terms &amp; Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link to={landingPath("privacy")} target="_blank">
                                        Privacy Policy
                                    </Link>
                                    .
                                </span>
                            </label>
                            {errors.agreed && (
                                <small className="homeojob-booking-modal__error homeojob-booking-modal__error--footer">
                                    {errors.agreed}
                                </small>
                            )}
                            {bookingError && (
                                <small className="homeojob-booking-modal__error homeojob-booking-modal__error--footer">
                                    {bookingError}
                                </small>
                            )}
                            <div className="homeojob-booking-modal__actions">
                                <button
                                    type="button"
                                    className="homeojob-booking-modal__btn homeojob-booking-modal__btn--ghost"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="homeojob-booking-modal__btn homeojob-booking-modal__btn--primary"
                                    onClick={handleProceedPayment}
                                >
                                    Proceed to OTP
                                    <i className="ri-arrow-right-line" aria-hidden="true" />
                                </button>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <span className="homeojob-booking-modal__footer-note">
                                A confirmation email has been sent to {patient.email || "your inbox"}.
                            </span>
                            <div className="homeojob-booking-modal__actions">
                                <button
                                    type="button"
                                    className="homeojob-booking-modal__btn homeojob-booking-modal__btn--ghost"
                                    onClick={() => window.print()}
                                >
                                    <i className="ri-printer-line" aria-hidden="true" />
                                    Print Receipt
                                </button>
                                <button
                                    type="button"
                                    className="homeojob-booking-modal__btn homeojob-booking-modal__btn--primary"
                                    onClick={onClose}
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </footer>
                )}
            </div>
        </div>
    );
};

export default BookingConfirmModal;

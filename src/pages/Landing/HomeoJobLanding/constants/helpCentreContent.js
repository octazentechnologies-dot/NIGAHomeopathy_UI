export const HELP_TOPICS = [
    {
        id: "appointments",
        title: "Appointments",
        icon: "ri-calendar-2-line",
        tone: "blue",
        description: "Book, reschedule or cancel consultations with our homeopathy doctors.",
        articles: [
            {
                id: "book-appointment",
                title: "How to book an appointment",
                summary: "Step-by-step guide to book your consultation.",
                steps: [
                    "Sign in to your Homeocentrum account.",
                    "Open Find a Doctor and choose a doctor or specialization.",
                    "Pick a clinic visit or teleconsultation and select an available slot.",
                    "Confirm your details and complete the payment to receive a booking confirmation.",
                ],
            },
            {
                id: "reschedule-appointment",
                title: "How to reschedule an appointment",
                summary: "Move your booking to another available slot.",
                steps: [
                    "Go to My Appointments from your account.",
                    "Select the appointment and click Reschedule.",
                    "Choose a new date and time, then confirm.",
                ],
            },
            {
                id: "cancel-appointment",
                title: "How to cancel an appointment",
                summary: "Cancel a booking and understand refund timelines.",
                steps: [
                    "Open My Appointments and select the booking.",
                    "Click Cancel and choose a reason.",
                    "Eligible refunds are processed to the original payment method within 3–5 working days.",
                ],
            },
            {
                id: "appointment-reminders",
                title: "Appointment reminders",
                summary: "Get SMS, email and WhatsApp reminders before your visit.",
                steps: [
                    "Reminders are sent automatically 24 hours and 1 hour before your appointment.",
                    "Update your mobile number and email in Account & Profile to receive them.",
                ],
            },
            {
                id: "follow-up",
                title: "Booking a follow-up consultation",
                summary: "Continue treatment with the same doctor.",
                steps: [
                    "Open your previous consultation from My Appointments.",
                    "Click Book Follow-up to see the doctor's next available slots.",
                    "Follow-ups within the validity period may be offered at a reduced fee.",
                ],
            },
            {
                id: "family-booking",
                title: "Booking for a family member",
                summary: "Add family members and book on their behalf.",
                steps: [
                    "Go to Account & Profile › Family Members and add the member's details.",
                    "While booking, select the family member as the patient.",
                ],
            },
            {
                id: "missed-appointment",
                title: "What if I miss my appointment?",
                summary: "Options available after a missed consultation.",
                steps: [
                    "Missed appointments are marked as No-show after 15 minutes.",
                    "Contact support within 24 hours to request a one-time reschedule.",
                ],
            },
            {
                id: "slot-unavailable",
                title: "Slot shows unavailable",
                summary: "Why a slot may disappear while booking.",
                steps: [
                    "Slots are held for a few minutes while another patient completes booking.",
                    "Refresh the page or pick another slot. If the issue continues, raise a support ticket.",
                ],
            },
        ],
    },
    {
        id: "payments",
        title: "Payments",
        icon: "ri-bank-card-line",
        tone: "blue",
        description: "Payment methods, invoices, refunds and failed transactions.",
        articles: [
            {
                id: "make-payment",
                title: "How to make a payment",
                summary: "Payment methods and refunds.",
                steps: [
                    "We accept UPI, debit/credit cards, net banking and popular wallets.",
                    "Payment is collected at the time of booking to confirm your slot.",
                    "You will receive a receipt by email and in My Payments.",
                ],
            },
            {
                id: "payment-not-reflecting",
                title: "Payment deducted but not reflecting",
                summary: "What to do if your booking is not confirmed.",
                steps: [
                    "Wait up to 30 minutes — most pending payments update automatically.",
                    "If not updated, raise a support ticket with the transaction ID and a screenshot.",
                ],
            },
            {
                id: "refund-status",
                title: "Checking refund status",
                summary: "Track refunds for cancelled bookings.",
                steps: [
                    "Open My Payments and select the transaction.",
                    "Refunds take 3–5 working days to reach your bank or card.",
                ],
            },
            {
                id: "download-invoice",
                title: "Downloading invoices",
                summary: "Get GST invoices for your consultations.",
                steps: [
                    "Go to My Payments and open the transaction.",
                    "Click Download Invoice to save the PDF.",
                ],
            },
            {
                id: "double-charge",
                title: "Charged twice for one booking",
                summary: "How duplicate payments are handled.",
                steps: [
                    "Duplicate charges are auto-reversed within 5–7 working days.",
                    "Share both transaction IDs with support if the reversal does not appear.",
                ],
            },
            {
                id: "consultation-fees",
                title: "Understanding consultation fees",
                summary: "Clinic visit, teleconsultation and follow-up pricing.",
                steps: [
                    "Each doctor sets separate fees for clinic visits and teleconsultations.",
                    "Fees are shown on the doctor's profile before you book.",
                ],
            },
        ],
    },
    {
        id: "telemedicine",
        title: "Telemedicine",
        icon: "ri-vidicon-line",
        tone: "blue",
        description: "Video consultations, device setup and call quality.",
        articles: [
            {
                id: "join-video-consultation",
                title: "How to join a video consultation",
                summary: "Check system requirements and join online.",
                steps: [
                    "Open My Appointments 5 minutes before the scheduled time.",
                    "Click Join Call and allow camera and microphone access.",
                    "Complete the device check, accept consent and wait for the doctor to admit you.",
                ],
            },
            {
                id: "system-requirements",
                title: "System requirements",
                summary: "Supported browsers, devices and internet speed.",
                steps: [
                    "Use the latest Chrome, Edge, Safari or Firefox.",
                    "A stable connection of at least 2 Mbps is recommended.",
                    "Use headphones for clearer audio.",
                ],
            },
            {
                id: "camera-mic",
                title: "Camera or microphone not working",
                summary: "Fix permission and device issues.",
                steps: [
                    "Click the lock icon in the address bar and allow camera and microphone.",
                    "Close other apps that may be using the camera.",
                    "Refresh the page and run the device check again.",
                ],
            },
            {
                id: "call-disconnected",
                title: "Call disconnected during consultation",
                summary: "How to rejoin an interrupted call.",
                steps: [
                    "Use the Rejoin button shown on the screen after a connection drop.",
                    "If the call has ended, the doctor may call you back or contact support.",
                ],
            },
            {
                id: "instant-consult",
                title: "Instant consultation",
                summary: "Consult an available doctor without a prior booking.",
                steps: [
                    "Choose Instant Consult on the teleconsultation page.",
                    "Pay the consultation fee and you will be connected to the next available doctor.",
                ],
            },
            {
                id: "chat-during-call",
                title: "Chat and share files during a call",
                summary: "Send messages and reports to your doctor.",
                steps: [
                    "Open the chat panel on the right side of the call screen.",
                    "Type a message or attach a report image or PDF.",
                ],
            },
            {
                id: "no-link",
                title: "Did not receive the call link",
                summary: "Where to find your teleconsultation link.",
                steps: [
                    "The Join Call button is always available in My Appointments.",
                    "Links are also sent by SMS and email 15 minutes before the consultation.",
                ],
            },
        ],
    },
    {
        id: "prescription",
        title: "Prescription",
        icon: "ri-file-text-line",
        tone: "blue",
        description: "Access, download and refill your homeopathy prescriptions.",
        articles: [
            {
                id: "download-prescription",
                title: "How to download prescription",
                summary: "Access and download your prescription.",
                steps: [
                    "Open My Prescriptions from your account.",
                    "Select the consultation and click Download PDF.",
                    "Prescriptions are also shared on WhatsApp if you have opted in.",
                ],
            },
            {
                id: "prescription-refill",
                title: "Requesting a refill",
                summary: "Continue your medicines without a new visit.",
                steps: [
                    "Open the prescription and click Request Refill.",
                    "Your doctor will review and approve the refill request.",
                ],
            },
            {
                id: "understand-prescription",
                title: "Understanding your prescription",
                summary: "Potency, dosage and instructions explained.",
                steps: [
                    "Each medicine lists its potency, dose and frequency.",
                    "Follow the diet and lifestyle notes added by your doctor.",
                ],
            },
            {
                id: "order-medicines",
                title: "Ordering prescribed medicines",
                summary: "Buy medicines through Homeo Meds.",
                steps: [
                    "Click Order Medicines on your prescription.",
                    "Confirm the delivery address and complete the payment.",
                ],
            },
            {
                id: "prescription-error",
                title: "Prescription download not working",
                summary: "Fix blank or failed PDF downloads.",
                steps: [
                    "Allow pop-ups for homeocentrum.com in your browser.",
                    "Try another browser or raise a support ticket if the issue continues.",
                ],
            },
        ],
    },
    {
        id: "account",
        title: "Account & Profile",
        icon: "ri-user-3-line",
        tone: "blue",
        description: "Sign in, profile details, security and notifications.",
        articles: [
            {
                id: "create-account",
                title: "Creating an account",
                summary: "Register with your mobile number or email.",
                steps: [
                    "Click Sign Up and enter your mobile number or email.",
                    "Verify with the OTP and complete your profile.",
                ],
            },
            {
                id: "reset-password",
                title: "Resetting your password",
                summary: "Recover access to your account.",
                steps: [
                    "Click Forgot Password on the login page.",
                    "Enter your registered email or mobile and follow the reset link or OTP.",
                ],
            },
            {
                id: "update-profile",
                title: "Updating profile details",
                summary: "Change name, photo, address and contact details.",
                steps: [
                    "Go to Account & Profile and click Edit.",
                    "Update your details and click Save.",
                ],
            },
            {
                id: "change-mobile",
                title: "Changing your mobile number",
                summary: "Update the number used for login and OTPs.",
                steps: [
                    "Open Account & Profile › Security.",
                    "Enter the new number and verify it with an OTP.",
                ],
            },
            {
                id: "notifications",
                title: "Managing notifications",
                summary: "Control SMS, email and WhatsApp updates.",
                steps: [
                    "Open Account & Profile › Notifications.",
                    "Toggle the channels you want to receive updates on.",
                ],
            },
            {
                id: "delete-account",
                title: "Deleting your account",
                summary: "Permanently remove your data.",
                steps: [
                    "Raise a support ticket with the subject Delete Account.",
                    "Our team will verify your identity and confirm deletion within 7 days.",
                ],
            },
        ],
    },
    {
        id: "reports",
        title: "Reports",
        icon: "ri-bar-chart-2-line",
        tone: "blue",
        description: "Lab reports, health records and progress tracking.",
        articles: [
            {
                id: "upload-report",
                title: "Uploading lab reports",
                summary: "Share reports with your doctor before a visit.",
                steps: [
                    "Open My Reports and click Upload.",
                    "Select an image or PDF and add a short description.",
                ],
            },
            {
                id: "view-reports",
                title: "Viewing your health records",
                summary: "See all consultations, reports and prescriptions.",
                steps: [
                    "Open My Health Records from your account.",
                    "Filter by date or doctor to find a specific record.",
                ],
            },
            {
                id: "share-report",
                title: "Sharing reports with a doctor",
                summary: "Give a doctor access to your records.",
                steps: [
                    "Open the report and click Share.",
                    "Select the doctor from your consultations list.",
                ],
            },
            {
                id: "report-download-issue",
                title: "Report download not working",
                summary: "Fix issues when downloading reports.",
                steps: [
                    "Check that pop-ups and downloads are allowed in your browser.",
                    "Raise a support ticket with the report name if it still fails.",
                ],
            },
        ],
    },
    {
        id: "clinic-visit",
        title: "Clinic Visit",
        icon: "ri-hospital-line",
        tone: "blue",
        description: "Visiting the clinic, timings, check-in and directions.",
        articles: [
            {
                id: "clinic-timings",
                title: "Clinic timings",
                summary: "Working hours and holiday schedule.",
                steps: [
                    "Clinics are open Monday to Saturday, 10:00 AM to 7:00 PM.",
                    "Sunday and holiday timings are shown on each clinic's page.",
                ],
            },
            {
                id: "check-in",
                title: "Checking in at the clinic",
                summary: "What to do when you arrive.",
                steps: [
                    "Arrive 10 minutes early and show your booking ID at reception.",
                    "Carry previous prescriptions and reports if available.",
                ],
            },
            {
                id: "directions",
                title: "Getting directions",
                summary: "Find the clinic location on the map.",
                steps: [
                    "Open your appointment and click Get Directions.",
                    "The clinic address and map link are also in your confirmation email.",
                ],
            },
            {
                id: "walk-in",
                title: "Walk-in consultations",
                summary: "Visiting without a prior booking.",
                steps: [
                    "Walk-ins are accepted based on doctor availability.",
                    "Booking online is recommended to avoid waiting.",
                ],
            },
            {
                id: "waiting-time",
                title: "Waiting time at the clinic",
                summary: "Track your queue position.",
                steps: [
                    "Your queue status is shown in My Appointments after check-in.",
                    "You will receive an SMS when the doctor is ready.",
                ],
            },
        ],
    },
    {
        id: "technical",
        title: "Technical",
        icon: "ri-settings-3-line",
        tone: "blue",
        description: "App issues, browser support and troubleshooting.",
        articles: [
            {
                id: "app-not-loading",
                title: "Website or app not loading",
                summary: "Quick fixes for loading issues.",
                steps: [
                    "Refresh the page and check your internet connection.",
                    "Clear your browser cache or try a private window.",
                ],
            },
            {
                id: "supported-browsers",
                title: "Supported browsers",
                summary: "Browsers we test and recommend.",
                steps: [
                    "Use the latest version of Chrome, Edge, Safari or Firefox.",
                    "Internet Explorer is not supported.",
                ],
            },
            {
                id: "otp-not-received",
                title: "OTP not received",
                summary: "Troubleshoot missing verification codes.",
                steps: [
                    "Wait 60 seconds and click Resend OTP.",
                    "Check that your number is correct and DND is not blocking messages.",
                ],
            },
            {
                id: "report-bug",
                title: "Reporting a bug",
                summary: "Help us fix issues faster.",
                steps: [
                    "Raise a support ticket with steps to reproduce the issue.",
                    "Attach a screenshot and mention your browser and device.",
                ],
            },
        ],
    },
];

export const LATEST_ARTICLES = [
    { topicId: "appointments", articleId: "book-appointment", icon: "ri-calendar-2-line" },
    { topicId: "telemedicine", articleId: "join-video-consultation", icon: "ri-vidicon-line" },
    { topicId: "payments", articleId: "make-payment", icon: "ri-bank-card-line" },
    { topicId: "prescription", articleId: "download-prescription", icon: "ri-file-text-line" },
];

export const findHelpArticle = (topicId, articleId) => {
    const topic = HELP_TOPICS.find((t) => t.id === topicId);
    const article = topic?.articles.find((a) => a.id === articleId);
    return topic && article ? { topic, article } : null;
};

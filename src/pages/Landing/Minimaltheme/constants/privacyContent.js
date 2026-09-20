export const PRIVACY_HERO = {
    eyebrow: "Trust • Privacy • Better Health",
    title: "Privacy & Policy",
    subtitle:
        "Learn how Homeocentrum protects your personal and health information with care, transparency, and secure practices.",
    chips: [
        { icon: "ri-lock-2-fill", label: "Your Data is Safe", theme: "blue" },
        { icon: "ri-leaf-fill", label: "Secure & Private", theme: "green" },
        { icon: "ri-group-fill", label: "Trusted by Patients", theme: "navy" },
        { icon: "ri-heart-pulse-fill", label: "For a Healthier Tomorrow", theme: "sky" },
    ],
};

export const PRIVACY_INTRO = {
    html: `<p><b>Homeocentrum ("Homeocentrum ","we","us")</b> is concerned about personal privacy and is committed to protecting the privacy of visitors to its website and all site-related services (collectively, the "Site"). Please read the Homeocentrum Privacy Statement below. IF YOU DO NOT AGREE WITH ANY OF THE TERMS BELOW, YOU SHOULD NOT USE THIS SITE. BY USING THIS SITE, YOU ARE AGREEING TO THE TERMS OF THIS PRIVACY POLICY.</p>`,
};

export const PRIVACY_SECTIONS = [
    {
        id: "personal-information",
        nav: "Personal Information",
        title: "1. Personal Information Procured",
        icon: "ri-user-3-fill",
        theme: "blue",
        summary:
            "We collect personally identifiable information from patients and healthcare providers during registration and while providing our services — including name, clinic details, date of birth, email, address, phone, and medical history.",
        html: `<p>We collect personally identifiable information from users (patients, and physicians or healthcare providers), in the course of registration and otherwise in providing our services. Most of this information is collected on forms or during registration. We may also collect some information related to users interactions with the services, as well as patient interactions with their physicians or healthcare providers. The information we collect includes but is not limited to:</p>`,
        list: [
            "Name",
            "Name of your physician and clinic",
            "Date of birth",
            "E-mail address",
            "Address",
            "Telephone and/or fax numbers",
            "Medical and treatment history, and other health information",
        ],
        after: `<p>Homeocentrum may also from time to time request additional information that is helpful or necessary to running the Site and providing products, services and information.</p>`,
    },
    {
        id: "use-of-information",
        nav: "Use of Information",
        title: "2. Use of Personal Information",
        icon: "ri-file-text-fill",
        theme: "teal",
        summary:
            "Homeocentrum uses your personal information to operate and improve its sites and services, send notifications, personalize content, and develop better homeopathy care tools.",
        html: `<p>Homeocentrum collects and uses your personal information to operate and improve its sites and services. Homeocentrum uses your personally identifiable information for purposes that include, but may not be limited to, the following:</p>`,
        list: [
            "To send you notifications via text messages, email and other forms of messaging",
            "To perform statistical analyses regarding the various products and services offered by Homeocentrum",
            "To send you notifications of special offers, new offerings, products or other services",
            "To contact you when reasonably necessary",
            "To provide and display content according to user preferences",
            "To track usage patterns",
            "To improve the Site and related services",
            "To use aggregate or de-identified data for analysis, research, public health, and other purposes, and to develop new products and services",
        ],
    },
    {
        id: "cookies",
        nav: "Cookies",
        title: "3. Use of Cookies",
        icon: "ri-cookie-fill",
        theme: "orange",
        summary:
            "We use cookies and similar technologies to enhance your experience, personalize the Site, and understand usage patterns. You can manage cookie preferences in your browser.",
        html: `<p>Homeocentrum uses "cookies," clear GIFs (a.k.a., web beacons, pixel tags), java script, log files and other technologies to facilitate your use of the Site, and to help personalize your experience while using the Site. "Cookies" are small text files that your browser stores on your computer on behalf of a Web site that you have visited. Homeocentrum will not use cookies to retrieve personal information from your computer. We will use cookies to enhance your experience at the Site, and to give you better, more personalized service when you return to the Site. We will not use cookies to examine your behavior before or after leaving the Site; though, we may collect the referring URL that led you to our Site. You have the ability to accept or decline cookies. Most Web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. If you choose to decline cookies, you may not be able to sign in or use other interactive features of Homeocentrum sites and services that depend on cookies. Homeocentrum will use this information for internal purposes only, we will not share it with others. You can check your browser to learn how to set your browser to inform you when you receive a cookie. Through cookies and other technologies we may collect log files; domain name; browser type and operating system; page views and related activities; IP address and location information; the length of time you use our Services; access date and time; browser type; device ID and other mobile or app identifiers; and referring URL.</p>`,
    },
    {
        id: "disclosure",
        nav: "Disclosure of Information",
        title: "4. Disclosure of Information",
        icon: "ri-share-forward-fill",
        theme: "purple",
        summary:
            "We do not sell or rent your personal information. Data may be shared with your healthcare providers, trusted service partners, or when required by law to protect safety.",
        html: `<p>Except as described in this paragraph, Homeocentrum will not transfer any personally identifiable information about you to any third party. All of the information you submit through the Site will be accessible to your physician and other designated healthcare providers. Their use and disclosure of your information is not subject to this privacy policy, but is subject to the policies and practices of the physician and/or healthcare provider. You should consult with them for information about their privacy practices. Homeocentrum does reserve the right to disclose your personally identifiable information as it believes is reasonably necessary to comply with any law, regulation or court order, as evidence in litigation in which Homeocentrum is involved, or to protect the life, health or safety of you or another person. In addition, Homeocentrum may also disclose such information to third party service providers who Homeocentrum employs to provide services on its behalf (such as marketing and information gathering services). Homeocentrum may transfer to, or share your personally identifiable information with, such business partners or service providers only to the extent the disclosure of such information is reasonably necessary to enable such business partners or service providers to fulfill their obligations to Homeocentrum or otherwise improve the services offered by the Site. Homeocentrum may disclose your personally identifiable information upon a transfer or sale to another entity of all or substantially all of Homeocentrum's assets or stock in Homeocentrum's line of business to which this Privacy Policy relates or upon any other corporate reorganization. Further, we may disclose aggregate or de-identified data about users for analysis, research, public health, and other purposes.</p>`,
    },
    {
        id: "access",
        nav: "Access",
        title: "5. Access",
        icon: "ri-key-2-fill",
        theme: "sky",
        summary:
            "You may access, update, and manage much of your personal information by logging in to your account and reviewing your profile details.",
        html: `<p>You may access, update and manage much of the personal information we maintain about you by logging in to your account and viewing or updating your profile and other information. We may retain archived version of prior information for a time, and your physician may maintain archived versions or other copies of your information as well.</p>`,
    },
    {
        id: "security",
        nav: "Security Measures",
        title: "6. Security Measures",
        icon: "ri-shield-check-fill",
        theme: "green",
        summary:
            "We employ technical and organizational safeguards — including encryption and firewalls — to help protect your information from unauthorized access or misuse.",
        html: `<p>Homeocentrum employs procedural and technological measures, reasonably designed to protect your personally identifiable information from loss, misuse or unauthorized access, disclosure, alteration or destruction. Where reasonably practical, Homeocentrum uses encryption, firewalls and other security technology to help prevent unauthorized access to your personally identifiable information. It is your responsibility to keep your password confidential. Do not share this information with anyone. If you are sharing a computer with anyone you should always log out before leaving a site or service to protect access to your information from subsequent users.</p>`,
    },
    {
        id: "website-links",
        nav: "Web Site Links",
        title: "7. Web Site Links",
        icon: "ri-link",
        theme: "pink",
        summary:
            "Our Site may include links to third-party websites. Those sites are not controlled by Homeocentrum and have their own privacy practices.",
        html: `<p>The Site may contain links to third-party web sites that may be accessed from within our Site. External sites linked in the Site are not under the control of Homeocentrum and Homeocentrum is not responsible for the contents of any linked site or any link contained in a linked site. Homeocentrum does not undertake to review, approve, correct or update the contents of any linked site. Homeocentrum provides these links only as a convenience and does not monitor, endorse, warrant, or make any other representations with respect to the linked sites. Homeocentrum is not responsible for the content or the privacy policies of any linked sites or for use of personally identifiable information collected directly or indirectly by third parties, including Homeocentrum's business partners, as a result of your use of such linked sites.</p>`,
    },
    {
        id: "changes",
        nav: "Changes to this Policy",
        title: "8. Changes to this Privacy Policy",
        icon: "ri-refresh-line",
        theme: "mint",
        summary:
            "We may update this Privacy Policy from time to time. When we do, the revised policy will be posted on this page for your review.",
        html: `<p>Due to the Internet's rapidly evolving nature, and to reflect changes in our services and customer feedback, Homeocentrum may need to update this Privacy Policy from time to time. If so, Homeocentrum will post its updated policy on this site. Homeocentrum encourages you to review this Privacy Policy regularly for any changes.</p>`,
    },
    {
        id: "questions",
        nav: "Questions",
        title: "9. Questions",
        icon: "ri-question-fill",
        theme: "violet",
        summary:
            "If you have questions about our privacy practices, please reach out through the Contact Us page on Homeocentrum.",
        html: `<p>If you have questions about our privacy policy, please contact us by visiting the "Contact Us" link on the Site's home page.</p>`,
    },
];

/** @deprecated kept for any legacy imports that expect flat intro sections */
export const PRIVACY_LEGACY_SECTIONS = [
    { intro: true, html: PRIVACY_INTRO.html },
    ...PRIVACY_SECTIONS,
];

import React from "react";

import { PRIVACY_AUDIENCES } from "../constants/privacyContent";
import LegalPolicyView from "./LegalPolicyView";

const PrivacyPage = () => (
    <LegalPolicyView
        audiences={PRIVACY_AUDIENCES}
        sectionPrefix="privacy"
        shieldIcon="ri-shield-keyhole-fill"
        navLabel="Privacy sections"
    />
);

export default PrivacyPage;

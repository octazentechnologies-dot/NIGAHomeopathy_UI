import React from "react";

import { DISCLAIMER_AUDIENCES } from "../constants/disclaimerContent";
import LegalPolicyView from "./LegalPolicyView";

const DisclaimerPage = () => (
    <LegalPolicyView
        audiences={DISCLAIMER_AUDIENCES}
        sectionPrefix="disclaimer"
        shieldIcon="ri-information-fill"
        navLabel="Disclaimer sections"
        className="homeojob-privacy--terms"
    />
);

export default DisclaimerPage;

import React from "react";

import { TERMS_AUDIENCES } from "../constants/termsContent";
import LegalPolicyView from "./LegalPolicyView";

const TermsPage = () => (
    <LegalPolicyView
        audiences={TERMS_AUDIENCES}
        sectionPrefix="terms"
        shieldIcon="ri-file-text-fill"
        navLabel="Terms sections"
        className="homeojob-privacy--terms"
    />
);

export default TermsPage;

/** Marketing site lives at domain root (e.g. homeocentrum.com/). */
export const LANDING_BASE_PATH = "";

/** Previous landing base paths — redirect to root routes. */
export const LEGACY_LANDING_PREFIX = "/minimaltheme";
export const LEGACY_LANDING_SPACE_PREFIX = "/Homeo Centrum";
export const LEGACY_LANDING_HOMEOPATH = "/HomeoCentrum";
export const LEGACY_JOB_LANDING_PREFIX = "/job-landing";
export const LEGACY_JOBS_LANDING_PREFIX = "/jobs-landing";

export const LEGACY_LANDING_PREFIXES = [
    LEGACY_LANDING_PREFIX,
    LEGACY_LANDING_SPACE_PREFIX,
    LEGACY_LANDING_HOMEOPATH,
    LEGACY_JOB_LANDING_PREFIX,
    LEGACY_JOBS_LANDING_PREFIX,
];

/** Catch-all for the marketing site (inner routes live in HomeoJobLanding/index.js). */
export const LANDING_SPLAT_PATH = "/*";

/** Public marketing routes (documentation / legacy helpers). */
export const LANDING_PUBLIC_PATHS = [
    "/",
    "/about",
    "/features",
    "/pricing",
    "/blog",
    "/blog/:blogId",
    "/news",
    "/news/:newsId",
    "/contact",
    "/privacy",
    "/terms",
    "/account",
];

export const landingPath = (...segments) => {
    const suffix = segments
        .flat()
        .filter((segment) => segment != null && String(segment).length > 0)
        .map((segment) => String(segment).replace(/^\/+/, ""))
        .join("/");

    return suffix ? `/${suffix}` : "/";
};

export const legacyLandingTarget = (pathname, search = "", hash = "") => {
    const legacyPrefix = LEGACY_LANDING_PREFIXES.find((prefix) => pathname.startsWith(prefix));
    if (!legacyPrefix) {
        return null;
    }

    const suffix = pathname.slice(legacyPrefix.length);
    const target = suffix && suffix !== "/" ? suffix : "/";

    return `${target}${search}${hash}`;
};

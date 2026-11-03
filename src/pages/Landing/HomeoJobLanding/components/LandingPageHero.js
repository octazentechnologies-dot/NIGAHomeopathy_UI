import React from "react";

const LandingPageHero = ({
    eyebrow,
    title,
    highlight,
    subtitle,
    align = "center",
    children,
}) => (
    <header className={`homeojob-page__hero homeojob-page__hero--${align}`}>
        {eyebrow ? <p className="homeojob-page__eyebrow">{eyebrow}</p> : null}
        <h1 className="homeojob-page__title">
            {title}
            {highlight ? <span className="text-primary"> {highlight}</span> : null}
        </h1>
        {subtitle ? <p className="homeojob-page__subtitle">{subtitle}</p> : null}
        {children}
    </header>
);

export default LandingPageHero;

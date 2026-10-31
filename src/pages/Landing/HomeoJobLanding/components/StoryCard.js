import React from "react";
import { Link } from "react-router-dom";

const THEMES = ["green", "purple"];
const CATEGORY_FALLBACK = [
    { label: "Practice Tips", icon: "ri-leaf-line" },
    { label: "Clinic Updates", icon: "ri-book-open-line" },
];

export const formatStoryDate = (value) => {
    if (!value) return "";
    const text = String(value).trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return text;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
};

const StoryCard = ({
    index = 0,
    image,
    imageAlt = "",
    category,
    categoryIcon,
    date,
    title,
    excerpt,
    href,
}) => {
    const theme = THEMES[index % THEMES.length];
    const fallback = CATEGORY_FALLBACK[index % CATEGORY_FALLBACK.length];
    const dateLabel = formatStoryDate(date);

    return (
        <article className={`homeojob-news-card homeojob-news-card--${theme}`}>
            <div className="homeojob-news-card__media">
                <img src={image} alt={imageAlt || title || ""} />
                <span className="homeojob-news-card__category">
                    <i className={categoryIcon || fallback.icon} aria-hidden="true" />
                    {category || fallback.label}
                </span>
            </div>
            <div className="homeojob-news-card__body">
                {dateLabel ? (
                    <p className="homeojob-news-card__date">
                        <i className="ri-calendar-line" aria-hidden="true" />
                        {dateLabel}
                    </p>
                ) : null}
                <h3 className="homeojob-news-card__title">
                    <Link to={href}>{title}</Link>
                </h3>
                {excerpt ? <p className="homeojob-news-card__excerpt">{excerpt}</p> : null}
                <div className="homeojob-news-card__footer">
                    <Link to={href} className="homeojob-news-card__more">
                        Learn More
                        <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                    <Link to={href} className="homeojob-news-card__arrow" aria-label={`Read ${title}`}>
                        <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                </div>
                <i className="ri-leaf-fill homeojob-news-card__flourish" aria-hidden="true" />
            </div>
        </article>
    );
};

export default StoryCard;

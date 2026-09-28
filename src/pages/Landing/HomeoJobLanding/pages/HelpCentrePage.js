import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { listPublicHelp } from "../../../../helpers/publicBookingApi";
import { HELP_TOPICS, LATEST_ARTICLES, findHelpArticle } from "../constants/helpCentreContent";

import "../../../../assets/scss/pages/homeojob-help-centre.scss";

const TopicCard = ({ topic, active, onSelect }) => (
    <button
        type="button"
        className={`homeojob-help__topic${active ? " is-active" : ""}`}
        onClick={() => onSelect(topic.id)}
        aria-pressed={active}
    >
        <span className="homeojob-help__topic-icon" aria-hidden="true">
            <i className={topic.icon} />
        </span>
        <span className="homeojob-help__topic-title">{topic.title}</span>
        <span className="homeojob-help__topic-count">{topic.articles.length} Articles</span>
    </button>
);

const ArticleItem = ({ article, topicTitle, open, onToggle, feedback, onFeedback }) => (
    <div className={`homeojob-help__article${open ? " is-open" : ""}`} id={`help-article-${article.id}`}>
        <button
            type="button"
            className="homeojob-help__article-head"
            onClick={onToggle}
            aria-expanded={open}
        >
            <span className="homeojob-help__article-icon" aria-hidden="true">
                <i className="ri-article-line" />
            </span>
            <span className="homeojob-help__article-text">
                <span className="homeojob-help__article-title">{article.title}</span>
                <span className="homeojob-help__article-summary">
                    {topicTitle ? <span className="homeojob-help__article-topic">{topicTitle}</span> : null}
                    {article.summary}
                </span>
            </span>
            <i className="ri-arrow-down-s-line homeojob-help__article-caret" aria-hidden="true" />
        </button>
        {open ? (
            <div className="homeojob-help__article-body">
                <ol className="homeojob-help__steps">
                    {article.steps.map((step) => (
                        <li key={step}>{step}</li>
                    ))}
                </ol>
                <div className="homeojob-help__feedback">
                    {feedback ? (
                        <span className="homeojob-help__feedback-thanks">
                            <i className="ri-checkbox-circle-fill" aria-hidden="true" />
                            Thanks for your feedback!
                        </span>
                    ) : (
                        <>
                            <span>Was this article helpful?</span>
                            <button type="button" onClick={() => onFeedback("yes")}>
                                <i className="ri-thumb-up-line" aria-hidden="true" /> Yes
                            </button>
                            <button type="button" onClick={() => onFeedback("no")}>
                                <i className="ri-thumb-down-line" aria-hidden="true" /> No
                            </button>
                        </>
                    )}
                </div>
            </div>
        ) : null}
    </div>
);

const HelpCentrePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const topicId = searchParams.get("topic") || "";
    const articleId = searchParams.get("article") || "";
    const [query, setQuery] = useState("");
    const [openArticleId, setOpenArticleId] = useState(articleId);
    const [feedback, setFeedback] = useState({});
    const [publishedArticles, setPublishedArticles] = useState([]);
    const contentRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        listPublicHelp()
            .then((list) => {
                if (!cancelled) setPublishedArticles(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!cancelled) setPublishedArticles([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const activeTopic = useMemo(() => HELP_TOPICS.find((t) => t.id === topicId) || null, [topicId]);

    useEffect(() => {
        document.title = activeTopic
            ? `${activeTopic.title} | Help Centre | ${SITE.name}`
            : `${SITE.name} | Help Centre`;
    }, [activeTopic]);

    useEffect(() => {
        setOpenArticleId(articleId);
    }, [topicId, articleId]);

    const searchResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return null;
        return HELP_TOPICS.flatMap((topic) =>
            topic.articles
                .filter((article) =>
                    [topic.title, article.title, article.summary, ...article.steps]
                        .join(" ")
                        .toLowerCase()
                        .includes(q)
                )
                .map((article) => ({ topic, article }))
        );
    }, [query]);

    const scrollToContent = () => {
        window.requestAnimationFrame(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const selectTopic = (id) => {
        setQuery("");
        setSearchParams(id ? { topic: id } : {});
        scrollToContent();
    };

    const openArticle = (tId, aId) => {
        setQuery("");
        setSearchParams({ topic: tId, article: aId });
        scrollToContent();
    };

    const renderTopicsGrid = () => (
        <div className="homeojob-help__topics">
            {HELP_TOPICS.map((topic) => (
                <TopicCard
                    key={topic.id}
                    topic={topic}
                    active={activeTopic?.id === topic.id}
                    onSelect={selectTopic}
                />
            ))}
        </div>
    );

    const renderMainContent = () => {
        if (searchResults) {
            return (
                <div className="homeojob-help__panel">
                    <div className="homeojob-help__panel-head">
                        <h2 className="homeojob-help__section-title mb-0">
                            {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for “{query.trim()}”
                        </h2>
                        <button type="button" className="homeojob-help__link-btn" onClick={() => setQuery("")}>
                            <i className="ri-close-line" aria-hidden="true" /> Clear search
                        </button>
                    </div>
                    {searchResults.length === 0 ? (
                        <p className="homeojob-help__empty">
                            No articles match your search. Try different keywords or contact support.
                        </p>
                    ) : (
                        <div className="homeojob-help__articles">
                            {searchResults.map(({ topic, article }) => (
                                <ArticleItem
                                    key={`${topic.id}-${article.id}`}
                                    article={article}
                                    topicTitle={topic.title}
                                    open={openArticleId === article.id}
                                    onToggle={() =>
                                        setOpenArticleId((prev) => (prev === article.id ? "" : article.id))
                                    }
                                    feedback={feedback[article.id]}
                                    onFeedback={(value) => setFeedback((p) => ({ ...p, [article.id]: value }))}
                                />
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (activeTopic) {
            return (
                <>
                    <div className="homeojob-help__panel">
                        <div className="homeojob-help__topic-hero">
                            <span className="homeojob-help__topic-icon homeojob-help__topic-icon--lg" aria-hidden="true">
                                <i className={activeTopic.icon} />
                            </span>
                            <div className="flex-grow-1 min-w-0">
                                <h2 className="homeojob-help__topic-hero-title">{activeTopic.title}</h2>
                                <p className="homeojob-help__topic-hero-desc">{activeTopic.description}</p>
                            </div>
                            <button type="button" className="homeojob-help__link-btn" onClick={() => selectTopic("")}>
                                <i className="ri-arrow-left-line" aria-hidden="true" /> All topics
                            </button>
                        </div>
                        <div className="homeojob-help__articles">
                            {activeTopic.articles.map((article) => (
                                <ArticleItem
                                    key={article.id}
                                    article={article}
                                    open={openArticleId === article.id}
                                    onToggle={() =>
                                        setOpenArticleId((prev) => (prev === article.id ? "" : article.id))
                                    }
                                    feedback={feedback[article.id]}
                                    onFeedback={(value) => setFeedback((p) => ({ ...p, [article.id]: value }))}
                                />
                            ))}
                        </div>
                    </div>

                    <h2 className="homeojob-help__section-title mt-4">Browse Other Topics</h2>
                    {renderTopicsGrid()}
                </>
            );
        }

        return (
            <>
                <h2 className="homeojob-help__section-title">Popular Topics</h2>
                {renderTopicsGrid()}
            </>
        );
    };

    return (
        <section className="homeojob-help">
            <Container>
                <nav className="homeojob-help__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath()}>Home</Link>
                    <span>/</span>
                    {activeTopic ? (
                        <>
                            <Link to={landingPath("help")}>Help Centre</Link>
                            <span>/</span>
                            <span>{activeTopic.title}</span>
                        </>
                    ) : (
                        <span>Help Centre</span>
                    )}
                </nav>

                <Row className="align-items-center g-4 homeojob-help__hero">
                    <Col lg={8}>
                        <h1 className="homeojob-help__title">Help Centre</h1>
                        <p className="homeojob-help__subtitle">
                            Find answers to common questions and learn how to use {SITE.name}.
                        </p>
                        <form className="homeojob-help__search" onSubmit={(e) => e.preventDefault()} role="search">
                            <i className="ri-search-line" aria-hidden="true" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search help articles, e.g. booking, payment, teleconsultation..."
                                aria-label="Search help articles"
                            />
                        </form>
                    </Col>
                    <Col lg={4} className="d-none d-lg-block">
                        <div className="homeojob-help__illustration" aria-hidden="true">
                            <span className="homeojob-help__illustration-ring" />
                            <span className="homeojob-help__illustration-core">
                                <i className="ri-customer-service-2-fill" />
                            </span>
                            <span className="homeojob-help__illustration-chip homeojob-help__illustration-chip--a">
                                <i className="ri-question-line" />
                            </span>
                            <span className="homeojob-help__illustration-chip homeojob-help__illustration-chip--b">
                                <i className="ri-chat-3-line" />
                            </span>
                        </div>
                    </Col>
                </Row>

                <div ref={contentRef} className="homeojob-help__content">
                <Row className="g-4">
                    <Col lg={8}>{renderMainContent()}</Col>

                    <Col lg={4}>
                        {publishedArticles.length > 0 ? (
                            <div className="homeojob-help__panel">
                                <h2 className="homeojob-help__section-title">Published Articles</h2>
                                <ul className="homeojob-help__latest">
                                    {publishedArticles.map((article) => {
                                        const slug = article.slug || article.Slug;
                                        const title = article.title || article.Title;
                                        if (!slug) return null;
                                        return (
                                            <li key={slug}>
                                                <Link to={landingPath(`help/${slug}`)}>
                                                    <span className="homeojob-help__latest-text">
                                                        <span className="homeojob-help__latest-title">{title}</span>
                                                    </span>
                                                    <i className="ri-arrow-right-s-line" aria-hidden="true" />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : null}

                        <div className="homeojob-help__panel">
                            <h2 className="homeojob-help__section-title">Latest Articles</h2>
                            <ul className="homeojob-help__latest">
                                {LATEST_ARTICLES.map((item) => {
                                    const found = findHelpArticle(item.topicId, item.articleId);
                                    if (!found) return null;
                                    return (
                                        <li key={item.articleId}>
                                            <button
                                                type="button"
                                                onClick={() => openArticle(item.topicId, item.articleId)}
                                            >
                                                <span className="homeojob-help__latest-icon" aria-hidden="true">
                                                    <i className={item.icon} />
                                                </span>
                                                <span className="homeojob-help__latest-text">
                                                    <span className="homeojob-help__latest-title">
                                                        {found.article.title}
                                                    </span>
                                                    <span className="homeojob-help__latest-summary">
                                                        {found.article.summary}
                                                    </span>
                                                </span>
                                                <i className="ri-arrow-right-s-line" aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="homeojob-help__contact">
                            <span className="homeojob-help__contact-icon" aria-hidden="true">
                                <i className="ri-customer-service-2-fill" />
                            </span>
                            <h3 className="homeojob-help__contact-title">Can't find what you're looking for?</h3>
                            <p className="homeojob-help__contact-text">
                                Raise a support ticket and our team will assist you.
                            </p>
                            <Link to={landingPath("contact")} className="homeojob-help__contact-btn">
                                <i className="ri-headphone-line" aria-hidden="true" />
                                Contact Support
                            </Link>
                        </div>
                    </Col>
                </Row>
                </div>
            </Container>
        </section>
    );
};

export default HelpCentrePage;

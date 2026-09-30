import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { listPublicHelp } from "../../../../helpers/publicBookingApi";

import "../../../../assets/scss/pages/homeojob-help-centre.scss";

const plainText = (html) => String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const mapArticle = (row) => {
    const body = String(row.body || row.Body || "");
    const title = row.title || row.Title || "Article";
    const slug = row.slug || row.Slug || String(row.helpArticleId || row.HelpArticleId || title);
    return {
        id: slug,
        title,
        summary: plainText(body).slice(0, 180),
        body,
    };
};

const ArticleItem = ({ article, open, onToggle, feedback, onFeedback }) => {
    const looksHtml = /<\/?[a-z][\s\S]*>/i.test(article.body || "");
    return (
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
                    {article.summary ? (
                        <span className="homeojob-help__article-summary">{article.summary}</span>
                    ) : null}
                </span>
                <i className="ri-arrow-down-s-line homeojob-help__article-caret" aria-hidden="true" />
            </button>
            {open ? (
                <div className="homeojob-help__article-body">
                    {looksHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: article.body }} />
                    ) : (
                        <p style={{ whiteSpace: "pre-wrap" }}>{article.body || "This article has no body yet."}</p>
                    )}
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
};

const HelpCentrePage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const articleId = searchParams.get("article") || "";
    const [query, setQuery] = useState("");
    const [openArticleId, setOpenArticleId] = useState(articleId);
    const [feedback, setFeedback] = useState({});
    const [published, setPublished] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const contentRef = useRef(null);

    useEffect(() => {
        document.title = `${SITE.name} | Help Centre`;
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        listPublicHelp()
            .then((list) => {
                if (cancelled) return;
                setPublished(Array.isArray(list) ? list.map(mapArticle) : []);
                setLoadError("");
            })
            .catch(() => {
                if (cancelled) return;
                setPublished([]);
                setLoadError("Published help articles could not be loaded.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        setOpenArticleId(articleId);
    }, [articleId]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return published;
        return published.filter((article) =>
            `${article.title} ${article.summary} ${plainText(article.body)}`.toLowerCase().includes(q)
        );
    }, [published, query]);

    const openArticle = (id) => {
        setSearchParams(id ? { article: id } : {});
        setOpenArticleId(id);
        window.requestAnimationFrame(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    return (
        <section className="homeojob-help">
            <Container>
                <nav className="homeojob-help__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath()}>Home</Link>
                    <span>/</span>
                    <span>Help Centre</span>
                </nav>

                <Row className="align-items-center g-4 homeojob-help__hero">
                    <Col lg={8}>
                        <h1 className="homeojob-help__title">Help Centre</h1>
                        <p className="homeojob-help__subtitle">
                            Published articles from {SITE.name}. Search updates as you type.
                        </p>
                        <form className="homeojob-help__search" onSubmit={(e) => e.preventDefault()} role="search">
                            <i className="ri-search-line" aria-hidden="true" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search published articles..."
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
                        </div>
                    </Col>
                </Row>

                <div ref={contentRef} className="homeojob-help__content">
                    <Row className="g-4">
                        <Col lg={8}>
                            <div className="homeojob-help__panel">
                                <h2 className="homeojob-help__section-title">
                                    {query.trim()
                                        ? `${visible.length} result${visible.length === 1 ? "" : "s"}`
                                        : "Published articles"}
                                </h2>
                                {loading ? (
                                    <p className="text-muted">Loading published articles…</p>
                                ) : loadError ? (
                                    <p className="text-danger">{loadError}</p>
                                ) : visible.length === 0 ? (
                                    <p className="homeojob-help__empty">
                                        {published.length === 0
                                            ? "No published articles yet."
                                            : "No published articles match your search."}
                                    </p>
                                ) : (
                                    <div className="homeojob-help__articles">
                                        {visible.map((article) => (
                                            <ArticleItem
                                                key={article.id}
                                                article={article}
                                                open={openArticleId === article.id}
                                                onToggle={() =>
                                                    openArticle(openArticleId === article.id ? "" : article.id)
                                                }
                                                feedback={feedback[article.id]}
                                                onFeedback={(value) =>
                                                    setFeedback((prev) => ({ ...prev, [article.id]: value }))
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Col>
                        <Col lg={4}>
                            <div className="homeojob-help__panel mb-4">
                                <h2 className="homeojob-help__section-title">Latest articles</h2>
                                {published.length === 0 ? (
                                    <p className="text-muted small mb-0">Published articles appear here.</p>
                                ) : (
                                    <ul className="homeojob-help__latest">
                                        {published.slice(0, 8).map((article) => (
                                            <li key={article.id}>
                                                <button type="button" onClick={() => openArticle(article.id)}>
                                                    <span className="homeojob-help__latest-icon" aria-hidden="true">
                                                        <i className="ri-article-line" />
                                                    </span>
                                                    <span className="homeojob-help__latest-text">
                                                        <span className="homeojob-help__latest-title">{article.title}</span>
                                                        {article.summary ? (
                                                            <span className="homeojob-help__latest-summary">
                                                                {article.summary}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                    <i className="ri-arrow-right-s-line" aria-hidden="true" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="homeojob-help__contact">
                                <span className="homeojob-help__contact-icon" aria-hidden="true">
                                    <i className="ri-customer-service-2-fill" />
                                </span>
                                <h3 className="homeojob-help__contact-title">Can&apos;t find what you&apos;re looking for?</h3>
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

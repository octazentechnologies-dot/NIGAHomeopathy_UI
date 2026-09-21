import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";

import { SITE } from "../../Minimaltheme/constants/siteContent";
import { landingPath } from "../../../../constants/landingRoutes";
import { NEARBY_MAP_DOCTORS } from "../constants/doctorsData";
import {
    listCareCategories,
    listPublicDoctors,
    mapPublicDoctorCard,
} from "../../../../helpers/publicBookingApi";

const PAGE_SIZE = 5;

const FindDoctorPage = () => {
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [specialization, setSpecialization] = useState(searchParams.get("concern") || "");
    const [city, setCity] = useState("");
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [teleOnly, setTeleOnly] = useState(false);
    const [sortBy, setSortBy] = useState("relevance");
    const [page, setPage] = useState(1);
    const [mapMode, setMapMode] = useState("map");
    const [favorites, setFavorites] = useState({});
    const [activePin, setActivePin] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        document.title = `${SITE.name} | Find a Doctor`;
        listCareCategories()
            .then((list) => setCategories(Array.isArray(list) ? list : []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        setQuery(searchParams.get("q") || "");
        setSpecialization(searchParams.get("concern") || "");
        setPage(1);
    }, [searchParams]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError("");
        const q = [query, specialization].filter((part) => String(part).trim()).join(" ").trim();
        listPublicDoctors({
            q: q || undefined,
            city: city.trim() || undefined,
            isOnline: onlineOnly ? true : undefined,
            teleOnly: teleOnly ? true : undefined,
            pageNumber: 1,
            pageSize: 50,
        })
            .then((result) => {
                if (cancelled) return;
                const mapped = (result.data || []).map((row) => mapPublicDoctorCard(row));
                setDoctors(mapped);
                setTotalRecords(result.totalRecords || mapped.length);
            })
            .catch((err) => {
                if (cancelled) return;
                setDoctors([]);
                setTotalRecords(0);
                setLoadError(typeof err === "string" ? err : "Could not load verified doctors.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [query, specialization, city, onlineOnly, teleOnly]);

    const filtered = useMemo(() => {
        let list = [...doctors];
        if (sortBy === "rating") {
            list = [...list].sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "fee-low") {
            list = [...list].sort((a, b) => (a.tele || a.inClinic) - (b.tele || b.inClinic));
        } else if (sortBy === "fee-high") {
            list = [...list].sort((a, b) => b.inClinic - a.inClinic);
        }
        return list;
    }, [doctors, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
    };

    const resetFilters = () => {
        setQuery("");
        setSpecialization("");
        setCity("");
        setOnlineOnly(false);
        setTeleOnly(false);
        setSortBy("relevance");
        setPage(1);
    };

    const toggleFavorite = (id) => {
        setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [1, 2, 3, 4, 5];
        if (currentPage > 5 && currentPage < totalPages - 1) {
            return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
        }
        return [...pages, "...", totalPages];
    }, [currentPage, totalPages]);

    return (
        <section className="homeojob-find-doctor">
            <Container>
                <nav className="homeojob-find-doctor__breadcrumb" aria-label="Breadcrumb">
                    <Link to={landingPath()}>Home</Link>
                    <span>/</span>
                    <span>Find a Doctor</span>
                </nav>

                <div className="homeojob-find-doctor__header">
                    <h1 className="homeojob-find-doctor__title">
                        Find the Right <span className="text-primary">Doctor</span> for You
                    </h1>
                    <p className="homeojob-find-doctor__subtitle">
                        Search from our verified homeopathy practitioners
                    </p>
                </div>

                <form className="homeojob-find-doctor__search" onSubmit={handleSearch}>
                    <i className="ri-search-line" aria-hidden="true" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by doctor name, specialization, clinic..."
                        aria-label="Search doctors"
                    />
                    <button type="submit" className="homeojob-find-doctor__search-btn">
                        <i className="ri-search-line" aria-hidden="true" />
                        Search
                    </button>
                </form>

                <div className="homeojob-find-doctor__filters">
                    <input
                        type="search"
                        className="homeojob-find-doctor__filter"
                        style={{ minWidth: 140 }}
                        placeholder="City"
                        aria-label="City"
                        value={city}
                        onChange={(e) => {
                            setCity(e.target.value);
                            setPage(1);
                        }}
                    />
                    <button
                        type="button"
                        className={`homeojob-find-doctor__filter${onlineOnly ? " is-active" : ""}`}
                        onClick={() => {
                            setOnlineOnly((v) => !v);
                            setPage(1);
                        }}
                    >
                        Online now
                    </button>
                    <button
                        type="button"
                        className={`homeojob-find-doctor__filter${teleOnly ? " is-active" : ""}`}
                        onClick={() => {
                            setTeleOnly((v) => !v);
                            setPage(1);
                        }}
                    >
                        Tele only
                    </button>
                    <button
                        type="button"
                        className="homeojob-find-doctor__reset"
                        onClick={resetFilters}
                    >
                        <i className="ri-refresh-line" aria-hidden="true" />
                        Reset Filters
                    </button>
                </div>
                {categories.length > 0 && (
                    <div className="homeojob-find-doctor__filters mt-2">
                        {categories.slice(0, 12).map((cat) => (
                            <button
                                key={cat.id ?? cat.name}
                                type="button"
                                className={`homeojob-find-doctor__filter${
                                    specialization === (cat.name || "") ? " is-active" : ""
                                }`}
                                onClick={() => {
                                    setSpecialization(cat.name || "");
                                    setPage(1);
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="homeojob-find-doctor__results-head">
                    <p className="homeojob-find-doctor__count">
                        <strong>{loading ? "…" : totalRecords || filtered.length}</strong> Doctors Found
                    </p>
                    <label className="homeojob-find-doctor__sort">
                        Sort by:
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="relevance">Relevance</option>
                            <option value="rating">Rating</option>
                            <option value="fee-low">Fee: Low to High</option>
                            <option value="fee-high">Fee: High to Low</option>
                        </select>
                    </label>
                </div>

                <Row className="g-4 homeojob-find-doctor__layout align-items-stretch">
                    <Col lg={7} xl={8} className="d-flex flex-column">
                        <div className="homeojob-find-doctor__list">
                            {loading ? (
                                <p className="text-muted p-3 mb-0">Loading verified doctors…</p>
                            ) : loadError ? (
                                <p className="text-danger p-3 mb-0">{loadError}</p>
                            ) : pageItems.length === 0 ? (
                                <p className="text-muted p-3 mb-0">No verified doctors match these filters.</p>
                            ) : (
                            pageItems.map((doc) => (
                                <article key={doc.id} className="homeojob-doctor-card">
                                    <button
                                        type="button"
                                        className={`homeojob-doctor-card__fav${
                                            favorites[doc.id] ? " is-active" : ""
                                        }`}
                                        aria-label={`Save ${doc.name}`}
                                        onClick={() => toggleFavorite(doc.id)}
                                    >
                                        <i
                                            className={
                                                favorites[doc.id]
                                                    ? "ri-heart-fill"
                                                    : "ri-heart-line"
                                            }
                                        />
                                    </button>

                                    <img
                                        src={doc.image}
                                        alt={doc.name}
                                        className="homeojob-doctor-card__avatar"
                                    />

                                    <div className="homeojob-doctor-card__info">
                                        <h3 className="homeojob-doctor-card__name">
                                            {doc.name}
                                            {doc.verified ? (
                                            <span
                                                className="homeojob-doctor-card__verified"
                                                title="Verified"
                                            >
                                                <i className="ri-checkbox-circle-fill" />
                                            </span>
                                            ) : null}
                                        </h3>
                                        <p className="homeojob-doctor-card__creds">
                                            {doc.credentials}
                                        </p>
                                        <p className="homeojob-doctor-card__specs">
                                            {doc.specialties}
                                        </p>
                                        <div className="homeojob-doctor-card__meta">
                                            <span className="homeojob-doctor-card__rating">
                                                <i className="ri-star-fill" aria-hidden="true" />
                                                {doc.rating.toFixed(1)}
                                                <small>({doc.reviews})</small>
                                            </span>
                                            <span className="homeojob-doctor-card__location">
                                                <i className="ri-map-pin-line" aria-hidden="true" />
                                                {doc.location}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="homeojob-doctor-card__fees">
                                        <div>
                                            <span>In-Clinic</span>
                                            <strong>₹ {doc.inClinic}</strong>
                                        </div>
                                        <div>
                                            <span>Tele</span>
                                            <strong>₹ {doc.tele}</strong>
                                        </div>
                                    </div>

                                    <div className="homeojob-doctor-card__actions">
                                        <Link
                                            to={landingPath(`book/${doc.id}`)}
                                            className="homeojob-doctor-card__book"
                                        >
                                            <i className="ri-calendar-check-line" aria-hidden="true" />
                                            Book Appointment
                                        </Link>
                                        <span
                                            className={`homeojob-doctor-card__avail homeojob-doctor-card__avail--${doc.available}`}
                                        >
                                            <i />
                                            {doc.available === "today"
                                                ? "Available Today"
                                                : "Available Tomorrow"}
                                        </span>
                                    </div>
                                </article>
                            ))
                            )}
                        </div>
                    </Col>

                    <Col lg={5} xl={4} className="d-flex">
                        <aside className="homeojob-find-map">
                            <div className="homeojob-find-map__head">
                                <h2>
                                    <i className="ri-map-pin-2-fill" aria-hidden="true" />
                                    Doctors Near You
                                </h2>
                                <p>Showing nearby doctors within 3 km of your location.</p>
                            </div>

                            <div
                                className={`homeojob-find-map__frame homeojob-find-map__frame--zoomed-out${
                                    mapMode === "satellite" ? " is-satellite" : ""
                                }`}
                            >
                                <div className="homeojob-find-map__toggles">
                                    <button
                                        type="button"
                                        className={mapMode === "map" ? "is-active" : undefined}
                                        onClick={() => setMapMode("map")}
                                    >
                                        Map
                                    </button>
                                    <button
                                        type="button"
                                        className={mapMode === "satellite" ? "is-active" : undefined}
                                        onClick={() => setMapMode("satellite")}
                                    >
                                        Satellite
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="homeojob-find-map__locate"
                                    aria-label="Recenter map"
                                    onClick={() => setActivePin(null)}
                                >
                                    <i className="ri-focus-3-line" />
                                </button>

                                <div className="homeojob-find-map__canvas" aria-hidden={false}>
                                    <div className="homeojob-find-map__roads" aria-hidden="true" />

                                    <div
                                        className="homeojob-find-map__radius"
                                        aria-hidden="true"
                                        title="3 km radius"
                                    >
                                        <span>3 km</span>
                                    </div>

                                    <div className="homeojob-find-map__you" title="Your location">
                                        <span className="homeojob-find-map__you-pulse" />
                                        <span className="homeojob-find-map__you-dot" />
                                    </div>

                                    {NEARBY_MAP_DOCTORS.map((doc) => (
                                        <button
                                            key={doc.id}
                                            type="button"
                                            className={`homeojob-find-map__pin${
                                                activePin === doc.id ? " is-active" : ""
                                            }`}
                                            style={{
                                                top: doc.mapPos.top,
                                                left: doc.mapPos.left,
                                            }}
                                            aria-label={`${doc.name}, ${doc.distanceKm} km away`}
                                            onClick={() =>
                                                setActivePin((prev) =>
                                                    prev === doc.id ? null : doc.id
                                                )
                                            }
                                        >
                                            <i className="ri-map-pin-2-fill" aria-hidden="true" />
                                            <span className="homeojob-find-map__pin-tip">
                                                {doc.name}
                                                <small>{doc.distanceKm} km</small>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="homeojob-find-map__footer">
                                <div className="homeojob-find-map__location">
                                    <i className="ri-crosshair-2-line" aria-hidden="true" />
                                    <div>
                                        <strong>Your Location:</strong> Kolhapur, Maharashtra
                                    </div>
                                    <button type="button">Change</button>
                                </div>
                                <div className="homeojob-find-map__hint">
                                    <i className="ri-map-pin-fill" aria-hidden="true" />
                                    <span>
                                        <strong>Nearby Doctors:</strong> Click on a marker to view
                                        doctor details
                                    </span>
                                </div>
                            </div>
                        </aside>
                    </Col>
                </Row>

                <div className="homeojob-find-doctor__pagination" aria-label="Pagination">
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                    >
                        <i className="ri-arrow-left-s-line" />
                    </button>
                    {pageNumbers.map((item, idx) =>
                        item === "..." ? (
                            <span key={`ellipsis-${idx}`} className="is-ellipsis">
                                …
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                className={item === currentPage ? "is-active" : undefined}
                                onClick={() => setPage(item)}
                            >
                                {item}
                            </button>
                        )
                    )}
                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-label="Next page"
                    >
                        <i className="ri-arrow-right-s-line" />
                    </button>
                </div>
            </Container>
        </section>
    );
};

export default FindDoctorPage;

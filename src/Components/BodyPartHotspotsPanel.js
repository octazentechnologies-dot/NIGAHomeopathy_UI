import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { searchSubsectionByHotspot } from "../helpers/realbackend_helper";

const GRADES = [4, 3, 2, 1];
const RUBRIC_PAGE_SIZE = 10;

const emptyRubricState = () => ({
  items: [],
  page: 0,
  totalPages: 1,
  loading: false,
  loadingMore: false,
  error: null,
});

export default function BodyPartHotspotsPanel({
  meshKeyName,
  selectedPart,
  selectedSectionName,
  hotspots = [],
  loading,
  error,
  hotspotHoverName,
  setHotspotHoverName,
  onAddToRepertorization,
  repertorizationRubrics = [],
}) {
  const [openHotspotKey, setOpenHotspotKey] = useState(null);
  const [rubricByHotspot, setRubricByHotspot] = useState({});
  const scrollRef = useRef(null);
  const loadMoreLockRef = useRef(false);

  const bodyPartTitle = meshKeyName || selectedPart;
  const title = selectedSectionName || bodyPartTitle || "Hotspots";

  const openHotspot = useMemo(() => {
    if (!openHotspotKey || !hotspots?.length) return null;
    return hotspots.find((h) => String(h.id ?? h.name) === openHotspotKey) || null;
  }, [openHotspotKey, hotspots]);

  const openHotspotName = openHotspot?.name || "";

  const repertorizedGradeByRubricId = useMemo(() => {
    const map = new Map();
    (repertorizationRubrics || []).forEach((r) => {
      const id = r.rubricId ?? r.subsectionId ?? r.subSectionId;
      if (id != null && r.intensityNo != null) {
        map.set(String(id), Number(r.intensityNo));
      }
    });
    return map;
  }, [repertorizationRubrics]);

  useEffect(() => {
    setOpenHotspotKey(null);
    setRubricByHotspot({});
  }, [selectedPart, selectedSectionName]);

  const fetchRubrics = useCallback(async (hotspotName, hotspotKey, page, append) => {
    if (!hotspotName) return;

    setRubricByHotspot((prev) => ({
      ...prev,
      [hotspotKey]: {
        ...(prev[hotspotKey] || emptyRubricState()),
        loading: !append,
        loadingMore: append,
        error: null,
      },
    }));

    try {
      const response = await searchSubsectionByHotspot({
        HotspotName: hotspotName,
        PageNumber: page,
        PageSize: RUBRIC_PAGE_SIZE,
      });
      const nextItems = response?.resultObject || [];
      const totalPages = response?.totalPages ?? 1;

      setRubricByHotspot((prev) => {
        const current = prev[hotspotKey] || emptyRubricState();
        const merged = append ? [...current.items, ...nextItems] : nextItems;
        return {
          ...prev,
          [hotspotKey]: {
            items: merged,
            page,
            totalPages,
            loading: false,
            loadingMore: false,
            error: null,
          },
        };
      });
    } catch (err) {
      setRubricByHotspot((prev) => ({
        ...prev,
        [hotspotKey]: {
          ...(prev[hotspotKey] || emptyRubricState()),
          loading: false,
          loadingMore: false,
          error:
            typeof err === "string" ? err : err?.message || "Failed to load rubrics",
        },
      }));
    } finally {
      loadMoreLockRef.current = false;
    }
  }, []);

  const toggleHotspot = (h) => {
    const key = String(h.id ?? h.name);
    const willOpen = openHotspotKey !== key;
    setOpenHotspotKey(willOpen ? key : null);

    if (willOpen && h.name) {
      const existing = rubricByHotspot[key];
      if (!existing?.items?.length && !existing?.loading) {
        fetchRubrics(h.name, key, 1, false);
      }
    }
  };

  const handleRubricScroll = () => {
    const el = scrollRef.current;
    if (!el || !openHotspotKey || !openHotspotName) return;

    const state = rubricByHotspot[openHotspotKey];
    if (!state || state.loading || state.loadingMore) return;
    if (state.page >= state.totalPages) return;
    if (loadMoreLockRef.current) return;

    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    if (!nearBottom) return;

    loadMoreLockRef.current = true;
    fetchRubrics(openHotspotName, openHotspotKey, state.page + 1, true);
  };

  const handleGradeClick = (rubric, grade) => {
    const rubricId = rubric.subSectionId;

    if (onAddToRepertorization) {
      onAddToRepertorization(
        {
          subSectionId: rubricId,
          subSectionName: rubric.subSectionName,
          rubricId,
          rubricName: rubric.subSectionName,
        },
        grade
      );
    }
  };

  const hasBodyPart = Boolean(bodyPartTitle);
  const hasContext = Boolean(selectedSectionName);

  return (
    <motion.aside
      className="anatomy-panel anatomy-panel--hotspots"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="anatomy-panel-card anatomy-panel-card--scroll">
        <div className="anatomy-panel-head">
          <div className="anatomy-panel-part-title">{title}</div>
          <div className="anatomy-panel-mesh anatomy-panel-mesh--muted">
            {hasContext
              ? "Hotspots for the selected section"
              : hasBodyPart
                ? "Select a section to load hotspots"
                : "Select a body part on the model"}
          </div>
        </div>

        <div className="anatomy-section">
          <div className="anatomy-section-label">Hotspots</div>

          {!hasContext && (
            <div className="anatomy-panel-empty">
              Select a section to load hotspots for that area.
            </div>
          )}

          {hasContext && error && !loading && (
            <div className="anatomy-panel-empty anatomy-panel-empty--error">{error}</div>
          )}

          {hasContext && loading && (
            <div className="anatomy-section-loading">
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Loading hotspots…
            </div>
          )}

          {hasContext && !loading && !error && !hotspots.length && (
            <div className="anatomy-panel-empty">
              No hotspots for this selection.
            </div>
          )}

          {hasContext && !loading && !error && hotspots.length > 0 && (
            <div className="anatomy-hotspot-list">
              {hotspots.map((h) => {
                const key = String(h.id ?? h.name);
                const isOpen = openHotspotKey === key;
                const state = rubricByHotspot[key] || emptyRubricState();

                return (
                  <div key={key} className="anatomy-hotspot-block">
                    <button
                      type="button"
                      className={`anatomy-hotspot-row ${
                        hotspotHoverName === h.name ? "active" : ""
                      }`}
                      onClick={() => toggleHotspot(h)}
                      onMouseEnter={() => setHotspotHoverName?.(h.name)}
                      onMouseLeave={() => setHotspotHoverName?.("")}
                    >
                      <span>{h.name}</span>
                      <span className="anatomy-hotspot-chev">{isOpen ? "▾" : "▸"}</span>
                    </button>

                    {isOpen && (
                      <div
                        ref={isOpen ? scrollRef : null}
                        className="anatomy-rubric-panel anatomy-rubric-panel--scroll"
                        onScroll={isOpen ? handleRubricScroll : undefined}
                      >
                        {state.loading && (
                          <div className="anatomy-section-loading">
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            />
                            Loading rubrics…
                          </div>
                        )}

                        {state.error && !state.loading && (
                          <div className="anatomy-panel-empty anatomy-panel-empty--error">
                            {state.error}
                          </div>
                        )}

                        {!state.loading && !state.error && !state.items.length && (
                          <div className="anatomy-panel-empty subtle">
                            No rubrics found for this hotspot.
                          </div>
                        )}

                        {!state.loading &&
                          !state.error &&
                          state.items.map((r) => (
                            <div key={r.subSectionId} className="anatomy-rubric-row">
                              <div className="anatomy-rubric-meta">
                                <span className="anatomy-rubric-title">
                                  {r.subSectionName}
                                </span>
                              </div>
                              <div className="anatomy-grade-row" role="group">
                                {GRADES.map((g) => {
                                  const activeGrade = repertorizedGradeByRubricId.get(
                                    String(r.subSectionId)
                                  );
                                  const isSelected =
                                    activeGrade != null && activeGrade === g;
                                  return (
                                    <button
                                      key={g}
                                      type="button"
                                      className={`anatomy-grade-btn${
                                        isSelected ? " anatomy-grade-btn--selected" : ""
                                      }`}
                                      onClick={() => handleGradeClick(r, g)}
                                    >
                                      {g}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                        {state.loadingMore && (
                          <div className="anatomy-rubric-load-more">
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            />
                            Loading more…
                          </div>
                        )}

                        {!state.loading &&
                          !state.loadingMore &&
                          state.items.length > 0 &&
                          state.page >= state.totalPages && (
                            <div className="anatomy-rubric-end subtle">
                              End of list ({state.items.length} rubrics)
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

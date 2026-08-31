import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

const GRADES = [4, 3, 2, 1];

export default function RightPanel({
  selectedPart,
  selectedMeshName,
  hotspots,
  hotspotHoverName,
  setHotspotHoverName,
}) {
  const [openHotspotKey, setOpenHotspotKey] = useState(null);
  const [rubricGrades, setRubricGrades] = useState({});
  const [repertorizeLines, setRepertorizeLines] = useState([]);

  const title = selectedPart || "—";

  const openHotspot = useMemo(() => {
    if (!openHotspotKey || !hotspots?.length) return null;
    return hotspots.find((h) => String(h.id ?? h.name) === openHotspotKey) || null;
  }, [openHotspotKey, hotspots]);

  useEffect(() => {
    setOpenHotspotKey(null);
    setRubricGrades({});
  }, [selectedPart, selectedMeshName]);

  const toggleHotspot = (h) => {
    const key = String(h.id ?? h.name);
    setOpenHotspotKey((prev) => (prev === key ? null : key));
    setRubricGrades({});
  };

  const setGrade = (rubricId, grade) => {
    setRubricGrades((prev) => ({
      ...prev,
      [rubricId]: prev[rubricId] === grade ? null : grade,
    }));
  };

  const addToRepertorize = () => {
    if (!openHotspot || !selectedPart) return;
    const rubrics = (openHotspot.rubrics || [])
      .map((r) => {
        const g = rubricGrades[r.id];
        if (!g) return null;
        return {
          id: r.id,
          subsection: r.subsection,
          title: r.title,
          grade: g,
        };
      })
      .filter(Boolean);
    if (!rubrics.length) return;
    setRepertorizeLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${openHotspot.name}`,
        part: selectedPart,
        mesh: selectedMeshName,
        hotspot: openHotspot.name,
        rubrics,
      },
    ]);
    setOpenHotspotKey(null);
    setRubricGrades({});
  };

  const canAdd = useMemo(() => {
    if (!openHotspot?.rubrics?.length) return false;
    return openHotspot.rubrics.some((r) => rubricGrades[r.id]);
  }, [openHotspot, rubricGrades]);

  return (
    <motion.aside
      className="anatomy-panel"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="anatomy-panel-card anatomy-panel-card--scroll">
        <div className="anatomy-panel-head">
          <div className="anatomy-panel-part-title">{title}</div>
          {selectedMeshName ? (
            <div className="anatomy-panel-mesh">{selectedMeshName}</div>
          ) : (
            <div className="anatomy-panel-mesh anatomy-panel-mesh--muted">
              Select a body region on the model
            </div>
          )}
        </div>

        <div className="anatomy-section">
          <div className="anatomy-section-label">Hotspots</div>
          <div className="anatomy-hotspot-list">
            {hotspots?.length ? (
              hotspots.map((h) => {
                const key = String(h.id ?? h.name);
                const isOpen = openHotspotKey === key;
                return (
                  <div key={key} className="anatomy-hotspot-block">
                    <button
                      type="button"
                      className={`anatomy-hotspot-row ${hotspotHoverName === h.name ? "active" : ""}`}
                      onClick={() => toggleHotspot(h)}
                      onMouseEnter={() => setHotspotHoverName?.(h.name)}
                      onMouseLeave={() => setHotspotHoverName?.("")}
                    >
                      <span>{h.name}</span>
                      <span className="anatomy-hotspot-chev">{isOpen ? "▾" : "▸"}</span>
                    </button>

                    {isOpen && (h.rubrics?.length ? (
                      <div className="anatomy-rubric-panel">
                        {h.rubrics.map((r) => (
                          <div key={r.id} className="anatomy-rubric-row">
                            <div className="anatomy-rubric-meta">
                              <span className="anatomy-rubric-sub">{r.subsection}</span>
                              <span className="anatomy-rubric-title">{r.title}</span>
                            </div>
                            <div className="anatomy-grade-row" role="group" aria-label={`Grade for ${r.title}`}>
                              {GRADES.map((g) => (
                                <button
                                  key={g}
                                  type="button"
                                  className={`anatomy-grade-btn ${rubricGrades[r.id] === g ? "selected" : ""}`}
                                  onClick={() => setGrade(r.id, g)}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <motion.button
                          type="button"
                          className="anatomy-repert-btn"
                          disabled={!canAdd}
                          onClick={addToRepertorize}
                          whileTap={{ scale: 0.98 }}
                        >
                          Add to Repertorize
                        </motion.button>
                      </div>
                    ) : (
                      <div className="anatomy-panel-empty subtle">No rubrics for this hotspot</div>
                    ))}
                  </div>
                );
              })
            ) : (
              <div className="anatomy-panel-empty">
                No hotspots for this body part. Configure in <code>src/data/hotspots.js</code>
              </div>
            )}
          </div>
        </div>

        {repertorizeLines.length > 0 && (
          <div className="anatomy-section">
            <div className="anatomy-section-label">Repertorize</div>
            <ul className="anatomy-repert-list">
              {repertorizeLines.map((line) => (
                <li key={line.id} className="anatomy-repert-item">
                  <div className="anatomy-repert-head">
                    <strong>{line.hotspot}</strong>
                    <span className="anatomy-repert-part">{line.part}</span>
                  </div>
                  {line.rubrics.map((rb) => (
                    <div key={rb.id} className="anatomy-repert-rubric">
                      <span className="anatomy-repert-grade">{rb.grade}</span>
                      <span>{rb.title}</span>
                      <span className="anatomy-repert-sub">{rb.subsection}</span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

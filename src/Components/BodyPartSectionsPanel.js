import React from "react";
import { motion } from "framer-motion";

export default function BodyPartSectionsPanel({
  meshKeyName,
  selectedPart,
  sections = [],
  loading,
  error,
  selectedSectionId,
  onSelectSection,
}) {
  const title = meshKeyName || selectedPart || "Body Part";
  const hasSelection = Boolean(meshKeyName || selectedPart);

  return (
    <motion.aside
      className="anatomy-panel anatomy-panel--sections"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="anatomy-panel-card anatomy-panel-card--scroll">
        <div className="anatomy-panel-head">
          <div className="anatomy-panel-part-title">{title}</div>
          <div className="anatomy-panel-mesh anatomy-panel-mesh--muted">
            {hasSelection
              ? "Sections for this region"
              : "Click a body region on the 3D model"}
          </div>
        </div>

        <div className="anatomy-section">
          <div className="anatomy-section-label">Sections</div>

          {!hasSelection && (
            <div className="anatomy-panel-empty">
              Click on the model (e.g. head, arm, chest) to load sections for that area.
            </div>
          )}

          {selectedPart && !meshKeyName && !loading && (
            <div className="anatomy-panel-empty">
              No mesh key configured for <strong>{selectedPart}</strong>. Add it in Admin →
              Mesh Key Master.
            </div>
          )}

          {meshKeyName && loading && (
            <div className="anatomy-section-loading">
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Loading sections…
            </div>
          )}

          {meshKeyName && error && !loading && (
            <div className="anatomy-panel-empty anatomy-panel-empty--error">{error}</div>
          )}

          {meshKeyName && !loading && !error && !sections.length && (
            <div className="anatomy-panel-empty">
              No sections found for <strong>{meshKeyName}</strong>. Map sections in Admin →
              Section Master.
            </div>
          )}

          {meshKeyName && !loading && !error && sections.length > 0 && (
            <ul className="anatomy-section-list">
              {sections.map((row) => {
                const id = row.ThreeDBodyPartSectionMasterID;
                const name = row.SectionName || "—";
                const active =
                  selectedSectionId != null &&
                  String(selectedSectionId) === String(id);
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`anatomy-section-item ${active ? "active" : ""}`}
                      onClick={() => onSelectSection?.(row)}
                    >
                      <span className="anatomy-section-item-name">{name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

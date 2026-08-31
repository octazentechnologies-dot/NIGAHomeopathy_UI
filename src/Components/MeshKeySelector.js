import React from "react";
import { motion } from "framer-motion";

export default function MeshKeySelector({
  meshKeys = [],
  selectedMeshKeyId,
  onSelect,
  loading,
}) {
  if (loading) {
    return (
      <div className="anatomy-mesh-key-strip">
        <div className="anatomy-mesh-key-loading">
          <span className="spinner-border spinner-border-sm me-2" role="status" />
          Loading body regions…
        </div>
      </div>
    );
  }

  if (!meshKeys.length) {
    return (
      <div className="anatomy-mesh-key-strip">
        <div className="anatomy-panel-empty subtle">
          No mesh keys configured. Add them in Admin → 3D Body Part → Mesh Key Master.
        </div>
      </div>
    );
  }

  return (
    <div className="anatomy-mesh-key-strip">
      <div className="anatomy-mesh-key-label">Body regions</div>
      <div className="anatomy-mesh-key-pills">
        {meshKeys.map((item) => {
          const id = item.ThreeD_BodyPart_MeshKeyID;
          const name = item.ThreeD_BodyPart_MeshKey_Name || "—";
          const active = String(selectedMeshKeyId) === String(id);
          return (
            <motion.button
              key={id}
              type="button"
              className={`anatomy-mesh-key-pill ${active ? "active" : ""}`}
              onClick={() => onSelect(item)}
              whileTap={{ scale: 0.98 }}
            >
              {name}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

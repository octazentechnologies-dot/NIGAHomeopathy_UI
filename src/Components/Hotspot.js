import React, { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

export default function Hotspot({ hotspot, onClick, showLabel }) {
  const [dotHover, setDotHover] = useState(false);
  const label = hotspot?.name || "Hotspot";
  const labelVisible = Boolean(showLabel || dotHover);

  const tooltipId = useMemo(
    () => `hs_${String(hotspot?.id ?? label).replace(/\s+/g, "_")}`,
    [hotspot?.id, label]
  );

  return (
    <Html position={hotspot.position} center>
      <div className="hs-wrap">
        <motion.button
          type="button"
          className="hs-dot"
          onClick={() => onClick?.(hotspot)}
          onMouseEnter={() => setDotHover(true)}
          onMouseLeave={() => setDotHover(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          aria-describedby={tooltipId}
        >
          <span className="hs-pulse" />
        </motion.button>

        <AnimatePresence>
          {labelVisible && (
            <motion.div
              id={tooltipId}
              className="hs-tooltip"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Html>
  );
}


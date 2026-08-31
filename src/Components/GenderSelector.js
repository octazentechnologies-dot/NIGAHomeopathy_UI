import React from "react";
import { motion } from "framer-motion";

export default function GenderSelector({ value, onChange }) {
  return (
    <div className="anatomy-gender-toggle">
      <motion.button
        type="button"
        className={`anatomy-toggle-btn ${value === "male" ? "active" : ""}`}
        onClick={() => onChange("male")}
        whileTap={{ scale: 0.98 }}
      >
        Male
      </motion.button>
      <motion.button
        type="button"
        className={`anatomy-toggle-btn ${value === "female" ? "active" : ""}`}
        onClick={() => onChange("female")}
        whileTap={{ scale: 0.98 }}
      >
        Female
      </motion.button>
    </div>
  );
}


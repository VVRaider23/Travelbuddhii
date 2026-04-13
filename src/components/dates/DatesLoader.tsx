"use client";

import { motion } from "framer-motion";

export function DatesLoader() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24,
      padding: "80px 20px", minHeight: "60vh",
    }}>
      {/* Plane flying to calendar */}
      <div style={{ position: "relative", width: 200, height: 48, display: "flex", alignItems: "center" }}>
        {/* Plane */}
        <motion.span
          animate={{ x: [0, 140, 140], opacity: [1, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
          style={{ position: "absolute", left: 0, fontSize: 28 }}
        >
          ✈️
        </motion.span>

        {/* Trail dots */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              repeatDelay: 0.4,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: 28 + i * 24,
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--tb-orange)",
              opacity: 0,
            }}
          />
        ))}

        {/* Calendar destination */}
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
          style={{ position: "absolute", right: 0, fontSize: 32 }}
        >
          📅
        </motion.span>
      </div>

      {/* Text */}
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          fontSize: 15, fontWeight: 600,
          color: "var(--tb-muted)",
          fontFamily: "var(--font-sans)",
        }}
      >
        Loading your dates...
      </motion.p>
    </div>
  );
}

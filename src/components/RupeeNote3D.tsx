import { motion } from "motion/react";

/**
 * Pure-CSS 3D pieces: a ₹500 note that spins on its Y axis with real
 * front/back faces and thickness, plus an extruded rupee glyph orbiting it.
 */
export function RupeeNote3D() {
  return (
    <div className="rupee-stage" aria-hidden="true">
      <motion.div
        className="note-3d"
        animate={{ rotateY: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <div className="note-face note-front">
          <span className="note-corner tl">500</span>
          <span className="note-corner br">500</span>
          <span className="note-glyph">₹</span>
          <span className="note-strip" />
          <span className="note-label">five hundred rupees</span>
        </div>
        <div className="note-face note-back">
          <span className="note-corner tl">₹500</span>
          <span className="note-seal" />
          <span className="note-label">tally · personal ledger</span>
        </div>
        <span className="note-edge note-edge-l" />
        <span className="note-edge note-edge-r" />
      </motion.div>

      <motion.div
        className="glyph-3d"
        animate={{ rotateY: -360, y: [0, -14, 0] }}
        transition={{
          rotateY: { duration: 9, repeat: Infinity, ease: "linear" },
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="glyph-layer" style={{ transform: `translateZ(${i * 2 - 9}px)` }}>
            ₹
          </span>
        ))}
      </motion.div>
    </div>
  );
}

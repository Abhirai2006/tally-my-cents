import { motion, useReducedMotion } from "motion/react";

const DEPTH = 16;

/**
 * A single, detailed 3D rupee: a real extruded glyph (front face, back face and
 * sixteen interior slices) turning inside tilted orbit rings, over a soft plinth
 * shadow. Pure CSS 3D — no WebGL payload.
 */
export function Rupee3D() {
  const reduced = useReducedMotion();

  const spin = reduced
    ? {}
    : {
        animate: { rotateY: 360 },
        transition: { duration: 16, repeat: Infinity, ease: "linear" as const },
      };

  return (
    <div className="rupee-stage" aria-hidden="true">
      <div className="halo" />
      <div className="plinth" />

      <motion.div
        className="orbit orbit-c"
        style={{ rotateX: 72 }}
        {...(reduced
          ? {}
          : {
              animate: { rotateZ: 360 },
              transition: { duration: 26, repeat: Infinity, ease: "linear" as const },
            })}
      >
        <span className="orbit-dot" />
      </motion.div>

      <motion.div
        className="orbit orbit-a"
        style={{ rotateX: 66 }}
        {...(reduced
          ? {}
          : {
              animate: { rotateZ: -360 },
              transition: { duration: 18, repeat: Infinity, ease: "linear" as const },
            })}
      />

      <motion.div
        className="orbit orbit-b"
        style={{ rotateX: 78, rotateY: 18 }}
        {...(reduced
          ? {}
          : {
              animate: { rotateZ: 360 },
              transition: { duration: 12, repeat: Infinity, ease: "linear" as const },
            })}
      >
        <span className="orbit-dot" />
      </motion.div>

      <motion.div
        className="glyph-3d"
        {...(reduced
          ? {}
          : {
              animate: { y: [0, -10, 0] },
              transition: { duration: 6, repeat: Infinity, ease: "easeInOut" as const },
            })}
      >
        <motion.div
          className="glyph-3d"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          {...spin}
        >
          {Array.from({ length: DEPTH }, (_, i) => (
            <span
              key={i}
              className="glyph-layer"
              style={{
                transform: `translateZ(${(i - DEPTH / 2) * 1.6}px)`,
                opacity: 0.55 + (i / DEPTH) * 0.45,
              }}
            >
              ₹
            </span>
          ))}
          <span
            className="glyph-layer face-back"
            style={{ transform: `translateZ(${-DEPTH * 0.8 - 1}px) rotateY(180deg)` }}
          >
            ₹
          </span>
          <span
            className="glyph-layer face-front"
            style={{ transform: `translateZ(${DEPTH * 0.8 + 1}px)` }}
          >
            ₹
          </span>
        </motion.div>
      </motion.div>

      <span className="tick tick-l">inr · ledger</span>
      <span className="tick tick-r">every rupee, tracked</span>
    </div>
  );
}

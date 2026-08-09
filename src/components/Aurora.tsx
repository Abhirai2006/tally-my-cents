import { motion } from "motion/react";

/** Slow-drifting colour blobs behind the paper grain. */
export function Aurora() {
  const blobs = [
    { c: "var(--expense)", s: 420, x: "-8%", y: "-10%", d: 0 },
    { c: "var(--gold)", s: 360, x: "62%", y: "6%", d: 3 },
    { c: "var(--income)", s: 400, x: "18%", y: "58%", d: 6 },
  ];

  return (
    <div className="aurora" aria-hidden="true">
      {blobs.map((b, i) => (
        <motion.span
          key={i}
          className="blob"
          style={{ background: b.c, width: b.s, height: b.s, left: b.x, top: b.y }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.12, 0.94, 1],
          }}
          transition={{ duration: 26 + i * 6, repeat: Infinity, ease: "easeInOut", delay: b.d }}
        />
      ))}
    </div>
  );
}

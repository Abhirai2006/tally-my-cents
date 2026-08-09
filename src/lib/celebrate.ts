import confetti from "canvas-confetti";

const COLORS = ["#c9a227", "#b4552d", "#3f7d58", "#e8dcc0"];

export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const burst = (x: number) =>
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 42,
      origin: { x, y: 0.7 },
      colors: COLORS,
      scalar: 0.9,
      disableForReducedMotion: true,
    });

  burst(0.25);
  window.setTimeout(() => burst(0.75), 160);
  window.setTimeout(() => burst(0.5), 320);
}

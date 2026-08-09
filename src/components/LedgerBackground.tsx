import { useEffect, useRef } from "react";

/**
 * Layered ambient background:
 *  - soft mesh-gradient washes that breathe
 *  - a pointer-following spotlight
 *  - a canvas field of drifting gold specks (paper dust)
 */
export function LedgerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    const onMove = (e: PointerEvent) => {
      if (!wrap) return;
      wrap.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      wrap.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
    };
    window.addEventListener("pointermove", onMove);

    const canvas = canvasRef.current;
    if (!canvas || reduced) return () => window.removeEventListener("pointermove", onMove);
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => window.removeEventListener("pointermove", onMove);

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Spec = { x: number; y: number; r: number; s: number; a: number; p: number };
    let specs: Spec[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(90, Math.round((w * h) / 22000));
      specs = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 1.8,
        s: 0.08 + Math.random() * 0.28,
        a: 0.18 + Math.random() * 0.4,
        p: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const isDark = () => document.documentElement.classList.contains("dark");

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const tint = isDark() ? "212, 175, 95" : "168, 124, 44";
      for (const sp of specs) {
        sp.y -= sp.s;
        sp.x += Math.sin(t / 2600 + sp.p) * 0.22;
        if (sp.y < -8) {
          sp.y = h + 8;
          sp.x = Math.random() * w;
        }
        const twinkle = 0.65 + 0.35 * Math.sin(t / 900 + sp.p * 3);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tint}, ${sp.a * twinkle})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={wrapRef} className="ledger-bg" aria-hidden="true">
      <div className="mesh mesh-a" />
      <div className="mesh mesh-b" />
      <div className="mesh mesh-c" />
      <div className="bg-grid" />
      <canvas ref={canvasRef} className="bg-specks" />
      <div className="spotlight" />
      <div className="vignette" />
    </div>
  );
}

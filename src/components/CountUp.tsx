import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/tally";

export function CountUp({
  value,
  sign,
  className,
}: {
  value: number;
  sign?: "expense" | "income";
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    const delta = value - origin;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(origin + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{formatMoney(display, sign)}</span>;
}

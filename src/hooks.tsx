import { useEffect, useState } from 'react';

export function useConfetti() {
  const [pieces, setPieces] = useState<number[]>([]);

  const fire = () => {
    const ids = Array.from({ length: 60 }, (_, i) => Date.now() + i);
    setPieces(ids);
    setTimeout(() => setPieces([]), 2600);
  };

  const ConfettiLayer = () => {
    if (pieces.length === 0) return null;
    const colors = ['#3b82f6', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];
    return (
      <>
        {pieces.map((id, i) => (
          <div
            key={id}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: colors[i % colors.length],
              animationDelay: `${Math.random() * 0.5}s`,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
            }}
          />
        ))}
      </>
    );
  };

  return { fire, ConfettiLayer };
}

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

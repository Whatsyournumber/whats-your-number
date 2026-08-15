import { useEffect, useState } from "react";

// Pool amplio de avatares (pravatar). Se rotan 3 a la vez, cambiando
// uno cada cierto tiempo para un efecto sutil de "gente nueva".
const POOL = [12, 13, 15, 16, 32, 33, 45, 47, 48, 51, 52, 60, 68];

function pick(count: number, exclude: number[] = []): number[] {
  const available = POOL.filter((n) => !exclude.includes(n));
  const out: number[] = [];
  const pool = [...available];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(idx, 1)[0];
    if (picked === undefined) break;
    out.push(picked);
  }
  return out;
}

const url = (n: number) => `https://i.pravatar.cc/80?img=${n}`;

export function RotatingAvatars({
  size = 3,
  className = "h-8 w-8 rounded-full border-2 border-background object-cover",
}: {
  size?: number;
  className?: string;
}) {
  const [faces, setFaces] = useState<number[]>(() => pick(size));
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setFaces((prev) => {
        // Reemplaza un solo avatar por uno nuevo del pool.
        const replaceIdx = Math.floor(Math.random() * prev.length);
        const used = prev.filter((_, i) => i !== replaceIdx);
        const [next] = pick(1, used);
        const copy = [...prev];
        if (next !== undefined) copy[replaceIdx] = next;
        return copy;
      });
      setFadeKey((k) => k + 1);
      window.setTimeout(tick, 4000 + Math.random() * 4000);
    };
    const id = window.setTimeout(tick, 3500 + Math.random() * 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  return (
    <div className="flex -space-x-2">
      {faces.map((n, i) => (
        <img
          key={`${i}-${n}-${fadeKey}`}
          src={url(n)}
          alt="User"
          loading="lazy"
          className={className}
          style={{ animation: "fade-in 0.5s ease-out" }}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

/** Epoch ms que se actualiza cada `intervalMs` (para textos tipo "hace 12 s"). */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

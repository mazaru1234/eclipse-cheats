"use client";

import { useEffect, useState } from "react";
import type { ActivePromo } from "@/lib/promo-utils";

export function useActivePromo() {
  const [promo, setPromo] = useState<ActivePromo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile/promo")
      .then((res) => (res.ok ? res.json() : { active: null }))
      .then((data) => setPromo(data.active ?? null))
      .catch(() => setPromo(null))
      .finally(() => setLoading(false));
  }, []);

  return { promo, loading };
}

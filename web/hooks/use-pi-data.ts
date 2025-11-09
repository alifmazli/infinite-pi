import { useEffect, useState } from "react";
import type { PiResponse } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const usePiData = () => {
  const [piData, setPiData] = useState<PiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPi = async () => {
    try {
      const response = await fetch(`${API_URL}/pi`);
      if (!response.ok) {
        throw new Error("Failed to fetch Pi value");
      }
      const data: PiResponse = await response.json();
      setPiData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPi();

    // Auto-refresh every 3 seconds
    const interval = setInterval(fetchPi, 3000);

    return () => clearInterval(interval);
  }, []);

  return { piData, loading, error };
};


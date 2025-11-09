"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";

interface PiResponse {
  value: string;
  decimalPlaces: number;
  cached: boolean;
  cachedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const SUN_RADIUS_KM = 695700; // Sun radius in kilometers

// 3D Sun Icon Component
function SunIcon3D() {
  return (
    <div className="relative inline-block">
      <div className="relative w-20 h-20 md:w-24 md:h-24">
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 opacity-80 blur-xl animate-pulse" />

        {/* Sun sphere with 3D effect */}
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500" />

          {/* 3D highlight */}
          <div
            className="absolute inset-0 bg-gradient-radial from-yellow-200/60 via-transparent to-transparent"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(255, 255, 200, 0.8) 0%, rgba(255, 200, 100, 0.4) 30%, transparent 60%)",
            }}
          />

          {/* Rotating rays */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "20s" }}
          >
            <div className="absolute inset-0">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 left-1/2 w-1 h-full origin-left"
                  style={{
                    transform: `rotate(${i * 30}deg) translateX(-50%)`,
                  }}
                >
                  <div className="w-full h-3 bg-gradient-to-b from-yellow-200 to-transparent rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Surface texture */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-50" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
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

  const calculateSunCircumference = (
    piValue: string,
    decimalPlaces: number
  ): string => {
    try {
      // Safeguard: ensure decimalPlaces is a valid number
      const safeDecimalPlaces = Math.max(0, Math.min(decimalPlaces || 0, 100));

      // Use the Pi value with precision matching the calculated decimal places
      // But limit to reasonable precision for display (max 20 decimal places)
      const displayPrecision = Math.min(safeDecimalPlaces, 20);

      const pi = parseFloat(piValue);
      if (isNaN(pi)) return "N/A";

      // Calculate circumference using the Pi value
      // JavaScript numbers have limited precision (~15-17 decimal digits)
      const circumference = 2 * pi * SUN_RADIUS_KM;

      // Format with appropriate precision (cap at 20 for toLocaleString safety)
      return circumference.toLocaleString("en-US", {
        maximumFractionDigits: displayPrecision,
        minimumFractionDigits: 0,
      });
    } catch (error) {
      console.error("Error calculating sun circumference:", error);
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <SunIcon3D />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Infinite π
              </h1>
            </div>
          </div>

          {/* Main Content Grid - 2 columns on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Pi Value Card */}
            <Card className="lg:sticky lg:top-8 lg:self-start">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Current π value</CardTitle>
                    <CardDescription>
                      Calculated using the Chudnovsky algorithm
                    </CardDescription>
                  </div>
                  {piData && (
                    <Badge variant={piData.cached ? "default" : "secondary"}>
                      {piData.cached ? "Cached" : "Fresh"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">
                      Calculating...
                    </p>
                  </div>
                )}
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">
                      Error: {error}
                    </p>
                  </div>
                )}
                {piData && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Value:
                      </p>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-slate-50 break-all">
                        {piData.value}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>
                        <strong>{piData.decimalPlaces}</strong> decimal places
                      </span>
                      {piData.cachedAt && (
                        <span>
                          Cached at:{" "}
                          {new Date(piData.cachedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right Column - Sun Circumference and Info */}
            <div className="space-y-6">
              {/* Sun Circumference Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Sun circumference</CardTitle>
                  <CardDescription>
                    Calculated using the current Pi value
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {piData ? (
                    <>
                      {/* Formula */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Formula of circumference:
                        </p>
                        <div className="text-base font-bold text-slate-700 dark:text-slate-300">
                          C = 2πr
                        </div>
                      </div>

                      {/* Pi Value */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Pi(π):
                        </p>
                        <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-50">
                          {piData.value.substring(0, 10)}...
                        </div>
                      </div>

                      {/* Radius */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Radius(r):
                        </p>
                        <div className="text-base font-bold text-slate-900 dark:text-slate-50">
                          {SUN_RADIUS_KM.toLocaleString()} km
                        </div>
                      </div>

                      {/* Circumference Result */}
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Circumference:
                        </p>
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                          {calculateSunCircumference(
                            piData.value,
                            piData.decimalPlaces
                          )}{" "}
                          km
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600 dark:text-slate-400">
                        Waiting for Pi value...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PiResponse } from "@/lib/types";
import { SUN_RADIUS_KM, calculateSunCircumference } from "@/lib/calculations";

interface SunCircumferenceCardProps {
  piData: PiResponse | null;
}

export function SunCircumferenceCard({ piData }: SunCircumferenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sun circumference</CardTitle>
        <CardDescription>Calculated using the current Pi value</CardDescription>
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
                {calculateSunCircumference(piData.value, piData.decimalPlaces)}{" "}
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
  );
}


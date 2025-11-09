import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PiResponse } from "@/lib/types";

interface PiValueCardProps {
  piData: PiResponse | null;
  loading: boolean;
  error: string | null;
}

export function PiValueCard({ piData, loading, error }: PiValueCardProps) {
  return (
    <Card className="lg:sticky lg:top-8 lg:self-start">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Current π value</CardTitle>
            <CardDescription>
              Calculated using the Chudnovsky algorithm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <p className="text-slate-600 dark:text-slate-400">Calculating...</p>
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
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
                  Cached at: {new Date(piData.cachedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

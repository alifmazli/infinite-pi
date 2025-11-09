"use client";

import { PageHeader } from "@/components/page-header";
import { PiValueCard } from "@/components/pi-value-card";
import { SunCircumferenceCard } from "@/components/sun-circumference-card";
import { usePiData } from "@/hooks/use-pi-data";

export default function Home() {
  const { piData, loading, error } = usePiData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <PageHeader />

          {/* Main Content Grid - 2 columns on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <PiValueCard piData={piData} loading={loading} error={error} />

            <div className="space-y-6">
              <SunCircumferenceCard piData={piData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

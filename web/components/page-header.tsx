import { SunIcon3D } from "./sun-icon-3d";

export function PageHeader() {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-4">
        <SunIcon3D />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Infinite π
        </h1>
      </div>
    </div>
  );
}


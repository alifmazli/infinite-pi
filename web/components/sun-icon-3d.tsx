export function SunIcon3D() {
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


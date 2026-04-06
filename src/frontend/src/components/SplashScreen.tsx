import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    // fade in: 0.5s, hold: 1s, fade out: 0.5s = total ~2s
    const t1 = setTimeout(() => setPhase("hold"), 500);
    const t2 = setTimeout(() => setPhase("out"), 1500);
    const t3 = setTimeout(() => onComplete(), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712]"
      style={{
        transition: "opacity 0.5s ease",
        opacity: phase === "out" ? 0 : 1,
      }}
    >
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full border-2 border-purple-500/30"
          style={{
            width: 160,
            height: 160,
            animation: "ping-slow 1.5s ease-out infinite",
          }}
        />
        <div
          className="absolute rounded-full border border-purple-400/20"
          style={{
            width: 200,
            height: 200,
            animation: "ping-slow 1.5s ease-out 0.3s infinite",
          }}
        />
        {/* Logo */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/50"
          style={{
            width: 120,
            height: 120,
            animation:
              phase === "in"
                ? "scale-in 0.5s ease-out forwards"
                : "pulse-glow 1s ease-in-out infinite alternate",
          }}
        >
          <img
            src="/assets/generated/ankita-joshi-logo-transparent.dim_200x200.png"
            alt="ANKITA JOSHI"
            className="h-16 w-16 object-contain"
            onError={(e) => {
              // fallback if image not found
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {/* Text fallback */}
          <span className="absolute text-2xl font-bold text-white">AJ</span>
        </div>
      </div>

      {/* App name */}
      <div
        className="mt-8 text-center"
        style={{
          animation:
            phase === "in" ? "fade-up 0.6s ease-out 0.3s forwards" : undefined,
          opacity: phase === "in" ? 0 : 1,
        }}
      >
        <h1 className="text-3xl font-bold tracking-wider text-white">
          ANKITA JOSHI
        </h1>
        <p className="mt-1 text-sm tracking-widest text-purple-400">
          SOCIAL MEDIA
        </p>
      </div>

      {/* Loading dots */}
      <div className="mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-purple-500"
            style={{
              animation: `bounce-dot 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes scale-in {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse-glow {
          from { box-shadow: 0 0 20px 5px rgba(168,85,247,0.4); }
          to { box-shadow: 0 0 40px 15px rgba(168,85,247,0.7); }
        }
        @keyframes fade-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes bounce-dot {
          from { transform: translateY(0); opacity: 0.4; }
          to { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

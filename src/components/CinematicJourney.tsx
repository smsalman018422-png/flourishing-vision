import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Day = {
  num: number;
  title: string;
  subtitle: string;
  sky: string;
  accent: string;
};

const DAYS: Day[] = [
  {
    num: 1,
    title: "The Struggle",
    subtitle:
      "Your business feels stuck. Low engagement. No clear strategy. We start here.",
    sky: "linear-gradient(180deg, #1a2024 0%, #2a3134 100%)",
    accent: "#94a3b8",
  },
  {
    num: 2,
    title: "Foundation Set",
    subtitle: "Brand audit complete. Strategy locked in. Content systems built.",
    sky: "linear-gradient(180deg, #2a3134 0%, #3a4a44 100%)",
    accent: "#cbd5e1",
  },
  {
    num: 3,
    title: "Data & Targeting Live",
    subtitle: "Meta Pixel installed. Audiences researched. Ads ready to launch.",
    sky: "linear-gradient(180deg, #1a3a4a 0%, #1e4a5e 100%)",
    accent: "#22d3ee",
  },
  {
    num: 4,
    title: "Engagement Rising",
    subtitle: "Your audience is responding. Comments flowing. Saves increasing.",
    sky: "linear-gradient(180deg, #1a4a4a 0%, #2a5a4a 100%)",
    accent: "#34d399",
  },
  {
    num: 5,
    title: "Going Viral",
    subtitle:
      "Content systems firing. Algorithmic boost engaged. Reach exploding.",
    sky: "linear-gradient(180deg, #2a4a3a 0%, #4a6a2a 100%)",
    accent: "#a3e635",
  },
  {
    num: 6,
    title: "Scaling Up",
    subtitle: "Conversions multiplying. Revenue accelerating. Brand recognized.",
    sky: "linear-gradient(180deg, #5a4a1a 0%, #8a6a2a 100%)",
    accent: "#fbbf24",
  },
  {
    num: 7,
    title: "You've Arrived",
    subtitle:
      "Premium brand status. Predictable growth. Your business transformed.",
    sky: "linear-gradient(180deg, #8a6a1a 0%, #f4d76e 100%)",
    accent: "#fde047",
  },
];

// Smooth interpolation between hex colors
function lerpColor(a: string, b: string, t: number) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff;
  const br = (bh >> 16) & 0xff,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${b2})`;
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const u = () => setM(mq.matches);
    u();
    mq.addEventListener("change", u);
    return () => mq.removeEventListener("change", u);
  }, []);
  return m;
}

export default function CinematicJourney({
  onCTAClick,
}: {
  onCTAClick?: () => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
    });
    return () => st.kill();
  }, []);

  // Derive current day (0..6) and intra-day t (0..1)
  const total = DAYS.length;
  const scaled = Math.min(progress * total, total - 0.0001);
  const dayIdx = Math.floor(scaled);
  const dayT = scaled - dayIdx;
  const day = DAYS[dayIdx];
  const nextDay = DAYS[Math.min(dayIdx + 1, total - 1)];

  // Smooth sky color blending (top + bottom)
  const parseTopBottom = (g: string) => {
    const m = g.match(/#([0-9a-f]{6})/gi) || [];
    return [m[0] || "#000000", m[1] || "#000000"];
  };
  const [t1, b1] = parseTopBottom(day.sky);
  const [t2, b2] = parseTopBottom(nextDay.sky);
  const skyTop = lerpColor(t1, t2, dayT);
  const skyBot = lerpColor(b1, b2, dayT);

  // Trophy reveal in last 8% of journey
  const showTrophy = progress > 0.92;
  const showRocket = progress > 0.86 && progress <= 0.99;

  // Rocket Y based on progress (climbs from bottom to top)
  const rocketY = (() => {
    if (!showRocket) return 0;
    const rt = (progress - 0.86) / 0.13; // 0..1 over launch range
    return -rt * 110; // vh
  })();

  // Road gold percentage
  const goldPct = Math.round(progress * 100);

  const particleCount = isMobile ? 8 : 22;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: `${DAYS.length * 80}vh` }}
      aria-label="7-Day Growth Journey"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Sky */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)`,
          }}
        />

        {/* Background mountains */}
        <svg
          className="absolute bottom-[28%] left-0 w-full h-1/3 opacity-50"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          <path
            d="M0 300 L150 120 L300 200 L500 80 L700 180 L900 100 L1100 220 L1200 150 L1200 300 Z"
            fill="rgba(0,0,0,0.45)"
          />
          <path
            d="M0 300 L200 180 L400 240 L600 160 L800 220 L1000 180 L1200 240 L1200 300 Z"
            fill="rgba(0,0,0,0.55)"
          />
        </svg>

        {/* Trees mid-layer */}
        {!isMobile && (
          <div className="absolute bottom-[18%] left-0 right-0 flex justify-between px-6 opacity-70 pointer-events-none">
            {[...Array(10)].map((_, i) => (
              <svg key={i} width="32" height="64" viewBox="0 0 40 80">
                <polygon points="20,0 5,50 35,50" fill="#0b1410" />
                <polygon points="20,20 0,70 40,70" fill="#11201a" />
                <rect x="17" y="65" width="6" height="15" fill="#2a1d12" />
              </svg>
            ))}
          </div>
        )}

        {/* Road with golden progression */}
        <div className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none overflow-hidden">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={{
              width: "180%",
              height: "100%",
              transform: "translateX(-50%) perspective(600px) rotateX(58deg)",
              transformOrigin: "bottom center",
              background: `linear-gradient(180deg,
                rgba(${74 - goldPct * 0.4}, ${74 - goldPct * 0.2}, ${74 - goldPct * 0.6}, 0.95) 0%,
                rgba(${42 + goldPct * 1.5}, ${42 + goldPct * 1}, ${42 - goldPct * 0.3}, 1) 100%)`,
              boxShadow:
                progress > 0.5
                  ? `0 0 ${(progress - 0.5) * 200}px rgba(244, 215, 110, ${(progress - 0.5) * 1.2})`
                  : "none",
            }}
          >
            {/* Center lane stripe */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2"
              style={{
                background: `repeating-linear-gradient(180deg,
                  rgba(${250}, ${230}, ${130}, ${0.4 + progress * 0.6}) 0 20px,
                  transparent 20px 40px)`,
              }}
            />
          </div>
        </div>

        {/* Foreground grass */}
        <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 40"
            preserveAspectRatio="none"
          >
            {[...Array(80)].map((_, i) => (
              <path
                key={i}
                d={`M${i * 15} 40 Q${i * 15 + 4} ${15 + (i % 3) * 5} ${i * 15 + 8} 40`}
                stroke={progress > 0.6 ? "#facc15" : "#22c55e"}
                strokeWidth="1.5"
                fill="none"
                opacity="0.5"
              />
            ))}
          </svg>
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: 4,
                height: 4,
                background: `radial-gradient(circle, ${
                  progress > 0.6
                    ? "rgba(253, 224, 71, 0.9)"
                    : "rgba(74, 222, 128, 0.85)"
                }, transparent)`,
                animation: `cj-float ${4 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Section heading (fades out near end) */}
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center px-4 transition-opacity duration-500"
          style={{ opacity: showTrophy ? 0 : 1 }}
        >
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white/95 drop-shadow-lg">
            Your 7-Day Growth Journey
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-1">
            Scroll to experience the transformation
          </p>
        </div>

        {/* Progress dots */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-3">
          {DAYS.map((d, i) => (
            <div
              key={d.num}
              className="flex items-center gap-2 transition-all"
              style={{
                opacity: i === dayIdx ? 1 : 0.4,
                transform: i === dayIdx ? "scale(1.15)" : "scale(1)",
              }}
            >
              <span className="text-[10px] text-white/80 font-mono">
                D{d.num}
              </span>
              <span
                className="block h-2 w-2 rounded-full"
                style={{
                  background: i <= dayIdx ? d.accent : "rgba(255,255,255,0.3)",
                  boxShadow:
                    i === dayIdx ? `0 0 12px ${d.accent}` : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* Single Day Card — swaps as user scrolls */}
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none">
          <AnimatePresence mode="wait">
            {!showTrophy && (
              <motion.div
                key={day.num}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="pointer-events-auto max-w-md w-full rounded-2xl backdrop-blur-md bg-black/50 border border-white/15 p-6 sm:p-7 shadow-2xl"
                style={{
                  boxShadow: `0 0 50px ${day.accent}55, 0 12px 40px rgba(0,0,0,0.6)`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="grid place-items-center h-12 w-12 rounded-full font-bold text-black text-lg"
                    style={{
                      background: day.accent,
                      boxShadow: `0 0 20px ${day.accent}aa`,
                    }}
                  >
                    {day.num}
                  </span>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest text-white/60">
                      Day {day.num} of 7
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {day.title}
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                  {day.subtitle}
                </p>
                {day.num === 7 && (
                  <div className="mt-3 flex items-center gap-2 text-yellow-300 text-sm font-semibold">
                    <Trophy className="h-4 w-4" /> Premium status unlocked
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rocket */}
        {showRocket && (
          <div
            className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none z-30"
            style={{
              width: 56,
              height: 110,
              transform: `translateX(-50%) translateY(${rocketY}vh)`,
              transition: "transform 0.1s linear",
            }}
          >
            <svg
              viewBox="0 0 60 120"
              className="w-full h-full drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]"
            >
              <ellipse cx="30" cy="20" rx="14" ry="20" fill="#e2e8f0" />
              <rect x="16" y="20" width="28" height="55" fill="#f1f5f9" />
              <circle
                cx="30"
                cy="40"
                r="6"
                fill="#0ea5e9"
                stroke="#0c4a6e"
                strokeWidth="2"
              />
              <polygon points="16,75 4,95 16,90" fill="#dc2626" />
              <polygon points="44,75 56,95 44,90" fill="#dc2626" />
              <rect x="22" y="75" width="16" height="10" fill="#475569" />
              <ellipse cx="30" cy="100" rx="10" ry="18" fill="url(#cj-flame)">
                <animate
                  attributeName="ry"
                  values="18;24;18"
                  dur="0.3s"
                  repeatCount="indefinite"
                />
              </ellipse>
              <defs>
                <radialGradient id="cj-flame" cx="50%" cy="0%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="60%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>
            </svg>
          </div>
        )}

        {/* Trophy reveal */}
        <AnimatePresence>
          {showTrophy && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="absolute inset-0 z-40 flex items-center justify-center px-4"
            >
              <div className="text-center max-w-xl mx-auto px-6 py-10 rounded-3xl backdrop-blur-xl bg-black/50 border border-yellow-300/40 shadow-[0_0_80px_rgba(251,191,36,0.6)]">
                <div className="text-6xl mb-3">🏆</div>
                <h3 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-3">
                  Growth Activated
                </h3>
                <p className="text-base sm:text-lg text-white/90 mb-6">
                  Your Business Growth Journey Starts Here.
                </p>
                <button
                  onClick={onCTAClick}
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:scale-105 transition-transform"
                >
                  Start My Free Trial <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes cj-float {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(15px, -25px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}

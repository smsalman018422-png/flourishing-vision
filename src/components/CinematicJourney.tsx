import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Day = {
  num: number;
  title: string;
  subtitle: string;
  sky: string; // tailwind gradient classes
  accent: string; // hex
};

const DAYS: Day[] = [
  {
    num: 1,
    title: "The Struggle",
    subtitle:
      "Your business feels stuck. Low engagement. No clear strategy. We start here.",
    sky: "linear-gradient(180deg, #1a2024 0%, #2a3134 100%)",
    accent: "#64748b",
  },
  {
    num: 2,
    title: "Foundation Set",
    subtitle: "Brand audit complete. Strategy locked in. Content systems built.",
    sky: "linear-gradient(180deg, #2a3134 0%, #3a4a44 100%)",
    accent: "#94a3b8",
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
    subtitle: "Content systems firing. Algorithmic boost engaged. Reach exploding.",
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
  const skyRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Sky / road scroll-driven transitions
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Sky background morphs through each day
      const skyTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });
      DAYS.forEach((d) => {
        skyTl.to(skyRef.current, { background: d.sky, duration: 1, ease: "none" });
      });

      // Road golden progression
      gsap.to(roadRef.current, {
        "--gold": "100%",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Day card entrance
      DAYS.forEach((d, i) => {
        gsap.fromTo(
          `.cj-day-${d.num}`,
          { opacity: 0, x: i % 2 === 0 ? -80 : 80, scale: 0.9 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            scrollTrigger: {
              trigger: `.cj-panel-${d.num}`,
              start: "top 75%",
              end: "top 25%",
              scrub: 1,
            },
          },
        );
      });

      // Rocket launch on day 7
      ScrollTrigger.create({
        trigger: ".cj-panel-7",
        start: "top 40%",
        once: true,
        onEnter: () => {
          const tl = gsap.timeline();
          tl.to(rocketRef.current, { opacity: 1, duration: 0.3 })
            .to(rocketRef.current, {
              y: "-120vh",
              duration: 2.2,
              ease: "power2.in",
            })
            .to(
              trophyRef.current,
              { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
              "-=0.4",
            );
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Mouse-reactive grass / particles (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      gsap.to(".cj-grass", { x, duration: 0.6 });
      gsap.to(".cj-particles", { x: x * 1.5, y, duration: 0.6 });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [isMobile]);

  const particleCount = isMobile ? 10 : 24;

  return (
    <section
      ref={sectionRef}
      className="cj-journey relative w-full"
      style={{ height: `${DAYS.length * 100}vh` }}
      aria-label="7-Day Growth Journey"
    >
      {/* Sticky cinematic stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Sky */}
        <div
          ref={skyRef}
          className="absolute inset-0 transition-colors"
          style={{ background: DAYS[0].sky }}
        />

        {/* Background mountains (parallax slow) */}
        <svg
          className="cj-bg-mountains absolute bottom-1/3 left-0 w-full h-1/3 opacity-40"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          <path d="M0 300 L150 120 L300 200 L500 80 L700 180 L900 100 L1100 220 L1200 150 L1200 300 Z" fill="#0a0f0d" />
          <path d="M0 300 L200 180 L400 240 L600 160 L800 220 L1000 180 L1200 240 L1200 300 Z" fill="#1a1f1d" />
        </svg>

        {/* Mid trees */}
        {!isMobile && (
          <div className="cj-mid-trees absolute bottom-[18%] left-0 right-0 flex justify-between px-4 opacity-60 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <svg key={i} width="40" height="80" viewBox="0 0 40 80">
                <polygon points="20,0 5,50 35,50" fill="#0f1a14" />
                <polygon points="20,20 0,70 40,70" fill="#152218" />
                <rect x="17" y="65" width="6" height="15" fill="#3a2a1a" />
              </svg>
            ))}
          </div>
        )}

        {/* Road (perspective) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 perspective-[800px] pointer-events-none">
          <div
            ref={roadRef}
            className="cj-road absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
            style={
              {
                width: "120%",
                height: "100%",
                transform: "rotateX(60deg)",
                background:
                  "linear-gradient(180deg, transparent 0%, transparent 30%, color-mix(in oklab, #4a4a4a calc(100% - var(--gold,0%)), #f4d76e var(--gold,0%)) 30%, color-mix(in oklab, #2a2a2a calc(100% - var(--gold,0%)), #c9a04d var(--gold,0%)) 100%)",
                "--gold": "0%",
                boxShadow: "0 0 80px color-mix(in oklab, transparent calc(100% - var(--gold,0%)), #f4d76e var(--gold,0%))",
              } as React.CSSProperties
            }
          >
            {/* Lane stripes */}
            <div className="absolute inset-x-0 top-1/2 h-1 bg-gradient-to-r from-transparent via-yellow-200/60 to-transparent" />
          </div>
        </div>

        {/* Foreground grass */}
        <div className="cj-grass absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 60" preserveAspectRatio="none">
            {[...Array(60)].map((_, i) => (
              <path
                key={i}
                d={`M${i * 20} 60 Q${i * 20 + 5} ${30 + (i % 3) * 5} ${i * 20 + 10} 60`}
                stroke="#22c55e"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
            ))}
          </svg>
        </div>

        {/* Particles */}
        <div className="cj-particles absolute inset-0 pointer-events-none">
          {[...Array(particleCount)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: 4,
                height: 4,
                background:
                  "radial-gradient(circle, rgba(74,222,128,0.85), transparent)",
                animation: `cj-float ${4 + (i % 5)}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Rocket */}
        <div
          ref={rocketRef}
          className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-0 pointer-events-none z-30"
          style={{ width: 60, height: 120 }}
        >
          <svg viewBox="0 0 60 120" className="w-full h-full drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]">
            <ellipse cx="30" cy="20" rx="14" ry="20" fill="#e2e8f0" />
            <rect x="16" y="20" width="28" height="55" fill="#f1f5f9" />
            <circle cx="30" cy="40" r="6" fill="#0ea5e9" stroke="#0c4a6e" strokeWidth="2" />
            <polygon points="16,75 4,95 16,90" fill="#dc2626" />
            <polygon points="44,75 56,95 44,90" fill="#dc2626" />
            <rect x="22" y="75" width="16" height="10" fill="#475569" />
            <ellipse cx="30" cy="100" rx="10" ry="18" fill="url(#cj-flame)">
              <animate attributeName="ry" values="18;22;18" dur="0.3s" repeatCount="indefinite" />
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

        {/* Trophy reveal — shown after rocket */}
        <div
          ref={trophyRef}
          className="absolute inset-0 z-40 flex items-center justify-center opacity-0 scale-75 pointer-events-none"
        >
          <div className="pointer-events-auto text-center max-w-xl mx-auto px-6 py-10 rounded-3xl backdrop-blur-xl bg-black/40 border border-yellow-300/40 shadow-[0_0_80px_rgba(251,191,36,0.5)]">
            <div className="text-6xl mb-3">🏆</div>
            <h3 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text text-transparent mb-3">
              Growth Activated
            </h3>
            <p className="text-base sm:text-lg text-white/90 mb-6">
              Your Business Growth Journey Starts Here.
            </p>
            {onCTAClick ? (
              <button
                onClick={onCTAClick}
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:scale-105 transition-transform"
              >
                Start My Free Trial <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <Link
                to="/free-trial"
                className="inline-flex items-center gap-2 h-12 px-8 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-400 text-[#0a0f0d] shadow-[0_0_30px_rgba(74,222,128,0.7)] hover:scale-105 transition-transform"
              >
                Start My Free Trial <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>

        {/* Section heading overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 text-center px-4">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-4xl font-display font-bold text-white/90 drop-shadow-lg"
          >
            Your 7-Day Growth Journey
          </motion.h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Scroll to experience the transformation
          </p>
        </div>
      </div>

      {/* Scroll panels — invisible spacers + day cards */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {DAYS.map((d, i) => (
          <div
            key={d.num}
            className={`cj-panel-${d.num} relative h-screen flex items-center ${
              i % 2 === 0 ? "justify-start" : "justify-end"
            } px-4 sm:px-12`}
          >
            <div
              className={`cj-day-${d.num} pointer-events-auto max-w-md w-full sm:w-auto rounded-2xl backdrop-blur-md bg-black/40 border border-white/15 p-5 sm:p-6 shadow-2xl`}
              style={{
                boxShadow: `0 0 40px ${d.accent}33, 0 10px 30px rgba(0,0,0,0.5)`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="grid place-items-center h-10 w-10 rounded-full font-bold text-black"
                  style={{ background: d.accent }}
                >
                  {d.num}
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">
                    Day {d.num}
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">
                    {d.title}
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {d.subtitle}
              </p>
              {d.num === 7 && (
                <div className="mt-3 flex items-center gap-2 text-yellow-300 text-sm font-semibold">
                  <Trophy className="h-4 w-4" /> Premium status unlocked
                </div>
              )}
            </div>
          </div>
        ))}
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

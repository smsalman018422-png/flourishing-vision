import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Flag,
  Trophy,
  Settings,
  MessageCircle,
  Target,
  TrendingUp,
  Megaphone,
  Rocket,
  ChevronDown,
  Users,
  Activity,
  MessageSquare,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

type Day = {
  day: number;
  title: string;
  icon: keyof typeof iconMap;
  color: string;
  items: string[];
  note: string | null;
};

const days: Day[] = [
  {
    day: 1,
    title: "Full Business Page Optimization",
    icon: "Settings",
    color: "from-green-500 to-emerald-600",
    items: [
      "Receive Secure Page Access & Setup",
      "Complete On-Page SEO Optimization",
      "Professional Profile Picture Enhancement",
      "High Converting Custom Cover Photo Design",
      "Bio, CTA Button & Business Info Optimization",
      "Brand Identity & Competitor Analysis",
    ],
    note: null,
  },
  {
    day: 2,
    title: "Content & Customer Engagement Setup",
    icon: "MessageCircle",
    color: "from-green-500 to-emerald-600",
    items: [
      "First Premium Custom Designed Content Post",
      "Comment & Reply Management",
      "Inbox Message Handling & Customer Support",
      "Audience Engagement Strategy Activation",
      "Organic Reach Improvement Actions",
      "Engagement Monitoring & Interaction Boosting",
    ],
    note: null,
  },
  {
    day: 3,
    title: "Ads & Sales Tracking Setup",
    icon: "Target",
    color: "from-emerald-500 to-teal-600",
    items: [
      "Meta Pixel Installation & Website Tracking Setup",
      "First Facebook/Instagram Ads Campaign Launch",
      "Audience Targeting Research",
      "Conversion Tracking Configuration",
      "Campaign Testing & Optimization Setup",
    ],
    note: "Everything from Day 1 & Day 2 PLUS:",
  },
  {
    day: 4,
    title: "Engagement & Brand Growth Expansion",
    icon: "TrendingUp",
    color: "from-emerald-500 to-teal-600",
    items: [
      "Ad Performance Scaling Optimization",
      "Story Posting Strategy for More Reach",
      "High Engagement Text/Clickbait Style Posts",
      "Organic Audience Retargeting",
      "Daily Engagement Management",
      "Competitor Trend Monitoring",
    ],
    note: "Everything from Previous Days PLUS:",
  },
  {
    day: 5,
    title: "Winning Content & Product Marketing",
    icon: "Megaphone",
    color: "from-amber-500 to-orange-600",
    items: [
      "New High Quality Image Content Post",
      "Story Content Publishing",
      "Ad Campaign Monitoring & Optimization",
      "Product Creative Design Support",
      "Viral Style Content Testing",
      "Winning Ad Creative Research & Analysis",
    ],
    note: "Everything from Previous Days PLUS:",
  },
  {
    day: 6,
    title: "Scaling & Growth Optimization",
    icon: "Rocket",
    color: "from-amber-500 to-orange-600",
    items: [
      "Advanced Ad Scaling Strategy",
      "Audience Optimization & Retargeting",
      "Higher Engagement Campaign Push",
      "Performance Monitoring & Daily Adjustments",
      "Content Reach Improvement Strategy",
    ],
    note: "Everything from Previous Days PLUS:",
  },
  {
    day: 7,
    title: "Final Optimization & Full Performance Report",
    icon: "Trophy",
    color: "from-yellow-400 to-amber-500",
    items: [
      "Complete Growth & Performance Report",
      "Customer Dashboard Analytics Access",
      "Ad Performance Breakdown",
      "Audience Insights & Engagement Report",
      "Future Growth Recommendations",
      "Personalized Strategy Consultation",
    ],
    note: "Everything from Previous 6 Days PLUS:",
  },
];

const iconMap: Record<string, LucideIcon> = {
  Settings,
  MessageCircle,
  Target,
  TrendingUp,
  Megaphone,
  Rocket,
  Trophy,
};

const bonusIconMap: Record<string, LucideIcon> = {
  Users,
  Activity,
  MessageSquare,
  TrendingUp,
  UserCheck,
};

// ============ SVG DECORATIONS ============

function GrassBlade({ className = "", delay = 0, color = "#4ade80" }: { className?: string; delay?: number; color?: string }) {
  return (
    <svg
      viewBox="0 0 20 30"
      className={`grass-sway ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <path d="M10 30 Q 6 18, 4 2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 30 Q 10 16, 10 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M10 30 Q 14 18, 16 2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Flower({ className = "", color = "#fbbf24", style }: { className?: string; color?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" className={className} style={style}>
      <circle cx="10" cy="6" r="2.5" fill={color} />
      <circle cx="6" cy="10" r="2.5" fill={color} />
      <circle cx="14" cy="10" r="2.5" fill={color} />
      <circle cx="10" cy="14" r="2.5" fill={color} />
      <circle cx="10" cy="10" r="1.8" fill="#fef3c7" />
    </svg>
  );
}

function Leaf({ className = "", delay = 0, style }: { className?: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`leaf-float ${className}`}
      style={{ animationDelay: `${delay}s`, ...style }}
    >
      <path d="M10 2 Q 16 8, 14 16 Q 8 18, 4 12 Q 4 6, 10 2 Z" fill="#84cc16" opacity="0.7" />
      <path d="M10 2 Q 10 10, 12 16" stroke="#65a30d" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

function Rock({ className = "", size = 16, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 14" width={size} height={size * 0.7} className={className} style={style}>
      <ellipse cx="10" cy="10" rx="9" ry="4" fill="#6b7280" />
      <ellipse cx="8" cy="8" rx="6" ry="3" fill="#9ca3af" />
      <ellipse cx="7" cy="7" rx="2" ry="1" fill="#d1d5db" opacity="0.6" />
    </svg>
  );
}

// ============ COBBLESTONE ROAD ============

function CobbleRoad({ vertical = false }: { vertical?: boolean }) {
  // Generate scattered cobblestones
  const stones = [] as Array<{ cx: number; cy: number; rx: number; ry: number; rot: number; tone: number }>;
  // Stones laid out across width 100, height 800
  let id = 0;
  for (let y = 0; y < 800; y += 18) {
    const offset = (y / 18) % 2 === 0 ? 0 : 6;
    for (let x = 6 + offset; x < 100; x += 12) {
      stones.push({
        cx: x + (Math.sin(id * 1.7) * 1.5),
        cy: y + (Math.cos(id * 2.3) * 1.5),
        rx: 5 + (Math.sin(id) * 0.8),
        ry: 4 + (Math.cos(id * 1.3) * 0.6),
        rot: (id * 37) % 60 - 30,
        tone: y / 800, // 0 = top, 1 = bottom
      });
      id++;
    }
  }

  const stoneColor = (t: number) => {
    if (t < 0.4) {
      // gray top
      const g = 110 + Math.floor(t * 30);
      return `rgb(${g}, ${g + 5}, ${g + 10})`;
    } else if (t < 0.75) {
      // mossy middle
      return `rgb(${90 - Math.floor((t - 0.4) * 40)}, ${130 - Math.floor((t - 0.4) * 20)}, ${90 - Math.floor((t - 0.4) * 30)})`;
    } else {
      // golden bottom
      return `rgb(${180 + Math.floor((t - 0.75) * 200)}, ${150 + Math.floor((t - 0.75) * 150)}, ${70 + Math.floor((t - 0.75) * 80)})`;
    }
  };

  return (
    <svg
      viewBox="0 0 100 800"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="roadShadow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="mossOverlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#374151" stopOpacity="0" />
          <stop offset="45%" stopColor="#365314" stopOpacity="0.25" />
          <stop offset="75%" stopColor="#78350f" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Base road shape - winding on desktop, straight on mobile */}
      {vertical ? (
        <>
          <rect x="35" y="0" width="30" height="800" fill="#3f3f46" />
          {stones.map((s, i) => (
            <ellipse
              key={i}
              cx={35 + (s.cx * 0.3)}
              cy={s.cy}
              rx={s.rx * 0.5}
              ry={s.ry * 0.5}
              fill={stoneColor(s.tone)}
              transform={`rotate(${s.rot} ${35 + s.cx * 0.3} ${s.cy})`}
              opacity="0.95"
            />
          ))}
          <rect x="35" y="0" width="30" height="800" fill="url(#mossOverlay)" />
          <rect x="35" y="0" width="30" height="800" fill="url(#roadShadow)" opacity="0.5" />
        </>
      ) : (
        <>
          {/* S-curve road via clip path */}
          <defs>
            <clipPath id="roadCurve">
              <path d="M 30 0 Q 80 200, 30 400 T 30 800 L 70 800 Q 20 600, 70 400 T 70 0 Z" />
            </clipPath>
          </defs>
          <g clipPath="url(#roadCurve)">
            <rect x="0" y="0" width="100" height="800" fill="#3f3f46" />
            {stones.map((s, i) => (
              <ellipse
                key={i}
                cx={s.cx}
                cy={s.cy}
                rx={s.rx}
                ry={s.ry}
                fill={stoneColor(s.tone)}
                transform={`rotate(${s.rot} ${s.cx} ${s.cy})`}
                opacity="0.95"
              />
            ))}
            <rect x="0" y="0" width="100" height="800" fill="url(#mossOverlay)" />
          </g>
          {/* Road edges */}
          <path
            d="M 30 0 Q 80 200, 30 400 T 30 800"
            stroke="#1f1f23"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M 70 0 Q 20 200, 70 400 T 70 800"
            stroke="#1f1f23"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
        </>
      )}
    </svg>
  );
}

// ============ WOODEN SIGNPOST ============

function WoodenSign({ children, rotate = -3 }: { children: React.ReactNode; rotate?: number }) {
  return (
    <div className="relative inline-block" style={{ transform: `rotate(${rotate}deg)` }}>
      {/* Stake going into ground */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-6 bg-gradient-to-b from-amber-900 to-amber-950 rounded-b-sm shadow-md" />
      {/* Sign board */}
      <div
        className="relative px-4 py-2 rounded-md shadow-xl border-2 border-amber-950"
        style={{
          background:
            "repeating-linear-gradient(180deg, #92400e 0px, #78350f 2px, #92400e 4px, #a16207 6px, #78350f 8px)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* Wood grain lines */}
        <div className="absolute inset-1 opacity-20 pointer-events-none"
             style={{
               backgroundImage: "repeating-linear-gradient(180deg, transparent, transparent 3px, #451a03 3px, #451a03 4px)"
             }}
        />
        {/* Nail dots */}
        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-zinc-700 rounded-full shadow-inner ring-1 ring-zinc-500" />
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-zinc-700 rounded-full shadow-inner ring-1 ring-zinc-500" />
        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-zinc-700 rounded-full shadow-inner ring-1 ring-zinc-500" />
        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-zinc-700 rounded-full shadow-inner ring-1 ring-zinc-500" />
        <div className="relative text-white font-bold text-sm tracking-wider px-2 drop-shadow">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN ============

export function Roadmap({ onCtaClick }: { onCtaClick?: () => void }) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      {/* Local CSS animations */}
      <style>{`
        @keyframes grassSway {
          0%, 100% { transform: rotate(-4deg); }
          50% { transform: rotate(4deg); }
        }
        .grass-sway {
          transform-origin: bottom center;
          animation: grassSway 3.5s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes leafFloat {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(15px, -20px) rotate(180deg); opacity: 1; }
          100% { transform: translate(30px, 0) rotate(360deg); opacity: 0.7; }
        }
        .leaf-float {
          animation: leafFloat 8s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes trophyGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.3); }
          50% { box-shadow: 0 0 50px rgba(251, 191, 36, 0.9), 0 0 100px rgba(251, 191, 36, 0.5); }
        }
        .trophy-glow { animation: trophyGlow 2.5s ease-in-out infinite; }
      `}</style>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium mb-4">
          🌱 Your 7-Day Roadmap To Growth
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
          <span className="text-white">What You Get During Your</span>
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent">
            7 DAYS FREE TRIAL
          </span>
        </h2>
        <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto">
          Day-by-day breakdown of everything we do for your brand. Tap any day to see details.
        </p>
      </div>

      {/* START */}
      <div className="flex justify-center mb-10 relative z-10">
        <WoodenSign rotate={-2}>
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-emerald-300" />
            START YOUR JOURNEY
          </div>
        </WoodenSign>
      </div>

      {/* Roadmap container */}
      <div className="relative max-w-6xl mx-auto">
        {/* Cobblestone road - desktop curved */}
        <div className="absolute inset-0 hidden md:block" aria-hidden="true">
          <CobbleRoad vertical={false} />
        </div>
        {/* Cobblestone road - mobile straight */}
        <div className="absolute inset-0 md:hidden" aria-hidden="true">
          <CobbleRoad vertical={true} />
        </div>

        {/* Edge grass + nature decorations - desktop */}
        <div className="absolute inset-0 hidden md:block pointer-events-none" aria-hidden="true">
          {[0, 12, 25, 38, 52, 65, 78, 90].map((top, i) => (
            <div key={`gl-${i}`} className="absolute" style={{ top: `${top}%`, left: "8%" }}>
              <GrassBlade className="w-5 h-7" delay={i * 0.3} color={i > 5 ? "#a3a30b" : "#4ade80"} />
            </div>
          ))}
          {[5, 18, 32, 45, 58, 72, 85].map((top, i) => (
            <div key={`gr-${i}`} className="absolute" style={{ top: `${top}%`, right: "8%" }}>
              <GrassBlade className="w-5 h-7" delay={i * 0.4 + 0.5} color={i > 4 ? "#ca8a04" : "#22c55e"} />
            </div>
          ))}
          <Flower className="absolute w-4 h-4" color="#f472b6" style={{ top: "15%", left: "12%" } as React.CSSProperties} />
          <Flower className="absolute w-4 h-4" color="#fbbf24" style={{ top: "40%", right: "13%" } as React.CSSProperties} />
          <Flower className="absolute w-4 h-4" color="#a78bfa" style={{ top: "62%", left: "11%" } as React.CSSProperties} />
          <Flower className="absolute w-4 h-4" color="#f87171" style={{ top: "82%", right: "12%" } as React.CSSProperties} />
          <Rock className="absolute" size={20} style={{ top: "28%", right: "10%" } as React.CSSProperties} />
          <Rock className="absolute" size={14} style={{ top: "55%", left: "9%" } as React.CSSProperties} />
          <Rock className="absolute" size={18} style={{ top: "75%", right: "9%" } as React.CSSProperties} />
          <Leaf className="absolute w-5 h-5" delay={0} style={{ top: "10%", right: "20%" } as React.CSSProperties} />
          <Leaf className="absolute w-4 h-4" delay={2} style={{ top: "48%", left: "18%" } as React.CSSProperties} />
          <Leaf className="absolute w-5 h-5" delay={4} style={{ top: "70%", right: "22%" } as React.CSSProperties} />
        </div>

        {/* Edge grass - mobile (along straight road) */}
        <div className="absolute inset-0 md:hidden pointer-events-none" aria-hidden="true">
          {[5, 18, 32, 45, 58, 72, 85].map((top, i) => (
            <div key={`mgl-${i}`} className="absolute" style={{ top: `${top}%`, left: "2%" }}>
              <GrassBlade className="w-4 h-5" delay={i * 0.3} color={i > 4 ? "#ca8a04" : "#4ade80"} />
            </div>
          ))}
          {[10, 22, 38, 52, 65, 78, 92].map((top, i) => (
            <div key={`mgr-${i}`} className="absolute" style={{ top: `${top}%`, right: "2%" }}>
              <GrassBlade className="w-4 h-5" delay={i * 0.35 + 0.4} color={i > 4 ? "#a16207" : "#22c55e"} />
            </div>
          ))}
          <Flower className="absolute w-3 h-3" color="#f472b6" style={{ top: "20%", left: "5%" } as React.CSSProperties} />
          <Flower className="absolute w-3 h-3" color="#fbbf24" style={{ top: "60%", right: "5%" } as React.CSSProperties} />
        </div>

        {/* Day stations */}
        <div className="relative z-10">
          {days.map((day, index) => (
            <DayStation
              key={day.day}
              day={day}
              index={index}
              isExpanded={expandedDay === day.day}
              onToggle={() =>
                setExpandedDay(expandedDay === day.day ? null : day.day)
              }
            />
          ))}
        </div>
      </div>

      {/* FINISH */}
      <div className="flex justify-center mt-10 relative z-10">
        <div className="relative">
          <div className="absolute -inset-3 bg-amber-500/40 rounded-2xl blur-2xl trophy-glow" />
          <div className="relative bg-gradient-to-br from-amber-500 to-yellow-500 px-8 py-4 rounded-xl border-2 border-yellow-400 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Trophy size={24} />
              FINISH — GROWTH ACHIEVED 🎉
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* BONUS */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 relative z-10">
          <div className="text-center mb-5">
            <div className="inline-block px-4 py-1 bg-emerald-500/20 rounded-full text-emerald-300 text-xs font-bold tracking-widest">
              ✨ BONUS DURING FREE TRIAL
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: "Users", label: "Professional Social Media Management" },
              { icon: "Activity", label: "Daily Monitoring & Optimization" },
              { icon: "MessageSquare", label: "Real Human Engagement Handling" },
              { icon: "TrendingUp", label: "Brand Growth Strategy Support" },
              { icon: "UserCheck", label: "Dedicated Team Support" },
            ].map((bonus, i) => {
              const BIcon = bonusIconMap[bonus.icon];
              return (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    {BIcon && <BIcon size={20} className="text-emerald-300" />}
                  </div>
                  <p className="text-xs text-white/75 leading-snug">{bonus.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-white/60 mb-4">
            Experience what a real marketing team can do for your business in just 7 days
          </p>
          <button
            onClick={onCtaClick}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 rounded-full text-[#0a0f0d] font-bold text-lg shadow-2xl shadow-emerald-500/50 hover:scale-105 transition-all"
          >
            Start My Free Trial — 100% FREE →
          </button>
        </div>
      </div>
    </section>
  );
}

function DayStation({
  day,
  index,
  isExpanded,
  onToggle,
}: {
  day: Day;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isEven = index % 2 === 0;
  const Icon = iconMap[day.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative mb-10 md:mb-14"
    >
      <div
        className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        }`}
      >
        {/* Wooden Signpost */}
        <div className="md:w-1/2 flex md:justify-end">
          <div className={`relative ${isEven ? "md:mr-12" : "md:ml-12"} ml-14 md:ml-0 mb-3 md:mb-0`}>
            <WoodenSign rotate={isEven ? -3 : 3}>DAY {day.day}</WoodenSign>
          </div>
        </div>

        {/* Card */}
        <div className="md:w-1/2 w-full pl-14 md:pl-0">
          <button
            onClick={onToggle}
            className={`w-full text-left p-5 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/[0.02] border ${
              isExpanded
                ? "border-emerald-500/50 shadow-2xl shadow-emerald-500/20"
                : "border-white/10"
            } hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${day.color} flex items-center justify-center flex-shrink-0`}
              >
                {Icon && <Icon size={20} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base sm:text-lg mb-1 leading-tight">
                  Day {day.day} — {day.title}
                </h3>
                {day.note && (
                  <p className="text-emerald-400 text-xs font-medium">{day.note}</p>
                )}
              </div>
              <ChevronDown
                size={20}
                className={`text-white/50 transition-transform shrink-0 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <ul className="mt-4 space-y-2 pl-1">
                    {day.items.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-sm text-white/80"
                      >
                        <Check
                          size={16}
                          className="text-emerald-400 flex-shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

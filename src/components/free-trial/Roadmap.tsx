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

export function Roadmap({ onCtaClick }: { onCtaClick?: () => void }) {
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  return (
    <section className="relative py-20 px-4 overflow-hidden">
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

      {/* Roadmap */}
      <div className="relative max-w-6xl mx-auto">
        {/* START */}
        <div className="flex justify-center mb-10 relative z-10">
          <div className="relative">
            <div className="absolute -inset-2 bg-emerald-500/30 rounded-2xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-800 to-amber-900 px-6 py-3 rounded-xl border-2 border-amber-700 shadow-2xl">
              <div className="flex items-center gap-2 text-white font-bold tracking-wide">
                <Flag size={20} className="text-emerald-400" />
                START YOUR JOURNEY
              </div>
            </div>
          </div>
        </div>

        {/* Path */}
        <div className="relative">
          {/* Desktop center path */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-2 bg-gradient-to-b from-gray-600 via-emerald-500 to-amber-400 opacity-40 rounded-full hidden md:block" />
          {/* Mobile dotted left path */}
          <div
            className="absolute left-6 top-0 bottom-0 w-0.5 text-emerald-500/60 md:hidden"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgb(52,211,153) 0 4px, transparent 4px 12px)",
            }}
          />

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

        {/* FINISH */}
        <div className="flex justify-center mt-10 relative z-10">
          <div className="relative">
            <div className="absolute -inset-3 bg-amber-500/40 rounded-2xl blur-2xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-amber-500 to-yellow-500 px-8 py-4 rounded-xl border-2 border-yellow-400 shadow-2xl">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Trophy size={24} />
                FINISH — GROWTH ACHIEVED 🎉
              </div>
            </div>
          </div>
        </div>

        {/* BONUS */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30">
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
      className="relative mb-8 md:mb-12"
    >
      <div
        className={`flex flex-col md:flex-row items-start md:items-center gap-4 ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        }`}
      >
        {/* Signboard */}
        <div className="md:w-1/2 flex md:justify-end">
          <div className={`relative ${isEven ? "md:mr-12" : "md:ml-12"} ml-12 md:ml-0`}>
            <div className="relative bg-gradient-to-br from-amber-800 to-amber-900 px-4 py-2 rounded-lg shadow-xl border-2 border-amber-700 transform -rotate-2 hover:rotate-0 transition-transform">
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-amber-950 rounded-full" />
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-950 rounded-full" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-amber-950 rounded-full" />
              <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-950 rounded-full" />
              <div className="text-white font-bold text-sm tracking-wider px-2">
                DAY {day.day}
              </div>
            </div>
            {/* Dot on path - desktop */}
            <div
              className="absolute top-1/2 -translate-y-1/2 hidden md:block"
              style={{ [isEven ? "right" : "left"]: "-3rem" } as React.CSSProperties}
            >
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${day.color} shadow-lg shadow-emerald-500/50 ring-4 ring-[#0a0f0d]`}
              />
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="md:w-1/2 w-full pl-12 md:pl-0">
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

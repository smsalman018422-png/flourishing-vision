import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Rocket, Star, Award, ArrowRight, DollarSign, TrendingUp } from "lucide-react";

/* ---------- helpers ---------- */

function CountUp({
  to,
  prefix = "",
  suffix = "",
  progress,
  trigger,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  progress: number; // 0..1, when this exceeds trigger we animate
  trigger: number;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current && progress >= trigger) {
      fired.current = true;
      const controls = animate(mv, to, { duration: 1.4, ease: "easeOut" });
      return controls.stop;
    }
  }, [progress, trigger, to, mv]);

  return <motion.span>{rounded}</motion.span>;
}

/* ---------- floating particles ---------- */

function Particles() {
  const dots = Array.from({ length: 32 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((_, i) => {
        const left = (i * 53) % 100;
        const delay = (i % 8) * 0.6;
        const size = 2 + (i % 4);
        const dur = 8 + (i % 6) * 1.5;
        return (
          <motion.span
            key={i}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "-10%", opacity: [0, 0.7, 0] }}
            transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
            style={{ left: `${left}%`, width: size, height: size }}
            className="absolute rounded-full bg-accent/70 shadow-[0_0_12px_2px_oklch(0.82_0.19_145/0.6)]"
          />
        );
      })}
    </div>
  );
}

/* ---------- growth chart SVG (scroll-driven) ---------- */

const CHART_PATH =
  "M 20 260 L 70 240 L 120 250 L 170 215 L 220 225 L 270 180 L 320 195 L 370 150 L 420 165 L 470 110 L 520 130 L 570 70 L 620 40";

function GrowthChart({ progress }: { progress: number }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [len, setLen] = useState(1);
  const [dot, setDot] = useState({ x: 20, y: 260 });

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, []);

  useEffect(() => {
    if (pathRef.current && len) {
      const p = pathRef.current.getPointAtLength(len * progress);
      setDot({ x: p.x, y: p.y });
    }
  }, [progress, len]);

  const dashOffset = len * (1 - progress);

  // Floating markers placed along the chart
  const markers = [
    { at: 0.25, label: "+24%", Icon: TrendingUp },
    { at: 0.55, label: "$1.2M", Icon: DollarSign },
    { at: 0.82, label: "+312%", Icon: TrendingUp },
  ];

  return (
    <svg viewBox="0 0 640 320" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.46 0.13 152)" />
          <stop offset="50%" stopColor="oklch(0.62 0.16 150)" />
          <stop offset="100%" stopColor="oklch(0.82 0.19 145)" />
        </linearGradient>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.19 145 / 0.55)" />
          <stop offset="100%" stopColor="oklch(0.82 0.19 145 / 0)" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* grid */}
      <g stroke="oklch(1 0 0 / 0.06)" strokeWidth="1">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" x2="640" y1={40 + i * 40} y2={40 + i * 40} />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} y1="0" y2="320" x1={i * 80} x2={i * 80} />
        ))}
      </g>

      {/* area fill — clipped via mask scaled by progress */}
      <mask id="revealMask">
        <rect x="0" y="0" width={640 * progress} height="320" fill="white" />
      </mask>
      <path
        d={`${CHART_PATH} L 620 320 L 20 320 Z`}
        fill="url(#areaGrad)"
        mask="url(#revealMask)"
      />

      {/* main line */}
      <path
        ref={pathRef}
        d={CHART_PATH}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={dashOffset}
        filter="url(#glow)"
      />

      {/* moving dot */}
      <circle cx={dot.x} cy={dot.y} r="7" fill="oklch(0.82 0.19 145)" filter="url(#glow)" />
      <circle cx={dot.x} cy={dot.y} r="3" fill="white" />

      {/* markers */}
      {markers.map((m, i) => {
        if (!pathRef.current || !len) return null;
        const p = pathRef.current.getPointAtLength(len * m.at);
        const visible = progress >= m.at - 0.02;
        return (
          <g
            key={i}
            transform={`translate(${p.x - 36}, ${p.y - 38})`}
            style={{
              opacity: visible ? 1 : 0,
              transform: `translate(${p.x - 36}px, ${p.y - (visible ? 44 : 28)}px)`,
              transition: "opacity 400ms ease, transform 500ms cubic-bezier(.2,.8,.2,1)",
            }}
          >
            <rect width="72" height="26" rx="13" fill="oklch(0.16 0.012 160 / 0.85)" stroke="oklch(0.82 0.19 145 / 0.6)" />
            <text x="36" y="17" textAnchor="middle" fontSize="12" fontWeight="600" fill="oklch(0.96 0.015 150)">
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- floating $ / % chips ---------- */

function FloatingChips() {
  const chips = [
    { Icon: DollarSign, label: "+$248K", x: "10%", y: "18%", delay: 0 },
    { Icon: TrendingUp, label: "+47%", x: "82%", y: "26%", delay: 1.2 },
    { Icon: DollarSign, label: "ROI 6.4×", x: "78%", y: "72%", delay: 2.1 },
    { Icon: TrendingUp, label: "+128%", x: "8%", y: "76%", delay: 0.6 },
  ];
  return (
    <>
      {chips.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 1, 0.6], y: [12, -8, -16, -8] }}
          transition={{ duration: 5, repeat: Infinity, delay: c.delay, ease: "easeInOut" }}
          style={{ left: c.x, top: c.y }}
          className="absolute glass-strong rounded-full pl-2 pr-3 py-1 flex items-center gap-1.5 text-xs font-semibold shadow-glow"
        >
          <span className="grid place-items-center h-5 w-5 rounded-full bg-gradient-primary">
            <c.Icon className="h-3 w-3 text-primary-foreground" />
          </span>
          {c.label}
        </motion.div>
      ))}
    </>
  );
}

/* ---------- Lottie loader (graceful fallback) ---------- */

function LottieOrFallback({ progress }: { progress: number }) {
  const [data, setData] = useState<unknown | null>(null);
  const [failed, setFailed] = useState(false);
  const LottieRef = useRef<typeof import("lottie-react").default | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/animations/growth.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (json) => {
        if (cancelled) return;
        const mod = await import("lottie-react");
        LottieRef.current = mod.default;
        setData(json);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (data && LottieRef.current) {
    const Lottie = LottieRef.current;
    // We render Lottie but still overlay the SVG chart for the scroll-scrub experience.
    return (
      <>
        <Lottie animationData={data} loop autoplay className="absolute inset-0 w-full h-full opacity-60" />
        <div className="absolute inset-0">
          <GrowthChart progress={progress} />
        </div>
      </>
    );
  }

  if (!failed && !data) {
    // While loading, show the SVG so it's never blank.
    return <GrowthChart progress={progress} />;
  }

  return <GrowthChart progress={progress} />;
}

/* ---------- main hero ---------- */

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // On mobile/small screens: skip the GSAP scroll-pin animation entirely.
    // Show the KPIs/chart in their final state so the section still looks complete.
    if (!isDesktop) {
      setProgress(1);
      return;
    }

    let ctx: { revert: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const gsapMod = await import("gsap");
      const stMod = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      const gsap = gsapMod.default;
      const ScrollTrigger = stMod.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: sectionRef.current!,
          start: "top top",
          end: "+=120%",
          pin: pinRef.current!,
          pinSpacing: true,
          scrub: true,
          onUpdate: (self) => {
            setProgress(self.progress);
          },
        });
      }, sectionRef);

      setTimeout(() => ScrollTrigger.refresh(), 200);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [isDesktop]);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ minHeight: isDesktop ? "220vh" : undefined }}
    >
      <div
        ref={pinRef}
        className="relative w-full overflow-hidden bg-background min-h-screen md:h-screen"
      >
        {/* ambient backdrop */}
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="absolute inset-0 grid-bg opacity-60" />
        <Particles />

        <div className="relative h-full mx-auto max-w-7xl px-4 sm:px-6 pt-28 sm:pt-32 pb-10">
          <div className="grid h-full lg:grid-cols-2 gap-10 items-center">
            {/* LEFT */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-medium">
                <Rocket className="h-3.5 w-3.5 text-accent" />
                Premium Global Agency
              </div>

              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02]">
                We Grow Brands{" "}
                <span className="text-gradient">Globally</span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-xl">
                From startups to enterprises — we scale your brand with data-driven marketing
                that delivers real ROI.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <motion.a
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  href="#contact"
                  className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow"
                >
                  Book Free Strategy Call
                  <ArrowRight className="h-4 w-4" />
                </motion.a>
                <a
                  href="#work"
                  className="inline-flex items-center h-12 px-6 rounded-xl glass font-medium border border-glass-border hover:bg-muted/30 transition-colors"
                >
                  View Our Work
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </span>
                  <span className="text-foreground/90 font-medium">
                    <CountUp to={500} suffix="+ Clients" progress={1} trigger={0} />
                  </span>
                </div>
                <span className="hidden sm:inline text-muted-foreground/40">|</span>
                <div className="flex items-center gap-2 text-foreground/90">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="font-medium">Top Rated Agency 2026</span>
                </div>
              </div>
            </motion.div>

            {/* RIGHT */}
            <div id="hero-animation" className="relative h-[420px] sm:h-[500px] lg:h-full lg:max-h-[640px]">
              <div className="absolute inset-0 rounded-3xl glass-strong overflow-hidden shadow-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/15" />

                {/* header chrome */}
                <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-3 border-b border-glass-border">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">growth.live</div>
                  <div className="text-xs text-accent font-semibold">
                    {Math.round(progress * 100)}%
                  </div>
                </div>

                {/* live KPIs */}
                <div className="absolute top-14 inset-x-0 px-5 grid grid-cols-3 gap-3 text-center">
                  <div className="glass rounded-xl py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</div>
                    <div className="text-base font-semibold text-foreground">
                      <CountUp to={148000} progress={progress} trigger={0.18} />
                    </div>
                  </div>
                  <div className="glass rounded-xl py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</div>
                    <div className="text-base font-semibold text-foreground">
                      <CountUp to={1200000} prefix="$" progress={progress} trigger={0.5} />
                    </div>
                  </div>
                  <div className="glass rounded-xl py-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ROI</div>
                    <div className="text-base font-semibold text-accent">
                      <CountUp to={640} suffix="%" progress={progress} trigger={0.8} />
                    </div>
                  </div>
                </div>

                {/* chart / lottie area */}
                <div className="absolute inset-x-0 bottom-0 top-32">
                  <LottieOrFallback progress={progress} />
                  <FloatingChips />
                </div>
              </div>

              {/* scroll hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: progress < 0.05 ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
              >
                ↓ scroll to grow
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

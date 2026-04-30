import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Services = lazy(() => import("@/components/home/Services").then((m) => ({ default: m.Services })));
const Stats = lazy(() => import("@/components/home/Stats").then((m) => ({ default: m.Stats })));
const PortfolioPreview = lazy(() => import("@/components/home/PortfolioPreview").then((m) => ({ default: m.PortfolioPreview })));
const Process = lazy(() => import("@/components/home/Process").then((m) => ({ default: m.Process })));
const Testimonials = lazy(() => import("@/components/home/Testimonials").then((m) => ({ default: m.Testimonials })));
const CTA = lazy(() => import("@/components/home/CTA").then((m) => ({ default: m.CTA })));

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={null}>
          <Services />
          <Stats />
          <PortfolioPreview />
          <Process />
          <Testimonials />
          <CTA />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

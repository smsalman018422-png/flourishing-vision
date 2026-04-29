import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Work } from "@/components/home/Work";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { CTA } from "@/components/home/CTA";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased relative overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <Work />
        <Process />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

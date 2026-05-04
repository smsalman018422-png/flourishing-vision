import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, Loader2, Mail, MapPin, Send } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";

function LazyCalendly({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!ref.current || show) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show]);
  return (
    <div ref={ref} className="absolute inset-0">
      {show ? (
        <iframe
          src={src}
          title="Schedule a call"
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading scheduler…</div>
        </div>
      )}
    </div>
  );
}

const CALENDLY_URL = "https://calendly.com/letusgrow/30min";

const SERVICES = ["Social Media", "Paid Ads", "SEO", "Branding", "Other"];
const BUDGETS = ["$500-$1K", "$1K-$5K", "$5K-$10K", "$10K+"];
const LOCATIONS = ["USA", "UK", "Canada", "Bangladesh"];

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  service: z.string().max(60).optional().or(z.literal("")),
  budget: z.string().max(60).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

type FormState = z.input<typeof schema>;

const initial: FormState = {
  full_name: "",
  email: "",
  phone: "",
  company: "",
  service: "",
  budget: "",
  message: "",
};

export function Contact() {
  const { data: settings } = useSiteSettings();
  const contactEmail = settings?.contact_email;
  const [form, setForm] = useState<FormState>(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your inputs");
      setStatus("error");
      return;
    }
    setStatus("loading");
    const { error: dbError } = await supabase.from("contact_submissions").insert({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      company: parsed.data.company || null,
      service: parsed.data.service || null,
      budget: parsed.data.budget || null,
      message: parsed.data.message || null,
    });
    if (dbError) {
      setError("Something went wrong. Please try again.");
      setStatus("error");
      return;
    }
    setStatus("success");
    setForm(initial);
  };

  const inputCls =
    "w-full h-11 rounded-xl border border-border/60 bg-card/40 backdrop-blur px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition";

  return (
    <section id="contact" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-primary/10 blur-[160px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs font-medium text-primary uppercase tracking-[0.3em]">Get in touch</p>
          <h2 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Let&apos;s build your <span className="text-primary">growth engine</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Book a call or drop us a message — we reply within 2 hours during business days.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT — Book a call */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Book a Free 30-Min Strategy Call</h3>
                <p className="text-sm text-muted-foreground">Talk directly with our growth experts</p>
              </div>
            </div>

            <div className="mt-6 flex-1 rounded-2xl overflow-hidden border border-border/60 bg-background/40 min-h-[460px] relative">
              <LazyCalendly src={CALENDLY_URL} />
            </div>

            <a
              href={CALENDLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30"
            >
              Schedule on Calendly →
            </a>
          </motion.div>

          {/* RIGHT — Contact form */}
          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Send us a message</h3>
                <p className="text-sm text-muted-foreground">We&apos;ll get back within 2 hours</p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-12 flex flex-col items-center justify-center text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="h-20 w-20 rounded-full bg-primary/15 text-primary flex items-center justify-center"
                  >
                    <Check className="h-10 w-10" strokeWidth={3} />
                  </motion.div>
                  <h4 className="mt-6 text-2xl font-bold">Message sent!</h4>
                  <p className="mt-2 text-muted-foreground">We&apos;ll reply within 2 hours.</p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm text-primary hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full name *</label>
                    <input className={`${inputCls} mt-1.5`} value={form.full_name} onChange={update("full_name")} placeholder="Jane Doe" required maxLength={100} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</label>
                    <input type="email" className={`${inputCls} mt-1.5`} value={form.email} onChange={update("email")} placeholder="you@brand.com" required maxLength={255} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone / WhatsApp</label>
                    <input className={`${inputCls} mt-1.5`} value={form.phone} onChange={update("phone")} placeholder="+1 555 000 0000" maxLength={40} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company name</label>
                    <input className={`${inputCls} mt-1.5`} value={form.company} onChange={update("company")} placeholder="Acme Inc." maxLength={120} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service interested in</label>
                    <select className={`${inputCls} mt-1.5`} value={form.service} onChange={update("service")}>
                      <option value="">Select a service</option>
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Budget range</label>
                    <select className={`${inputCls} mt-1.5`} value={form.budget} onChange={update("budget")}>
                      <option value="">Select a range</option>
                      {BUDGETS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</label>
                    <textarea
                      className={`${inputCls} mt-1.5 h-32 py-3 resize-none`}
                      value={form.message}
                      onChange={update("message")}
                      placeholder="Tell us about your goals…"
                      maxLength={2000}
                    />
                  </div>

                  {status === "error" && error && (
                    <div className="sm:col-span-2 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm px-4 py-3">
                      {error}
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg shadow-primary/30 disabled:opacity-60"
                    >
                      {status === "loading" ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                      ) : (
                        <>Send Message <Send className="h-4 w-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </div>

        {/* Footer info */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {contactEmail ? (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition justify-center md:justify-start"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span>{contactEmail}</span>
            </a>
          ) : <span />}
          <div className="flex items-center gap-3 text-muted-foreground justify-center md:justify-end flex-wrap">
            <MapPin className="h-5 w-5 text-primary" />
            {LOCATIONS.map((loc, i) => (
              <span key={loc} className="flex items-center gap-3">
                <span>{loc}</span>
                {i < LOCATIONS.length - 1 && <span className="text-border">|</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

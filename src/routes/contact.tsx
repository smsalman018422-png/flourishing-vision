import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageCircle, MapPin, Clock, CheckCircle2, Phone } from "lucide-react";
import { TwitterIcon, LinkedInIcon, InstagramIcon, FacebookIcon } from "@/components/icons/Brands";
import { trackFormStart, trackFormSubmit, trackLead } from "@/lib/meta-pixel";
import { buildMailHref, buildTelHref, buildWhatsAppHref, useSiteSettings, normalizeSocialUrl } from "@/hooks/useSiteSettings";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  service: z.string().max(120).optional().or(z.literal("")),
  budget: z.string().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us a bit more (10+ chars)").max(2000),
});

type FormData = z.infer<typeof schema>;

const BUDGETS = ["< $2k/mo", "$2k–$5k/mo", "$5k–$10k/mo", "$10k–$25k/mo", "$25k+/mo"];

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Let Us Grow" },
      { name: "description", content: "Let's grow together. Get in touch or book a call directly." },
      { property: "og:title", content: "Contact — Let Us Grow" },
      { property: "og:description", content: "Let's grow together. Get in touch or book a call directly." },
    ],
  }),
  component: ContactPage,
});

const PACKAGE_OPTIONS = [
  "Starter Growth",
  "Business Growth",
  "Full Management",
  "Full Page Management",
  "Custom Package",
];

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", company: "", service: "", budget: "", message: "" },
  });

  const onSubmit = async (values: FormData) => {
    const { error } = await supabase.from("contact_submissions").insert({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone || null,
      company: values.company || null,
      service: values.service || null,
      budget: values.budget || null,
      message: values.message,
    });
    if (error) {
      toast.error("Couldn't send your message. Please try again.");
      return;
    }
    toast.success("Thanks — we'll be in touch within one business day.");
    trackLead({ content_name: "Contact Form" });
    trackFormSubmit("Contact Form");
    setSubmitted(true);
    form.reset();
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Contact"
        title="Let's grow together"
        subtitle="Tell us about your goals and we'll get back to you within one business day."
      />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left */}
          <div className="space-y-8">
            <ContactInfo />
            <ContactItem icon={MapPin} label="Offices" value="New York · London · Bangalore" />
            <ContactItem icon={Clock} label="Office hours" value="Mon–Fri · 9am–7pm local" />
            <div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Follow us</p>
              <div className="flex items-center gap-3">
                {[
                  { Icon: TwitterIcon, href: "https://twitter.com" },
                  { Icon: LinkedInIcon, href: "https://linkedin.com" },
                  { Icon: InstagramIcon, href: "https://instagram.com" },
                ].map(({ Icon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 w-11 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right form */}
          <div className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mx-auto h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <h3 className="mt-6 text-2xl font-display font-semibold">Message sent</h3>
                  <p className="mt-2 text-muted-foreground">We'll be in touch within one business day.</p>
                  <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>Send another</Button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={form.handleSubmit(onSubmit)}
                  onFocus={() => trackFormStart("Contact Form")}
                  className="space-y-4"
                >
                  <Field label="Full name" error={form.formState.errors.full_name?.message}>
                    <Input {...form.register("full_name")} maxLength={100} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Email" error={form.formState.errors.email?.message}>
                      <Input type="email" {...form.register("email")} maxLength={255} />
                    </Field>
                    <Field label="Phone / WhatsApp">
                      <Input {...form.register("phone")} maxLength={40} />
                    </Field>
                  </div>
                  <Field label="Company">
                    <Input {...form.register("company")} maxLength={120} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Package">
                      <Select onValueChange={(v) => form.setValue("service", v)}>
                        <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                        <SelectContent>
                          {PACKAGE_OPTIONS.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Budget">
                      <Select onValueChange={(v) => form.setValue("budget", v)}>
                        <SelectTrigger><SelectValue placeholder="Range" /></SelectTrigger>
                        <SelectContent>
                          {BUDGETS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Message" error={form.formState.errors.message?.message}>
                    <Textarea rows={5} {...form.register("message")} maxLength={2000} />
                  </Field>
                  <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Sending…" : "Send message"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Calendly */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-display font-semibold mb-4">Or book a call directly</h2>
        <div className="rounded-2xl overflow-hidden glass">
          <iframe
            src="https://calendly.com/letusgrow/intro?hide_event_type_details=1&background_color=0a0a0a&text_color=ffffff&primary_color=22c55e"
            title="Book a call"
            className="w-full h-[700px]"
            loading="lazy"
          />
        </div>
      </section>
    </PageShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ContactItem({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-4">
      <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} className="block hover:opacity-80 transition-opacity">{inner}</a> : inner;
}

function ContactInfo() {
  const { data: settings, isLoading } = useSiteSettings();
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }
  const email = settings?.contact_email;
  const wa = buildWhatsAppHref(settings?.contact_whatsapp);
  const tel = buildTelHref(settings?.contact_phone);
  return (
    <>
      {email && <ContactItem icon={Mail} label="Email" value={email} href={buildMailHref(email) ?? undefined} />}
      {wa && <ContactItem icon={MessageCircle} label="WhatsApp" value={settings!.contact_whatsapp!} href={wa} />}
      {tel && <ContactItem icon={Phone} label="Phone" value={settings!.contact_phone!} href={tel} />}
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const FALLBACK = `Welcome to Let Us Grow. By accessing or using our website and services, you agree to these Terms of Service.

1. Use of services
You agree to use our services only for lawful purposes and in accordance with these terms.

2. Intellectual property
All content on this site, including logos, copy, designs and case studies, is owned by Let Us Grow unless otherwise stated.

3. Engagements
Project scope, deliverables, timelines and payment terms are defined in individual proposals or statements of work signed between you and Let Us Grow.

4. Limitation of liability
We are not liable for indirect, incidental, or consequential damages arising from use of our services.

5. Changes
We may update these terms from time to time. Continued use of the site constitutes acceptance.

6. Contact
For questions, contact hello@letusgrow.com.`;

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Let Us Grow" },
      { name: "description", content: "Terms governing the use of Let Us Grow services and website." },
      { property: "og:title", content: "Terms of Service — Let Us Grow" },
      { property: "og:description", content: "Terms governing the use of Let Us Grow services and website." },
    ],
  }),
  component: () => (
    <LegalPage
      settingKey="legal_terms"
      title="Terms of Service"
      subtitle="The terms that govern your use of our site and services."
      fallback={FALLBACK}
    />
  ),
});

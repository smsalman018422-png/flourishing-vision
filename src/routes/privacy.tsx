import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const FALLBACK = `We respect your privacy. This Privacy Policy describes how Let Us Grow ("we", "our", "us") collects, uses, and protects information you share with us.

1. Information we collect
We collect information you provide directly (such as your name, email, and project details when you contact us) and basic analytics data about how you use our site.

2. How we use information
We use the information to respond to inquiries, deliver services, send updates you've subscribed to, and improve our site.

3. Sharing
We do not sell your personal information. We share data only with service providers needed to operate our business (e.g., email, analytics) under confidentiality agreements.

4. Your rights
You can request access, correction, or deletion of your data at any time by emailing us.

5. Contact
For questions about this policy, contact hello@letusgrow.com.`;

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Let Us Grow" },
      { name: "description", content: "How Let Us Grow collects, uses, and protects your information." },
      { property: "og:title", content: "Privacy Policy — Let Us Grow" },
      { property: "og:description", content: "How Let Us Grow collects, uses, and protects your information." },
    ],
  }),
  component: () => (
    <LegalPage
      settingKey="legal_privacy"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      fallback={FALLBACK}
    />
  ),
});

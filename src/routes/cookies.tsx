import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";

const FALLBACK = `This Cookie Policy explains how Let Us Grow uses cookies and similar technologies on our website.

1. What are cookies
Cookies are small text files stored on your device that help websites remember information about your visit.

2. How we use cookies
We use essential cookies for site functionality, and analytics cookies to understand how visitors use the site so we can improve it.

3. Managing cookies
You can control or delete cookies through your browser settings. Disabling cookies may affect parts of the site.

4. Third-party services
We may use third-party services (like analytics providers) that set their own cookies. Refer to their policies for details.

5. Contact
For questions about cookies, contact hello@letusgrow.com.`;

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Let Us Grow" },
      { name: "description", content: "How Let Us Grow uses cookies and similar tracking technologies." },
      { property: "og:title", content: "Cookie Policy — Let Us Grow" },
      { property: "og:description", content: "How Let Us Grow uses cookies and similar tracking technologies." },
    ],
  }),
  component: () => (
    <LegalPage
      settingKey="legal_cookies"
      title="Cookie Policy"
      subtitle="How we use cookies and similar technologies."
      fallback={FALLBACK}
    />
  ),
});

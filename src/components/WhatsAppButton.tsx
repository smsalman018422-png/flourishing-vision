import { motion } from "framer-motion";

const PHONE = "15550000000"; // replace with real number
const MESSAGE = "Hi LetuGrow team, I'd like to discuss...";

export function WhatsAppButton() {
  const href = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl"
      style={{ backgroundColor: "#25D366" }}
    >
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-40"
        style={{ backgroundColor: "#25D366" }}
      />
      <svg
        viewBox="0 0 32 32"
        className="relative h-7 w-7 text-white"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.314.158-.717.114-1.06-.157-.444-2.064-.972-2.578-.972zM16.115 4.764c-6.296 0-11.421 5.117-11.421 11.418a11.45 11.45 0 0 0 1.668 5.94L4.7 27.236l5.323-1.667a11.512 11.512 0 0 0 6.092 1.74c6.297 0 11.422-5.116 11.422-11.418 0-3.052-1.193-5.918-3.349-8.07a11.343 11.343 0 0 0-8.073-3.057zm0 20.913a9.46 9.46 0 0 1-5.123-1.493l-.366-.222-3.16.992 1.005-3.078-.237-.378a9.502 9.502 0 0 1-1.45-5.026c0-5.244 4.279-9.5 9.531-9.5 2.55 0 4.93.99 6.722 2.785a9.387 9.387 0 0 1 2.787 6.722c0 5.245-4.279 9.5-9.531 9.5z" />
      </svg>
    </motion.a>
  );
}

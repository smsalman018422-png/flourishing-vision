import { Link } from "@tanstack/react-router";

type LogoProps = {
  className?: string;
  /** kept for backwards compatibility — ignored, no image is rendered */
  imgClassName?: string;
  to?: string;
  /** kept for backwards compatibility — text is always shown now */
  showText?: boolean;
  textClassName?: string;
};

/**
 * Brand wordmark for "Let Us Grow".
 * Pure text logo — no image asset. "Grow" is highlighted with the brand gradient.
 */
export function Logo({
  className = "flex items-center",
  to,
  textClassName = "font-display font-bold tracking-tight text-xl sm:text-2xl leading-none whitespace-nowrap",
}: LogoProps) {
  const inner = (
    <span className={textClassName} aria-label="Let Us Grow">
      <span className="text-foreground">Let Us </span>
      <span className="text-gradient">Grow</span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} className={className} aria-label="Let Us Grow — Home">
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

import { Link } from "@tanstack/react-router";
import logoSrc from "@/assets/logo.png";

type LogoProps = {
  className?: string;
  imgClassName?: string;
  to?: string;
  showText?: boolean;
  textClassName?: string;
};

export function Logo({
  className = "flex items-center gap-2",
  imgClassName = "h-9 w-auto object-contain",
  to,
  showText = false,
  textClassName = "font-display font-semibold text-lg",
}: LogoProps) {
  const inner = (
    <>
      <img
        src={logoSrc}
        alt="Let Us Grow"
        className={imgClassName}
        loading="eager"
        decoding="async"
      />
      {showText && <span className={textClassName}>Let Us Grow</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

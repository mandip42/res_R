import Link from "next/link";

type LogoProps = {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
};

export function Logo({ className = "", height = 36, width = 180 }: LogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg ${className}`}
      style={{ minHeight: height }}
    >
      <span
        className="font-semibold tracking-tight text-foreground"
        style={{ fontSize: Math.round(height * 0.5), lineHeight: 1 }}
      >
        Roast My Resume
      </span>
    </Link>
  );
}

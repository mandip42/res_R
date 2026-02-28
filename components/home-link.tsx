import Link from "next/link";
import { Home } from "lucide-react";

export function HomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <Home className="h-4 w-4" />
      Home
    </Link>
  );
}

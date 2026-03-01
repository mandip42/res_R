import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://roastmyresume.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Roast My Resume",
  description:
    "Get a brutally honest, AI-powered roast of your resume with actionable fixes in under 60 seconds.",
  openGraph: {
    title: "Roast My Resume",
    description:
      "Your resume is probably terrible. Let's fix that with AI-powered brutal honesty.",
    url: appUrl,
    siteName: "Roast My Resume",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Roast My Resume"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Roast My Resume",
    description:
      "Get a brutally honest AI-powered roast of your resume with actionable fixes.",
    images: ["/og.png"]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}


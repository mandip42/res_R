import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://roastmyresume.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Would I Hire You?",
  description:
    "Only if you survive the resume roast. Get a brutally honest, AI-powered roast of your resume with actionable fixes in under 60 seconds.",
  openGraph: {
    title: "Would I Hire You?",
    description:
      "Only if you survive the resume roast. Your resume is probably terrible — let's fix that with AI-powered brutal honesty.",
    url: appUrl,
    siteName: "Would I Hire You?",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Would I Hire You?"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Would I Hire You?",
    description:
      "Only if you survive the resume roast. Get a brutally honest AI-powered roast of your resume with actionable fixes.",
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


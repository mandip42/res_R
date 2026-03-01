import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Terms of Service | Roast My Resume",
  description: "Terms of service for Roast My Resume.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl flex flex-col gap-10">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </header>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Acceptance</h2>
            <p>
              By using Roast My Resume (“the Service”), you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. Use of the Service</h2>
            <p>
              You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service. You are responsible for the content you upload and for keeping your account credentials secure. You may not use the Service for illegal purposes, to harass others, or to attempt to reverse-engineer or abuse our systems.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Plans and payments</h2>
            <p>
              Free users receive one full roast as described on the pricing page. Pro and Lifetime plans are paid via Stripe. Subscription fees are billed in advance. You can cancel a subscription through the billing portal; cancellation takes effect at the end of the current billing period. Refunds are handled according to our refund policy and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Disclaimer</h2>
            <p>
              The Service provides AI-generated feedback for informational purposes. We do not guarantee job offers, interview outcomes, or specific results. Use the feedback at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, Roast My Resume and its operators are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you paid us in the twelve months before the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Changes and contact</h2>
            <p>
              We may update these terms from time to time; continued use after changes constitutes acceptance. For questions, contact us at the email address provided in the app or on our website.
            </p>
          </section>
        </div>

        <footer className="border-t border-border/60 pt-6">
          <Link href="/" className="text-xs text-primary hover:underline">
            ← Back to home
          </Link>
        </footer>
      </div>
    </main>
  );
}

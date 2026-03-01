import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Privacy Policy | Roast My Resume",
  description: "Privacy policy for Roast My Resume — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl flex flex-col gap-10">
        <nav className="flex items-center justify-between gap-4">
          <Logo height={36} width={180} />
          <AuthNav />
        </nav>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </header>

        <div className="prose prose-sm prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-base font-semibold text-foreground">1. Information we collect</h2>
            <p>
              We collect information you provide when you sign up (email, name, username), the resumes you upload for roasting, and the resulting roast feedback. We also collect usage data (e.g. when you use the service) and technical data (e.g. IP, browser) for security and operation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">2. How we use it</h2>
            <p>
              We use your data to provide the roast service (including sending your resume content to our AI provider for analysis), to manage your account and subscriptions, to send transactional emails (e.g. password reset), and to improve the product. We do not sell your data or use your resume content to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">3. Third parties</h2>
            <p>
              We use Supabase (auth and database), Stripe (payments), OpenAI (resume analysis), and Resend (email). Each has its own privacy policy. Your resume content is processed by OpenAI only to generate your roast and is not used for model training per our agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">4. Data retention & security</h2>
            <p>
              We retain your account and roast data while your account is active. You can request deletion of your account and data by contacting us. We use industry-standard measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">5. Your rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete, or export your data, or to object to certain processing. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">6. Contact</h2>
            <p>
              For privacy-related questions, contact us at the email address listed in the app or on our website.
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

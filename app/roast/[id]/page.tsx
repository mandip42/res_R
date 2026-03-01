import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { RoastActions } from "./RoastActions";
import type { RoastResult } from "@/lib/openai-client";

type RoastPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RoastPage({ params }: RoastPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: roast, error } = await supabase
    .from("roasts")
    .select("result_json, score, created_at, user_id")
    .eq("id", id)
    .single();

  if (error || !roast || !roast.result_json) {
    notFound();
  }

  if (user && roast.user_id !== user.id) {
    notFound();
  }

  let plan: "free" | "pro" | "lifetime" = "free";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    plan = (profile?.plan as "free" | "pro" | "lifetime") ?? "free";
  }

  const result = roast.result_json as RoastResult;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <nav className="flex justify-start">
          <Logo height={36} width={180} />
        </nav>
        <header className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Roast ID: {id}</p>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Roast results
          </h1>
          <p className="text-sm text-muted-foreground">{result.one_liner}</p>
        </header>

        {/* Score */}
        <Card className="border-primary/40 bg-card/80 shadow-glow-red">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm md:text-base">
              <span>Overall Roast Score</span>
              <span className="text-xs text-muted-foreground">
                Higher is less terrible (allegedly)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-baseline gap-3 text-primary">
            <span className="text-4xl font-semibold">
              {result.overall_score ?? roast.score ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard
            title="First impression"
            roast={result.first_impression.roast}
            fix={result.first_impression.fix}
          />
          <SectionCard
            title="Skills section"
            roast={result.skills_section.roast}
            fix={result.skills_section.fix}
          />
          <SectionCard
            title="Work experience"
            roast={result.work_experience.roast}
            fix={result.work_experience.fix}
          />
        </div>

        {/* Red flags */}
        {result.red_flags && result.red_flags.length > 0 && (
          <Card className="border-red-500/40 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base text-red-400">
                Red flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
              {result.red_flags.map((rf, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="font-medium text-red-300">Roast</p>
                  <p>{rf.roast}</p>
                  <p className="mt-1 text-emerald-300">Fix</p>
                  <p>{rf.fix}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top fixes */}
        {result.top_fixes && result.top_fixes.length > 0 && (
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">
                Top 5 things to fix immediately
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground md:text-sm">
              <ol className="list-decimal space-y-1 pl-4">
                {result.top_fixes.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <RoastActions roastId={id} plan={plan} />
      </div>
    </main>
  );
}

type SectionCardProps = {
  title: string;
  roast: string;
  fix: string;
};

function SectionCard({ title, roast, fix }: SectionCardProps) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader>
        <CardTitle className="text-sm md:text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs text-muted-foreground md:text-sm">
        <div>
          <p className="font-medium text-red-300">Roast</p>
          <p>{roast}</p>
        </div>
        <div>
          <p className="font-medium text-emerald-300">Fix</p>
          <p>{fix}</p>
        </div>
      </CardContent>
    </Card>
  );
}


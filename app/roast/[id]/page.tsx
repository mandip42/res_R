import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { RoastActions } from "./RoastActions";
import type { RoastResult } from "@/lib/openai-client";
import { SectionCardClient } from "./SectionCardClient";
import { QuickFeedbackCard } from "./QuickFeedbackCard";
import { LiveBulletEditor } from "./LiveBulletEditor";

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
    .select("result_json, score, created_at, user_id, resume_text")
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
  const isJobCompare = result.mode === "job_compare";
  const isFreeJob = isJobCompare && plan === "free";

  let atsPresent: string[] = [];
  let atsMissing: string[] = [];

  if (isJobCompare && result.job_context?.description) {
    const resumeText = (roast.resume_text as string) ?? "";
    const jobDesc = (result.job_context.description as string) ?? "";

    const stop = new Set([
      "and",
      "the",
      "with",
      "from",
      "that",
      "this",
      "your",
      "will",
      "have",
      "for",
      "you",
      "are",
      "our",
      "who",
      "work",
      "role",
      "team",
      "about",
      "experience",
      "skills",
      "years",
    ]);

    const tokens = jobDesc
      .toLowerCase()
      .split(/[^a-z0-9+.#]+/)
      .filter((t) => t.length >= 4 && !stop.has(t));

    const uniq: string[] = [];
    for (const t of tokens) {
      if (!uniq.includes(t)) uniq.push(t);
    }

    const limited = uniq.slice(0, 20);
    const resumeLower = resumeText.toLowerCase();

    atsPresent = [];
    atsMissing = [];
    for (const kw of limited) {
      if (resumeLower.includes(kw)) atsPresent.push(kw);
      else atsMissing.push(kw);
    }
  }

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
          {isJobCompare && (
            <span className="inline-flex w-fit items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              Resume vs specific job
            </span>
          )}
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

        {/* Quick ATS feedback (Ryzma-style): action verbs + sentence length */}
        {result.quick_feedback && (
          <QuickFeedbackCard quickFeedback={result.quick_feedback} />
        )}

        {/* Sections */}
        <SectionCardClient
          roastId={id}
          plan={plan}
          sectionKey="first_impression"
          title="First impression"
          roast={result.first_impression.roast}
          fix={result.first_impression.fix}
          isJobCompare={isJobCompare}
        />
        <SectionCardClient
          roastId={id}
          plan={plan}
          sectionKey="skills_section"
          title="Skills section"
          roast={result.skills_section.roast}
          fix={result.skills_section.fix}
          isJobCompare={isJobCompare}
        />

        <div className="relative space-y-4">
          {isFreeJob && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/75 backdrop-blur-sm">
              <div className="mx-4 rounded-lg border border-primary/40 bg-background/95 px-4 py-3 text-center text-xs md:text-sm">
                <p className="font-medium text-foreground">
                  Upgrade to see your full job‑aligned roast
                </p>
                <p className="mt-1 text-muted-foreground">
                  Skills, work experience, red flags, and detailed fixes are unlocked on Pro and Lifetime.
                </p>
              </div>
            </div>
          )}

          <div className={isFreeJob ? "space-y-4 opacity-40 pointer-events-none" : "space-y-4"}>
            <SectionCardClient
              roastId={id}
              plan={plan}
              sectionKey="work_experience"
              title="Work experience"
              roast={result.work_experience.roast}
              fix={result.work_experience.fix}
              isJobCompare={isJobCompare}
            />

            {/* Design & format (Enhancv-style) */}
            {result.design_and_format && (
              <Card className="border-border/70 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-sm md:text-base">
                    Design &amp; format
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
                  <div>
                    <p className="font-medium text-red-300">Roast</p>
                    <p>{result.design_and_format.roast}</p>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-300">Fix</p>
                    <p>{result.design_and_format.fix}</p>
                  </div>
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>

        {/* Live bullet editor (CVComp-style): edit bullets right here */}
        {user && (
          <LiveBulletEditor roastId={id} isJobCompare={isJobCompare} />
        )}

        {/* ATS / keyword coverage — free for all in job-compare (no paywall) */}
        {isJobCompare && (
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm md:text-base">
                ATS &amp; keyword coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground md:text-sm">
              {result.job_context?.description ? (
                <>
                  <p>
                    We scanned the job description for important phrases and checked whether they
                    appear in your resume.
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-emerald-400">
                        Present in your resume
                      </p>
                      {atsPresent.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          We didn&apos;t find many obvious matches — your resume may need stronger
                          alignment to this job.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {atsPresent.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-amber-300">
                        Missing or weakly covered
                      </p>
                      {atsMissing.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          Nice — most of the key phrases from this posting already show up in your
                          resume.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {atsMissing.map((kw) => (
                            <span
                              key={kw}
                              className="rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <p>
                  We couldn&apos;t read the job description for this roast. Run a fresh job
                  comparison to see ATS keywords.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <RoastActions roastId={id} plan={plan} isJobCompare={isJobCompare} />
      </div>
    </main>
  );
}

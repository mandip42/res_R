"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuickFeedback } from "@/lib/openai-client";

type QuickFeedbackCardProps = {
  quickFeedback: QuickFeedback;
};

/**
 * Ryzma-style: instant, scannable feedback on action verbs and sentence length.
 */
export function QuickFeedbackCard({ quickFeedback }: QuickFeedbackCardProps) {
  const { action_verbs, sentence_length } = quickFeedback;
  const hasVerbs = Array.isArray(action_verbs) && action_verbs.length > 0;

  return (
    <Card className="border-emerald-500/30 bg-card/80">
      <CardHeader>
        <CardTitle className="text-sm md:text-base text-emerald-200">
          Quick ATS wins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs text-muted-foreground md:text-sm">
        {hasVerbs && (
          <div>
            <p className="mb-2 font-medium text-foreground/90">
              Stronger action verbs
            </p>
            <ul className="space-y-1.5">
              {action_verbs.map((av, idx) => (
                <li key={idx} className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-red-300 line-through">
                    {av.weak}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300">
                    {av.strong}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {sentence_length && (
          <div>
            <p className="mb-1 font-medium text-foreground/90">
              Sentence length
            </p>
            <p>{sentence_length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { JOB_ROAST_SYSTEM_PROMPT, RoastResult, getOpenAI } from "@/lib/openai-client";
import { parseJSONFromAI } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing roast id" }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    const jobDescription = (body?.job_description as string | undefined)?.trim() ?? "";
    const jobUrl = (body?.job_url as string | undefined)?.trim() ?? "";
    const rolePreset =
      ((body?.role_preset as string | undefined)?.trim() as
        | "default"
        | "big_tech"
        | "startup"
        | "consulting"
        | "finance"
        | undefined) ?? "default";

    if (!jobDescription || jobDescription.length < 80) {
      return NextResponse.json(
        {
          error:
            "Paste the full job description (at least a few sentences) so we can compare your resume to it.",
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: roast, error } = await supabase
      .from("roasts")
      .select("user_id, resume_text")
      .eq("id", id)
      .single();

    if (error || !roast) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    if (roast.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    const plan = (profile?.plan as "free" | "pro" | "lifetime") ?? "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "Reusing a resume for multiple jobs is available on Pro plans." },
        { status: 402 }
      );
    }

    const resumeText: string = (roast.resume_text as string) ?? "";
    if (!resumeText || resumeText.trim().length < 50) {
      return NextResponse.json(
        { error: "This roast does not have enough resume text to reuse. Try uploading again." },
        { status: 400 }
      );
    }

    // Create a new roast row for the new job comparison
    const { data: newRoastRow, error: insertError } = await supabase
      .from("roasts")
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError || !newRoastRow) {
      console.error(insertError);
      return NextResponse.json(
        { error: "Failed to create new roast record" },
        { status: 500 }
      );
    }

    const roleLens =
      rolePreset === "big_tech"
        ? "Review this as if you are a hiring manager at a Big Tech / FAANG company, caring a lot about impact, scale, and clear signals of strong engineering."
        : rolePreset === "startup"
        ? "Review this as if you are a startup founder or hiring manager, caring about scrappiness, ownership, and shipping quickly with limited resources."
        : rolePreset === "consulting"
        ? "Review this as if you are a consulting interviewer at a top firm, caring about structured thinking, leadership, and clear business impact."
        : rolePreset === "finance"
        ? "Review this as if you are a finance / banking recruiter, caring about analytical rigor, deal or project experience, and attention to detail."
        : "Review this as a pragmatic hiring manager who wants to know if this resume would actually get an interview for this job.";

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: JOB_ROAST_SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `${roleLens}\n\n` +
            `Here is the resume text:\n\n${resumeText}\n\n` +
            `---\n\n` +
            `Here is the job description text:\n\n${jobDescription}\n\n` +
            (jobUrl ? `Job URL (for context only, do not scrape): ${jobUrl}\n` : ""),
        },
      ],
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from OpenAI");
    }

    let parsed: RoastResult;
    try {
      parsed = parseJSONFromAI<RoastResult>(content);
    } catch (err) {
      console.error("Job-from-profile parse error", err, content);
      return NextResponse.json(
        { error: "AI response was not valid JSON for the new job comparison." },
        { status: 500 }
      );
    }

    parsed.mode = "job_compare";
    parsed.job_context = {
      description: jobDescription,
      url: jobUrl || null,
    };
    parsed.role_preset = rolePreset;

    const score = parsed.overall_score ?? null;

    const { error: updateError } = await supabase
      .from("roasts")
      .update({
        result_json: parsed,
        score,
        status: "completed",
      })
      .eq("id", newRoastRow.id);

    if (updateError) {
      console.error(updateError);
    }

    return NextResponse.json({ id: newRoastRow.id }, { status: 200 });
  } catch (err) {
    console.error("Job-from-profile error", err);
    return NextResponse.json(
      { error: "Failed to create job comparison from this resume. Please try again." },
      { status: 500 }
    );
  }
}


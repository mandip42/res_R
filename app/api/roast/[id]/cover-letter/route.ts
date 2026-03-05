import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOpenAI } from "@/lib/openai-client";
import { parseJSONFromAI } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing roast id" }, { status: 400 });
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
      .select("user_id, resume_text, result_json")
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
        { error: "Cover letters and outreach emails are available on Pro plans." },
        { status: 402 }
      );
    }

    const resumeText: string = (roast.resume_text as string) ?? "";
    const result: any = roast.result_json;

    if (!result || result.mode !== "job_compare") {
      return NextResponse.json(
        { error: "Cover letter generation is only available for job comparison roasts." },
        { status: 400 }
      );
    }

    const jobDescription: string | undefined = result.job_context?.description;
    const jobUrl: string | undefined = result.job_context?.url ?? undefined;
    const rolePreset: string | undefined = result.role_preset ?? undefined;

    if (!jobDescription || jobDescription.trim().length < 40) {
      return NextResponse.json(
        { error: "Job description missing from this roast. Please run a new job comparison." },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    const system =
      "You are an experienced hiring manager and career coach. " +
      "Given a candidate's resume and a specific job description, " +
      "you write tailored, non-generic cover letters and short outreach emails that feel human and specific.";

    const lensHint =
      rolePreset === "big_tech"
        ? "Write as if applying to a Big Tech / FAANG role."
        : rolePreset === "startup"
        ? "Write as if applying to an early-stage startup role."
        : rolePreset === "consulting"
        ? "Write as if applying to a consulting role at a top firm."
        : rolePreset === "finance"
        ? "Write as if applying to a finance / banking role."
        : "Write as if applying to a pragmatic, no-nonsense hiring manager.";

    const userParts: string[] = [];
    userParts.push(lensHint);
    userParts.push("\nHere is the candidate's resume text:\n");
    userParts.push(resumeText);
    userParts.push("\n---\nHere is the job description:\n");
    userParts.push(jobDescription);
    if (jobUrl) {
      userParts.push(`\nJob URL (for context only, do not scrape): ${jobUrl}`);
    }
    userParts.push(
      "\nWrite:\n" +
        "1) A tailored cover letter (3–5 short paragraphs) that cites specifics from the resume and job.\n" +
        "2) A concise cold email this candidate could send to a hiring manager or recruiter, with a strong subject line.\n" +
        "Keep tone confident, clear, and professional — not cringe or overly formal.\n"
    );
    userParts.push(
      "Respond as JSON ONLY with:\n" +
        '{ "cover_letter": "string", "cold_email": { "subject": "string", "body": "string" } }'
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n") },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from OpenAI");
    }

    type CoverLetterResult = {
      cover_letter?: string;
      cold_email?: { subject?: string; body?: string };
    };
    let parsed: CoverLetterResult;
    try {
      parsed = parseJSONFromAI<CoverLetterResult>(content);
    } catch (err) {
      console.error("Cover letter parse error", err, content);
      return NextResponse.json(
        { error: "AI response was not valid JSON for cover letter/email." },
        { status: 500 }
      );
    }

    if (!parsed.cover_letter || !parsed.cold_email?.subject || !parsed.cold_email.body) {
      return NextResponse.json(
        { error: "AI did not return a full cover letter and email. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        cover_letter: parsed.cover_letter,
        cold_email: {
          subject: parsed.cold_email.subject,
          body: parsed.cold_email.body,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cover letter error", err);
    return NextResponse.json(
      { error: "Failed to generate cover letter. Please try again." },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOpenAI } from "@/lib/openai-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SectionKey = "first_impression" | "skills_section" | "work_experience";

export async function POST(
  req: NextRequest,
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

    const body = await req.json().catch(() => null);
    const section = (body?.section as SectionKey | undefined) ?? undefined;
    if (!section || !["first_impression", "skills_section", "work_experience"].includes(section)) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    // Load roast and ensure ownership
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
        { error: "Section rewrites are available on Pro plans." },
        { status: 402 }
      );
    }

    const resumeText = (roast.resume_text as string) ?? "";
    const result = roast.result_json as any;

    const sectionData = result?.[section];
    const sectionRoast: string | undefined = sectionData?.roast;
    const sectionFix: string | undefined = sectionData?.fix;

    if (!sectionRoast && !sectionFix) {
      return NextResponse.json(
        { error: "Section data missing from roast result" },
        { status: 400 }
      );
    }

    const isJobCompare = result?.mode === "job_compare";
    const jobDescription: string | undefined = result?.job_context?.description;

    const openai = getOpenAI();

    const system =
      "You are a sharp, practical resume editor. " +
      "Given a resume and an existing critique/fix for one section, " +
      "you will propose 2–3 alternative bullet points or short paragraphs " +
      "that the candidate can paste directly into their resume.";

    const userParts: string[] = [];
    userParts.push("Here is the full resume text:");
    userParts.push(resumeText);
    userParts.push("\n---\n");
    userParts.push(`We are focusing on the section: ${section}.`);
    if (sectionRoast) {
      userParts.push("\nExisting roast of this section:\n");
      userParts.push(sectionRoast);
    }
    if (sectionFix) {
      userParts.push("\nExisting suggested fix for this section:\n");
      userParts.push(sectionFix);
    }
    if (isJobCompare && jobDescription) {
      userParts.push(
        "\nThis roast was generated in the context of the following job description. " +
          "Tailor your alternatives so they align strongly with this job:\n"
      );
      userParts.push(jobDescription);
    }

    userParts.push(
      "\nReturn 2–3 concrete alternative bullet points or short paragraphs for this section " +
        "that the candidate can paste into their resume. Focus on clarity, impact, and metrics where possible.\n"
    );
    userParts.push(
      "Respond as JSON with a single field 'alternatives', an array of strings. " +
        "Example: {\"alternatives\": [\"...\", \"...\"]}"
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

    let parsed: { alternatives?: string[] };
    try {
      parsed = JSON.parse(content) as { alternatives?: string[] };
    } catch (err) {
      console.error("Rewrite parse error", err, content);
      return NextResponse.json(
        { error: "AI response was not valid JSON for alternatives." },
        { status: 500 }
      );
    }

    const alternatives =
      parsed.alternatives?.filter((s) => typeof s === "string" && s.trim().length > 0) ?? [];

    if (!alternatives.length) {
      return NextResponse.json(
        { error: "AI did not return any alternatives. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ alternatives }, { status: 200 });
  } catch (err) {
    console.error("Rewrite section error", err);
    return NextResponse.json(
      { error: "Failed to generate rewrites. Please try again." },
      { status: 500 }
    );
  }
}


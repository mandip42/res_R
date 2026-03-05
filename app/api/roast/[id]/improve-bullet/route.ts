import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getOpenAI } from "@/lib/openai-client";
import { parseJSONFromAI } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live bullet editor (CVComp-style): user pastes any bullet point,
 * gets 2–3 improved versions. Available to all users (no paywall).
 */
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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const bullet = typeof body?.bullet === "string" ? body.bullet.trim() : "";
    if (!bullet || bullet.length < 10) {
      return NextResponse.json(
        { error: "Paste a bullet point (at least a few words) to improve." },
        { status: 400 }
      );
    }

    const { data: roast, error } = await supabase
      .from("roasts")
      .select("user_id, result_json")
      .eq("id", id)
      .single();

    if (error || !roast) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    if (roast.user_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const result = (roast.result_json as any) ?? {};
    const isJobCompare = result?.mode === "job_compare";
    const jobDescription: string | undefined = result?.job_context?.description;

    const openai = getOpenAI();
    const system =
      "You are a sharp resume editor. Given a single resume bullet point, " +
      "return 2–3 improved versions that are more impactful, use stronger action verbs, " +
      "and include metrics/outcomes where possible. Keep each version one bullet (1–2 lines).";

    let userContent =
      "Improve this bullet point. Return JSON with a single field 'alternatives', an array of 2–3 strings.\n\n" +
      "Bullet to improve:\n" + bullet;
    if (isJobCompare && jobDescription && jobDescription.length > 0) {
      userContent +=
        "\n\nOptional context — tailor alternatives to this job:\n" +
        jobDescription.slice(0, 1500);
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      temperature: 0.6,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content from OpenAI");
    }

    let parsed: { alternatives?: string[] };
    try {
      parsed = parseJSONFromAI<{ alternatives?: string[] }>(content);
    } catch (err) {
      console.error("Improve bullet parse error", err, content);
      return NextResponse.json(
        { error: "AI response was not valid JSON. Try again." },
        { status: 500 }
      );
    }

    const alternatives =
      parsed.alternatives?.filter((s) => typeof s === "string" && s.trim().length > 0) ?? [];

    if (!alternatives.length) {
      return NextResponse.json(
        { error: "No alternatives returned. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ alternatives }, { status: 200 });
  } catch (err) {
    console.error("Improve bullet error", err);
    return NextResponse.json(
      { error: "Failed to improve bullet. Please try again." },
      { status: 500 }
    );
  }
}

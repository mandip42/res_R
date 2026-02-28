import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { extractTextFromFile } from "@/lib/resume-parser";
import { ROAST_SYSTEM_PROMPT, RoastResult, getOpenAI } from "@/lib/openai-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const DEV_ADMIN_EMAILS = ["mandipgoswami25@gmail.com", "mandipgoswami@gmail.com"];

/** Emails that get unlimited roasts (e.g. admin/testing). Set in .env.local at project root. Use ADMIN_EMAIL=one@email.com or ADMIN_EMAILS=one@e.com,two@e.com. Restart dev server after changing. In development, DEV_ADMIN_EMAILS always have access. */
function hasUnlimitedAccess(email: string | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (process.env.NODE_ENV === "development" && DEV_ADMIN_EMAILS.includes(normalized)) return true;
  const single = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  if (single && single === normalized) return true;
  const list = process.env.ADMIN_EMAILS?.toLowerCase().split(",").map((e) => e.trim()).filter(Boolean) ?? [];
  return list.includes(normalized);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 5MB)" },
        { status: 400 }
      );
    }

    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX." },
        { status: 400 }
      );
    }

    // Ensure we have a profile row in our own users table for this auth user
    let plan = "free" as "free" | "pro" | "lifetime";

    const { data: existingProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      const meta = user.user_metadata ?? {};
      const full_name = (meta.full_name as string)?.trim() || undefined;
      const username = (typeof meta.username === "string" ? meta.username.trim() : null) || undefined;
      const { data: newProfile, error: userInsertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          full_name,
          username,
          plan: "free"
        })
        .select("*")
        .single();

      if (userInsertError || !newProfile) {
        console.error("Failed to create user profile", userInsertError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      plan = newProfile.plan as typeof plan;
    } else {
      plan = (existingProfile.plan as typeof plan) ?? "free";
    }

    const unlimited = hasUnlimitedAccess(user.email ?? undefined);
    if (!unlimited && plan === "free") {
      const { count } = await supabase
        .from("roasts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");

      if ((count ?? 0) >= 1) {
        return NextResponse.json(
          { error: "Free plan limit reached" },
          { status: 402 }
        );
      }
    }

    const resumeText = await extractTextFromFile(file);

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from your resume. Please upload a higher quality PDF or DOCX."
        },
        { status: 400 }
      );
    }

    const { data: roastRow, error: insertError } = await supabase
      .from("roasts")
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        status: "processing"
      })
      .select("id")
      .single();

    if (insertError || !roastRow) {
      console.error(insertError);
      return NextResponse.json(
        { error: "Failed to create roast record" },
        { status: 500 }
      );
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: ROAST_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here is the resume text:\n\n${resumeText}`
        }
      ],
      temperature: 0.8
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content from OpenAI");
    }

    let parsed: RoastResult;
    try {
      parsed = JSON.parse(content) as RoastResult;
    } catch (err) {
      console.error("Failed to parse OpenAI JSON", err, content);
      throw new Error("AI response was not valid JSON");
    }

    const score = parsed.overall_score ?? null;

    const { error: updateError } = await supabase
      .from("roasts")
      .update({
        result_json: parsed,
        score,
        status: "completed"
      })
      .eq("id", roastRow.id);

    if (updateError) {
      console.error(updateError);
    }

    return NextResponse.json({ id: roastRow.id }, { status: 200 });
  } catch (error: any) {
    console.error("Roast API error", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while roasting your resume. Please try again."
      },
      { status: 500 }
    );
  }
}


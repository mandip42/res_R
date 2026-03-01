import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { RoastResult } from "@/lib/openai-client";
import { jsPDF } from "jspdf";

/** og.png is 1200×630; preserve aspect ratio so it isn't compressed vertically */
const LOGO_WIDTH_PT = 160;
const LOGO_ASPECT = 630 / 1200;
const LOGO_HEIGHT_PT = LOGO_WIDTH_PT * LOGO_ASPECT;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLORS = {
  bg: [252, 252, 252] as [number, number, number],
  card: [255, 255, 255] as [number, number, number],
  border: [228, 228, 228] as [number, number, number],
  text: [26, 26, 26] as [number, number, number],
  muted: [100, 100, 100] as [number, number, number],
  roast: [225, 100, 100] as [number, number, number],
  fix: [52, 211, 153] as [number, number, number],
  primary: [220, 38, 38] as [number, number, number],
};

const MARGIN = 20;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const GAP = 10;
const CARD_PAD = 12;
const CARD_RADIUS = 4;
const COL_GAP = 10;
const COL_WIDTH = (CONTENT_WIDTH - COL_GAP) / 2;

const FONT = {
  tiny: 7,
  small: 8,
  body: 9,
  label: 8,
  title: 10,
  mainTitle: 14,
  score: 20,
};

const LINE_FACTOR = 1.32;
/** Extra space between "Roast"/"Fix" label and the content below so they don't overlap. */
const LABEL_TO_CONTENT_GAP = 5;

function lh(fontSize: number): number {
  return fontSize * LINE_FACTOR;
}

function measureWrapped(doc: jsPDF, text: string, w: number, fontSize: number): { lines: string[]; height: number } {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, w);
  return { lines, height: lines.length * lh(fontSize) };
}

function drawWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  fontSize: number,
  color: [number, number, number]
): number {
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const { lines, height } = measureWrapped(doc, text, w, fontSize);
  doc.text(lines, x, y);
  return y + height;
}

function drawCard(doc: jsPDF, x: number, y: number, w: number, h: number, borderColor?: [number, number, number]) {
  doc.setFillColor(...COLORS.card);
  doc.setDrawColor(...(borderColor ?? COLORS.border));
  doc.roundedRect(x, y, w, h, CARD_RADIUS, CARD_RADIUS, "FD");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing roast id" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: roast, error } = await supabase
      .from("roasts")
      .select("result_json, score")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !roast || !roast.result_json) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    const result = roast.result_json as RoastResult;
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setLineHeightFactor(LINE_FACTOR);

    const bottomMargin = 36;
    function addPageIfNeeded(currentY: number, neededHeight: number): number {
      if (currentY + neededHeight > pageHeight - bottomMargin) {
        doc.addPage();
        doc.setFillColor(...COLORS.bg);
        doc.rect(0, 0, PAGE_WIDTH, pageHeight, "F");
        return MARGIN;
      }
      return currentY;
    }

    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, PAGE_WIDTH, pageHeight, "F");

    let y = MARGIN;

    try {
      const logoPath = join(process.cwd(), "public", "og.png");
      const logoBuf = await readFile(logoPath);
      const logoBase64 = logoBuf.toString("base64");
      const logoX = (PAGE_WIDTH - LOGO_WIDTH_PT) / 2;
      doc.addImage(logoBase64, "PNG", logoX, y - 2, LOGO_WIDTH_PT, LOGO_HEIGHT_PT);
    } catch {
      doc.setFontSize(FONT.mainTitle);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text("Roast My Resume", MARGIN, y + 12);
    }
    y += LOGO_HEIGHT_PT + 6;

    doc.setFontSize(FONT.tiny);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Roast ID: ${id}`, MARGIN, y);
    y += lh(FONT.tiny);

    doc.setFontSize(FONT.mainTitle);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("Roast results", MARGIN, y);
    y += lh(FONT.mainTitle) + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT.body);
    doc.setTextColor(...COLORS.muted);
    const oneLiner = measureWrapped(doc, result.one_liner ?? "", CONTENT_WIDTH, FONT.body);
    doc.text(oneLiner.lines, MARGIN, y);
    y += oneLiner.height + GAP;

    const score = result.overall_score ?? roast.score ?? 0;
    const scoreCardH = 42;
    drawCard(doc, MARGIN, y, CONTENT_WIDTH, scoreCardH, COLORS.primary);
    doc.setFontSize(FONT.small);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.text);
    doc.text("Overall Roast Score", MARGIN + CARD_PAD, y + 14);
    doc.setFontSize(FONT.tiny);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("Higher is less terrible (allegedly)", PAGE_WIDTH - MARGIN - CARD_PAD, y + 14, { align: "right" });
    doc.setFontSize(FONT.score);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.primary);
    doc.text(`${score}`, MARGIN + CARD_PAD, y + 34);
    doc.setFontSize(FONT.body);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("/ 100", MARGIN + CARD_PAD + doc.getTextWidth(`${score}`) + 4, y + 34);
    y += scoreCardH + GAP;

    const sections = [
      { title: "First impression", roast: result.first_impression?.roast ?? "", fix: result.first_impression?.fix ?? "" },
      { title: "Skills section", roast: result.skills_section?.roast ?? "", fix: result.skills_section?.fix ?? "" },
      { title: "Work experience", roast: result.work_experience?.roast ?? "", fix: result.work_experience?.fix ?? "" },
    ];

    const innerW = COL_WIDTH - CARD_PAD * 2;
    const sectionCards: { title: string; roast: string; fix: string; col: number; startY: number }[] = [];
    let col0Y = y;
    let col1Y = y;

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const titleH = lh(FONT.title);
      const roastM = measureWrapped(doc, sec.roast, innerW, FONT.body);
      const fixM = measureWrapped(doc, sec.fix, innerW, FONT.body);
      const cardH = CARD_PAD + titleH + 3 + lh(FONT.label) + LABEL_TO_CONTENT_GAP + roastM.height + 2 + lh(FONT.label) + LABEL_TO_CONTENT_GAP + fixM.height + CARD_PAD;

      if (i === 0 || i === 2) {
        sectionCards.push({ ...sec, col: 0, startY: col0Y });
        col0Y += cardH + GAP;
      } else {
        sectionCards.push({ ...sec, col: 1, startY: col1Y });
        col1Y += cardH + GAP;
      }
    }

    const gridBottom = Math.max(col0Y, col1Y);
    for (const s of sectionCards) {
      const cx = MARGIN + s.col * (COL_WIDTH + COL_GAP);
      const titleH = lh(FONT.title);
      const roastM = measureWrapped(doc, s.roast, innerW, FONT.body);
      const fixM = measureWrapped(doc, s.fix, innerW, FONT.body);
      const cardH = CARD_PAD + titleH + 3 + lh(FONT.label) + LABEL_TO_CONTENT_GAP + roastM.height + 2 + lh(FONT.label) + LABEL_TO_CONTENT_GAP + fixM.height + CARD_PAD;

      drawCard(doc, cx, s.startY, COL_WIDTH, cardH);

      const innerX = cx + CARD_PAD;
      let cy = s.startY + CARD_PAD;
      doc.setFontSize(FONT.title);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.text);
      doc.text(s.title, innerX, cy + 8);
      cy += titleH + 3;

      doc.setFontSize(FONT.label);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.roast);
      doc.text("Roast", innerX, cy + 6);
      cy += lh(FONT.label) + LABEL_TO_CONTENT_GAP;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.body);
      doc.setTextColor(...COLORS.text);
      cy = drawWrapped(doc, s.roast, innerX, cy, innerW, FONT.body, COLORS.text) + 2;

      doc.setFontSize(FONT.label);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.fix);
      doc.text("Fix", innerX, cy + 6);
      cy += lh(FONT.label) + LABEL_TO_CONTENT_GAP;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.body);
      doc.setTextColor(...COLORS.muted);
      drawWrapped(doc, s.fix, innerX, cy, innerW, FONT.body, COLORS.muted);
    }
    y = gridBottom + GAP;

    if (result.red_flags?.length) {
      y = addPageIfNeeded(y, 120);
      const innerWFull = CONTENT_WIDTH - CARD_PAD * 2;
      const innerX = MARGIN + CARD_PAD;

      const titleH = CARD_PAD + lh(FONT.title) + 4;
      drawCard(doc, MARGIN, y, CONTENT_WIDTH, titleH, COLORS.primary);
      doc.setFontSize(FONT.title);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.primary);
      doc.text("Red flags", innerX, y + CARD_PAD + 8);
      let cy = y + titleH + GAP;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.body);

      for (const rf of result.red_flags) {
        const roastH = measureWrapped(doc, rf.roast, innerWFull, FONT.body).height;
        const fixH = measureWrapped(doc, rf.fix, innerWFull, FONT.body).height;
        const itemH = lh(FONT.label) + LABEL_TO_CONTENT_GAP + roastH + 2 + lh(FONT.label) + LABEL_TO_CONTENT_GAP + fixH + 6;
        cy = addPageIfNeeded(cy, itemH);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.label);
        doc.setTextColor(...COLORS.roast);
        doc.text("Roast", innerX, cy + 6);
        cy += lh(FONT.label) + LABEL_TO_CONTENT_GAP;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.text);
        cy = drawWrapped(doc, rf.roast, innerX, cy, innerWFull, FONT.body, COLORS.text) + 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONT.label);
        doc.setTextColor(...COLORS.fix);
        doc.text("Fix", innerX, cy + 6);
        cy += lh(FONT.label) + LABEL_TO_CONTENT_GAP;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONT.body);
        doc.setTextColor(...COLORS.muted);
        cy = drawWrapped(doc, rf.fix, innerX, cy, innerWFull, FONT.body, COLORS.muted) + 6;
      }
      y = cy + GAP;
    }

    if (result.top_fixes?.length) {
      const innerWFull = CONTENT_WIDTH - CARD_PAD * 2;
      const innerX = MARGIN + CARD_PAD;
      const titleH = CARD_PAD + lh(FONT.title) + 4;
      y = addPageIfNeeded(y, titleH + 60);

      drawCard(doc, MARGIN, y, CONTENT_WIDTH, titleH);
      doc.setFontSize(FONT.title);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.text);
      doc.text("Top 5 things to fix", innerX, y + CARD_PAD + 8);
      let cy = y + titleH + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT.body);
      doc.setTextColor(...COLORS.muted);

      for (let i = 0; i < result.top_fixes.length; i++) {
        const fix = result.top_fixes[i];
        const lineH = measureWrapped(doc, `${i + 1}. ${fix}`, innerWFull, FONT.body).height + 2;
        cy = addPageIfNeeded(cy, lineH);
        cy = drawWrapped(doc, `${i + 1}. ${fix}`, innerX, cy, innerWFull, FONT.body, COLORS.muted) + 2;
      }
      y = cy + GAP;
    }

    doc.setFontSize(FONT.tiny);
    doc.setTextColor(...COLORS.muted);
    doc.text("Generated by Roast My Resume", PAGE_WIDTH / 2, pageHeight - 14, { align: "center" });

    return new NextResponse(new Uint8Array(doc.output("arraybuffer")), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="roast-${id}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF export error:", err);
    return NextResponse.json({ error: "Failed to generate PDF. Please try again." }, { status: 500 });
  }
}

import OpenAI from "openai";

let _client: OpenAI | null = null;

/** Lazy client so OPENAI_API_KEY is only checked at request time, not at build time (Vercel). */
export function getOpenAI(): OpenAI {
  if (!_client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey: key });
  }
  return _client;
}

export type RoastResult = {
  overall_score: number;
  first_impression: { roast: string; fix: string };
  skills_section: { roast: string; fix: string };
  work_experience: { roast: string; fix: string };
  red_flags: { roast: string; fix: string }[];
  top_fixes: string[];
  one_liner: string;
};

export const ROAST_SYSTEM_PROMPT = `
You are a brutally honest, witty, and slightly savage career coach who has reviewed 
10,000+ resumes at top companies like Google, McKinsey, and Goldman Sachs. Your job is 
to roast the resume you receive — pointing out every weakness, cliché, red flag, and 
missed opportunity with sharp, memorable language. But you always follow every roast 
with a concrete, actionable fix. You care about the person succeeding, you're just not 
going to sugarcoat it. 

Return your response as a structured JSON object with the following fields:
- overall_score (number out of 100)
- first_impression (object with 'roast' and 'fix' strings)
- skills_section (object with 'roast' and 'fix' strings)
- work_experience (object with 'roast' and 'fix' strings)
- red_flags (array of up to 5 objects, each with 'roast' and 'fix')
- top_fixes (array of 5 strings — the most important things to change immediately)
- one_liner (a single savage but funny summary sentence of the resume)

Respond with ONLY the JSON. Do not include any surrounding backticks or commentary.
`.trim();


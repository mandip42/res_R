import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse JSON from an AI response that may be wrapped in markdown, have extra text,
 * or contain trailing commas. Reduces "AI response was not valid JSON" errors.
 */
export function parseJSONFromAI<T = unknown>(raw: string): T {
  let str = raw.trim()

  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  const codeBlock = str.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) str = codeBlock[1].trim()

  // Extract the first complete JSON object or array (first { to last }, or [ to last ])
  const firstBrace = str.indexOf("{")
  const firstBracket = str.indexOf("[")
  if (firstBracket >= 0 && (firstBrace < 0 || firstBracket < firstBrace)) {
    const end = str.lastIndexOf("]")
    if (end > firstBracket) str = str.slice(firstBracket, end + 1)
  } else if (firstBrace >= 0) {
    const end = str.lastIndexOf("}")
    if (end > firstBrace) str = str.slice(firstBrace, end + 1)
  }

  // Remove trailing commas (invalid in JSON but LLMs often add them)
  str = str.replace(/,(\s*[}\]])/g, "$1")

  return JSON.parse(str) as T
}

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();

  if (filename.endsWith(".pdf")) {
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text ?? "";
  }

  if (filename.endsWith(".docx")) {
    const buffer = Buffer.from(arrayBuffer);
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
}


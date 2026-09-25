/** Shared, pure limits and validators used by both browser and server code. */

export const MAX_DOC_CHARS = 120_000;
export const MIN_DOC_CHARS = 40;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_NAME = 200;
export const MAX_QUESTION_CHARS = 2_000;
export const MAX_HISTORY = 20;
export const MAX_HISTORY_MESSAGE_CHARS = 8_000;

export type DocKind = "pdf" | "docx";

export function detectKind(fileName: string): DocKind | null {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  return null;
}

/** Returns an error message for an unacceptable file, or null if it is fine. */
export function validateFile(file: { name: string; size: number }): string | null {
  if (!detectKind(file.name)) return "Unsupported file. Please upload a PDF or a .docx file.";
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_FILE_BYTES) return "This file is larger than 20 MB. Please upload a smaller file.";
  return null;
}

/** Strips control characters and path fragments from a user-supplied file name. */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f<>"`]/g, "").trim();
  return (cleaned || "document").slice(0, MAX_FILE_NAME);
}

export function cleanText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function truncateDoc(text: string): string {
  return text.length > MAX_DOC_CHARS ? text.slice(0, MAX_DOC_CHARS) : text;
}

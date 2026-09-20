/**
 * Browser-only text extraction for PDF and DOCX files.
 * Import this lazily (inside an event handler) — it pulls in heavy browser libs.
 */

export type ExtractedDoc = { text: string; kind: "pdf" | "docx" };

function clean(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ");
    pages.push(line);
  }

  return pages.join("\n\n");
}

async function extractDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value as string;
}

export async function extractText(file: File): Promise<ExtractedDoc> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const text = clean(await extractPdf(file));
    if (text.length < 40) {
      throw new Error(
        "We couldn't read any text from this PDF. It may be a scan or image — try a text-based PDF.",
      );
    }
    return { text, kind: "pdf" };
  }

  if (name.endsWith(".docx")) {
    const text = clean(await extractDocx(file));
    if (text.length < 40) throw new Error("This Word file appears to be empty.");
    return { text, kind: "docx" };
  }

  throw new Error("Unsupported file. Please upload a PDF or a .docx file.");
}

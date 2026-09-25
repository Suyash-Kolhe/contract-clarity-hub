/**
 * Browser-only text extraction for PDF and DOCX files.
 * Import this lazily (inside an event handler) — it pulls in heavy browser libs.
 */
import { cleanText, detectKind, MIN_DOC_CHARS, validateFile, type DocKind } from "./limits";

export type ExtractedDoc = { text: string; kind: DocKind };

const PAGE_BATCH = 8;

async function extractPdf(file: File) {
  const [pdfjs, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = new Array(pdf.numPages);

  // Read pages in small parallel batches instead of one at a time.
  for (let start = 1; start <= pdf.numPages; start += PAGE_BATCH) {
    const end = Math.min(start + PAGE_BATCH - 1, pdf.numPages);
    const batch = [];
    for (let i = start; i <= end; i++) {
      batch.push(
        pdf.getPage(i).then(async (page) => {
          const content = await page.getTextContent();
          pages[i - 1] = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ");
        }),
      );
    }
    await Promise.all(batch);
  }

  return pages.join("\n\n");
}

async function extractDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value as string;
}

export async function extractText(file: File): Promise<ExtractedDoc> {
  const invalid = validateFile(file);
  if (invalid) throw new Error(invalid);

  const kind = detectKind(file.name) as DocKind;
  const text = cleanText(kind === "pdf" ? await extractPdf(file) : await extractDocx(file));

  if (text.length < MIN_DOC_CHARS) {
    throw new Error(
      kind === "pdf"
        ? "We couldn't read any text from this PDF. It may be a scan or image — try a text-based PDF."
        : "This Word file appears to be empty.",
    );
  }
  return { text, kind };
}

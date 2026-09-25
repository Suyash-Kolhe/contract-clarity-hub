import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { analyzeDocument } from "./analysis.functions";
import { addDoc, newId, updateDoc } from "./doc-store";
import { sanitizeFileName, truncateDoc, validateFile } from "./limits";

export function useUpload() {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeDocument);

  async function upload(file: File) {
    setBusy(true);
    const id = newId();
    try {
      const invalid = validateFile(file);
      if (invalid) throw new Error(invalid);

      const { extractText } = await import("./extract-text");
      const extracted = await extractText(file);
      const text = truncateDoc(extracted.text);
      const fileName = sanitizeFileName(file.name);

      addDoc({
        id,
        fileName,
        kind: extracted.kind,
        text,
        charCount: extracted.text.length,
        createdAt: Date.now(),
        status: "analyzing",
        chat: [],
        checkedQuestions: [],
      });

      void navigate({ to: "/docs/$docId", params: { docId: id } });

      const analysis = await analyze({ data: { fileName, text } });
      updateDoc(id, { status: "ready", analysis });
      toast.success("Review ready", { description: analysis.title });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";
      updateDoc(id, { status: "error", error: message });
      toast.error("We couldn't review that document", { description: message });
    } finally {
      setBusy(false);
    }
  }

  return { upload, busy };
}

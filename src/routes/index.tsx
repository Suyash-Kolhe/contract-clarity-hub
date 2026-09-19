import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  FileText,
  Loader2,
  MessagesSquare,
  Table2,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useDocs } from "@/lib/doc-store";
import { useUpload } from "@/lib/use-upload";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Counsel Desk — Upload a contract for plain-language review" },
      {
        name: "description",
        content:
          "Upload a PDF or Word contract and get a plain-language summary, a clause-by-clause risk table, document Q&A, and a checklist of questions for your lawyer.",
      },
      { property: "og:title", content: "Counsel Desk — Upload a contract" },
      {
        property: "og:description",
        content: "Plain-language contract review in minutes. Not legal advice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  { Icon: FileText, title: "Plain-language summary", body: "What the document actually says." },
  { Icon: Table2, title: "Clause risk table", body: "Obligation, Risk, Standard or Ambiguous." },
  { Icon: MessagesSquare, title: "Ask the document", body: "Answers drawn only from your file." },
  { Icon: ClipboardCheck, title: "Lawyer checklist", body: "Export the questions worth asking." },
];

function Home() {
  const docs = useDocs();
  const { upload, busy } = useUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-foreground/70 uppercase">
          Contract review workspace
        </p>
        <h1 className="mt-3 text-4xl leading-[1.1] sm:text-5xl">
          Understand what you're about to sign.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          Upload a contract and Counsel Desk reads it back to you in plain English — clause by
          clause, with the risky and vague bits flagged.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) void upload(file);
          }}
          className={cn(
            "mt-9 rounded-xl border-2 border-dashed bg-surface px-6 py-12 text-center transition-colors",
            dragging ? "border-accent bg-accent/5" : "border-border",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            {busy ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <UploadCloud className="size-5" />
            )}
          </span>
          <h2 className="mt-4 text-xl">
            {busy ? "Reading your document…" : "Drop a contract here"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            PDF or Word (.docx), text-based files up to a few hundred pages.
          </p>
          <Button
            variant="accent"
            className="mt-5"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            Choose a file
          </Button>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="bg-surface p-5">
              <Icon className="size-5 text-accent-foreground/80" />
              <h3 className="mt-3 text-lg leading-tight">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        {docs.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl">Your library</h2>
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <Link
                    to="/docs/$docId"
                    params={{ docId: doc.id }}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {doc.analysis?.title ?? doc.fileName}
                      </span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {doc.analysis?.documentType ?? doc.fileName} ·{" "}
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {doc.status === "analyzing"
                        ? "Reviewing…"
                        : doc.status === "error"
                          ? "Failed"
                          : `${doc.analysis?.clauses.length ?? 0} clauses`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}

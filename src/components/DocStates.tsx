import { Link } from "@tanstack/react-router";
import { Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { StoredDoc } from "@/lib/doc-store";

export function Analyzing({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <Loader2 className="size-6 animate-spin text-accent-foreground" />
      <h2 className="mt-4 text-xl">{label}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Longer contracts can take a minute. You can leave this tab open.
      </p>
    </div>
  );
}

export function DocError({ message }: { message?: string | undefined }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center">
      <TriangleAlert className="size-6 text-destructive" />
      <h2 className="mt-4 text-xl">We couldn't review this document</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        {message ?? "Something went wrong."}
      </p>
      <Button variant="outline" className="mt-5" asChild>
        <Link to="/">Upload another document</Link>
      </Button>
    </div>
  );
}

export function MissingDoc() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-16 text-center">
      <h2 className="text-xl">This document isn't here</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Documents are kept in this browser only. It may have been removed or opened elsewhere.
      </p>
      <Button variant="accent" className="mt-5" asChild>
        <Link to="/">Upload a document</Link>
      </Button>
    </div>
  );
}

/** Returns a state element when the doc isn't ready, otherwise null. */
export function docGate(doc: StoredDoc | undefined, busyLabel: string) {
  if (!doc) return <MissingDoc />;
  if (doc.status === "error") return <DocError message={doc.error} />;
  if (doc.status === "analyzing" || !doc.analysis) return <Analyzing label={busyLabel} />;
  return null;
}

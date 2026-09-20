import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowRight, Users } from "lucide-react";

import { ClauseTag, type TagName } from "@/components/ClauseTag";
import { docGate } from "@/components/DocStates";
import { DisclaimerNote } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { useDoc } from "@/lib/doc-store";

export const Route = createFileRoute("/docs/$docId/")({
  head: () => ({
    meta: [
      { title: "Plain-language summary — Counsel Desk" },
      {
        name: "description",
        content: "A plain-English summary of your uploaded contract, with the key takeaways.",
      },
      { property: "og:title", content: "Plain-language summary — Counsel Desk" },
      {
        property: "og:description",
        content: "What your contract actually says, in plain English.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SummaryPage,
});

const TAGS: TagName[] = ["Obligation", "Risk", "Standard", "Ambiguous"];

function SummaryPage() {
  const { docId } = useParams({ from: "/docs/$docId" });
  const doc = useDoc(docId);
  const gate = docGate(doc, "Reading your contract…");
  if (gate) return gate;

  const analysis = doc!.analysis!;
  const counts = TAGS.map((tag) => ({
    tag,
    count: analysis.clauses.filter((c) => c.tag === tag).length,
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map(({ tag, count }) => (
          <div key={tag} className="rounded-lg border border-border bg-surface p-4">
            <p className="display-title text-3xl leading-none">{count}</p>
            <ClauseTag tag={tag} className="mt-2.5" />
          </div>
        ))}
      </div>

      {analysis.parties.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Users className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Parties:</span>
          {analysis.parties.map((party) => (
            <span
              key={party}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
            >
              {party}
            </span>
          ))}
        </div>
      )}

      <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-2xl">In plain language</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {analysis.summary.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      {analysis.keyPoints.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-2xl">Key takeaways</h2>
          <ul className="mt-4 space-y-3">
            {analysis.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="accent">
          <Link to="/docs/$docId/clauses" params={{ docId }}>
            Review clauses <ArrowRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/docs/$docId/chat" params={{ docId }}>
            Ask a question
          </Link>
        </Button>
      </div>

      <DisclaimerNote className="text-xs text-muted-foreground" />
    </div>
  );
}

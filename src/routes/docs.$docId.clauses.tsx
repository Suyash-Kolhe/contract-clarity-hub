import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ClauseTag, type TagName } from "@/components/ClauseTag";
import { DisclaimerNote } from "@/components/Disclaimer";
import { docGate } from "@/components/DocStates";
import { Input } from "@/components/ui/input";
import { useDoc } from "@/lib/doc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs/$docId/clauses")({
  head: () => ({
    meta: [
      { title: "Clause-by-clause review — Counsel Desk" },
      {
        name: "description",
        content:
          "Every clause in your contract tagged as Obligation, Risk, Standard or Ambiguous with a one-line plain-English explanation.",
      },
      { property: "og:title", content: "Clause-by-clause review — Counsel Desk" },
      {
        property: "og:description",
        content: "Obligation, Risk, Standard or Ambiguous — clause by clause.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClausesPage,
});

const FILTERS: (TagName | "All")[] = ["All", "Risk", "Ambiguous", "Obligation", "Standard"];

function ClausesPage() {
  const { docId } = useParams({ from: "/docs/$docId" });
  const doc = useDoc(docId);
  const [filter, setFilter] = useState<TagName | "All">("All");
  const [query, setQuery] = useState("");

  const clauses = doc?.analysis?.clauses ?? [];
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clauses.filter(
      (c) =>
        (filter === "All" || c.tag === filter) &&
        (q === "" ||
          `${c.reference} ${c.heading} ${c.explanation} ${c.excerpt}`.toLowerCase().includes(q)),
    );
  }, [clauses, filter, query]);

  const gate = docGate(doc, "Tagging the clauses…");
  if (gate) return gate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter(tag)}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === tag
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {tag}
              {tag !== "All" && (
                <span className="ml-1.5 opacity-70">
                  {clauses.filter((c) => c.tag === tag).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clauses…"
          className="sm:max-w-56"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-border bg-secondary/60">
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Clause
              </th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Tag
              </th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                What it means
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((clause, i) => (
              <tr
                key={`${clause.reference}-${i}`}
                className="flex flex-col gap-2 border-b border-border p-5 last:border-0 sm:table-row sm:p-0"
              >
                <td className="align-top sm:w-56 sm:px-5 sm:py-4">
                  <span className="block font-mono text-xs text-muted-foreground">
                    {clause.reference}
                  </span>
                  <span className="mt-0.5 block font-semibold">{clause.heading}</span>
                </td>
                <td className="align-top sm:w-36 sm:px-5 sm:py-4">
                  <ClauseTag tag={clause.tag as TagName} />
                </td>
                <td className="align-top sm:px-5 sm:py-4">
                  <p className="leading-relaxed">{clause.explanation}</p>
                  {clause.excerpt && (
                    <p className="mt-2 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground italic">
                      “{clause.excerpt}”
                    </p>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">
                  No clauses match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DisclaimerNote className="text-xs text-muted-foreground" />
    </div>
  );
}

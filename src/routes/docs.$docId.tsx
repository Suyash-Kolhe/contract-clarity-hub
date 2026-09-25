import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { ClipboardCheck, FileText, Loader2, MessagesSquare, Table2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useDoc } from "@/lib/doc-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/docs/$docId")({
  head: () => ({
    meta: [
      { title: "Document review — Counsel Desk" },
      {
        name: "description",
        content:
          "Plain-language summary, clause risk table, document Q&A and a lawyer checklist for your uploaded contract.",
      },
      { property: "og:title", content: "Document review — Counsel Desk" },
      {
        property: "og:description",
        content: "Summary, clause tags, Q&A and lawyer questions for your contract.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocLayout,
});

const TABS = [
  { to: "/docs/$docId" as const, label: "Summary", Icon: FileText, exact: true },
  { to: "/docs/$docId/clauses" as const, label: "Clauses", Icon: Table2, exact: false },
  { to: "/docs/$docId/chat" as const, label: "Ask", Icon: MessagesSquare, exact: false },
  {
    to: "/docs/$docId/checklist" as const,
    label: "Checklist",
    Icon: ClipboardCheck,
    exact: false,
  },
];

function DocLayout() {
  const { docId } = useParams({ from: "/docs/$docId" });
  const doc = useDoc(docId);

  return (
    <AppShell>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-5xl px-5 pt-8 sm:px-8">
          <h1 className="truncate text-3xl leading-tight">
            {doc?.analysis?.title ?? doc?.fileName ?? "Document"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {doc?.status === "analyzing" && (
              <span role="status" className="inline-flex items-center gap-1.5 text-accent-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Reviewing…
              </span>
            )}
            {doc?.analysis?.documentType && <span>{doc.analysis.documentType}</span>}
            {doc?.fileName && <span className="truncate">· {doc.fileName}</span>}
          </p>

          <nav aria-label="Document sections" className="-mb-px flex gap-1 overflow-x-auto pt-5">
            {TABS.map(({ to, label, Icon, exact }) => (
              <Link
                key={label}
                to={to}
                params={{ docId }}
                activeOptions={{ exact }}
                className="rounded-t-md px-3.5 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-b-2 data-[status=active]:border-accent data-[status=active]:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon aria-hidden="true" className={cn("size-4")} />
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <Outlet />
      </div>
    </AppShell>
  );
}

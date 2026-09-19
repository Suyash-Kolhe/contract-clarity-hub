import { Link, useParams } from "@tanstack/react-router";
import { FileText, Loader2, Menu, Plus, Scale, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { DisclaimerBar } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { removeDoc, useDocs } from "@/lib/doc-store";
import { useUpload } from "@/lib/use-upload";
import { cn } from "@/lib/utils";

function DocList({ onNavigate }: { onNavigate?: () => void }) {
  const docs = useDocs();
  const params = useParams({ strict: false }) as { docId?: string };

  if (docs.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-sidebar-foreground/55">
        No documents yet. Upload a contract to begin.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {docs.map((doc) => {
        const active = params.docId === doc.id;
        return (
          <li key={doc.id} className="group relative">
            <Link
              to="/docs/$docId"
              params={{ docId: doc.id }}
              onClick={onNavigate}
              className={cn(
                "flex items-start gap-2.5 rounded-md px-3 py-2.5 pr-9 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              {doc.status === "analyzing" ? (
                <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-sidebar-primary" />
              ) : doc.status === "error" ? (
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
              ) : (
                <FileText className="mt-0.5 size-4 shrink-0 opacity-70" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {doc.analysis?.title ?? doc.fileName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-sidebar-foreground/50">
                  {doc.status === "analyzing"
                    ? "Reviewing…"
                    : doc.status === "error"
                      ? "Failed"
                      : (doc.analysis?.documentType ?? doc.kind.toUpperCase())}
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label={`Remove ${doc.fileName}`}
              onClick={() => removeDoc(doc.id)}
              className="absolute top-2.5 right-2 rounded p-1.5 text-sidebar-foreground/40 opacity-0 transition hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, busy } = useUpload();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pt-6 pb-4">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Scale className="size-5" />
          </span>
          <span>
            <span className="display-title block text-lg leading-tight">Counsel Desk</span>
            <span className="block text-[11px] tracking-wide text-sidebar-foreground/50 uppercase">
              Contract review
            </span>
          </span>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) {
              onNavigate?.();
              void upload(file);
            }
          }}
        />
        <Button
          variant="accent"
          className="w-full"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          New document
        </Button>
      </div>

      <div className="px-4 pb-2">
        <p className="px-2 text-[11px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase">
          Your documents
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-6">
        <DocList onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-sidebar-foreground/45">
          Documents stay in this browser. Nothing is stored on a server.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-sidebar-border lg:block">
          <div className="sticky top-0 h-screen">
            <SidebarInner />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open documents">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-80 border-0 p-0">
                <SheetTitle className="sr-only">Documents</SheetTitle>
                <SidebarInner onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="display-title text-lg">Counsel Desk</span>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <div className="sticky bottom-0 z-40">
        <DisclaimerBar />
      </div>
    </div>
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { DisclaimerNote } from "@/components/Disclaimer";
import { docGate } from "@/components/DocStates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askDocument } from "@/lib/analysis.functions";
import { updateDoc, useDoc } from "@/lib/doc-store";

export const Route = createFileRoute("/docs/$docId/chat")({
  head: () => ({
    meta: [
      { title: "Ask this document — Counsel Desk" },
      {
        name: "description",
        content:
          "Ask questions about your uploaded contract and get answers drawn only from the document itself.",
      },
      { property: "og:title", content: "Ask this document — Counsel Desk" },
      {
        property: "og:description",
        content: "Answers sourced only from your uploaded contract.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "How can this agreement be terminated?",
  "What am I obligated to pay, and when?",
  "Are there any penalties or late fees?",
  "Who owns the work produced under this contract?",
];

function ChatPage() {
  const { docId } = useParams({ from: "/docs/$docId" });
  const doc = useDoc(docId);
  const ask = useServerFn(askDocument);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const messages = doc?.chat ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending, docId]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending || !doc) return;

    const history = doc.chat;
    updateDoc(docId, { chat: [...history, { role: "user", content: trimmed }] });
    setInput("");
    setPending(true);

    try {
      const answer = await ask({ data: { text: doc.text, question: trimmed, history } });
      updateDoc(docId, {
        chat: [
          ...history,
          { role: "user", content: trimmed },
          { role: "assistant", content: answer },
        ],
      });
    } catch (error) {
      toast.error("Couldn't answer that", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
      updateDoc(docId, { chat: history });
      setInput(trimmed);
    } finally {
      setPending(false);
    }
  }

  const gate = docGate(doc, "Preparing the document…");
  if (gate) return gate;

  return (
    <div className="flex min-h-[60vh] flex-col gap-5">
      <div className="flex-1 space-y-5">
        {messages.length === 0 && !pending && (
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl">Ask about this document</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Answers come only from the file you uploaded. If it isn't in there, you'll be told so.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="cursor-pointer rounded-lg border border-border bg-background px-4 py-3 text-left text-sm transition-colors hover:border-accent hover:bg-secondary/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) =>
          message.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {message.content}
              </p>
            </div>
          ) : (
            <div key={i} className="max-w-[92%] space-y-3 text-[15px] leading-relaxed">
              {message.content.split(/\n{1,}/).map((para, j) =>
                para.trim() ? (
                  <p key={j}>{para}</p>
                ) : null,
              )}
            </div>
          ),
        )}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Reading the document…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-14 rounded-xl border border-border bg-surface p-3 shadow-panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            placeholder="Ask about a clause, a deadline, a payment…"
            className="min-h-16 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" variant="accent" disabled={pending || !input.trim()}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>

      <DisclaimerNote className="text-xs text-muted-foreground" />
    </div>
  );
}

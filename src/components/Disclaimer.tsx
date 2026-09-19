import { Info } from "lucide-react";

export function DisclaimerBar() {
  return (
    <div className="border-t border-border bg-secondary/80 px-4 py-2 backdrop-blur">
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-semibold text-foreground">Not legal advice.</strong> Counsel Desk
          is an AI reading aid. It can misread or miss terms. Always confirm anything important with
          a qualified lawyer before signing or relying on a document.
        </span>
      </p>
    </div>
  );
}

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p className={className}>
      AI-generated review — not legal advice. Verify with a qualified lawyer.
    </p>
  );
}

import { AlertTriangle, CheckCircle2, HelpCircle, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

export type TagName = "Obligation" | "Risk" | "Standard" | "Ambiguous";

const STYLES: Record<TagName, { className: string; Icon: typeof Scale }> = {
  Obligation: {
    className: "bg-tag-obligation text-tag-obligation-foreground",
    Icon: Scale,
  },
  Risk: {
    className: "bg-tag-risk text-tag-risk-foreground",
    Icon: AlertTriangle,
  },
  Standard: {
    className: "bg-tag-standard text-tag-standard-foreground",
    Icon: CheckCircle2,
  },
  Ambiguous: {
    className: "bg-tag-ambiguous text-tag-ambiguous-foreground",
    Icon: HelpCircle,
  },
};

export function ClauseTag({ tag, className }: { tag: TagName; className?: string }) {
  const { className: tagClass, Icon } = STYLES[tag] ?? STYLES.Standard;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tagClass,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {tag}
    </span>
  );
}

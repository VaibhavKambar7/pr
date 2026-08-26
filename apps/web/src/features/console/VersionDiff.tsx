"use client";

import { useMemo } from "react";
import { diffWords } from "diff";

type DiffPart = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

export function VersionDiffView({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = useMemo<DiffPart[]>(() => diffWords(oldText, newText), [oldText, newText]);

  return (
    <pre className="m-0 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-background p-3 font-mono text-xs leading-relaxed">
      {parts.map((part, index) => {
        if (part.added) {
          return (
            <span className="rounded-sm bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" key={index}>
              {part.value}
            </span>
          );
        }

        if (part.removed) {
          return (
            <span className="rounded-sm bg-red-500/15 text-red-600 line-through decoration-red-500/50 dark:text-red-400" key={index}>
              {part.value}
            </span>
          );
        }

        return <span className="text-muted-foreground" key={index}>{part.value}</span>;
      })}
    </pre>
  );
}

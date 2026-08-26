"use client";

import { ChevronDown } from "lucide-react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  ExecutionDetail,
  ExecutionListItem,
  PromptVersion,
  PromptVersionTag,
  RuntimeRenderResult,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export const VERSION_TAGS = ["production", "staging", "canary"];

export function splitTemplate(template: string) {
  return template.split(/(\{\{[^{}]+\}\})/g);
}

export function TemplateBlock({ template, className }: { template: string; className?: string }) {
  return (
    <pre
      className={cn(
        "max-w-full overflow-x-auto whitespace-pre-wrap rounded-xl border bg-card p-4 font-mono text-[13px] leading-relaxed",
        className,
      )}
    >
      {splitTemplate(template).map((part, index) =>
        part.startsWith("{{") ? (
          <span
            className="rounded bg-emerald-500/10 px-1 font-semibold text-emerald-600 dark:text-emerald-400"
            key={index}
          >
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </pre>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 rounded-full bg-current animate-[live-pulse_2.4s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function StatusBadge({ status }: { status: PromptVersion["status"] }) {
  if (status === "LIVE") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <LiveDot />live
      </Badge>
    );
  }

  if (status === "DRAFT") {
    return <Badge variant="outline">draft</Badge>;
  }

  return <Badge variant="secondary">archived</Badge>;
}

export function formatClock(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}`;
}

export function timeAgo(iso: string | null) {
  if (!iso) {
    return "";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }

  return `${Math.floor(seconds / 86400)}d ago`;
}

export type StatusMessage = {
  text: string;
  isError: boolean;
};

export function StatusLine({ message }: { message: StatusMessage }) {
  if (!message.text) {
    return null;
  }

  return (
    <p
      className={cn(
        "font-mono text-xs",
        message.isError ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {message.text}
    </p>
  );
}

type VersionComposer = {
  isOpen: boolean;
  template: string;
  changeNotes: string;
  model: string;
  modelParams: string;
  variableSchema: string;
};

type VersionLedgerProps = {
  versions: PromptVersion[];
  tags: PromptVersionTag[];
  liveVersion: PromptVersion | null;
  promotingVersion: number | null;
  isCreatingVersion: boolean;
  isLoading: boolean;
  message: StatusMessage;
  composer: VersionComposer;
  onToggleComposer: () => void;
  onComposerFieldChange: (
    field: Exclude<keyof VersionComposer, "isOpen">,
    value: string,
  ) => void;
  onGenerateSchema: () => void;
  onCreateVersion: (event: FormEvent<HTMLFormElement>) => void;
  onPromote: (version: PromptVersion) => void;
  onSetTag: (version: PromptVersion, tag: string) => void;
  onRemoveTag: (tag: string) => void;
};

function VersionNode({ status }: { status: PromptVersion["status"] }) {
  return (
    <span className="z-[1] mt-0.5 flex size-[19px] flex-none items-center justify-center">
      {status === "LIVE" ? (
        <span className="size-[11px] rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
      ) : status === "DRAFT" ? (
        <span className="size-[11px] rounded-full border-2 border-muted-foreground/50" />
      ) : (
        <span className="size-[9px] rounded-full bg-border" />
      )}
    </span>
  );
}

export function VersionLedger({
  versions,
  tags,
  liveVersion,
  promotingVersion,
  isCreatingVersion,
  isLoading,
  message,
  composer,
  onToggleComposer,
  onComposerFieldChange,
  onGenerateSchema,
  onCreateVersion,
  onPromote,
  onSetTag,
  onRemoveTag,
}: VersionLedgerProps) {
  const tagsForVersion = (versionId: string) => tags.filter((item) => item.versionId === versionId);

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between pb-2 pl-[26px]">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Immutable history · newest first
        </p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">{versions.length} versions</span>
          <Button onClick={onToggleComposer} size="sm" type="button" variant={composer.isOpen ? "secondary" : "default"}>
            {composer.isOpen ? "Close editor" : "New draft"}
          </Button>
        </div>
      </div>

      {composer.isOpen ? (
        <form
          className="mb-3 grid gap-3 rounded-xl border bg-card p-4"
          onSubmit={onCreateVersion}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="version-template">Template</Label>
            <Textarea
              disabled={isCreatingVersion}
              id="version-template"
              onChange={(event) => onComposerFieldChange("template", event.target.value)}
              required
              rows={7}
              value={composer.template}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="version-change-notes">What changed? optional</Label>
            <Input
              disabled={isCreatingVersion}
              id="version-change-notes"
              maxLength={300}
              onChange={(event) => onComposerFieldChange("changeNotes", event.target.value)}
              placeholder="tightened refund wording"
              value={composer.changeNotes}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor="version-model">Model optional</Label>
              <Input
                disabled={isCreatingVersion}
                id="version-model"
                onChange={(event) => onComposerFieldChange("model", event.target.value)}
                placeholder="gpt-4.1-mini"
                value={composer.model}
              />
            </div>
            <div className="flex items-end">
              <Button disabled={isCreatingVersion} onClick={onGenerateSchema} size="sm" type="button" variant="outline">
                Generate schema from template
              </Button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="version-schema-json">Variable schema JSON optional</Label>
            <Textarea
              disabled={isCreatingVersion}
              id="version-schema-json"
              onChange={(event) => onComposerFieldChange("variableSchema", event.target.value)}
              rows={4}
              value={composer.variableSchema}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="version-params">Model params JSON</Label>
            <Textarea
              disabled={isCreatingVersion}
              id="version-params"
              onChange={(event) => onComposerFieldChange("modelParams", event.target.value)}
              rows={3}
              value={composer.modelParams}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={onToggleComposer} size="sm" type="button" variant="ghost">
              Cancel
            </Button>
            <Button disabled={isCreatingVersion} size="sm" type="submit">
              {isCreatingVersion ? "Creating..." : "Create draft"}
            </Button>
          </div>
        </form>
      ) : null}

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">Loading versions...</p>
      ) : versions.length === 0 ? (
        <div className="grid content-start justify-items-start gap-1.5 rounded-xl border border-dashed p-6">
          <strong className="text-sm">No versions yet</strong>
          <p className="m-0 text-xs leading-relaxed text-muted-foreground">
            Cut an immutable draft, then promote it to go live.
          </p>
          <Button className="mt-1.5" onClick={onToggleComposer} size="sm" type="button">
            Create the first draft
          </Button>
        </div>
      ) : (
        <ol className="relative m-0 flex list-none flex-col p-0">
          <div aria-hidden className="absolute bottom-4 left-[9px] top-4 w-px bg-border" />
          {versions.map((version) => {
            const previousVersion = versions.find((item) => item.version === version.version - 1);
            const versionTagNames = tagsForVersion(version.id).map((item) => item.tag);
            const selectableTags = VERSION_TAGS.filter(
              (tag) => !versionTagNames.includes(tag),
            );

            return (
              <li
                className="group relative flex items-start gap-4 rounded-lg py-3 pr-2 transition-colors hover:bg-card"
                key={version.id}
              >
                <VersionNode status={version.status} />
                <div className="grid min-w-0 flex-1 gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono text-[13px] font-bold">v{version.version}</strong>
                    <StatusBadge status={version.status} />
                    {tagsForVersion(version.id).map((item) => (
                      <Badge key={item.id} variant="secondary">
                        {item.tag}
                        <button
                          aria-label={`Remove ${item.tag} tag`}
                          className="ml-0.5 text-current opacity-60 hover:opacity-100"
                          onClick={() => onRemoveTag(item.tag)}
                          type="button"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                    {selectableTags.length > 0 && version.status !== "DRAFT" ? (
                      <div className="relative">
                        <select
                          aria-label={`Add tag to v${version.version}`}
                          className="appearance-none rounded-full border border-dashed py-0.5 pl-2.5 pr-7 font-mono text-[11px] text-muted-foreground hover:border-foreground"
                          defaultValue=""
                          onChange={(event) => {
                            if (event.target.value) {
                              onSetTag(version, event.target.value);
                              event.target.value = "";
                            }
                          }}
                        >
                          <option disabled value="">
                            add tag
                          </option>
                          {selectableTags.map((tag) => (
                            <option key={tag} value={tag}>
                              {tag}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    ) : null}
                  </div>
                  {version.changeNotes ? (
                    <p className="text-xs leading-relaxed text-foreground/80">{version.changeNotes}</p>
                  ) : null}
                  <p className="font-mono text-[11.5px] text-muted-foreground">
                    {version.model ?? "no model"} ·{" "}
                    {version.status === "LIVE" && version.promotedAt
                      ? `promoted ${timeAgo(version.promotedAt)}`
                      : `created ${timeAgo(version.createdAt)}`}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  {version.status === "LIVE" ? (
                    previousVersion ? (
                      <Button
                        disabled={promotingVersion !== null}
                        onClick={() => onPromote(previousVersion)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Roll back to v{previousVersion.version}
                      </Button>
                    ) : null
                  ) : (
                    <Button
                      disabled={promotingVersion !== null}
                      onClick={() => onPromote(version)}
                      size="sm"
                      type="button"
                    >
                      {liveVersion ? "Roll back to this" : "Promote to live"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="pl-[26px] pt-2">
        <StatusLine message={message} />
      </div>
    </section>
  );
}

type RuntimePanelProps = {
  variablesJson: string;
  result: RuntimeRenderResult | null;
  isRendering: boolean;
  canRender: boolean;
  message: StatusMessage;
  onVariablesChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RuntimePanel({
  variablesJson,
  result,
  isRendering,
  canRender,
  message,
  onVariablesChange,
  onSubmit,
}: RuntimePanelProps) {
  return (
    <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
      <div className="grid content-start gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Variables JSON</p>
          <span className="font-mono text-[11px] text-muted-foreground">POST /runtime/…/render</span>
        </div>
        <Textarea
          className="font-mono text-xs leading-relaxed"
          disabled={!canRender || isRendering}
          onChange={(event) => onVariablesChange(event.target.value)}
          rows={12}
          value={variablesJson}
        />
        <Button className="justify-self-start" disabled={!canRender || isRendering} type="submit">
          {isRendering ? "Rendering..." : "Render"}
        </Button>
        <StatusLine message={message} />
      </div>
      <div className="grid content-start gap-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Rendered output</p>
          {result ? (
            <span className="font-mono text-[11px] text-muted-foreground">
              served v{result.promptVersion.version}
            </span>
          ) : null}
        </div>
        {result ? (
          <>
            <TemplateBlock template={result.renderedPrompt} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              What your application receives when it asks for the live prompt. Variables are
              validated against the schema before rendering.
            </p>
          </>
        ) : (
          <div className="grid content-start justify-items-start gap-1.5 rounded-xl border border-dashed p-6">
            <strong className="text-sm">No render yet</strong>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">
              Submit variables to preview exactly what the runtime returns for the live version.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

type ExecutionHistoryProps = {
  executions: ExecutionListItem[];
  selectedExecutionId: string | null;
  detail: ExecutionDetail | null;
  isLoadingDetail: boolean;
  isLoading: boolean;
  onSelect: (executionId: string) => void;
  onCloseDetail: () => void;
};

export function ExecutionHistory({
  executions,
  selectedExecutionId,
  detail,
  isLoadingDetail,
  isLoading,
  onSelect,
  onCloseDetail,
}: ExecutionHistoryProps) {
  if (executions.length === 0) {
    return (
      <div className="mt-5 grid content-start justify-items-start gap-1.5 rounded-xl border border-dashed p-6">
        <strong className="text-sm">{isLoading ? "Loading history..." : "No executions yet"}</strong>
        <p className="m-0 text-xs leading-relaxed text-muted-foreground">
          Every render through the runtime API shows up here with caller and cost.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>time</TableHead>
              <TableHead>caller</TableHead>
              <TableHead>ver</TableHead>
              <TableHead>latency</TableHead>
              <TableHead>tokens</TableHead>
              <TableHead>cost</TableHead>
              <TableHead>state</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.map((execution) => {
              const caller = execution.apiKey
                ? `${execution.apiKey.prefix}…`
                : execution.user?.email ?? "—";

              return (
                <TableRow
                  className={cn(
                    "cursor-pointer font-mono text-xs",
                    execution.id === selectedExecutionId && "bg-secondary",
                  )}
                  key={execution.id}
                  onClick={() => onSelect(execution.id)}
                >
                  <TableCell>{formatClock(execution.createdAt)}</TableCell>
                  <TableCell>{caller}</TableCell>
                  <TableCell>v{execution.promptVersion.version}</TableCell>
                  <TableCell>{execution.latencyMs ?? "—"} ms</TableCell>
                  <TableCell>{execution.totalTokens ?? "—"} tok</TableCell>
                  <TableCell>{execution.costUsd ? `$${execution.costUsd}` : "—"}</TableCell>
                  <TableCell>
                    {execution.error ? (
                      <Badge variant="destructive">error</Badge>
                    ) : (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" variant="outline">
                        ok
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {detail ? (
        <div className="mt-4 grid gap-3.5 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <strong className="font-mono text-xs">
              execution {detail.id.slice(0, 10)}… · v{detail.promptVersion.version}
            </strong>
            <Button onClick={onCloseDetail} size="sm" type="button" variant="ghost">
              Close
            </Button>
          </div>
          {isLoadingDetail ? (
            <p className="font-mono text-xs text-muted-foreground">Loading execution...</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <figure className="grid gap-1.5">
                  <figcaption className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Variables
                  </figcaption>
                  <pre className="overflow-x-auto rounded-lg border bg-secondary p-3 font-mono text-xs leading-relaxed">
                    {JSON.stringify(detail.variables, null, 2)}
                  </pre>
                </figure>
                <figure className="grid gap-1.5">
                  <figcaption className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Output
                  </figcaption>
                  <pre className="overflow-x-auto rounded-lg border bg-secondary p-3 font-mono text-xs leading-relaxed">
                    {detail.error ?? detail.output ?? "no output recorded"}
                  </pre>
                </figure>
              </div>
              <figure className="grid gap-1.5">
                <figcaption className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Rendered prompt
                </figcaption>
                <TemplateBlock template={detail.renderedPrompt} />
              </figure>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

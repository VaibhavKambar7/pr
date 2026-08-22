import { cn } from "@/lib/utils";

const FEATURES = [
  {
    body: "Create prompt records and immutable versions per project.",
    title: "registry",
  },
  {
    body: "Fetch or render the live version from another application.",
    title: "runtime",
  },
  {
    body: "Track prompt usage, variables, latency, and API-key attribution.",
    title: "history",
  },
];

export function AuthHero() {
  return (
    <section
      className={cn(
        "flex flex-col justify-center gap-10 border-b p-8 sm:p-12 lg:border-b-0 lg:border-r",
        "bg-muted/40",
      )}
    >
      <div className="max-w-xl">
        <span className="inline-flex h-7 items-center rounded-full border bg-card px-2.5 font-mono text-xs lowercase text-muted-foreground">
          pr
        </span>
        <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-tighter sm:text-5xl lg:text-6xl">
          Prompt registry for production apps.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg sm:tracking-tight">
          Pr gives engineering teams a registry for live prompt versions, runtime delivery, API
          keys, schema-checked variables, and execution history.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div className="rounded-xl border bg-card p-3.5" key={feature.title}>
            <strong className="mb-2 block text-sm font-semibold">{feature.title}</strong>
            <span className="text-xs leading-relaxed text-muted-foreground">{feature.body}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

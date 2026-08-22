import { Card } from "@/components/ui/card";

type RouteLoadingProps = {
  title: string;
  description: string;
};

export function RouteLoading({ title, description }: RouteLoadingProps) {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-md p-6">
        <span className="inline-flex h-7 items-center rounded-full border px-2.5 font-mono text-xs lowercase text-muted-foreground">
          pr
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
        <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="absolute inset-y-0 w-[38%] animate-[loading-slide_1.1s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </Card>
    </main>
  );
}

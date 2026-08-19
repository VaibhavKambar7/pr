type RouteLoadingProps = {
  title: string;
  description: string;
};

export function RouteLoading({ title, description }: RouteLoadingProps) {
  return (
    <main className="page-shell route-state-shell">
      <section className="route-state-card">
        <span className="eyebrow">Pr</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="loading-bar" aria-hidden="true" />
      </section>
    </main>
  );
}

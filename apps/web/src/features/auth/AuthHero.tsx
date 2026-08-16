export function AuthHero() {
  return (
    <section className="brand-card">
      <span className="eyebrow">Prompt infrastructure, not prompt chaos</span>
      <h1 className="hero-title">Ship prompts like product code.</h1>
      <p className="hero-copy">
        Promptu lets teams manage live prompt versions outside app deploys, with runtime delivery, API
        keys, rollback, and execution history baked into the workflow.
      </p>

      <div className="feature-row">
        <div className="feature-pill">
          <strong>Registry</strong>
          <span>Create prompt records and immutable versions per project.</span>
        </div>
        <div className="feature-pill">
          <strong>Runtime</strong>
          <span>Fetch or render the live version from another application.</span>
        </div>
        <div className="feature-pill">
          <strong>History</strong>
          <span>Track prompt usage, variables, latency, and API-key attribution.</span>
        </div>
      </div>
    </section>
  );
}

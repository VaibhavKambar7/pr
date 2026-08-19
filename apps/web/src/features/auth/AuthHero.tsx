export function AuthHero() {
  return (
    <section className="brand-card">
      <div>
        <span className="eyebrow">Pr</span>
        <h1 className="hero-title">Prompt registry for production apps.</h1>
        <p className="hero-copy">
          Pr gives engineering teams a registry for live prompt versions, runtime delivery, API keys,
          schema-checked variables, and execution history.
        </p>
      </div>

      <div className="feature-row">
        <div className="feature-pill">
          <strong>registry</strong>
          <span>Create prompt records and immutable versions per project.</span>
        </div>
        <div className="feature-pill">
          <strong>runtime</strong>
          <span>Fetch or render the live version from another application.</span>
        </div>
        <div className="feature-pill">
          <strong>history</strong>
          <span>Track prompt usage, variables, latency, and API-key attribution.</span>
        </div>
      </div>
    </section>
  );
}

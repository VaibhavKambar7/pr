export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "linear-gradient(135deg, rgb(248, 250, 252) 0%, rgb(226, 232, 240) 100%)",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          padding: "2rem",
          borderRadius: "24px",
          backgroundColor: "white",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
        }}
      >
        <p style={{ margin: 0, color: "#475569", fontSize: "0.95rem" }}>Prompt Infrastructure</p>
        <h1 style={{ margin: "0.75rem 0 1rem", fontSize: "3rem", lineHeight: 1 }}>pr</h1>
        <p style={{ margin: 0, color: "#334155", fontSize: "1.1rem", lineHeight: 1.7 }}>
          Build, version, and ship prompts without redeploying applications.
        </p>
      </section>
    </main>
  );
}

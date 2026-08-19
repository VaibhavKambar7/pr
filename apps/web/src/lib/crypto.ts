export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function versionIdempotencyKey(
  promptId: string,
  input: {
    template: string;
    variableSchema?: Record<string, unknown>;
    model?: string;
    modelParams?: Record<string, unknown>;
  },
): Promise<string> {
  const payload = JSON.stringify({
    template: input.template,
    variableSchema: input.variableSchema ?? null,
    model: input.model ?? null,
    modelParams: input.modelParams ?? null,
  });
  const hash = await sha256Hex(payload);
  return `cv:${promptId}:${hash}`;
}

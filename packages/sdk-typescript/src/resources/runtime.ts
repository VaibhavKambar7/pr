import { request } from "../http.js";
import type { RequestContext, RequestOptions } from "../http.js";
import type {
  GetPromptOptions,
  RenderPromptInput,
  RuntimeGetResult,
  RuntimeRenderResult,
} from "../types.js";

export class RuntimeResource {
  constructor(
    private readonly context: RequestContext,
    private readonly projectId: string,
  ) {}

  async get(promptId: string, options: GetPromptOptions = {}): Promise<RuntimeGetResult> {
    const requestOptions: RequestOptions = {
      method: "GET",
      query: { tag: options.tag },
      signal: options.signal,
    };

    return request<RuntimeGetResult>(this.context, this.projectPath(promptId, "/live"), requestOptions);
  }

  async render(promptId: string, input: RenderPromptInput): Promise<RuntimeRenderResult> {
    const { signal, tag, variables } = input;
    const requestOptions: RequestOptions = {
      method: "POST",
      query: { tag },
      body: { variables },
      signal,
    };

    return request<RuntimeRenderResult>(
      this.context,
      this.projectPath(promptId, "/render"),
      requestOptions,
    );
  }

  private projectPath(promptId: string, suffix = ""): string {
    return `/runtime/projects/${encodeURIComponent(this.projectId)}/prompts/${encodeURIComponent(promptId)}${suffix}`;
  }
}

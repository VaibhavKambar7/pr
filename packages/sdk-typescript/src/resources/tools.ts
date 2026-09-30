import { request } from "../http.js";
import type { RequestContext } from "../http.js";
import type { ListToolsOptions, RuntimeToolListResult } from "../types.js";

export class ToolResource {
  constructor(
    private readonly context: RequestContext,
    private readonly projectId: string,
  ) {}

  list(options: ListToolsOptions = {}): Promise<RuntimeToolListResult> {
    return request<RuntimeToolListResult>(this.context, this.projectPath(), {
      method: "GET",
      signal: options.signal,
    });
  }

  private projectPath(): string {
    return `/runtime/projects/${encodeURIComponent(this.projectId)}/tools`;
  }
}

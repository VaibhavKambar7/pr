import { request } from "../http.js";
import type { RequestContext } from "../http.js";
import type {
  GetToolOptions,
  ListToolsOptions,
  RuntimeToolGetResult,
  RuntimeToolListResult,
  RuntimeToolValidationResult,
  ToolInput,
  ValidateToolInputOptions,
} from "../types.js";

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

  get(toolSlug: string, options: GetToolOptions = {}): Promise<RuntimeToolGetResult> {
    return request<RuntimeToolGetResult>(
      this.context,
      `${this.projectPath()}/${encodeURIComponent(toolSlug)}`,
      {
        method: "GET",
        signal: options.signal,
      },
    );
  }

  validate(
    toolSlug: string,
    input: ToolInput,
    options: ValidateToolInputOptions = {},
  ): Promise<RuntimeToolValidationResult> {
    return request<RuntimeToolValidationResult>(
      this.context,
      `${this.projectPath()}/${encodeURIComponent(toolSlug)}/validate`,
      {
        method: "POST",
        body: { input },
        signal: options.signal,
      },
    );
  }

  private projectPath(): string {
    return `/runtime/projects/${encodeURIComponent(this.projectId)}/tools`;
  }
}

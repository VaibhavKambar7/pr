import type { FormEventHandler } from "react";
import type {
  ApiKey,
  AuthUser,
  ExecutionDetail,
  ExecutionListItem,
  Prompt,
  PromptVersion,
  PromptVersionTag,
  Project,
  RuntimeRenderResult,
} from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

type SectionStateProps = {
  title: string;
  description: string;
  tone?: "empty" | "error" | "loading";
};

function SectionState({ title, description, tone = "empty" }: SectionStateProps) {
  return (
    <div className={`section-state ${tone}`}>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

type DashboardSummaryProps = {
  user: AuthUser;
  projects: Project[];
  selectedProject: Project | null;
  liveVersion: PromptVersion | null;
  onLogout: () => void;
};

export function DashboardSummary({
  user,
  projects,
  selectedProject,
  liveVersion,
  onLogout,
}: DashboardSummaryProps) {
  return (
    <Card as="section" className="dashboard-card-hero">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1>Welcome, {user.name ?? user.email}.</h1>
          <p>
            Create a project workspace first. Every prompt, version, API key, and execution belongs to
            one of these projects.
          </p>
        </div>
        <Button onClick={onLogout} variant="secondary">
          Log out
        </Button>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <span>Total projects</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="metric-card">
          <span>Active project</span>
          <strong>{selectedProject?.slug ?? "none"}</strong>
        </div>
        <div className="metric-card">
          <span>Live version</span>
          <strong>{liveVersion ? `v${liveVersion.version}` : "none"}</strong>
        </div>
      </div>
    </Card>
  );
}

type ProjectSectionProps = {
  projects: Project[];
  selectedProjectId: string | null;
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  projectMessage: string;
  isProjectError: boolean;
  isLoadingProjects: boolean;
  isCreatingProject: boolean;
  onSelectProject: (projectId: string) => void;
  onProjectNameChange: (value: string) => void;
  onProjectSlugChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onCreateProject: FormEventHandler<HTMLFormElement>;
};

export function ProjectSection({
  projects,
  selectedProjectId,
  projectName,
  projectSlug,
  projectDescription,
  projectMessage,
  isProjectError,
  isLoadingProjects,
  isCreatingProject,
  onSelectProject,
  onProjectNameChange,
  onProjectSlugChange,
  onProjectDescriptionChange,
  onCreateProject,
}: ProjectSectionProps) {
  return (
    <section className="workspace-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Projects</span>
          <h2>Workspaces</h2>
          <p>Select the workspace your application will use at runtime.</p>
        </div>

        {isLoadingProjects ? (
          <SectionState
            description="Fetching your workspaces from the API."
            title="Loading projects"
            tone="loading"
          />
        ) : null}

        {!isLoadingProjects && projects.length === 0 ? (
          <SectionState description="Create one on the right. Then we can add prompts inside it." title="No projects yet" />
        ) : null}

        <div className="project-list">
          {projects.map((project) => (
            <Button
              className={`project-card ${project.id === selectedProjectId ? "active" : ""}`}
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              type="button"
              variant="ghost"
            >
              <span>{project.slug}</span>
              <strong>{project.name}</strong>
              <small>{project.description || "No description yet"}</small>
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <span className="eyebrow">Create</span>
          <h2>New project</h2>
          <p>This becomes the parent workspace for prompts and API keys.</p>
        </div>

        <form className="form-stack" onSubmit={onCreateProject}>
          <div className="field">
            <label htmlFor="project-name">Project name</label>
            <Input
              id="project-name"
              minLength={2}
              onChange={(event) => onProjectNameChange(event.target.value)}
              placeholder="Customer Support AI"
              required
              value={projectName}
            />
          </div>

          <div className="field">
            <label htmlFor="project-slug">Slug optional</label>
            <Input
              id="project-slug"
              minLength={2}
              onChange={(event) => onProjectSlugChange(event.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="customer-support-ai"
              title="Use lowercase letters, numbers, and hyphens"
              value={projectSlug}
            />
          </div>

          <div className="field">
            <label htmlFor="project-description">Description optional</label>
            <Textarea
              id="project-description"
              maxLength={500}
              onChange={(event) => onProjectDescriptionChange(event.target.value)}
              placeholder="Prompts used by the support automation service."
              rows={4}
              value={projectDescription}
            />
          </div>

          <Button disabled={isCreatingProject} type="submit">
            {isCreatingProject ? "Creating..." : "Create project"}
          </Button>
        </form>

        <p className={`status-message ${isProjectError ? "error" : ""}`}>{projectMessage}</p>
      </Card>
    </section>
  );
}

type ApiKeysSectionProps = {
  selectedProject: Project | null;
  apiKeys: ApiKey[];
  apiKeyName: string;
  apiKeyMessage: string;
  newRawApiKey: string | null;
  isApiKeyError: boolean;
  isLoadingApiKeys: boolean;
  isCreatingApiKey: boolean;
  revokingApiKeyId: string | null;
  onApiKeyNameChange: (value: string) => void;
  onCreateApiKey: FormEventHandler<HTMLFormElement>;
  onRevokeApiKey: (apiKey: ApiKey) => void;
};

export function ApiKeysSection({
  selectedProject,
  apiKeys,
  apiKeyName,
  apiKeyMessage,
  newRawApiKey,
  isApiKeyError,
  isLoadingApiKeys,
  isCreatingApiKey,
  revokingApiKeyId,
  onApiKeyNameChange,
  onCreateApiKey,
  onRevokeApiKey,
}: ApiKeysSectionProps) {
  return (
    <section className="api-keys-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Application Access</span>
          <h2>API keys</h2>
          <p>External services use these keys as bearer tokens to fetch or render live prompts at runtime.</p>
        </div>

        {isLoadingApiKeys ? (
          <SectionState
            description="Fetching application credentials for this project."
            title="Loading API keys"
            tone="loading"
          />
        ) : null}

        {!isLoadingApiKeys && selectedProject && apiKeys.length === 0 ? (
          <SectionState
            description="Create one on the right before wiring another app to runtime endpoints."
            title="No API keys yet"
          />
        ) : null}

        {!selectedProject ? (
          <SectionState
            description="Select or create a project before managing API keys."
            title="No project selected"
          />
        ) : null}

        <div className="api-key-list">
          {apiKeys.map((apiKey) => (
            <article className={`api-key-card ${apiKey.revokedAt ? "revoked" : ""}`} key={apiKey.id}>
              <div>
                <span>{apiKey.revokedAt ? "revoked" : "active"}</span>
                <strong>{apiKey.name}</strong>
                <small>
                  prefix {apiKey.prefix} · created {new Date(apiKey.createdAt).toLocaleString()}
                </small>
                <small>
                  {apiKey.lastUsedAt
                    ? `last used ${new Date(apiKey.lastUsedAt).toLocaleString()}`
                    : "not used yet"}
                </small>
              </div>
              <Button
                disabled={Boolean(apiKey.revokedAt) || revokingApiKeyId === apiKey.id}
                onClick={() => onRevokeApiKey(apiKey)}
                type="button"
                variant="secondary"
              >
                {revokingApiKeyId === apiKey.id ? "Revoking..." : apiKey.revokedAt ? "Revoked" : "Revoke"}
              </Button>
            </article>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <span className="eyebrow">Create</span>
          <h2>New API key</h2>
          <p>The raw key is shown once. Store it in the calling application's environment.</p>
        </div>

        <form className="form-stack" onSubmit={onCreateApiKey}>
          <div className="field">
            <label htmlFor="api-key-name">Key name</label>
            <Input
              disabled={!selectedProject}
              id="api-key-name"
              minLength={2}
              onChange={(event) => onApiKeyNameChange(event.target.value)}
              placeholder="support-service-dev"
              required
              value={apiKeyName}
            />
          </div>

          <Button disabled={!selectedProject || isCreatingApiKey} type="submit">
            {isCreatingApiKey ? "Creating..." : "Create API key"}
          </Button>
        </form>

        {newRawApiKey ? (
          <div className="secret-panel">
            <span>Raw key shown once</span>
            <code>{newRawApiKey}</code>
          </div>
        ) : (
          <div className="active-record">
            <span>Runtime header</span>
            <strong>Authorization: Bearer pr_...</strong>
          </div>
        )}

        <p className={`status-message ${isApiKeyError ? "error" : ""}`}>{apiKeyMessage}</p>
      </Card>
    </section>
  );
}

type PromptRegistrySectionProps = {
  selectedProject: Project | null;
  selectedPrompt: Prompt | null;
  prompts: Prompt[];
  selectedPromptId: string | null;
  promptName: string;
  promptSlug: string;
  promptDescription: string;
  promptMessage: string;
  isPromptError: boolean;
  isLoadingPrompts: boolean;
  isCreatingPrompt: boolean;
  onSelectPrompt: (promptId: string) => void;
  onPromptNameChange: (value: string) => void;
  onPromptSlugChange: (value: string) => void;
  onPromptDescriptionChange: (value: string) => void;
  onCreatePrompt: FormEventHandler<HTMLFormElement>;
};

export function PromptRegistrySection({
  selectedProject,
  selectedPrompt,
  prompts,
  selectedPromptId,
  promptName,
  promptSlug,
  promptDescription,
  promptMessage,
  isPromptError,
  isLoadingPrompts,
  isCreatingPrompt,
  onSelectPrompt,
  onPromptNameChange,
  onPromptSlugChange,
  onPromptDescriptionChange,
  onCreatePrompt,
}: PromptRegistrySectionProps) {
  return (
    <section className="registry-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Prompt Registry</span>
          <h2>{selectedProject ? selectedProject.name : "Select a project"}</h2>
          <p>Prompts are stable records. The actual prompt text lives in immutable versions below.</p>
        </div>

        {isLoadingPrompts ? (
          <SectionState
            description="Fetching prompt records for the selected workspace."
            title="Loading prompts"
            tone="loading"
          />
        ) : null}

        {!isLoadingPrompts && selectedProject && prompts.length === 0 ? (
          <SectionState
            description="Create a prompt record, then add versioned templates to it."
            title="No prompts in this project"
          />
        ) : null}

        {!selectedProject ? (
          <SectionState
            description="Select or create a project above before adding prompt records."
            title="No project selected"
          />
        ) : null}

        <div className="prompt-list">
          {prompts.map((prompt) => (
            <Button
              className={`prompt-card ${prompt.id === selectedPromptId ? "active" : ""}`}
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt.id)}
              type="button"
              variant="ghost"
            >
              <div>
                <span>{prompt.slug}</span>
                <strong>{prompt.name}</strong>
                <small>{prompt.description || "No description yet"}</small>
              </div>
              <em>{prompt.id === selectedPromptId ? "selected" : "registry"}</em>
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <span className="eyebrow">Create</span>
          <h2>New prompt</h2>
          <p>Add a named prompt record. Versioned templates are managed below.</p>
        </div>

        <form className="form-stack" onSubmit={onCreatePrompt}>
          <div className="field">
            <label htmlFor="prompt-name">Prompt name</label>
            <Input
              disabled={!selectedProject}
              id="prompt-name"
              minLength={2}
              onChange={(event) => onPromptNameChange(event.target.value)}
              placeholder="Support reply generator"
              required
              value={promptName}
            />
          </div>

          <div className="field">
            <label htmlFor="prompt-slug">Slug optional</label>
            <Input
              disabled={!selectedProject}
              id="prompt-slug"
              minLength={2}
              onChange={(event) => onPromptSlugChange(event.target.value)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="support-reply-generator"
              title="Use lowercase letters, numbers, and hyphens"
              value={promptSlug}
            />
          </div>

          <div className="field">
            <label htmlFor="prompt-description">Description optional</label>
            <Textarea
              disabled={!selectedProject}
              id="prompt-description"
              maxLength={500}
              onChange={(event) => onPromptDescriptionChange(event.target.value)}
              placeholder="Creates concise customer support replies using ticket context."
              rows={4}
              value={promptDescription}
            />
          </div>

          <Button disabled={!selectedProject || isCreatingPrompt} type="submit">
            {isCreatingPrompt ? "Creating..." : "Create prompt"}
          </Button>
        </form>

        <div className="active-record">
          <span>Active prompt</span>
          <strong>{selectedPrompt?.name ?? "none"}</strong>
        </div>

        <p className={`status-message ${isPromptError ? "error" : ""}`}>{promptMessage}</p>
      </Card>
    </section>
  );
}

type PromptVersionsSectionProps = {
  selectedPrompt: Prompt | null;
  liveVersion: PromptVersion | null;
  promptVersions: PromptVersion[];
  promptTags: PromptVersionTag[];
  selectedTag: string;
  versionTemplate: string;
  versionModel: string;
  versionModelParams: string;
  versionVariableSchema: string;
  isVersionVariableSchemaDirty: boolean;
  versionMessage: string;
  isVersionError: boolean;
  isLoadingVersions: boolean;
  isCreatingVersion: boolean;
  promotingVersion: number | null;
  onVersionTemplateChange: (value: string) => void;
  onVersionModelChange: (value: string) => void;
  onVersionModelParamsChange: (value: string) => void;
  onVersionVariableSchemaChange: (value: string) => void;
  onVersionVariableSchemaGenerate: () => void;
  onCreateVersion: FormEventHandler<HTMLFormElement>;
  onPromoteVersion: (promptVersion: PromptVersion) => void;
  onSetTag: (promptVersion: PromptVersion, tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onSelectedTagChange: (tag: string) => void;
};

export function PromptVersionsSection({
  selectedPrompt,
  liveVersion,
  promptVersions,
  promptTags,
  selectedTag,
  versionTemplate,
  versionModel,
  versionModelParams,
  versionVariableSchema,
  isVersionVariableSchemaDirty,
  versionMessage,
  isVersionError,
  isLoadingVersions,
  isCreatingVersion,
  promotingVersion,
  onVersionTemplateChange,
  onVersionModelChange,
  onVersionModelParamsChange,
  onVersionVariableSchemaChange,
  onVersionVariableSchemaGenerate,
  onCreateVersion,
  onPromoteVersion,
  onSetTag,
  onRemoveTag,
  onSelectedTagChange,
}: PromptVersionsSectionProps) {
  const AVAILABLE_TAGS = ["production", "staging", "canary"] as const;

  function getVersionTag(version: PromptVersion): string | undefined {
    return promptTags.find((t) => t.versionId === version.id)?.tag;
  }
  return (
    <section className="versions-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Versions</span>
          <h2>{selectedPrompt ? selectedPrompt.name : "Select a prompt"}</h2>
          <p>Create immutable templates and choose exactly one live version for runtime use.</p>
        </div>

        {isLoadingVersions ? (
          <SectionState
            description="Fetching immutable templates for the selected prompt."
            title="Loading versions"
            tone="loading"
          />
        ) : null}

        {!isLoadingVersions && selectedPrompt && promptVersions.length === 0 ? (
          <SectionState description="Create v1 on the right. After that, promote it live." title="No versions yet" />
        ) : null}

        {!selectedPrompt ? (
          <SectionState
            description="Select or create a prompt above before adding versions."
            title="No prompt selected"
          />
        ) : null}

        <div className="version-list">
          {promptVersions.map((promptVersion) => {
            const versionTag = getVersionTag(promptVersion);
            const isLiveVersion = promptVersion.status === "LIVE";
            const versionActionLabel = isLiveVersion
              ? "Live"
              : liveVersion
                ? "Rollback to this"
                : "Make live";

            return (
              <article className="version-card" key={promptVersion.id}>
                <div className="version-card-header">
                  <div>
                    <Badge variant={promptVersion.status.toLowerCase() === "live" ? "live" : "draft"}>
                      {promptVersion.status}
                    </Badge>
                    {versionTag ? (
                      <Badge variant={versionTag === "production" ? "live" : "draft"}>
                        {versionTag}
                      </Badge>
                    ) : null}
                    <strong>v{promptVersion.version}</strong>
                  </div>
                  <Button
                    disabled={isLiveVersion || promotingVersion === promptVersion.version}
                    onClick={() => onPromoteVersion(promptVersion)}
                    type="button"
                    variant="secondary"
                  >
                    {promotingVersion === promptVersion.version ? "Working..." : versionActionLabel}
                  </Button>
                </div>

                <div className="tag-manager">
                  <label htmlFor={`version-tag-${promptVersion.id}`}>Tag</label>
                  <select
                    id={`version-tag-${promptVersion.id}`}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value) {
                        onSetTag(promptVersion, value);
                      }
                    }}
                    value={versionTag ?? ""}
                  >
                    <option value="">untagged</option>
                    {AVAILABLE_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  {versionTag ? (
                    <Button
                      onClick={() => onRemoveTag(versionTag)}
                      type="button"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>

              <pre>{promptVersion.template}</pre>
              {promptVersion.variableSchema && typeof promptVersion.variableSchema === "object" ? (
                <details className="schema-details">
                  <summary>Schema details</summary>
                  <pre>{JSON.stringify(promptVersion.variableSchema, null, 2)}</pre>
                </details>
              ) : null}
              <small>
                {promptVersion.model ? `model: ${promptVersion.model}` : "model not set"} · created{" "}
                {new Date(promptVersion.createdAt).toLocaleString()}
              </small>
            </article>
          );
          })}
        </div>
      </Card>

      <Card>
        <div className="section-heading">
          <span className="eyebrow">Create</span>
          <h2>New version</h2>
          <p>Every prompt text change creates a new immutable version.</p>
        </div>

        <form className="form-stack" onSubmit={onCreateVersion}>
          <div className="field">
            <label htmlFor="version-template">Template</label>
            <Textarea
              disabled={!selectedPrompt}
              id="version-template"
              onChange={(event) => onVersionTemplateChange(event.target.value)}
              placeholder="Write a concise support reply for {{ customer_name }} about {{ issue }}."
              required
              rows={7}
              value={versionTemplate}
            />
          </div>

          <div className="field">
            <label htmlFor="version-model">Model optional</label>
            <Input
              disabled={!selectedPrompt}
              id="version-model"
              onChange={(event) => onVersionModelChange(event.target.value)}
              placeholder="gpt-4.1-mini"
              value={versionModel}
            />
          </div>

          <div className="field">
            <label htmlFor="version-model-params">Model params JSON optional</label>
            <Textarea
              disabled={!selectedPrompt}
              id="version-model-params"
              onChange={(event) => onVersionModelParamsChange(event.target.value)}
              rows={4}
              value={versionModelParams}
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label htmlFor="version-variable-schema">Variable schema JSON optional</label>
              <Button
                disabled={!selectedPrompt}
                onClick={onVersionVariableSchemaGenerate}
                type="button"
                variant="ghost"
              >
                Generate from template
              </Button>
            </div>
            <Textarea
              disabled={!selectedPrompt}
              id="version-variable-schema"
              onChange={(event) => onVersionVariableSchemaChange(event.target.value)}
              rows={8}
              value={versionVariableSchema}
            />
          </div>

          <Button disabled={!selectedPrompt || isCreatingVersion} type="submit">
            {isCreatingVersion ? "Creating..." : "Create version"}
          </Button>
        </form>

        <div className="active-record">
          <span>Live version</span>
          <strong>{liveVersion ? `v${liveVersion.version}` : "none"}</strong>
        </div>

        <p className={`status-message ${isVersionError ? "error" : ""}`}>{versionMessage}</p>
      </Card>
    </section>
  );
}

type RuntimeRenderSectionProps = {
  selectedProject: Project | null;
  selectedPrompt: Prompt | null;
  liveVersion: PromptVersion | null;
  runtimeVariables: string;
  runtimeMessage: string;
  renderResult: RuntimeRenderResult | null;
  isRuntimeError: boolean;
  isRenderingPrompt: boolean;
  onRuntimeVariablesChange: (value: string) => void;
  onRenderLivePrompt: FormEventHandler<HTMLFormElement>;
};

export function RuntimeRenderSection({
  selectedProject,
  selectedPrompt,
  liveVersion,
  runtimeVariables,
  runtimeMessage,
  renderResult,
  isRuntimeError,
  isRenderingPrompt,
  onRuntimeVariablesChange,
  onRenderLivePrompt,
}: RuntimeRenderSectionProps) {
  return (
    <section className="runtime-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Runtime</span>
          <h2>Render live prompt</h2>
          <p>
            This simulates what an application does at runtime: ask Pr for the current live prompt
            without redeploying.
          </p>
        </div>

        <form className="form-stack" onSubmit={onRenderLivePrompt}>
          <div className="field">
            <label htmlFor="runtime-variables">Variables JSON</label>
            <Textarea
              disabled={!selectedPrompt || !liveVersion}
              id="runtime-variables"
              onChange={(event) => onRuntimeVariablesChange(event.target.value)}
              rows={7}
              value={runtimeVariables}
            />
          </div>

          <Button
            disabled={!selectedPrompt || !liveVersion || isRenderingPrompt}
            type="submit"
          >
            {isRenderingPrompt ? "Rendering..." : "Render live prompt"}
          </Button>
        </form>

        <div className="active-record">
          <span>Runtime target</span>
          <strong>
            {selectedProject?.slug && selectedPrompt?.slug
              ? `${selectedProject.slug}/${selectedPrompt.slug}`
              : "none"}
          </strong>
        </div>

        <p className={`status-message ${isRuntimeError ? "error" : ""}`}>{runtimeMessage}</p>
      </Card>

      <Card className="render-output-card">
        <div className="section-heading">
          <span className="eyebrow">Output</span>
          <h2>Rendered prompt</h2>
          <p>The render call also creates an execution-history record.</p>
        </div>

        {renderResult ? (
          <>
            <div className="active-record">
              <span>Execution ID</span>
              <strong>{renderResult.executionId}</strong>
            </div>

            <div className="active-record">
              <span>Live version used</span>
              <strong>v{renderResult.promptVersion.version}</strong>
            </div>

            <pre className="rendered-prompt">{renderResult.renderedPrompt}</pre>
          </>
        ) : (
          <SectionState
            description="Render the live prompt to preview the final text and create an execution record."
            title="No render yet"
          />
        )}
      </Card>
    </section>
  );
}

type ExecutionHistorySectionProps = {
  selectedProject: Project | null;
  executions: ExecutionListItem[];
  selectedExecutionId: string | null;
  executionDetail: ExecutionDetail | null;
  executionMessage: string;
  isExecutionError: boolean;
  isLoadingExecutions: boolean;
  isLoadingExecutionDetail: boolean;
  onSelectExecution: (executionId: string) => void;
};

export function ExecutionHistorySection({
  selectedProject,
  executions,
  selectedExecutionId,
  executionDetail,
  executionMessage,
  isExecutionError,
  isLoadingExecutions,
  isLoadingExecutionDetail,
  onSelectExecution,
}: ExecutionHistorySectionProps) {
  return (
    <section className="execution-grid">
      <Card>
        <div className="section-heading">
          <span className="eyebrow">Observability</span>
          <h2>Execution history</h2>
          <p>
            Every runtime render creates an execution record with inputs, rendered output, latency, and
            caller attribution.
          </p>
        </div>

        {isLoadingExecutions ? (
          <SectionState
            description="Fetching runtime calls for the selected workspace and prompt."
            title="Loading executions"
            tone="loading"
          />
        ) : null}

        {!isLoadingExecutions && selectedProject && executions.length === 0 ? (
          <SectionState
            description="Render the live prompt above to create an execution history record."
            title="No executions yet"
          />
        ) : null}

        {!selectedProject ? (
          <SectionState description="Select a project before viewing execution history." title="No project selected" />
        ) : null}

        <div className="execution-list">
          {executions.map((execution) => (
            <Button
              className={`execution-card ${execution.id === selectedExecutionId ? "active" : ""}`}
              key={execution.id}
              onClick={() => onSelectExecution(execution.id)}
              type="button"
              variant="ghost"
            >
              <div>
                <span>{execution.error ? "error" : "render"}</span>
                <strong>{execution.prompt.name}</strong>
                <small>
                  v{execution.promptVersion.version} · {execution.latencyMs ?? "-"}ms ·{" "}
                  {new Date(execution.createdAt).toLocaleString()}
                </small>
                <small>
                  caller{" "}
                  {execution.apiKey
                    ? `${execution.apiKey.name} (${execution.apiKey.prefix})`
                    : execution.user?.email ?? "unknown"}
                </small>
              </div>
              <em>{execution.id === selectedExecutionId ? "selected" : "view"}</em>
            </Button>
          ))}
        </div>

        <p className={`status-message ${isExecutionError ? "error" : ""}`}>{executionMessage}</p>
      </Card>

      <Card className="execution-detail-card">
        <div className="section-heading">
          <span className="eyebrow">Detail</span>
          <h2>Execution detail</h2>
          <p>Inspect the exact variables and rendered prompt used for this runtime call.</p>
        </div>

        {isLoadingExecutionDetail ? (
          <SectionState
            description="Fetching the full inputs and rendered prompt for this execution."
            title="Loading detail"
            tone="loading"
          />
        ) : null}

        {executionDetail ? (
          <>
            <div className="detail-grid">
              <div className="active-record">
                <span>Execution</span>
                <strong>{executionDetail.id}</strong>
              </div>
              <div className="active-record">
                <span>Latency</span>
                <strong>{executionDetail.latencyMs ?? "-"}ms</strong>
              </div>
              <div className="active-record">
                <span>Version</span>
                <strong>v{executionDetail.promptVersion.version}</strong>
              </div>
              <div className="active-record">
                <span>Caller</span>
                <strong>
                  {executionDetail.apiKey ? executionDetail.apiKey.name : executionDetail.user?.email ?? "unknown"}
                </strong>
              </div>
            </div>

            <div className="json-panel">
              <span>Variables</span>
              <pre>{JSON.stringify(executionDetail.variables, null, 2)}</pre>
            </div>

            <div className="json-panel">
              <span>Rendered prompt</span>
              <pre>{executionDetail.renderedPrompt}</pre>
            </div>
          </>
        ) : (
          <SectionState
            description="Select an execution from the list to inspect its details."
            title="No execution selected"
          />
        )}
      </Card>
    </section>
  );
}

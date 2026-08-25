from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional, Union

PromptVariableValue = Union[str, int, float, bool, None]
PromptVariables = Dict[str, PromptVariableValue]

PromptVersionStatus = str  # one of "DRAFT" | "LIVE" | "ARCHIVED"


@dataclass(frozen=True)
class Prompt:
    id: str
    project_id: str
    name: str
    slug: str
    description: Optional[str]
    created_at: str
    updated_at: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Prompt":
        return cls(
            id=data["id"],
            project_id=data["projectId"],
            name=data["name"],
            slug=data["slug"],
            description=data.get("description"),
            created_at=data["createdAt"],
            updated_at=data["updatedAt"],
        )


@dataclass(frozen=True)
class PromptVersion:
    id: str
    prompt_id: str
    version: int
    status: PromptVersionStatus
    template: str
    variable_schema: Optional[Dict[str, Any]]
    model: Optional[str]
    model_params: Any
    created_at: str
    promoted_at: Optional[str]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PromptVersion":
        return cls(
            id=data["id"],
            prompt_id=data["promptId"],
            version=data["version"],
            status=data["status"],
            template=data["template"],
            variable_schema=data.get("variableSchema"),
            model=data.get("model"),
            model_params=data.get("modelParams"),
            created_at=data["createdAt"],
            promoted_at=data.get("promotedAt"),
        )


@dataclass(frozen=True)
class RuntimeGetResult:
    prompt: Prompt
    prompt_version: PromptVersion

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RuntimeGetResult":
        return cls(
            prompt=Prompt.from_dict(data["prompt"]),
            prompt_version=PromptVersion.from_dict(data["promptVersion"]),
        )


@dataclass(frozen=True)
class RuntimeRenderResult:
    execution_id: str
    prompt: Prompt
    prompt_version: PromptVersion
    rendered_prompt: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "RuntimeRenderResult":
        return cls(
            execution_id=data["executionId"],
            prompt=Prompt.from_dict(data["prompt"]),
            prompt_version=PromptVersion.from_dict(data["promptVersion"]),
            rendered_prompt=data["renderedPrompt"],
        )

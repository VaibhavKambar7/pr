from __future__ import annotations

from typing import Any, Dict, Optional
from urllib.parse import quote

from ..http import RequestContext, request_async, request_sync
from ..types import (
    PromptVariables,
    RuntimeGetResult,
    RuntimeRenderResult,
)


def _project_path(project_id: str, prompt_id: str, suffix: str = "") -> str:
    return (
        f"/runtime/projects/{quote(project_id, safe='')}"
        f"/prompts/{quote(prompt_id, safe='')}{suffix}"
    )


class RuntimeResource:
    """Synchronous access to runtime endpoints (API key auth)."""

    def __init__(self, context: RequestContext, client: Any, project_id: str) -> None:
        self._context = context
        self._client = client
        self._project_id = project_id

    def get(self, prompt_id: str, *, tag: Optional[str] = None) -> RuntimeGetResult:
        data = request_sync(
            self._context,
            self._client,
            _project_path(self._project_id, prompt_id, "/live"),
            query={"tag": tag} if tag else None,
        )
        return RuntimeGetResult.from_dict(data)

    def render(
        self,
        prompt_id: str,
        *,
        variables: PromptVariables,
        tag: Optional[str] = None,
    ) -> RuntimeRenderResult:
        body: Dict[str, Any] = {"variables": variables}
        data = request_sync(
            self._context,
            self._client,
            _project_path(self._project_id, prompt_id, "/render"),
            method="POST",
            json_body=body,
        )
        return RuntimeRenderResult.from_dict(data)


class AsyncRuntimeResource:
    """Async access to runtime endpoints."""

    def __init__(self, context: RequestContext, client: Any, project_id: str) -> None:
        self._context = context
        self._client = client
        self._project_id = project_id

    async def get(self, prompt_id: str, *, tag: Optional[str] = None) -> RuntimeGetResult:
        data = await request_async(
            self._context,
            self._client,
            _project_path(self._project_id, prompt_id, "/live"),
            query={"tag": tag} if tag else None,
        )
        return RuntimeGetResult.from_dict(data)

    async def render(
        self,
        prompt_id: str,
        *,
        variables: PromptVariables,
        tag: Optional[str] = None,
    ) -> RuntimeRenderResult:
        body: Dict[str, Any] = {"variables": variables}
        data = await request_async(
            self._context,
            self._client,
            _project_path(self._project_id, prompt_id, "/render"),
            method="POST",
            json_body=body,
        )
        return RuntimeRenderResult.from_dict(data)

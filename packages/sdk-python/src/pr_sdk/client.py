from __future__ import annotations

from typing import Optional

import httpx

from .http import DEFAULT_BASE_URL, DEFAULT_TIMEOUT_SECONDS, RequestContext
from .resources.runtime import AsyncRuntimeResource, RuntimeResource


def _validate_options(
    api_key: str,
    project_id: str,
    base_url: str,
    timeout_seconds: float,
) -> None:
    if not isinstance(api_key, str) or not api_key.strip():
        raise ValueError("`api_key` must be a non-empty string")
    if not isinstance(project_id, str) or not project_id.strip():
        raise ValueError("`project_id` must be a non-empty string")
    if not isinstance(base_url, str) or not base_url.strip():
        raise ValueError("`base_url` must be a non-empty string when provided")
    if timeout_seconds <= 0:
        raise ValueError("`timeout_ms` must be a positive number when provided")


def _normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/")


class _BasePrClient:
    def __init__(
        self,
        *,
        api_key: str,
        project_id: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout_ms: float = DEFAULT_TIMEOUT_SECONDS * 1000,
    ) -> None:
        timeout_seconds = timeout_ms / 1000

        _validate_options(api_key, project_id, base_url, timeout_seconds)

        self._context = RequestContext(
            base_url=_normalize_base_url(base_url),
            api_key=api_key,
            timeout_seconds=timeout_seconds,
        )
        self._project_id = project_id


class PrClient(_BasePrClient):
    """Synchronous client for the Pr runtime API.

    Use as a context manager to reuse connections::

        with PrClient(api_key="pr_...", project_id="...") as pr:
            result = pr.runtime.render("my-prompt", variables={"tone": "formal"})
    """

    def __init__(
        self,
        *,
        api_key: str,
        project_id: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout_ms: float = DEFAULT_TIMEOUT_SECONDS * 1000,
    ) -> None:
        super().__init__(
            api_key=api_key,
            project_id=project_id,
            base_url=base_url,
            timeout_ms=timeout_ms,
        )
        self._http_client = httpx.Client(timeout=self._context.timeout_seconds)
        self.runtime = RuntimeResource(self._context, self._http_client, self._project_id)

    def close(self) -> None:
        self._http_client.close()

    def __enter__(self) -> "PrClient":
        return self

    def __exit__(self, *_exc_info: object) -> None:
        self.close()


class AsyncPrClient(_BasePrClient):
    """Async client for the Pr runtime API.

    Use as an async context manager::

        async with AsyncPrClient(api_key="pr_...", project_id="...") as pr:
            result = await pr.runtime.render("my-prompt", variables={"tone": "formal"})
    """

    def __init__(
        self,
        *,
        api_key: str,
        project_id: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout_ms: float = DEFAULT_TIMEOUT_SECONDS * 1000,
    ) -> None:
        super().__init__(
            api_key=api_key,
            project_id=project_id,
            base_url=base_url,
            timeout_ms=timeout_ms,
        )
        self._http_client = httpx.AsyncClient(timeout=self._context.timeout_seconds)
        self.runtime = AsyncRuntimeResource(self._context, self._http_client, self._project_id)

    async def aclose(self) -> None:
        await self._http_client.aclose()

    async def __aenter__(self) -> "AsyncPrClient":
        return self

    async def __aexit__(self, *_exc_info: object) -> None:
        await self.aclose()

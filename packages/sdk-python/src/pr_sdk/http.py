from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

import httpx

from .errors import (
    PrNetworkError,
    PrServerError,
    PrTimeoutError,
    create_error_for_status,
    parse_error_body,
)

DEFAULT_BASE_URL = "http://localhost:3001"
DEFAULT_TIMEOUT_SECONDS = 10.0


@dataclass
class RequestContext:
    base_url: str
    api_key: str
    timeout_seconds: float


def build_request_url(context: RequestContext, path: str) -> str:
    return context.base_url + path


def _parse_retry_after_ms(response: httpx.Response) -> Optional[int]:
    header = response.headers.get("retry-after")

    if header is None:
        return None

    try:
        return max(int(float(header) * 1000), 0)
    except ValueError:
        return None


def _handle_response(response: httpx.Response) -> Any:
    if 200 <= response.status_code < 300:
        if not response.content:
            return None

        return response.json()

    parsed = parse_error_body(response.text)
    retry_after_ms = _parse_retry_after_ms(response) if response.status_code == 429 else None

    raise create_error_for_status(
        response.status_code,
        parsed.message,
        code=parsed.code,
        issues=parsed.issues,
        retry_after_ms=retry_after_ms,
    )


def request_sync(
    context: RequestContext,
    client: httpx.Client,
    path: str,
    *,
    method: str = "GET",
    query: Optional[Dict[str, str]] = None,
    json_body: Optional[Dict[str, Any]] = None,
) -> Any:
    try:
        response = client.request(
            method,
            build_request_url(context, path),
            params={k: v for k, v in query.items() if v is not None} if query else None,
            json=json_body if json_body is not None else None,
            headers={"Authorization": f"Bearer {context.api_key}"},
        )
    except httpx.TimeoutException as error:
        raise PrTimeoutError(f"request timed out after {context.timeout_seconds}s") from error
    except httpx.HTTPError as error:
        raise PrNetworkError("network request failed") from error

    return _handle_response(response)


async def request_async(
    context: RequestContext,
    client: httpx.AsyncClient,
    path: str,
    *,
    method: str = "GET",
    query: Optional[Dict[str, str]] = None,
    json_body: Optional[Dict[str, Any]] = None,
) -> Any:
    import asyncio

    try:
        response = await client.request(
            method,
            build_request_url(context, path),
            params={k: v for k, v in query.items() if v is not None} if query else None,
            json=json_body if json_body is not None else None,
            headers={"Authorization": f"Bearer {context.api_key}"},
        )
    except asyncio.CancelledError:
        raise
    except httpx.TimeoutException as error:
        raise PrTimeoutError(f"request timed out after {context.timeout_seconds}s") from error
    except httpx.HTTPError as error:
        raise PrNetworkError("network request failed") from error

    return _handle_response(response)


__all__ = [
    "DEFAULT_BASE_URL",
    "DEFAULT_TIMEOUT_SECONDS",
    "RequestContext",
    "request_sync",
    "request_async",
    "PrServerError",
]

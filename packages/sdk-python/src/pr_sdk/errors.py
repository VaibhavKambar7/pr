from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class PrErrorIssue:
    path: str
    message: str


@dataclass(frozen=True)
class PrErrorOptions:
    status: Optional[int] = None
    code: Optional[str] = None
    issues: List[PrErrorIssue] = field(default_factory=list)


class PrError(Exception):
    """Base error for all SDK errors."""

    def __init__(
        self,
        message: str,
        *,
        status: Optional[int] = None,
        code: Optional[str] = None,
        issues: Optional[List[PrErrorIssue]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.issues: List[PrErrorIssue] = list(issues or [])


class PrAuthenticationError(PrError):
    """401 — missing or invalid API key."""


class PrAuthorizationError(PrError):
    """403 — key cannot access this project."""


class PrNotFoundError(PrError):
    """404 — prompt, version, or tag not found."""


class PrValidationError(PrError):
    """400 — invalid query/body or failed variable schema validation."""


class PrConflictError(PrError):
    """409 — conflict."""


class PrRateLimitError(PrError):
    """429 — rate limited."""

    def __init__(
        self,
        message: str,
        *,
        retry_after_ms: Optional[int] = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(message, **kwargs)
        self.retry_after_ms = retry_after_ms


class PrServerError(PrError):
    """5xx — server-side failure."""


class PrNetworkError(PrError):
    """Request could not reach the server."""


class PrTimeoutError(PrError):
    """Request exceeded the configured timeout."""


def create_error_for_status(
    status: int,
    message: str,
    *,
    code: Optional[str] = None,
    issues: Optional[List[PrErrorIssue]] = None,
    retry_after_ms: Optional[int] = None,
) -> PrError:
    kwargs: Dict[str, Any] = {"status": status, "code": code, "issues": issues}

    if status == 400:
        return PrValidationError(message, **kwargs)
    if status == 401:
        return PrAuthenticationError(message, **kwargs)
    if status == 403:
        return PrAuthorizationError(message, **kwargs)
    if status == 404:
        return PrNotFoundError(message, **kwargs)
    if status == 409:
        return PrConflictError(message, **kwargs)
    if status == 429:
        return PrRateLimitError(message, retry_after_ms=retry_after_ms, **kwargs)
    if 500 <= status <= 599:
        return PrServerError(message, **kwargs)
    return PrError(message, **kwargs)


def _normalize_issues(value: Any) -> List[PrErrorIssue]:
    issues: List[PrErrorIssue] = []

    # shape: [{ path, message }, ...]
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict):
                path = item.get("path")
                message = item.get("message")
                if isinstance(path, str) and isinstance(message, str):
                    issues.append(PrErrorIssue(path=path, message=message))
        return issues

    # zod flatten().fieldErrors shape: { field: ["message", ...] }
    if isinstance(value, dict):
        for path, messages in value.items():
            if isinstance(messages, list):
                for message in messages:
                    if isinstance(message, str):
                        issues.append(PrErrorIssue(path=path, message=message))

    return issues


@dataclass(frozen=True)
class ParsedErrorBody:
    message: str
    code: Optional[str] = None
    issues: List[PrErrorIssue] = field(default_factory=list)


def parse_error_body(body: Any) -> ParsedErrorBody:
    if isinstance(body, (bytes, bytearray)):
        body = body.decode("utf-8", errors="replace")

    if isinstance(body, str):
        import json

        try:
            body = json.loads(body)
        except ValueError:
            return ParsedErrorBody(message=body)

    if not isinstance(body, dict):
        return ParsedErrorBody(message="request failed")

    raw_error = body.get("error")

    if isinstance(raw_error, str):
        code = body.get("code") if isinstance(body.get("code"), str) else None
        issues = _normalize_issues(body.get("issues"))
        return ParsedErrorBody(message=raw_error, code=code, issues=issues)

    if isinstance(raw_error, dict):
        message = raw_error.get("message")
        code = raw_error.get("code") if isinstance(raw_error.get("code"), str) else None
        issues = _normalize_issues(raw_error.get("issues"))
        return ParsedErrorBody(
            message=message if isinstance(message, str) else "request failed",
            code=code,
            issues=issues,
        )

    message = body.get("message")

    if isinstance(message, str):
        return ParsedErrorBody(message=message)

    return ParsedErrorBody(message="request failed")

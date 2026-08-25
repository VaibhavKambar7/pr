# pr-sdk

Python SDK for [Pr](../../README.md) — fetch and render production prompts from your Python code.

## Install

```bash
pip install -e packages/sdk-python   # local dev
# pip install pr-sdk                 # once published
```

Requires Python 3.9+. Uses `httpx`.

## Usage

### Sync

```python
from pr_sdk import PrClient, PrNotFoundError

with PrClient(
    api_key="pr_...",                # or os.environ["PR_API_KEY"]
    project_id="cmx...",
    # base_url="http://localhost:3001",  # default
    # timeout_ms=10_000,                  # default
) as pr:
    result = pr.runtime.render("my-prompt", variables={"tone": "formal"})
    print(result.rendered_prompt)

    version = pr.runtime.get("my-prompt")              # live version
    canary = pr.runtime.get("my-prompt", tag="canary")  # tagged version

    try:
        pr.runtime.get("does-not-exist")
    except PrNotFoundError as e:
        print(e.status, e.code, e.message)
```

### Async

```python
import asyncio
from pr_sdk import AsyncPrClient

async def main():
    async with AsyncPrClient(api_key="pr_...", project_id="cmx...") as pr:
        result = await pr.runtime.render("my-prompt", variables={"tone": "formal"})
        print(result.rendered_prompt)

asyncio.run(main())
```

## Errors

All errors inherit from `PrError`:

| Exception | Meaning |
| --- | --- |
| `PrValidationError` | 400 — bad variables/query (see `.issues`) |
| `PrAuthenticationError` | 401 — missing/invalid API key |
| `PrAuthorizationError` | 403 — key cannot access this project |
| `PrNotFoundError` | 404 — prompt/version/tag not found |
| `PrConflictError` | 409 |
| `PrRateLimitError` | 429 (see `.retry_after_ms`) |
| `PrServerError` | 5xx |
| `PrNetworkError` | could not reach the server |
| `PrTimeoutError` | exceeded `timeout_ms` |

Every error carries `.status`, `.code`, and `.issues` when the server provides them.

## Notes

- Responses are frozen dataclasses in snake_case (`rendered_prompt`, `prompt_version`), mapped from the API's camelCase JSON.
- `render()` creates an execution record server-side — the SDK does **not** auto-retry it.

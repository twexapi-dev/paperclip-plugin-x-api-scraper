# Contributing

Thanks for helping improve the TwexAPI Paperclip plugin.

## Before opening an issue or PR

- Search existing issues and pull requests for the same request.
- Keep reports specific, reproducible, and public-safe.
- Never include API keys, credentials, or private account data.
- For suspected vulnerabilities, follow [.github/SECURITY.md](./.github/SECURITY.md).

Useful issue details:

- Plugin version and install command
- Paperclip tool name and minimal input
- Expected and actual behavior
- Links to public docs or registry pages involved

## Pull requests

- Keep changes focused on one issue or improvement.
- Do not add endpoints that are not in the [TwexAPI OpenAPI](https://docs.twexapi.io/openapi.json).
- Do not copy Xquik-only fields such as WOEID trends, search `limit`, or `includeReplies`.
- Run `pnpm check` and `pnpm check:reproducible` before opening a PR.
- Add regression tests for behavior changes.

TwexAPI is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

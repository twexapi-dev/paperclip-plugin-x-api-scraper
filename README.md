# Twitter search & X API tools for Paperclip agents

Add 6 read-only TwexAPI tools to Paperclip agents for Twitter search, tweet lookup, profiles, timelines, and trending tweets.

## Tools

| Agent task | Paperclip tool | Result |
| --- | --- | --- |
| Search tweets | `twexapi.search_tweets` | Run a Twitter search with query operators. |
| Read one tweet | `twexapi.lookup_tweet` | Get a tweet by ID. |
| Find X users | `twexapi.search_users` | Search by name or username. |
| Read a profile | `twexapi.get_user` | Get public profile data. |
| Read profile tweets | `twexapi.get_user_tweets` | List recent posts from one user. |
| Read trending tweets | `twexapi.get_trends` | Get trending tweets by country. |

This plugin does not export followers or publish posts. Use the [TwexAPI REST API](https://docs.twexapi.io/api-reference/overview) for those tasks.

## TwexAPI routes

| Agent task | Paperclip tool | TwexAPI route |
| --- | --- | --- |
| Search tweets | `twexapi.search_tweets` | `POST /twitter/advanced_search/page` |
| Read one tweet | `twexapi.lookup_tweet` | `POST /v2/tweet/detail` |
| Search users | `twexapi.search_users` | `GET /twitter/search-user/{keyword}/{target_count}` |
| Read a profile | `twexapi.get_user` | `GET /twitter/{screen_name}/about` |
| Read profile tweets | `twexapi.get_user_tweets` | `POST /twitter/{screen_name}/timeline/page` |
| Read trending tweets | `twexapi.get_trends` | `GET /twitter/global-trending/tweets` |

## Configuration

- `apiBaseUrl`: TwexAPI REST endpoint. Defaults to `https://api.twexapi.io`.
- `apiKeySecretRef`: Paperclip secret reference for the TwexAPI API key.
- `defaultTimelineCount`: Default timeline page count from 1 to 100.
- `defaultUserSearchCount`: Default user search count from 1 to 100.
- `defaultTrendCount`: Default trend count from 1 to 100.

Paperclip resolves the API key at call time and sends `Authorization: Bearer`.

Create an API key in the [TwexAPI dashboard](https://twexapi.io/dashboard) and store it in a Paperclip secret referenced by `apiKeySecretRef`.

## Install

```sh
paperclipai plugin install @twexapi-dev/paperclip-plugin-x-api-scraper
```

Pin the current release when you need reproducible installs:

```sh
paperclipai plugin install @twexapi-dev/paperclip-plugin-x-api-scraper --version 0.1.2
```

npm: [@twexapi-dev/paperclip-plugin-x-api-scraper](https://www.npmjs.com/package/@twexapi-dev/paperclip-plugin-x-api-scraper)

## Develop locally

```sh
pnpm install
pnpm check
pnpm check:reproducible
```

`pnpm check` runs type checks, tests at 100% coverage, and the build.
`pnpm check:reproducible` compares 2 clean builds and package archives. CI checks REUSE 3.3 metadata and dependencies.

## API contract

- [OpenAPI schema](https://docs.twexapi.io/openapi.json)
- [API reference](https://docs.twexapi.io/api-reference/overview)
- [Support policy](./SUPPORT.md)
- [Security policy](./.github/SECURITY.md)
- [Contribution guide](./CONTRIBUTING.md)

TwexAPI is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

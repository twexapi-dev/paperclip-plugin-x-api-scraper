# Twitter search and X API tools for Paperclip agents

TwexAPI is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

Add 6 read-only TwexAPI tools to Paperclip agents for Twitter search, tweet lookup, profiles, timelines, and trending tweets.

## Tools

| Agent task | Paperclip tool | TwexAPI route |
| --- | --- | --- |
| Search tweets | `twexapi.search_tweets` | `POST /twitter/advanced_search/page` |
| Read one tweet | `twexapi.lookup_tweet` | `POST /v2/tweet/detail` |
| Find X users | `twexapi.search_users` | `GET /twitter/search-user/{keyword}/{target_count}` |
| Read a profile | `twexapi.get_user` | `GET /twitter/{screen_name}/about` |
| Read profile tweets | `twexapi.get_user_tweets` | `POST /twitter/{screen_name}/timeline/page` |
| Read trending tweets | `twexapi.get_trends` | `GET /twitter/global-trending/tweets` |

This plugin does not export followers or publish posts. Use the TwexAPI REST API for those tasks.

## Configuration

- `apiBaseUrl`: TwexAPI REST endpoint. Defaults to `https://api.twexapi.io`.
- `apiKeySecretRef`: Paperclip secret reference for the TwexAPI API key.
- `defaultTimelineCount`: Default timeline page count from 1 to 100.
- `defaultUserSearchCount`: Default user search count from 1 to 100.
- `defaultTrendCount`: Default trend count from 1 to 100.

Paperclip resolves the API key at call time and sends `Authorization: Bearer`.

## Install

```sh
paperclipai plugin install @twexapi/paperclip-plugin-x-api-scraper
```

Pin the current release when you need reproducible installs:

```sh
paperclipai plugin install @twexapi/paperclip-plugin-x-api-scraper --version 0.1.0
```

## Develop locally

```sh
pnpm install
pnpm check
pnpm check:reproducible
```

`pnpm check` runs type checks, tests at 100% coverage, and the build.

## Documentation

- [TwexAPI docs](https://docs.twexapi.io)
- [REST overview](https://docs.twexapi.io/api-reference/overview)

TwexAPI is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.

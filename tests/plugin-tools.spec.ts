import { afterEach, describe, expect, it, vi } from "vitest";
import { twexApiRequest } from "../src/helpers.js";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import {
  createHarness,
  defaultConfig,
  jsonResponse,
  useResponses,
} from "./test-helpers.js";

describe("TwexAPI Paperclip plugin tools", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers connection details and searches tweets", async () => {
    expect.assertions(9);

    const requests = useResponses([
      jsonResponse({
        data: [{ tweet_id: "123", text: "hello" }],
        has_next_page: true,
        next_cursor: "cursor",
      }),
    ]);
    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const connection = await harness.getData("connection");
    const output = await harness.executeTool(TOOL_NAMES.searchTweets, {
      q: " from:twexapi ",
      sortBy: "Top",
      next_cursor: "cursor",
      extraTerms: ["lang:en", "  "],
    });
    const requestedUrl = new URL(requests[0]?.url ?? "");
    const requestedHeaders = new Headers(requests[0]?.init?.headers);
    const body = JSON.parse(String(requests[0]?.init?.body ?? "{}")) as Record<
      string,
      unknown
    >;

    expect(connection).toEqual({
      apiBaseUrl: "https://api.twexapi.io",
      configured: true,
      tools: Object.values(TOOL_NAMES),
    });
    expect(output.error).toBeUndefined();
    expect(output.content).toBe("Found 1 tweet. More results are available.");
    expect(output.data).toEqual({
      data: [{ tweet_id: "123", text: "hello" }],
      has_next_page: true,
      next_cursor: "cursor",
    });
    expect(requestedUrl.pathname).toBe("/twitter/advanced_search/page");
    expect(requestedUrl.origin).toBe("https://api.twexapi.io");
    expect(body).toEqual({
      searchTerms: ["from:twexapi", "lang:en"],
      sortBy: "Top",
      next_cursor: "cursor",
    });
    expect(requestedHeaders.get("authorization")).toBe(
      "Bearer resolved:X_API_SCRAPER_KEY",
    );
    expect(requests[0]?.init?.method).toBe("POST");
  });

  it("runs all 6 read-only tools and the connection check", async () => {
    expect.assertions(9);

    const requests = useResponses([
      jsonResponse([{ tweet_id: "999" }]),
      jsonResponse({ data: [{ userName: "alice" }] }),
      jsonResponse({ data: { userName: "bob" } }),
      jsonResponse({
        data: [{ tweet_id: "1" }, { tweet_id: "2" }],
        next_cursor: "next",
      }),
      jsonResponse({ data: [{ tweet_id: "trend" }] }),
      jsonResponse({ balance: 10 }),
    ]);
    const harness = createHarness({
      ...defaultConfig,
      apiBaseUrl: "https://api.twexapi.io///",
    });
    await plugin.definition.setup(harness.ctx);

    const tweet = await harness.executeTool(TOOL_NAMES.lookupTweet, {
      id: "999",
    });
    const users = await harness.executeTool(TOOL_NAMES.searchUsers, {
      q: "alice",
    });
    const user = await harness.executeTool(TOOL_NAMES.getUser, {
      screen_name: "@bob",
    });
    const timeline = await harness.executeTool(TOOL_NAMES.getUserTweets, {
      screen_name: "bob",
      next_cursor: "next",
      count: 100,
    });
    const trends = await harness.executeTool(TOOL_NAMES.getTrends, {
      count: 200,
      topic: "",
      content: "  ",
    });
    const connection = await harness.performAction("test-connection");

    expect(tweet).toEqual({
      content: "Fetched tweet 999.",
      data: [{ tweet_id: "999" }],
    });
    expect(users).toEqual({
      content: "Found 1 user.",
      data: { data: [{ userName: "alice" }] },
    });
    expect(user).toEqual({
      content: "Fetched profile bob.",
      data: { data: { userName: "bob" } },
    });
    expect(timeline).toEqual({
      content: "Fetched 2 tweets for bob. More results are available.",
      data: {
        data: [{ tweet_id: "1" }, { tweet_id: "2" }],
        next_cursor: "next",
      },
    });
    expect(trends).toEqual({
      content: "Fetched 1 trending tweet.",
      data: { data: [{ tweet_id: "trend" }] },
    });
    expect(connection).toEqual({ ok: true, data: { balance: 10 } });
    expect(requests.map(({ url }) => url)).toEqual([
      "https://api.twexapi.io/v2/tweet/detail",
      "https://api.twexapi.io/twitter/search-user/alice/10",
      "https://api.twexapi.io/twitter/bob/about",
      "https://api.twexapi.io/twitter/bob/timeline/page",
      "https://api.twexapi.io/twitter/global-trending/tweets?country=United+States&count=100",
      "https://api.twexapi.io/balance",
    ]);
    expect(
      requests.every(
        ({ init }) =>
          new Headers(init?.headers).get("authorization") ===
          "Bearer resolved:X_API_SCRAPER_KEY",
      ),
    ).toBe(true);
    expect(JSON.parse(String(requests[3]?.init?.body ?? "{}"))).toEqual({
      count: 100,
      next_cursor: "next",
    });
  });

  it("searches tweets without a cursor and posts an empty JSON body by default", async () => {
    expect.assertions(3);

    const requests = useResponses([
      jsonResponse({ data: [], has_next_page: false }),
      jsonResponse({ ok: true }),
    ]);
    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const output = await harness.executeTool(TOOL_NAMES.searchTweets, {
      q: "haystack",
    });
    await twexApiRequest(harness.ctx, "POST", "/v2/tweet/detail");

    expect(output.content).toBe("Found 0 tweets.");
    expect(JSON.parse(String(requests[0]?.init?.body ?? "{}"))).toEqual({
      searchTerms: ["haystack"],
      sortBy: "Latest",
    });
    expect(requests[1]?.init?.body).toBe("{}");
  });
});

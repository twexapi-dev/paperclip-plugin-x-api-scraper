import { afterEach, describe, expect, it, vi } from "vitest";
import plugin from "../src/worker.js";
import { TOOL_NAMES } from "../src/constants.js";
import {
  createHarness,
  defaultConfig,
  jsonResponse,
  useResponses,
} from "./test-helpers.js";

describe("TwexAPI Paperclip plugin error messages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("explains how to add each missing required parameter", async () => {
    expect.assertions(1);

    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    const outputs = await Promise.all([
      harness.executeTool(TOOL_NAMES.searchTweets, {}),
      harness.executeTool(TOOL_NAMES.lookupTweet, { id: "" }),
      harness.executeTool(TOOL_NAMES.searchUsers, { q: 42 }),
      harness.executeTool(TOOL_NAMES.getUser, { screen_name: "   " }),
      harness.executeTool(TOOL_NAMES.getUserTweets, { screen_name: null }),
    ]);

    expect(outputs).toEqual([
      { error: "q is required. Add q and retry." },
      { error: "id is required. Add id and retry." },
      { error: "q is required. Add q and retry." },
      { error: "screen_name is required. Add screen_name and retry." },
      { error: "screen_name is required. Add screen_name and retry." },
    ]);
  });

  it("summarizes empty, text, and malformed collection responses", async () => {
    expect.assertions(2);

    const requests = useResponses([
      new Response(null, { status: 200 }),
      new Response("plain text", { status: 200 }),
      jsonResponse({ data: "unexpected", has_next_page: false, next_cursor: 12 }),
      jsonResponse({}),
      jsonResponse({}),
    ]);
    const harness = createHarness({
      ...defaultConfig,
      defaultTimelineCount: "invalid",
    });
    await plugin.definition.setup(harness.ctx);

    const outputs = [
      await harness.executeTool(TOOL_NAMES.searchTweets, { q: "empty" }),
      await harness.executeTool(TOOL_NAMES.searchTweets, { q: "text" }),
      await harness.executeTool(TOOL_NAMES.searchTweets, { q: "shape" }),
      await harness.executeTool(TOOL_NAMES.getUserTweets, {
        screen_name: "alice",
      }),
      await harness.executeTool(TOOL_NAMES.getTrends, {}),
    ];

    expect(outputs).toEqual([
      { content: "Found 0 tweets.", data: null },
      { content: "Found 0 tweets.", data: "plain text" },
      {
        content: "Found 0 tweets.",
        data: { data: "unexpected", has_next_page: false, next_cursor: 12 },
      },
      { content: "Fetched 0 tweets for alice.", data: {} },
      { content: "Fetched 0 trending tweets.", data: {} },
    ]);
    expect(JSON.parse(String(requests[3]?.init?.body ?? "{}"))).toEqual({
      count: 20,
    });
  });

  it("tells users how to configure a missing API key", async () => {
    expect.assertions(1);

    const harness = createHarness({});
    await plugin.definition.setup(harness.ctx);

    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI API key is not configured. Add apiKeySecretRef.",
    );
  });

  it("preserves API errors and handles bodies without a message", async () => {
    expect.assertions(6);

    const longError = "x".repeat(300);
    useResponses([
      jsonResponse({ msg: "denied" }, 403),
      jsonResponse({ message: null, error: "blocked" }, 429),
      jsonResponse({ msg: "   " }, 500),
      jsonResponse({ message: 42 }, 500),
      new Response(longError, { status: 502 }),
      new Response("   ", { status: 503 }),
    ]);
    const harness = createHarness();
    await plugin.definition.setup(harness.ctx);

    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI request failed with status 403: denied",
    );
    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI request failed with status 429: blocked",
    );
    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI request failed with status 500: Request failed. Check the request and retry.",
    );
    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI request failed with status 500: Request failed. Check the request and retry.",
    );
    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      `TwexAPI request failed with status 502: ${longError.slice(0, 240)}`,
    );
    await expect(harness.executeTool(TOOL_NAMES.getTrends, {})).rejects.toThrow(
      "TwexAPI request failed with status 503: Request failed. Check the request and retry.",
    );
  });
});

import {
  definePlugin,
  runWorker,
  type PluginContext,
  type PluginHealthDiagnostics,
  type ToolResult,
} from "@paperclipai/plugin-sdk";
import { TOOL_NAMES } from "./constants.js";
import {
  arrayCount,
  asInteger,
  asString,
  asStringArray,
  countLabel,
  getConfig,
  normalizeConfig,
  pageSuffix,
  requirePathSegment,
  requireString,
  stripHandle,
  twexApiRequest,
  type ToolParams,
} from "./helpers.js";

let currentContext: PluginContext | null = null;

async function registerTools(ctx: PluginContext): Promise<void> {
  ctx.tools.register(
    TOOL_NAMES.searchTweets,
    {
      displayName: "Search tweets",
      description: "Search tweets with Twitter search operators through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          extraTerms: { type: "array", items: { type: "string" } },
          sortBy: { type: "string", enum: ["Latest", "Top"] },
          next_cursor: { type: "string" },
        },
        required: ["q"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const sortBy = asString(payload, "sortBy") ?? "Latest";
      const searchTerms = [q, ...asStringArray(payload, "extraTerms")];
      const data = await twexApiRequest(ctx, "POST", "/twitter/advanced_search/page", {
        body: {
          searchTerms,
          sortBy,
          ...(asString(payload, "next_cursor")
            ? { next_cursor: asString(payload, "next_cursor") }
            : {}),
        },
      });
      const count = arrayCount(data, "data");
      return {
        content: `Found ${countLabel(count, "tweet")}.${pageSuffix(data)}`,
        data,
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.lookupTweet,
    {
      displayName: "Get tweet",
      description: "Get tweet detail by ID through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const id = requirePathSegment(payload, "id");
      if (typeof id !== "string") return id;
      const data = await twexApiRequest(ctx, "POST", "/v2/tweet/detail", {
        body: [id],
      });
      return { content: `Fetched tweet ${id}.`, data };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.searchUsers,
    {
      displayName: "Search users",
      description: "Search X profiles by name or username.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          target_count: { type: "integer", minimum: 1, maximum: 100 },
        },
        required: ["q"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const q = requireString(payload, "q");
      if (typeof q !== "string") return q;
      const config = await getConfig(ctx);
      const targetCount = asInteger(
        payload,
        "target_count",
        config.defaultUserSearchCount,
        1,
        100,
      );
      const keyword = encodeURIComponent(q);
      const data = await twexApiRequest(
        ctx,
        "GET",
        `/twitter/search-user/${keyword}/${targetCount}`,
      );
      const count = arrayCount(data, "data");
      return { content: `Found ${countLabel(count, "user")}.`, data };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getUser,
    {
      displayName: "Get user profile",
      description: "Get an X profile by screen name.",
      parametersSchema: {
        type: "object",
        properties: { screen_name: { type: "string" } },
        required: ["screen_name"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const screenName = requirePathSegment(payload, "screen_name");
      if (typeof screenName !== "string") return screenName;
      const handle = encodeURIComponent(stripHandle(screenName));
      const data = await twexApiRequest(ctx, "GET", `/twitter/${handle}/about`);
      return { content: `Fetched profile ${stripHandle(screenName)}.`, data };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getUserTweets,
    {
      displayName: "Get user tweets",
      description: "Read one timeline page from an X user.",
      parametersSchema: {
        type: "object",
        properties: {
          screen_name: { type: "string" },
          count: { type: "integer", minimum: 1, maximum: 100 },
          next_cursor: { type: "string" },
        },
        required: ["screen_name"],
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const screenName = requirePathSegment(payload, "screen_name");
      if (typeof screenName !== "string") return screenName;
      const config = await getConfig(ctx);
      const handle = encodeURIComponent(stripHandle(screenName));
      const count = asInteger(
        payload,
        "count",
        config.defaultTimelineCount,
        1,
        100,
      );
      const data = await twexApiRequest(
        ctx,
        "POST",
        `/twitter/${handle}/timeline/page`,
        {
          body: {
            count,
            ...(asString(payload, "next_cursor")
              ? { next_cursor: asString(payload, "next_cursor") }
              : {}),
          },
        },
      );
      const tweetCount = arrayCount(data, "data");
      return {
        content: `Fetched ${countLabel(tweetCount, "tweet")} for ${stripHandle(screenName)}.${pageSuffix(data)}`,
        data,
      };
    },
  );

  ctx.tools.register(
    TOOL_NAMES.getTrends,
    {
      displayName: "Get trending tweets",
      description: "Read trending tweets for a country through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: {
          country: { type: "string" },
          count: { type: "integer", minimum: 1, maximum: 100 },
          topic: { type: "string" },
          content: { type: "string" },
        },
      },
    },
    async (params): Promise<ToolResult> => {
      const payload = params as ToolParams;
      const config = await getConfig(ctx);
      const data = await twexApiRequest(
        ctx,
        "GET",
        "/twitter/global-trending/tweets",
        {
          params: {
            country: asString(payload, "country") ?? "United States",
            count: asInteger(
              payload,
              "count",
              config.defaultTrendCount,
              1,
              100,
            ),
            topic: asString(payload, "topic"),
            content: asString(payload, "content"),
          },
        },
      );
      const count = arrayCount(data, "data");
      return { content: `Fetched ${countLabel(count, "trending tweet")}.`, data };
    },
  );
}

const plugin = definePlugin({
  async setup(ctx): Promise<void> {
    currentContext = ctx;

    ctx.data.register("connection", async () => {
      const config = await getConfig(ctx);
      return {
        apiBaseUrl: config.apiBaseUrl,
        configured: config.apiKeySecretRef.length > 0,
        tools: Object.values(TOOL_NAMES),
      };
    });

    ctx.actions.register("test-connection", async () => {
      const data = await twexApiRequest(ctx, "GET", "/balance");
      return { ok: true, data };
    });

    await registerTools(ctx);
  },

  async onHealth(): Promise<PluginHealthDiagnostics> {
    const ctx = currentContext;
    if (ctx === null) {
      return {
        status: "degraded",
        message: "Plugin worker has not started. Start the plugin.",
      };
    }
    const config = await getConfig(ctx);
    return {
      status: config.apiKeySecretRef ? "ok" : "degraded",
      message: config.apiKeySecretRef
        ? "TwexAPI plugin is ready."
        : "TwexAPI API key is missing. Add apiKeySecretRef.",
      details: {
        apiBaseUrl: config.apiBaseUrl,
        tools: Object.values(TOOL_NAMES),
      },
    };
  },

  async onValidateConfig(config): Promise<{
    ok: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const resolved = normalizeConfig(config);
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!resolved.apiKeySecretRef) {
      errors.push("apiKeySecretRef is required. Add a Paperclip secret reference.");
    }
    try {
      new URL(resolved.apiBaseUrl);
    } catch {
      errors.push("apiBaseUrl is invalid. Enter a complete URL.");
    }
    if (resolved.apiBaseUrl !== "https://api.twexapi.io") {
      warnings.push("apiBaseUrl should be https://api.twexapi.io unless you use a proxy.");
    }
    return { ok: errors.length === 0, errors, warnings };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);

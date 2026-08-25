import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";
import {
  DEFAULT_API_BASE_URL,
  DEFAULT_TIMELINE_COUNT,
  DEFAULT_TREND_COUNT,
  DEFAULT_USER_SEARCH_COUNT,
  PLUGIN_ID,
  PLUGIN_VERSION,
  TOOL_NAMES,
} from "./constants.js";

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "TwexAPI",
  description:
    "Paperclip plugin for Twitter search, tweet lookup, profiles, timelines, and trending tweets through TwexAPI. Not affiliated with X Corp.",
  author: "TwexAPI",
  categories: ["connector", "automation"],
  capabilities: ["http.outbound", "secrets.read-ref", "agent.tools.register"],
  entrypoints: {
    worker: "./dist/worker.js",
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      apiBaseUrl: {
        type: "string",
        title: "TwexAPI base URL",
        description: "Base URL for TwexAPI REST requests.",
        default: DEFAULT_API_BASE_URL,
      },
      apiKeySecretRef: {
        type: "string",
        title: "TwexAPI API key secret",
        description: "Paperclip secret reference for the TwexAPI API key.",
      },
      defaultTimelineCount: {
        type: "integer",
        title: "Default timeline page count",
        minimum: 1,
        maximum: 100,
        default: DEFAULT_TIMELINE_COUNT,
      },
      defaultUserSearchCount: {
        type: "integer",
        title: "Default user search count",
        minimum: 1,
        maximum: 100,
        default: DEFAULT_USER_SEARCH_COUNT,
      },
      defaultTrendCount: {
        type: "integer",
        title: "Default trend count",
        minimum: 1,
        maximum: 100,
        default: DEFAULT_TREND_COUNT,
      },
    },
    required: ["apiKeySecretRef"],
  },
  tools: [
    {
      name: TOOL_NAMES.searchTweets,
      displayName: "Search tweets",
      description: "Search tweets with Twitter search operators through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Primary Twitter search term with supported operators.",
          },
          extraTerms: {
            type: "array",
            items: { type: "string" },
            description: "Additional searchTerms appended to the query.",
          },
          sortBy: {
            type: "string",
            enum: ["Latest", "Top"],
            default: "Latest",
            description: "Sort by latest or top results.",
          },
          next_cursor: {
            type: "string",
            description: "Cursor from the previous page.",
          },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.lookupTweet,
      displayName: "Get tweet",
      description: "Get tweet detail by ID through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Tweet ID." },
        },
        required: ["id"],
      },
    },
    {
      name: TOOL_NAMES.searchUsers,
      displayName: "Search users",
      description: "Search X profiles by name or username.",
      parametersSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Profile name or username." },
          target_count: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Maximum users to return.",
          },
        },
        required: ["q"],
      },
    },
    {
      name: TOOL_NAMES.getUser,
      displayName: "Get user profile",
      description: "Get an X profile by screen name.",
      parametersSchema: {
        type: "object",
        properties: {
          screen_name: {
            type: "string",
            description: "Twitter screen name, with or without @.",
          },
        },
        required: ["screen_name"],
      },
    },
    {
      name: TOOL_NAMES.getUserTweets,
      displayName: "Get user tweets",
      description: "Read one timeline page from an X user.",
      parametersSchema: {
        type: "object",
        properties: {
          screen_name: {
            type: "string",
            description: "Twitter screen name, with or without @.",
          },
          count: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Maximum tweets to return for this page.",
          },
          next_cursor: {
            type: "string",
            description: "Cursor from the previous page.",
          },
        },
        required: ["screen_name"],
      },
    },
    {
      name: TOOL_NAMES.getTrends,
      displayName: "Get trending tweets",
      description: "Read trending tweets for a country through TwexAPI.",
      parametersSchema: {
        type: "object",
        properties: {
          country: {
            type: "string",
            default: "United States",
            description: "Country name for trending tweets.",
          },
          count: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Maximum trending tweets to return.",
          },
          topic: {
            type: "string",
            description: "Optional topic filter.",
          },
          content: {
            type: "string",
            description: "Optional content filter.",
          },
        },
      },
    },
  ],
};

export default manifest;

const PLUGIN_ID = "twexapi.paperclip-plugin-x-api-scraper";
const PLUGIN_VERSION = "0.1.1";
const DEFAULT_API_BASE_URL = "https://api.twexapi.io";
const DEFAULT_TIMELINE_COUNT = 20;
const DEFAULT_USER_SEARCH_COUNT = 20;
const DEFAULT_TREND_COUNT = 20;

const TOOL_NAMES = {
  searchTweets: "twexapi.search_tweets",
  lookupTweet: "twexapi.lookup_tweet",
  searchUsers: "twexapi.search_users",
  getUser: "twexapi.get_user",
  getUserTweets: "twexapi.get_user_tweets",
  getTrends: "twexapi.get_trends",
} as const;

export {
  DEFAULT_API_BASE_URL,
  DEFAULT_TIMELINE_COUNT,
  DEFAULT_TREND_COUNT,
  DEFAULT_USER_SEARCH_COUNT,
  PLUGIN_ID,
  PLUGIN_VERSION,
  TOOL_NAMES,
};

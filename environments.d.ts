declare namespace NodeJS {
  interface ProcessEnv {
    // Vercel Environment Variables
    VERCEL_PROJECT_PRODUCTION_URL: string;
    // KV Credentials
    KV_REST_API_URL: string;
    KV_REST_API_TOKEN: string;
    KV_REST_API_READ_ONLY_TOKEN: string;
    KV_URL: string;
    // Auth Endpoints
    AUTH_LOGIN_URL: string;
    AUTH_LOGOUT_URL: string;
    AUTH_CALLBACK_URL: string;
    AUTH_REFRESH_URL: string;
    AUTH_VALIDATE_URL: string;
    AUTH_CHANNELS_URL: string;
    BOT_LOGIN_URL: string;
    BOT_LOGOUT_URL: string;
    BOT_CALLBACK_URL: string;
    BOT_REFRESH_URL: string;
    BOT_VALIDATE_URL: string;
    // Auth Token Names
    STATE_TOKEN_NAME: string;
    ACCESS_TOKEN_NAME: string;
    REFRESH_TOKEN_NAME: string;
    BOT_STATE_TOKEN_NAME: string;
    BOT_ACCESS_TOKEN_NAME: string;
    BOT_REFRESH_TOKEN_NAME: string;
    // Twitch Endpoints
    TWITCH_AUTH_URL: string;
    TWITCH_TOKEN_URL: string;
    TWITCH_VALIDATE_URL: string;
    TWITCH_MODERATED_CHANNELS_URL: string;
    TWITCH_CHAT_MESSAGE_URL: string;
    // Twitch Credentials
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    // Twitch Bot Credentials
    TWITCH_BOT_CLIENT_ID: string;
    TWITCH_BOT_CLIENT_SECRET: string;
    TWITCH_BOT_OAUTH_TOKEN: string;
    TWITCH_BOT_REFRESH_TOKEN: string;
    TWITCH_BOT_ID: string;
    // Publish Endpoints
    NEXT_PUBLIC_PUBLISH_CHAT_URL: string;
    NEXT_PUBLIC_PUBLISH_EVENT_URL: string;
    NEXT_PUBLIC_PUBLISH_SNAPSHOT_URL: string;
    // Pusher Credentials
    PUSHER_APP_ID: string;
    NEXT_PUBLIC_PUSHER_KEY: string;
    PUSHER_SECRET: string;
    NEXT_PUBLIC_PUSHER_CLUSTER: string;
    // Enable Debug Logs
    NEXT_PUBLIC_DEBUG: string;
  }
}

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
    AUTH_CHANNELS_URL: string;
    // Auth Token Names
    STATE_TOKEN_NAME: string;
    ACCESS_TOKEN_NAME: string;
    REFRESH_TOKEN_NAME: string;
    // Twitch Endpoints
    TWITCH_AUTH_URL: string;
    TWITCH_TOKEN_URL: string;
    TWITCH_VALIDATE_URL: string;
    TWITCH_MODERATED_CHANNELS_URL: string;
    // Twitch Credentials
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    // Publish Endpoints
    PUBLISH_EVENT_URL: string;
    PUBLISH_SNAPSHOT_URL: string;
    // Pusher Credentials
    PUSHER_APP_ID: string;
    NEXT_PUBLIC_PUSHER_KEY: string;
    PUSHER_SECRET: string;
    NEXT_PUBLIC_PUSHER_CLUSTER: string;
    // Enable Debug Logs
    NEXT_PUBLIC_DEBUG: string;
  }
}

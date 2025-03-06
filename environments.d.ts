declare namespace NodeJS {
  interface ProcessEnv {
    TWITCH_AUTH_URL: string;
    TWITCH_TOKEN_URL: string;
    TWITCH_VALIDATE_URL: string;
    TWITCH_CALLBACK_URL: string;
    TWITCH_MODERATED_CHANNELS_URL: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCH_STATE_NAME: string;
    TWITCH_ACCESS_TOKEN_NAME: string;
    TWITCH_REFRESH_TOKEN_NAME: string;
    NEXT_PUBLIC_DEBUG: string;
    VERCEL_URL: string;
    KV_REST_API_URL: string;
    KV_REST_API_TOKEN: string;
    KV_REST_API_READ_ONLY_TOKEN: string;
    KV_URL: string;
    PUSHER_APP_ID: string;
    NEXT_PUBLIC_PUSHER_KEY: string;
    PUSHER_SECRET: string;
    NEXT_PUBLIC_PUSHER_CLUSTER: string;
  }
}

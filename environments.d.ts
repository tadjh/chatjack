declare namespace NodeJS {
  interface ProcessEnv {
    TWITCH_AUTH_URL: string;
    TWITCH_TOKEN_URL: string;
    TWITCH_VALIDATE_URL: string;
    TWITCH_CALLBACK_URL: string;
    TWITCH_CLIENT_ID: string;
    TWITCH_CLIENT_SECRET: string;
    TWITCH_STATE_NAME: string;
    TWITCH_ACCESS_TOKEN_NAME: string;
    TWITCH_REFRESH_TOKEN_NAME: string;
    NEXT_PUBLIC_DEBUG: string;
    VERCEL_URL: string;
  }
}

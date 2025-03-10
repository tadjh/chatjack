"use server";

import { CURRENT_URL } from "@/lib/constants";
import { ModeratedChannelsResponse } from "@/lib/integrations/twitch.types";
import { auth } from "@/lib/session";

export async function getModeratedChannels(): Promise<ModeratedChannelsResponse> {
  const errorResult: ModeratedChannelsResponse = {
    data: [],
    pagination: {},
  };

  try {
    const { session, access_token } = await auth();

    const params = new URLSearchParams({
      user_id: session.user_id,
      access_token,
    });

    const data = await fetch(
      `${CURRENT_URL}${process.env.AUTH_CHANNELS_URL}?${params.toString()}`,
      { cache: "force-cache" },
    );

    if (!data.ok) {
      return errorResult;
    }

    const payload = (await data.json()) as ModeratedChannelsResponse;

    return {
      data: [
        {
          broadcaster_id: session.user_id,
          broadcaster_login: session.login,
          broadcaster_name: session.login,
        },
        ...payload.data,
      ],
      pagination: payload.pagination,
    };
  } catch (err) {
    console.error("Error fetching moderated channels:", err);
    return errorResult;
  }
}

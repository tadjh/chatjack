import { SpectatorView } from "@/components/spectator-view";

export default async function Page({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = await params;
  return <SpectatorView channelName={channel} />;
}

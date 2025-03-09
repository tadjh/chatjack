import { SpectatorView } from "@/components/spectator-view";
import { Props } from "@/lib/types";
import { formatMetadata } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata(props: Props): Promise<Metadata> {
  return formatMetadata(props, "spectate");
}

export default async function Page({ params }: Props) {
  const { channel } = await params;
  return (
    <>
      <SpectatorView channel={channel} />
    </>
  );
}

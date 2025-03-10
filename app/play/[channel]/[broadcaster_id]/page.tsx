import { getModeratedChannels } from "@/app/actions";
import { ChannelSelect } from "@/components/channel-select";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Game } from "@/components/game";
import { Header } from "@/components/header";
import { Logout } from "@/components/logout";
import { Main } from "@/components/main";
import { Share } from "@/components/share";
import { SignedIn } from "@/components/signed-in";
import { Props } from "@/lib/types";
import { formatMetadata } from "@/lib/utils";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export async function generateMetadata(props: Props): Promise<Metadata> {
  return formatMetadata(props, "play");
}

export default async function Page({ params }: Props) {
  const { channel, broadcaster_id } = await params;
  if (!channel || !broadcaster_id) {
    return redirect("/play");
  }

  const options = await getModeratedChannels();
  return (
    <>
      <Game channel={channel} broadcaster_id={broadcaster_id} />
      <Container>
        <Header>
          <SignedIn>
            <ChannelSelect mode="play" channel={channel} options={options} />
            <Logout />
          </SignedIn>
        </Header>
        <Main />
        <Footer>
          <Share channel={channel} />
        </Footer>
      </Container>
    </>
  );
}

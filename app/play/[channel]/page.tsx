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

export async function generateMetadata(props: Props): Promise<Metadata> {
  return formatMetadata(props, "play");
}

export default async function Page({ params }: Props) {
  const { channel } = await params;
  const options = await getModeratedChannels();
  return (
    <>
      <Game channel={channel} />
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

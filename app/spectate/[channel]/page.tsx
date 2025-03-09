import { ChannelInput } from "@/components/channel-input";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Header, HeaderItem } from "@/components/header";
import { Main } from "@/components/main";
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
      <Container>
        <Header>
          <ChannelInput mode="spectate" channel={channel} />
          <HeaderItem className="cursor-none opacity-50 hover:opacity-100">
            Spectating
          </HeaderItem>
        </Header>
        <Main />
        <Footer className="opacity-50 hover:opacity-100" />
      </Container>
    </>
  );
}

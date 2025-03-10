import { getModeratedChannels } from "@/app/actions";
import { ChannelSelect } from "@/components/channel-select";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Logout } from "@/components/logout";
import { Main } from "@/components/main";
import { SignedIn } from "@/components/signed-in";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Play ChatJack",
  description: "Host a ChatJack session for a Twitch channel",
};

export default async function Page() {
  const options = await getModeratedChannels();
  const channel = "";
  return (
    <>
      <Container>
        <Header>
          <SignedIn>
            <ChannelSelect mode="play" channel={channel} options={options} />
            <Logout />
          </SignedIn>
        </Header>
        <Main />
        <Footer />
      </Container>
    </>
  );
}

import { ChannelInput } from "@/components/channel-input";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Header, HeaderItem } from "@/components/header";
import { Main } from "@/components/main";

export const metadata = {
  title: "Spectate - ChatJack",
  description: "Spectate a ChatJack session",
};

export default async function Page() {
  const channel = "";
  return (
    <>
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

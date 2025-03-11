import { Canvas } from "@/components/canvas";
import { Container } from "@/components/container";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Logout } from "@/components/logout";
import { Main } from "@/components/main";
import { SignedIn } from "@/components/signed-in";
import { SignedOut } from "@/components/signed-out";
import { TwitchLogin } from "@/components/twitch-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      <Canvas fps={12} caption="" channel="" mode="spectate" />
      <Container>
        <Header>
          <Button
            variant="link"
            className="game-text-shadow cursor-pointer text-lg"
            type="button"
            asChild
          >
            <Link href="/spectate" prefetch={false}>
              Spectate
            </Link>
          </Button>
          <SignedIn>
            <Button
              variant="link"
              className="game-text-shadow cursor-pointer text-lg"
              type="button"
              asChild
            >
              <Link href="/play" prefetch={false}>
                Play
              </Link>
            </Button>
            <Logout />
          </SignedIn>
          <SignedOut>
            <TwitchLogin />
          </SignedOut>
        </Header>
        <Main />
        <Footer />
      </Container>
    </>
  );
}

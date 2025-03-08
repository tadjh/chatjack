import { getModeratedChannels } from "@/app/actions";
import { ChannelName } from "@/components/channel-name";
import { Footer } from "@/components/footer";
import { Game } from "@/components/game";
import { Share } from "@/components/share";
import { SignedIn } from "@/components/signed-in";
import { SignedOut } from "@/components/signed-out";
import { TwitchLogin } from "@/components/twitch-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page() {
  const channels = await getModeratedChannels();

  return (
    <>
      <Game />
      <div className="relative z-50 flex min-h-screen flex-col gap-3">
        <header className="flex min-h-20 items-center justify-end p-5">
          <SignedIn>
            <ChannelName channels={channels} />
            <Button
              variant="link"
              className="game-text-shadow cursor-pointer text-lg"
              asChild
            >
              <Link href="/api/auth/twitch/logout">Logout</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <TwitchLogin />
          </SignedOut>
        </header>
        <main className="flex grow flex-col items-center justify-center">
          <div className="flex grow"></div>
        </main>
        <Footer>
          <Share />
        </Footer>
      </div>
    </>
  );
}

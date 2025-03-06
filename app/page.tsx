import { getModeratedChannels } from "@/app/actions";
import { Canvas } from "@/components/canvas";
import { ChannelName } from "@/components/channel-name";
import { SearchProvider } from "@/components/search-provider";
import { SignedIn } from "@/components/signed-in";
import { SignedOut } from "@/components/signed-out";
import { TwitchLogin } from "@/components/twitch-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const channels = await getModeratedChannels();

  return (
    <>
      <SearchProvider>
        <Canvas />
        <div className="relative z-50 flex min-h-screen flex-col gap-3">
          <header className="flex min-h-20 justify-end p-3">
            <SignedIn>
              <ChannelName channels={channels} />
              <Button
                variant="link"
                className="game-text-shadow cursor-pointer text-lg hover:underline"
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
          <footer className="game-text-shadow flex justify-end gap-3 p-3">
            {`© ${new Date().getFullYear()}`}
            <Link href="https://tadjh.com" className="hover:underline">
              tadjh.com
            </Link>
          </footer>
        </div>
      </SearchProvider>
    </>
  );
}

import { Game } from "@/components/game";
import { SignedIn } from "@/components/signed-in";
import { SignedOut } from "@/components/signed-out";
import { TwitchLogin } from "@/components/twitch-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Game />
      <div className="relative z-50 flex min-h-screen flex-col gap-3">
        <header className="flex min-h-20 justify-end p-3">
          <SignedIn>
            <Button
              variant="link"
              className="game-text-shadow cursor-pointer text-lg hover:underline"
              asChild
            >
              <Link href="/api/auth/twitch/logout">Logout</Link>
            </Button>
          </SignedIn>
        </header>
        <main className="flex grow flex-col items-center justify-center">
          <div className="flex grow"></div>
          <SignedOut>
            <TwitchLogin />
          </SignedOut>
          <div className="flex min-h-20"></div>
        </main>
        <footer className="flex justify-end p-3">
          {`© ${new Date().getFullYear()} chatjack by tadjh`}
        </footer>
      </div>
    </>
  );
}

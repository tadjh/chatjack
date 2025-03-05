import { Game } from "@/components/game";
import { SignedIn } from "@/components/signed-in";
import { SignedOut } from "@/components/signed-out";
import { TwitchLogin } from "@/components/twitch-login";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function Home() {
  return (
    <>
      <Suspense>
        <Game />
      </Suspense>
      <div className="fixed inset-0 z-10 grid h-full w-full">
        <div className="flex items-center justify-center"></div>
        <div className="flex items-center justify-center">
          <SignedOut>
            <TwitchLogin />
          </SignedOut>
        </div>
      </div>
      <div className="relative z-50 flex justify-end p-3">
        <SignedIn>
          <Button
            variant="link"
            className="game-text-shadow cursor-pointer text-lg hover:underline"
            asChild
          >
            <Link href="/api/auth/twitch/logout">Logout</Link>
          </Button>
        </SignedIn>
      </div>
    </>
  );
}

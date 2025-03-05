import { Game } from "@/components/game";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

export default function Page() {
  return (
    <>
      <Suspense>
        <Game />
      </Suspense>
      <div className="relative z-50 flex justify-end p-3">
        <Button
          variant="link"
          className="game-text-shadow cursor-pointer text-lg hover:underline"
          asChild
        >
          <Link href="/api/auth/twitch/logout">Logout</Link>
        </Button>
      </div>
    </>
  );
}

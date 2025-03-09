import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Logout() {
  return (
    <Button
      variant="link"
      className="game-text-shadow cursor-pointer text-lg"
      asChild
    >
      <Link href="/api/auth/twitch/logout">Logout</Link>
    </Button>
  );
}

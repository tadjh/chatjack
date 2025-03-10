import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Logout() {
  return (
    <Button
      variant="link"
      className="game-text-shadow cursor-pointer text-lg"
      asChild
    >
      <Link href={process.env.AUTH_LOGOUT_URL}>Logout</Link>
    </Button>
  );
}

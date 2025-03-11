import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Logout() {
  return (
    <Button
      variant="link"
      className="game-text-shadow cursor-pointer text-lg"
      type="button"
      asChild
    >
      <Link href={process.env.AUTH_LOGOUT_URL} prefetch={false}>
        Logout
      </Link>
    </Button>
  );
}

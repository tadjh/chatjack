import { Copyright } from "@/components/copyright";
import { Share } from "@/components/share";

export function Footer() {
  return (
    <footer className="game-text-shadow flex items-center justify-end gap-3 p-3">
      <Share />
      <Copyright />
    </footer>
  );
}

import { Copyright } from "@/components/copyright";
import { Share } from "@/components/share";
import { cn } from "@/lib/utils";

export function Footer({ className }: React.ComponentProps<"footer">) {
  return (
    <footer
      className={cn(
        "game-text-shadow flex items-center justify-end gap-3 p-3",
        className,
      )}
    >
      <Share />
      <Copyright />
    </footer>
  );
}

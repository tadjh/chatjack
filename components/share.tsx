import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SpectatorLink } from "@/components/spectator-link";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@/components/ui/dialog";

export function Share() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="game-text-shadow cursor-pointer text-lg hover:underline"
        >
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader className="space-y-4">
          <DialogTitle>Share this game</DialogTitle>
          <DialogDescription>
            Use this link to embed in an OBS browser source, or share with
            friends and fans who want to watch along.
          </DialogDescription>
        </DialogHeader>
        <SpectatorLink />
      </DialogContent>
    </Dialog>
  );
}

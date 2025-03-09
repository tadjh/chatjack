"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function createSpectatorLink(channel: string) {
  const url = new URL(window.location.href);
  url.pathname = `/spectate/${channel}`;
  url.search = "";
  return url.toString();
}

export function SpectatorLink({ channel }: { channel: string }) {
  const spectatorLink = createSpectatorLink(channel);

  function copyLink() {
    navigator.clipboard.writeText(spectatorLink);
    toast.info("Link copied to clipboard!");
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        value={spectatorLink}
        className="font-mono"
        readOnly
        aria-readonly
      />
      <Button className="cursor-pointer" onClick={copyLink}>
        Copy
      </Button>
    </div>
  );
}

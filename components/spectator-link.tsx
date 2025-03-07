"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function SpectatorLink() {
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel");
  const spectatorLink = createSpectatorLink();

  function createSpectatorLink() {
    const url = new URL(window.location.href);
    url.pathname = `/spectate/${channel}`;
    url.searchParams.delete("channel");
    url.searchParams.delete("debug");
    return url.toString();
  }

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

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function TwitchLogin() {
  return (
    <Button
      size="lg"
      className="ml-4 cursor-pointer bg-[#9147ff] font-bold text-white shadow-md shadow-black/25 hover:bg-[#772ce8] active:bg-[#5c16c5]"
      asChild
    >
      <Link href="/api/auth/twitch/login">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          version="1.1"
          x="0px"
          y="0px"
          viewBox="0 0 2400 2800"
          xmlSpace="preserve"
          className="size-6"
        >
          <g>
            <path
              fill="currentColor"
              d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600    V1300z"
            />
            <rect
              fill="currentColor"
              x="1700"
              y="550"
              width="200"
              height="600"
            />
            <rect
              fill="currentColor"
              x="1150"
              y="550"
              width="200"
              height="600"
            />
          </g>
        </svg>
        Login
      </Link>
    </Button>
  );
}

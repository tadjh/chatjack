"use client";

import { Renderer } from "@/lib/canvas/renderer";
import { Mediator } from "@/lib/mediator";
import { parseBoolean, parseNumber } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

export interface SearchProps {
  deck: string;
  debug: boolean;
  timer: number;
  fps: number;
}

enum CUSTOM_PARAMS {
  DECK = "d",
  TIMER = "t",
  FPS = "f",
  DEBUG = "debug",
}

const SearchContext = createContext<
  | ({
      setContext: (key: keyof SearchProps, value: string) => void;
    } & SearchProps)
  | null
>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const props: SearchProps = {
    deck: searchParams.get(CUSTOM_PARAMS.DECK) ?? "",
    debug: parseBoolean(searchParams.get(CUSTOM_PARAMS.DEBUG)),
    timer: parseNumber(
      searchParams.get(CUSTOM_PARAMS.TIMER),
      Mediator.defaultOptions.timer,
    ),
    fps: parseNumber(
      searchParams.get(CUSTOM_PARAMS.FPS),
      Renderer.defaultOptions.fps,
    ),
  };

  function setContext(key: keyof SearchProps, value: string) {
    const params = new URLSearchParams(searchParams);

    switch (key) {
      case "deck":
        params.set(CUSTOM_PARAMS.DECK, value);
        break;
      case "timer":
        params.set(CUSTOM_PARAMS.TIMER, value);
        break;
      case "fps":
        params.set(CUSTOM_PARAMS.FPS, value);
        break;
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <SearchContext.Provider value={{ ...props, setContext }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("SearchContext must be used within a SearchProvider");
  }

  return context;
}

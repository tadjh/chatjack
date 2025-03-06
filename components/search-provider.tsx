"use client";

import { CanvasProps } from "@/components/canvas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

const SearchContext = createContext<
  | ({
      setContext: (key: keyof CanvasProps, value: string) => void;
    } & CanvasProps)
  | null
>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const props: CanvasProps = {
    deck: searchParams.get("deck"),
    debug: searchParams.get("debug"),
    channel: searchParams.get("channel"),
    timer: searchParams.get("timer"),
    fps: searchParams.get("fps"),
  };

  function setContext(key: keyof CanvasProps, value: string) {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);

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
    throw new Error("Canvas context must be used within a CanvasProvider");
  }

  return context;
}

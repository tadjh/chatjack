import { Mediator } from "@/lib/mediator";
import { useRef } from "react";

export function useMediator() {
  const mediatorRef = useRef(Mediator.create());
  return mediatorRef.current;
}


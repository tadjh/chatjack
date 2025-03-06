import { EventBus } from "@/lib/event-bus";
import { Mediator } from "@/lib/mediator";
import { useRef } from "react";

export function useMediator(eventBus?: EventBus) {
  const mediatorRef = useRef(Mediator.create(eventBus));
  return mediatorRef.current;
}

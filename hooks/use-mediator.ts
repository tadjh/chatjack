import { EventBus } from "@/lib/event-bus";
import { Mediator, MediatorOptions } from "@/lib/mediator";
import { useRef } from "react";

export function useMediator(options: MediatorOptions, eventBus?: EventBus) {
  const mediatorRef = useRef(Mediator.create(options, eventBus));
  return mediatorRef.current;
}

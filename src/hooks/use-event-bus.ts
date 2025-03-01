import { EventBus, eventBus } from "@/lib/event-bus";
import { useRef } from "react";

export function useEventBus() {
  const eventBusRef = useRef<EventBus>(eventBus);
  return eventBusRef.current;
}

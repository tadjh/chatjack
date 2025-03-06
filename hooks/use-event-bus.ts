import { EventBus } from "@/lib/event-bus";
import { useRef } from "react";

export function useEventBus(channel: string) {
  const eventBusRef = useRef<EventBus | null>(null);

  if (!eventBusRef.current) {
    eventBusRef.current = EventBus.create({
      channel,
    });
  }

  return eventBusRef.current;
}

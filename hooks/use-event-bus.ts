import { EventBus } from "@/lib/event-bus";
import { useEffect, useRef } from "react";

export function useEventBus(channel: string) {
  const eventBusRef = useRef<EventBus | null>(null);

  if (!eventBusRef.current) {
    eventBusRef.current = EventBus.create({ channel });
  }

  useEffect(() => {
    if (!eventBusRef.current) {
      eventBusRef.current = EventBus.create({ channel });
    }

    eventBusRef.current.setChannel(channel);

    return () => {
      if (eventBusRef.current) {
        eventBusRef.current.teardown();
        eventBusRef.current = null;
      }
    };
  }, [channel]);

  return eventBusRef.current;
}

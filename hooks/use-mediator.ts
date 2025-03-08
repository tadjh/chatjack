import { Mediator, MediatorOptions } from "@/lib/mediator";
import { useEffect, useRef } from "react";

export function useMediator({ buffer, timer }: MediatorOptions) {
  const mediatorRef = useRef<Mediator | null>(null);

  if (!mediatorRef.current) {
    mediatorRef.current = Mediator.create({ buffer, timer });
  }

  useEffect(() => {
    if (!mediatorRef.current) {
      mediatorRef.current = Mediator.create({ buffer, timer });
    }

    mediatorRef.current.updateOptions({ buffer, timer });

    return () => {
      if (mediatorRef.current) {
        mediatorRef.current.teardown();
        mediatorRef.current = null;
      }
    };
  }, [buffer, timer]);

  return mediatorRef.current;
}

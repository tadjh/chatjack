import { Mediator } from "@/lib/mediator";
import { useRef } from "react";

export function useMediator() {
  const mediatorRef = useRef(Mediator.create());

  // useEffect(() => {
  //   const mediator = mediatorRef.current;

  //   return () => {
  //     mediator.destroy();
  //   };
  // }, []);
  return mediatorRef.current;
}


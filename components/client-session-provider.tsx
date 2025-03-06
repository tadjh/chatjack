"use client";

import { Twitch } from "@/lib/integrations/twitch.types";
import { createContext, useContext, useState } from "react";

const SessionContext = createContext<{
  session: Twitch.ValidateAccessTokenSessionData | null;
} | null>(null);

export function ClientSessionProvider({
  initialSession,
  children,
}: {
  initialSession: Twitch.ValidateAccessTokenSessionData | null;
  children: React.ReactNode;
}) {
  const [session] = useState(initialSession);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

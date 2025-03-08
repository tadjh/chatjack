"use client";

import { ValidateAccessTokenSessionData } from "@/lib/integrations/twitch.types";
import { createContext, useContext, useState } from "react";

const SessionContext = createContext<{
  session: ValidateAccessTokenSessionData | null;
} | null>(null);

export function ClientSessionProvider({
  initialSession,
  children,
}: {
  initialSession: ValidateAccessTokenSessionData | undefined;
  children: React.ReactNode;
}) {
  const [session] = useState(initialSession ?? null);

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

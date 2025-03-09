"use client";

import { ValidateAccessTokenSessionData } from "@/lib/integrations/twitch.types";
import { createContext, useContext, useState } from "react";

const ClientSessionContext =
  createContext<ValidateAccessTokenSessionData | null>(null);

export function SessionClient({
  initialSession,
  children,
}: {
  initialSession: ValidateAccessTokenSessionData;
  children: React.ReactNode;
}) {
  const [session] = useState<ValidateAccessTokenSessionData>(initialSession);

  return (
    <ClientSessionContext.Provider value={session}>
      {children}
    </ClientSessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(ClientSessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

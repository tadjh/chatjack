import { InvalidAuthStatus } from "@/lib/types";
import { ValidAuthStatus } from "@/lib/types";
import { useEffect, useState } from "react";

export type AuthStatus = ValidAuthStatus | InvalidAuthStatus;

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    user: null,
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/twitch/validate");
        const data = await res.json();
        setAuthStatus(data);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    }

    checkAuth();
  }, []);

  return authStatus;
}

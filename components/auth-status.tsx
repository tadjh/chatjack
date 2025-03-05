"use client";
import { useAuth } from "@/hooks/use-auth";

export default function AuthStatus() {
  const { authenticated, user } = useAuth();

  if (authenticated) {
    return <div>Authenticated as {user.login}</div>;
  }

  return <div>Not authenticated</div>;
}

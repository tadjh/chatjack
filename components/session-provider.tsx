import { SessionClient } from "@/components/session-client";
import { auth } from "@/lib/session";

export async function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await auth();

  return <SessionClient initialSession={session}>{children}</SessionClient>;
}

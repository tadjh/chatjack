import { ClientSessionProvider } from "./client-session-provider";
import { auth } from "@/app/actions";

export async function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await auth();

  return (
    <ClientSessionProvider initialSession={session}>
      {children}
    </ClientSessionProvider>
  );
}

import { auth } from "@/app/actions";
import { ClientSessionProvider } from "@/components/client-session-provider";

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

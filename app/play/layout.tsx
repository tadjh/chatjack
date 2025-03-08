import { SearchProvider } from "@/components/search-provider";
import { SessionProvider } from "@/components/session-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>
        <SearchProvider>{children}</SearchProvider>
      </SessionProvider>
    </>
  );
}

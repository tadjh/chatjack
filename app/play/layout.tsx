import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionProvider>{children}</SessionProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "font-sans",
          style: { background: "var(--background)" },
        }}
      />
    </>
  );
}

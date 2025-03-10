import { SearchProvider } from "@/components/search-provider";
import { Toaster } from "@/components/ui/sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SearchProvider>{children}</SearchProvider>
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

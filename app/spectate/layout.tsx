import { Toaster } from "@/components/ui/sonner";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
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

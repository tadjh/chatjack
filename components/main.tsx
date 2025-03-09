import { cn } from "@/lib/utils";

export function Main({ className, children }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex grow flex-col items-center justify-center",
        className,
      )}
    >
      {children}
    </main>
  );
}

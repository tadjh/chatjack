import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative z-50 flex min-h-screen flex-col gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function Header({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      className={cn("flex min-h-20 justify-end p-3", className)}
      {...props}
    >
      {children}
    </header>
  );
}

export function HeaderItem({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("game-text-shadow text-lg", className)} {...props}>
      {children}
    </div>
  );
}

export function HeaderLink({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Button
      variant="link"
      className={cn(
        "game-text-shadow cursor-pointer text-lg hover:underline",
        className,
      )}
      asChild
    >
      <Link {...props}>{children}</Link>
    </Button>
  );
}

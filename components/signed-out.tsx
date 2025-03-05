import { cookies } from "next/headers";

export async function SignedOut({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.TWITCH_ACCESS_TOKEN_NAME);

  if (token) {
    return null;
  }

  return <>{children}</>;
}

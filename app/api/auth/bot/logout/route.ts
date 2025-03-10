import { CURRENT_URL } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const response = NextResponse.redirect(CURRENT_URL);
  response.cookies.delete(process.env.BOT_ACCESS_TOKEN_NAME);
  response.cookies.delete(process.env.BOT_REFRESH_TOKEN_NAME);
  response.cookies.delete(process.env.BOT_STATE_TOKEN_NAME);
  revalidatePath("/", "layout");
  return response;
}

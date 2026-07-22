import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ROLE_HOME } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const destination = role ? ROLE_HOME[role] : "/login";

  return NextResponse.redirect(new URL(destination, req.url));
}

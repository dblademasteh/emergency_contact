import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  return NextResponse.json({
    isAdmin: session?.role === "admin",
    role: session?.role ?? null,
    name: session?.name ?? null,
  });
}

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Which roles are allowed under each top-level protected path.
// Admin is intentionally given access everywhere for moderation/support.
const ROUTE_ROLES: Record<string, string[]> = {
  "/patient": ["PATIENT", "ADMIN"],
  "/doctor": ["DOCTOR", "ADMIN"],
  "/ngo": ["NGO", "ADMIN"],
  "/admin": ["ADMIN"],
};

const ROLE_HOME: Record<string, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  NGO: "/ngo",
  ADMIN: "/admin",
};

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string | undefined;

    const matchedPrefix = Object.keys(ROUTE_ROLES).find((prefix) =>
      pathname.startsWith(prefix)
    );

    if (matchedPrefix && role && !ROUTE_ROLES[matchedPrefix].includes(role)) {
      // Logged in, but wrong role for this section -> bounce to their own home.
      const home = ROLE_HOME[role] ?? "/login";
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Just confirms a valid session exists; the function above handles
      // the finer-grained role check.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/ngo/:path*", "/admin/:path*"],
};

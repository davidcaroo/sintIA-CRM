import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "sintia_default_secret_key_change_in_production_32b!"
);

const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/chat",
  "/api/widget",
  "/api/integrations/google/callback",
  "/api/webhooks",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permitir estáticos, demo y login
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/login" ||
    pathname.startsWith("/demo")
  ) {
    return NextResponse.next();
  }

  // Rutas de API públicas
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("sintia_session")?.value;

  // Si no hay token
  if (!token) {
    // Si es una petición a /api/..., devolver 401 en JSON (no redirigir a HTML)
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Sesión inválida o expirada." }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // Permetti sempre l'accesso alle risorse statiche, pubbliche e API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||  // ✅ Escludi tutte le API
    pathname.startsWith('/public') ||
    pathname.startsWith('/hoon_logo.png') ||
    pathname.includes('.') // File con estensione
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const url = req.nextUrl.clone();

  if (!token) {
    if (pathname !== "/Login") {
      url.pathname = "/Login";
      return NextResponse.redirect(url);
    }
  } else if (["/Register", "/AddCollab", "/Lista_clienti", "/Feed-comm"].includes(pathname)) {
    if (token.role !== "amministratore") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Escludi esplicitamente API, static e immagini
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
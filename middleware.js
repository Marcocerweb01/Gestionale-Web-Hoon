import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  // Permetti sempre l'accesso alle risorse statiche e pubbliche
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/public') ||
    req.nextUrl.pathname.startsWith('/hoon_logo.png') ||  // Permetti esplicitamente l'accesso al logo
    req.nextUrl.pathname.includes('.') // Permetti l'accesso a tutti i file con estensione
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token nel middleware:", token);

  const url = req.nextUrl.clone();

  if (!token) {
    if (url.pathname !== "/Login") {
      url.pathname = "/Login";
      return NextResponse.redirect(url);
    }
  } else if (["/Register", "/AddCollab", "/Lista_clienti", "/Feed-comm"].includes(url.pathname)) {
    if (token.role !== "amministratore") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Escludi i file statici e le API dalla verifica del middleware
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
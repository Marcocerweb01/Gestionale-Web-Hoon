// middleware.js
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token nel middleware:", token);

  const url = req.nextUrl.clone();
  
  // Permetti sempre l'accesso alle risorse statiche
  if (req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.startsWith('/images') ||
      req.nextUrl.pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  if (!token) {
    if (req.nextUrl.pathname !== "/Login") {
      return NextResponse.redirect(new URL("/Login", req.url));
    }
  } else if (req.nextUrl.pathname === "/Login") {
    // Se l'utente è già autenticato e prova ad accedere alla pagina di login
    return NextResponse.redirect(new URL("/", req.url));
  } else if (["/Register", "/AddCollab", "/Lista_clienti", "/Feed-comm"].includes(req.nextUrl.pathname)) {
    if (token.role !== "amministratore") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api');
  const isAuthApi = pathname.startsWith('/api/auth');
  const isHoonLabApi = pathname.startsWith('/api/hoon-lab');
  const isHoonLabPage = pathname === '/Hoon-Lab' || pathname.startsWith('/Hoon-Lab/');
  
  // Le API auth e le risorse statiche restano pubbliche. Le altre API passano
  // dal controllo token per poter isolare completamente il ruolo Hoon Lab.
  if (
    pathname.startsWith('/_next') ||
    isAuthApi ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/hoon_logo.png') ||
    pathname.includes('.') // File con estensione
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const url = req.nextUrl.clone();

  if (!token) {
    if (isHoonLabApi) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    if (isApi) {
      return NextResponse.next();
    }
    if (pathname !== "/Login") {
      url.pathname = "/Login";
      return NextResponse.redirect(url);
    }
  } else if (token.role === "hoon_lab" && !isHoonLabApi && !isHoonLabPage) {
    if (isApi) {
      return NextResponse.json({ error: "Accesso riservato a Hoon Lab" }, { status: 403 });
    }
    url.pathname = "/Hoon-Lab";
    return NextResponse.redirect(url);
  } else if (isHoonLabApi || isHoonLabPage) {
    if (!["amministratore", "hoon_lab"].includes(token.role)) {
      if (isHoonLabApi) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  } else if (["/Feed-comm", "/Gestione-Utenti", "/Storico-Interviste-Webdesigner"].includes(pathname)) {
    if (token.role !== "amministratore") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  } else if (
    pathname.startsWith("/Eventi")
  ) {
    if (token.role !== "amministratore" && token.role !== "collaboratore") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  } else if (
    pathname.startsWith("/Operations/GooglePlacesNoWebsite") ||
    pathname.startsWith("/Operations/SocialAutomation") ||
    pathname.startsWith("/Operations/Analytics")
  ) {
    if (token.role !== "amministratore") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  } else if (["/Register", "/AddCollab", "/Lista_clienti"].includes(pathname)) {
    if (token.role !== "amministratore" && token.role !== "segretaria") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Pagine applicative e API: serve a confinare il ruolo Hoon Lab.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/:path*",
  ],
};

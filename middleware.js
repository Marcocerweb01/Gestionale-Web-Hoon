import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token nel middleware:", token); // Debug del token

  const url = req.nextUrl.clone();

  if (!token) {
    if (url.pathname !== "/Login") {
      url.pathname = "/Login";
      return NextResponse.redirect(url);
    }
  } else if (url.pathname === "/Register" || url.pathname === "/AddCollab" || url.pathname === "/Lista_clienti" || url.pathname === "/Feed-comm") {
    if (token.role !== "amministratore") {
      url.pathname = "/unauthorized"; // Puoi creare una pagina "Non autorizzato"
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|public).*)"],
};

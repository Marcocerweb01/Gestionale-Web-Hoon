import { NextResponse } from "next/server";
import crypto from "crypto";

// Meta invia una POST a questo endpoint quando un utente richiede
// la cancellazione dei dati dalla propria app Facebook/Instagram.
// Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

function parseSignedRequest(signedRequest, appSecret) {
  const [encodedSig, payload] = signedRequest.split(".");
  
  const sig = Buffer.from(
    encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );
  
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) {
    return null;
  }

  return JSON.parse(
    Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8")
  );
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request");

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      console.error("[DATA-DELETION] META_APP_SECRET non configurato");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      return NextResponse.json(
        { error: "Invalid signed request" },
        { status: 403 }
      );
    }

    const userId = data.user_id;
    const confirmationCode = crypto.randomUUID();

    console.log(
      `[DATA-DELETION] Richiesta cancellazione per user Meta ID: ${userId}, code: ${confirmationCode}`
    );

    // Qui puoi aggiungere la logica per cancellare i dati dell'utente dal DB
    // Ad esempio: await SocialAccount.deleteMany({ metaUserId: userId });

    const baseUrl =
      process.env.NEXTAUTH_URL || process.env.PUBLIC_URL || "";
    const statusUrl = `${baseUrl}/data-deletion?confirmation=${encodeURIComponent(confirmationCode)}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("[DATA-DELETION] Errore:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

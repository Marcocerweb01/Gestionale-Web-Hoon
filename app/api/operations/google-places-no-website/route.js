import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import GooglePlacesUsage from "@/models/GooglePlacesUsage";
import {
  hasNoWebsite,
  normalizePlace,
  searchGooglePlacesPage
} from "@/lib/googlePlaces";

export const dynamic = "force-dynamic";

const configuredLimit = Number(process.env.GOOGLE_PLACES_MONTHLY_CAP || 1000);
const FREE_CALLS_LIMIT = Number.isFinite(configuredLimit) && configuredLimit > 0
  ? Math.floor(configuredLimit)
  : 1000;
const MAX_GOOGLE_RESULTS = 60;
const MAX_SEARCHES_PER_MINUTE = 8;
const requestLog = new Map();
const allowedRoles = new Set(["amministratore", "segretaria"]);

const getMonthKey = () => new Date().toISOString().slice(0, 7);

const usagePayload = async () => {
  const month = getMonthKey();
  const usage = await GooglePlacesUsage.findOne({ month }).lean();
  const used = Number(usage?.calls || 0);

  return {
    month,
    used,
    limit: FREE_CALLS_LIMIT,
    remaining: Math.max(FREE_CALLS_LIMIT - used, 0)
  };
};

const requireAllowedSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Non autorizzato" }, { status: 401 }) };
  }

  if (!allowedRoles.has(session.user?.role)) {
    return { error: NextResponse.json({ error: "Accesso non consentito" }, { status: 403 }) };
  }

  return { session };
};

const checkSearchRateLimit = (userId) => {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (requestLog.get(userId) || []).filter((time) => time > windowStart);

  if (recent.length >= MAX_SEARCHES_PER_MINUTE) {
    requestLog.set(userId, recent);
    return false;
  }

  requestLog.set(userId, [...recent, now]);
  return true;
};

const reserveOneCall = async () => {
  const month = getMonthKey();

  await GooglePlacesUsage.updateOne(
    { month },
    { $setOnInsert: { month, calls: 0, updatedAt: new Date() } },
    { upsert: true }
  );

  const updated = await GooglePlacesUsage.findOneAndUpdate(
    { month, calls: { $lt: FREE_CALLS_LIMIT } },
    {
      $inc: { calls: 1 },
      $set: { updatedAt: new Date() }
    },
    { new: true }
  );

  return Boolean(updated);
};

const parseBody = async (req) => {
  const body = await req.json().catch(() => null);

  const keyword = String(body?.keyword || "").trim();
  const location = String(body?.location || "").trim();
  const language = String(body?.language || "it").trim().toLowerCase();
  const maxResults = Number(body?.maxResults || 20);

  if (keyword.length < 2) {
    return { error: "Inserisci una keyword o categoria di almeno 2 caratteri." };
  }

  if (location.length < 2) {
    return { error: "Inserisci una citta o area di almeno 2 caratteri." };
  }

  if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(language)) {
    return { error: "Lingua non valida. Usa un codice tipo it, en, fr." };
  }

  if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > MAX_GOOGLE_RESULTS) {
    return { error: `Max risultati deve essere tra 1 e ${MAX_GOOGLE_RESULTS}.` };
  }

  return { keyword, location, language, maxResults };
};

export async function GET() {
  try {
    const auth = await requireAllowedSession();
    if (auth.error) return auth.error;

    await connectToDB();
    return NextResponse.json({ usage: await usagePayload() });
  } catch (error) {
    console.error("Errore recupero utilizzo Google Places:", error);
    return NextResponse.json({ error: "Errore recupero utilizzo" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAllowedSession();
    if (auth.error) return auth.error;

    const userId = auth.session.user?.id || auth.session.user?.email || "unknown";
    if (!checkSearchRateLimit(userId)) {
      return NextResponse.json(
        { error: "Troppe ricerche ravvicinate. Riprova tra un minuto." },
        { status: 429 }
      );
    }

    const parsed = await parseBody(req);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_PLACES_API_KEY non configurata sul server." },
        { status: 500 }
      );
    }

    await connectToDB();

    const results = [];
    const seen = new Set();
    let scannedResults = 0;
    let callsThisSearch = 0;
    let nextPageToken;
    const pagesToRequest = Math.ceil(parsed.maxResults / 20);

    for (let page = 0; page < pagesToRequest; page += 1) {
      const currentUsage = await usagePayload();
      if (currentUsage.remaining <= 0) {
        break;
      }

      const reserved = await reserveOneCall();
      if (!reserved) {
        break;
      }

      callsThisSearch += 1;

      const remainingToScan = parsed.maxResults - scannedResults;
      const pageSize = Math.min(20, remainingToScan);

      const googlePage = await searchGooglePlacesPage({
        apiKey,
        keyword: parsed.keyword,
        location: parsed.location,
        languageCode: parsed.language,
        pageSize,
        pageToken: nextPageToken
      });

      scannedResults += googlePage.places.length;

      for (const place of googlePage.places) {
        if (!place.id || seen.has(place.id) || !hasNoWebsite(place)) continue;
        seen.add(place.id);
        results.push(normalizePlace(place));
      }

      nextPageToken = googlePage.nextPageToken;
      if (!nextPageToken || scannedResults >= parsed.maxResults) {
        break;
      }
    }

    const usage = await usagePayload();

    return NextResponse.json({
      results,
      usage: {
        ...usage,
        callsThisSearch,
        scannedResults
      }
    });
  } catch (error) {
    console.error("Errore ricerca Google Places:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore ricerca Google Places" },
      { status: 500 }
    );
  }
}

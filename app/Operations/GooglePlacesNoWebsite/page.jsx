"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertTriangle, Building2, Info } from "lucide-react";
import SearchForm from "@/Components/SearchForm";
import ResultsTable from "@/Components/ResultsTable";
import { placesToCsv } from "@/lib/csv";

const API_URL = "/api/operations/google-places-no-website";

export default function GooglePlacesNoWebsitePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    keyword: "",
    location: "",
    language: "it",
    maxResults: 20
  });
  const [usage, setUsage] = useState({
    month: "",
    used: 0,
    limit: 1000,
    remaining: 1000
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastScan, setLastScan] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }

    if (session && session.user.role !== "amministratore") {
      router.push("/unauthorized");
    }
  }, [router, session, status]);

  useEffect(() => {
    if (!session) return;

    const loadUsage = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (response.ok) {
          setUsage(data.usage);
        }
      } catch (err) {
        console.error("Errore caricamento usage:", err);
      }
    };

    loadUsage();
  }, [session]);

  const usagePercentage = useMemo(() => {
    if (!usage.limit) return 0;
    return Math.min(Math.round((usage.used / usage.limit) * 100), 100);
  }, [usage.limit, usage.used]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setLastScan(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante la ricerca");
      }

      setResults(data.results || []);
      setUsage({
        month: data.usage.month,
        used: data.usage.used,
        limit: data.usage.limit,
        remaining: data.usage.remaining
      });
      setLastScan({
        callsThisSearch: data.usage.callsThisSearch,
        scannedResults: data.usage.scannedResults
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la ricerca");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const csv = placesToCsv(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeKeyword = form.keyword.trim().replace(/\s+/g, "-").toLowerCase() || "places";
    const safeLocation = form.location.trim().replace(/\s+/g, "-").toLowerCase() || "area";

    link.href = url;
    link.download = `${safeKeyword}-${safeLocation}-senza-sito.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Aziende Google senza sito
              </h1>
            </div>
            <p className="max-w-3xl text-gray-600">
              Cerca aziende su Google Places e filtra le schede in cui Google non restituisce
              un websiteUri.
            </p>
          </div>

          <div className="w-full rounded-xl bg-white p-5 shadow-md lg:w-80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Chiamate mese</span>
              <span className="text-sm font-semibold text-gray-900">
                {usage.used} / {usage.limit}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Rimangono {usage.remaining} chiamate gratuite stimate.
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-none" />
            <p>
              L&apos;assenza di websiteUri nella scheda Google non garantisce che
              l&apos;azienda non abbia un sito. Il limite interno e impostato a {usage.limit}
              chiamate/mese.
            </p>
          </div>
        </div>

        <SearchForm
          values={form}
          loading={loading}
          remainingCalls={usage.remaining}
          onChange={setForm}
          onSubmit={handleSearch}
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {lastScan && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="text-2xl font-bold text-blue-600">
                {lastScan.callsThisSearch}
              </div>
              <div className="text-sm text-gray-500">Chiamate usate nella ricerca</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="text-2xl font-bold text-gray-900">
                {lastScan.scannedResults}
              </div>
              <div className="text-sm text-gray-500">Risultati Google analizzati</div>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-md">
              <div className="text-2xl font-bold text-green-600">{results.length}</div>
              <div className="text-sm text-gray-500">Aziende senza websiteUri</div>
            </div>
          </div>
        )}

        <ResultsTable results={results} onExport={exportCsv} />
      </div>
    </div>
  );
}

'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MetaAdsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/Login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Dashboard
          </Link>
          
          <div className="text-center py-12">
            <Share2 className="w-20 h-20 mx-auto text-purple-400 mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              📱 Servizio Meta ADS
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Sezione in sviluppo
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-blue-800">
                Questa sezione per la gestione delle campagne Meta ADS (Facebook/Instagram) sarà disponibile prossimamente.
                <br />
                Per ora, puoi utilizzare il servizio Google Ads.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import TabellaGoogleAdsAdmin from "@/Components/TabellaGoogleAdsAdmin";
import VistaGoogleAdsCollaboratore from "@/Components/VistaGoogleAdsCollaboratore";

export default function GoogleAdsPage() {
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

  // Controllo ruolo: admin vede tutto, collaboratori con ruolo "google ads" vedono solo le loro campagne
  const isAdmin = session?.user?.role === "amministratore";
  const hasGoogleAdsRole = session?.user?.subRoles?.includes("google ads");

  if (!isAdmin && !hasGoogleAdsRole) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Accesso Negato</h2>
          <p className="text-red-600">
            Non hai i permessi per accedere a questa sezione.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAdmin ? <TabellaGoogleAdsAdmin /> : <VistaGoogleAdsCollaboratore />}
    </div>
  );
}

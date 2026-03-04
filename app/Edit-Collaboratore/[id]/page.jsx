'use client';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { use } from "react";
import EditUserForm from "@/Components/Edit-collaboratore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EditCollaboratorePage({ params }) {
  const { data: session, status } = useSession();
  const { id } = use(params);

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

  // Solo amministratori possono modificare collaboratori
  if (session?.user?.role !== "amministratore") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Accesso Negato</h2>
          <p className="text-red-600">
            Solo gli amministratori possono modificare i collaboratori.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href="/Lista_collaboratori"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla Lista Collaboratori
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              ✏️ Modifica Collaboratore
            </h1>
            <p className="text-gray-600">
              Aggiorna i dati del collaboratore, inclusi ruoli e specializzazioni
            </p>
          </div>
          
          <EditUserForm userId={id} />
        </div>
      </div>
    </div>
  );
}

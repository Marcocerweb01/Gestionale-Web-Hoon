"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/Components/Header";
import TimelineLead from "@/Components/TimelineLead";
import CreaLead from "@/Components/CreaLead";
import { FaFilter } from "react-icons/fa";

export default function GestioneLead() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtri
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads();
    }
  }, [session]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/leads?commerciale=${session.user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Errore caricamento lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadCreato = (nuovoLead) => {
    setLeads([nuovoLead, ...leads]);
  };

  const handleLeadUpdate = (leadAggiornato) => {
    setLeads(leads.map(l => l._id === leadAggiornato._id ? leadAggiornato : l));
  };

  const handleLeadDelete = (leadId) => {
    setLeads(leads.filter(l => l._id !== leadId));
  };

  const leadsFiltrati = () => {
    let risultato = leads;

    // Filtro per stato
    if (filtroStato !== "tutti") {
      risultato = risultato.filter(l => l.stato_attuale === filtroStato);
    }

    // Filtro per ricerca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      risultato = risultato.filter(l => 
        l.nome_attivita.toLowerCase().includes(term) ||
        l.referente?.toLowerCase().includes(term) ||
        l.numero_telefono.includes(term) ||
        l.email?.toLowerCase().includes(term)
      );
    }

    return risultato;
  };

  const conteggioPerStato = (stato) => {
    return leads.filter(l => l.stato_attuale === stato).length;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Caricamento lead...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const leadsMostrati = leadsFiltrati();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Pagina */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Gestione Lead Commerciali
          </h1>
          <p className="text-gray-600">
            Traccia l'avanzamento dei tuoi contatti commerciali attraverso la timeline
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            
            {/* Searchbar */}
            <div className="flex-1 w-full lg:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Cerca per nome, referente, telefono, email..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pulsante Crea Lead */}
            <CreaLead 
              commercialeId={session.user.id} 
              onLeadCreato={handleLeadCreato}
            />
          </div>

          {/* Filtri Stati */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setFiltroStato("tutti")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtroStato === "tutti"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Tutti ({leads.length})
              </button>
              
              <button
                onClick={() => setFiltroStato("in_lavorazione")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtroStato === "in_lavorazione"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                In Lavorazione ({conteggioPerStato("in_lavorazione")})
              </button>

              <button
                onClick={() => setFiltroStato("da_richiamare")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtroStato === "da_richiamare"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }`}
              >
                Da Richiamare ({conteggioPerStato("da_richiamare")})
              </button>

              <button
                onClick={() => setFiltroStato("non_interessato")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtroStato === "non_interessato"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Non Interessato ({conteggioPerStato("non_interessato")})
              </button>

              <button
                onClick={() => setFiltroStato("completato")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filtroStato === "completato"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                Completato ({conteggioPerStato("completato")})
              </button>
            </div>
        </div>

        {/* Lista Lead */}
        {leadsMostrati.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nessun lead trovato
            </h3>
            <p className="text-gray-500">
              {searchTerm || filtroStato !== "tutti"
                ? "Prova a modificare i filtri di ricerca"
                : "Inizia creando il tuo primo lead commerciale"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leadsMostrati.map(lead => (
              <TimelineLead
                key={lead._id}
                lead={lead}
                onUpdate={handleLeadUpdate}
                onDelete={handleLeadDelete}
              />
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {leads.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{leads.length}</p>
                <p className="text-sm opacity-90">Totale Lead</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{conteggioPerStato("in_lavorazione")}</p>
                <p className="text-sm opacity-90">In Lavorazione</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{conteggioPerStato("da_richiamare")}</p>
                <p className="text-sm opacity-90">Da Richiamare</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{conteggioPerStato("completato")}</p>
                <p className="text-sm opacity-90">Completati</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

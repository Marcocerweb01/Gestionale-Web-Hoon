"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Header from "@/Components/Header";
import TimelineLead from "@/Components/TimelineLead";
import CreaLead from "@/Components/CreaLead";
import { FaFilter } from "react-icons/fa";

const FeedCollaborazione = ({params}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nome = searchParams.get("nome");
  const { collaboratoreId } = params;

  const [leads, setLeads] = useState([]);
  const [commercialeInfo, setCommercialeInfo] = useState(null);
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
    if (collaboratoreId) {
      fetchCommercialeInfo();
      fetchLeads();
    }
  }, [collaboratoreId]);

  const fetchCommercialeInfo = async () => {
    try {
      const response = await fetch(`/api/users/${collaboratoreId}`);
      if (response.ok) {
        const data = await response.json();
        setCommercialeInfo(data);
      }
    } catch (error) {
      console.error("Errore caricamento info commerciale:", error);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads?commerciale=${collaboratoreId}`);
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

    // Ordinamento speciale per "da_richiamare"
    if (filtroStato === "da_richiamare") {
      risultato = risultato.sort((a, b) => {
        const dataA = a.data_richiamo ? new Date(a.data_richiamo) : null;
        const dataB = b.data_richiamo ? new Date(b.data_richiamo) : null;
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        // Lead senza data vanno in fondo
        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;

        // Verifica se le date sono passate
        const aPassata = dataA < oggi;
        const bPassata = dataB < oggi;

        // Date passate sempre in cima
        if (aPassata && !bPassata) return -1;
        if (!aPassata && bPassata) return 1;

        // Se entrambe passate o entrambe future, ordina per data (crescente)
        return dataA - dataB;
      });
    }

    return risultato;
  };

  const conteggioPerStato = (stato) => {
    return leads.filter(l => l.stato_attuale === stato).length;
  };
  
  if (!collaboratoreId || !nome) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-600">ID collaboratore o Nome non forniti.</p>
        </div>
      </div>
    );
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const leadsMostrati = leadsFiltrati();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header Dashboard - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800">
                � Dashboard Lead Commerciali
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Benvenuto, {nome || (commercialeInfo ? `${commercialeInfo.nome} ${commercialeInfo.cognome || ''}` : 'Commerciale')}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Searchbar */}
            <div className="flex-1 w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Cerca per nome, referente, telefono, email..."
                className="w-full border border-gray-300 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pulsante Crea Lead */}
            <div className="w-full lg:w-auto">
              <CreaLead 
                commercialeId={collaboratoreId} 
                onLeadCreato={handleLeadCreato}
              />
            </div>
          </div>

          {/* Filtri Stati - Mobile Responsive */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setFiltroStato("tutti")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "tutti"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Tutti ({leads.length})
              </button>
              
              <button
                onClick={() => setFiltroStato("in_lavorazione")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "in_lavorazione"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                <span className="hidden sm:inline">In Lavorazione</span>
                <span className="sm:hidden">In Lav.</span>
                <span className="ml-1">({conteggioPerStato("in_lavorazione")})</span>
              </button>

              <button
                onClick={() => setFiltroStato("da_richiamare")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "da_richiamare"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }`}
              >
                <span className="hidden sm:inline">Da Richiamare</span>
                <span className="sm:hidden">Da Rich.</span>
                <span className="ml-1">({conteggioPerStato("da_richiamare")})</span>
              </button>

              <button
                onClick={() => setFiltroStato("non_interessato")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "non_interessato"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                <span className="hidden sm:inline">Non Interessato</span>
                <span className="sm:hidden">Non Int.</span>
                <span className="ml-1">({conteggioPerStato("non_interessato")})</span>
              </button>

              <button
                onClick={() => setFiltroStato("completato")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "completato"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                <span className="hidden sm:inline">Completato</span>
                <span className="sm:hidden">Compl.</span>
                <span className="ml-1">({conteggioPerStato("completato")})</span>
              </button>
            </div>
        </div>

        {/* Lista Lead - Mobile Responsive */}
        {leadsMostrati.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
            <div className="text-4xl md:text-6xl mb-4">📋</div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
              Nessun lead trovato
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              {searchTerm || filtroStato !== "tutti"
                ? "Prova a modificare i filtri di ricerca"
                : `Inizia creando il tuo primo lead commerciale`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
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

        {/* Footer Stats - Mobile Responsive */}
        {leads.length > 0 && (
          <div className="mt-6 md:mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-center">
              <div>
                <p className="text-xl md:text-3xl font-bold">{leads.length}</p>
                <p className="text-xs md:text-sm opacity-90">Totale Lead</p>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold">{conteggioPerStato("in_lavorazione")}</p>
                <p className="text-xs md:text-sm opacity-90">In Lavorazione</p>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold">{conteggioPerStato("da_richiamare")}</p>
                <p className="text-xs md:text-sm opacity-90">Da Richiamare</p>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold">{conteggioPerStato("completato")}</p>
                <p className="text-xs md:text-sm opacity-90">Completati</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedCollaborazione;

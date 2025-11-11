"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/Components/Header";
import TimelineLead from "@/Components/TimelineLead";
import CreaLead from "@/Components/CreaLead";
import { FaArrowLeft } from "react-icons/fa";

export default function LeadCommerciale() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const commercialeId = params.id;

  const [leads, setLeads] = useState([]);
  const [commercialeInfo, setCommercialeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtri
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroTimeline, setFiltroTimeline] = useState("tutti");
  const [filtroData, setFiltroData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }
  }, [status, router]);

  useEffect(() => {
    if (commercialeId) {
      fetchCommercialeInfo();
      fetchLeads();
    }
  }, [commercialeId]);

  const fetchCommercialeInfo = async () => {
    try {
      const response = await fetch(`/api/users/${commercialeId}`);
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
      const response = await fetch(`/api/leads?commerciale=${commercialeId}`);
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

    // Filtro per timeline (preventivo completato)
    if (filtroTimeline === "preventivo") {
      risultato = risultato.filter(l => l.timeline?.preventivo?.completato === true);
    }
    
    // Filtro per data specifica
    if (filtroData) {
      risultato = risultato.filter(l => {
        const dataLead = new Date(l.createdAt).toISOString().split('T')[0];
        return dataLead === filtroData;
      });
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

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header Pagina con Torna Indietro - Mobile Responsive */}
        <div className="mb-6 md:mb-8 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white rounded-lg shadow hover:shadow-lg transition-all"
            title="Torna indietro"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
              Lead {commercialeInfo ? `${commercialeInfo.nome} ${commercialeInfo.cognome || ''}`.trim() : 'Commerciale'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Traccia l&apos;avanzamento dei contatti commerciali
            </p>
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
                commercialeId={commercialeId} 
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
                In Lavorazione ({conteggioPerStato("in_lavorazione")})
              </button>

              <button
                onClick={() => setFiltroStato("da_richiamare")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "da_richiamare"
                    ? "bg-yellow-600 text-white"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }`}
              >
                Da Richiamare ({conteggioPerStato("da_richiamare")})
              </button>

              <button
                onClick={() => setFiltroStato("non_interessato")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "non_interessato"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Non Interessato ({conteggioPerStato("non_interessato")})
              </button>

              <button
                onClick={() => setFiltroStato("completato")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroStato === "completato"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                Completato ({conteggioPerStato("completato")})
              </button>

              {/* Filtro Timeline Preventivo */}
              <button
                onClick={() => setFiltroTimeline(filtroTimeline === "preventivo" ? "tutti" : "preventivo")}
                className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${
                  filtroTimeline === "preventivo"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                📋 Con Preventivo
              </button>

              {/* Filtro Data */}
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-100 rounded-full">
                <label className="text-xs md:text-sm font-medium text-gray-700">📅</label>
                <input
                  type="date"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  className="border-0 bg-transparent text-xs md:text-sm focus:outline-none focus:ring-0 w-32"
                />
              </div>

              {/* Reset Filtri */}
              {(filtroTimeline !== "tutti" || filtroData) && (
                <button
                  onClick={() => {
                    setFiltroTimeline("tutti");
                    setFiltroData("");
                  }}
                  className="px-3 md:px-4 py-2 rounded-full bg-gray-300 text-gray-800 hover:bg-gray-400 text-xs md:text-sm font-medium transition-all"
                >
                  ✖ Reset
                </button>
              )}
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
                : "Inizia creando il primo lead commerciale"
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

        {/* Footer Stats - Grid 2x2 */}
        {leads.length > 0 && (
          <div className="mt-6 md:mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
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
}
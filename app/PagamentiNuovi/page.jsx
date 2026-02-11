"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import FormEntrata from "@/Components/FormEntrata";
import FormUscita from "@/Components/FormUscita";
import TabellaPagamenti from "@/Components/TabellaPagamenti";
import DiagnosticaMigration from "@/Components/DiagnosticaMigration";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Filter
} from "lucide-react";

export default function PagamentiNuovi() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pagamenti, setPagamenti] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mostraFormEntrata, setMostraFormEntrata] = useState(false);
  const [mostraFormUscita, setMostraFormUscita] = useState(false);

  // Filtri
  const [filtroMese, setFiltroMese] = useState("");
  const [filtroAnno, setFiltroAnno] = useState(new Date().getFullYear().toString());
  const [filtroAzienda, setFiltroAzienda] = useState("");
  const [filtroServizio, setFiltroServizio] = useState("");
  const [filtroCollaboratore, setFiltroCollaboratore] = useState("");
  const [filtroStato, setFiltroStato] = useState("");
  const [ordinamento, setOrdinamento] = useState("data_desc");

  // Statistiche
  const [stats, setStats] = useState({
    totale_entrate: 0,
    totale_uscite: 0,
    bilancio: 0,
    num_entrate: 0,
    num_uscite: 0
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPagamenti();
    }
  }, [session, filtroMese, filtroAnno, filtroAzienda, filtroServizio, filtroCollaboratore, filtroStato, ordinamento]);

  const fetchPagamenti = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroMese) params.append("mese", filtroMese);
      if (filtroAnno) params.append("anno", filtroAnno);
      if (filtroAzienda) params.append("azienda", filtroAzienda);
      if (filtroServizio) params.append("servizio", filtroServizio);
      if (filtroCollaboratore) params.append("collaboratore", filtroCollaboratore);
      if (filtroStato) params.append("stato", filtroStato);
      if (ordinamento) params.append("sort", ordinamento);

      const response = await fetch(`/api/pagamenti-nuovi?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPagamenti(data);
        calcolaStatistiche(data);
      }
    } catch (error) {
      console.error("Errore caricamento pagamenti:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calcolaStatistiche = (pagamenti) => {
    const entrate = pagamenti.filter(p => p.tipo === "entrata");
    const uscite = pagamenti.filter(p => p.tipo === "uscita");

    const totale_entrate = entrate.reduce((sum, p) => sum + p.importo, 0);
    const totale_uscite = uscite.reduce((sum, p) => sum + p.importo, 0);

    setStats({
      totale_entrate,
      totale_uscite,
      bilancio: totale_entrate - totale_uscite,
      num_entrate: entrate.length,
      num_uscite: uscite.length
    });
  };

  const handleNuovaEntrata = (nuovaEntrata) => {
    fetchPagamenti(); // Ricarica tutto per includere anche le uscite auto-generate
    setMostraFormEntrata(false);
  };

  const handleNuovaUscita = (nuovaUscita) => {
    setPagamenti([nuovaUscita, ...pagamenti]);
    setMostraFormUscita(false);
  };

  const handlePagamentoAggiornato = () => {
    fetchPagamenti();
  };

  const handlePagamentoEliminato = () => {
    fetchPagamenti();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600">Caricamento pagamenti...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "amministratore") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl">Accesso non autorizzato</p>
        </div>
      </div>
    );
  }

  const mesi = [
    { value: "1", label: "Gennaio" },
    { value: "2", label: "Febbraio" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Aprile" },
    { value: "5", label: "Maggio" },
    { value: "6", label: "Giugno" },
    { value: "7", label: "Luglio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Settembre" },
    { value: "10", label: "Ottobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Dicembre" }
  ];

  const anni = [];
  const annoCorrente = new Date().getFullYear();
  for (let i = annoCorrente - 5; i <= annoCorrente + 1; i++) {
    anni.push(i);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
            💰 Gestione Pagamenti - Nuovo Sistema
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Sistema completo per la gestione di entrate e uscite aziendali
          </p>
        </div>

        {/* Diagnostica Migration */}
        <DiagnosticaMigration />

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Totale Entrate</p>
                <p className="text-3xl font-bold">€ {stats.totale_entrate.toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">{stats.num_entrate} transazioni</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-75" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Totale Uscite</p>
                <p className="text-3xl font-bold">€ {stats.totale_uscite.toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">{stats.num_uscite} transazioni</p>
              </div>
              <TrendingDown className="w-12 h-12 opacity-75" />
            </div>
          </div>

          <div className={`bg-gradient-to-r ${stats.bilancio >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white rounded-lg shadow-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Bilancio</p>
                <p className="text-3xl font-bold">€ {stats.bilancio.toFixed(2)}</p>
                <p className="text-xs opacity-75 mt-1">
                  {stats.bilancio >= 0 ? "In attivo" : "In passivo"}
                </p>
              </div>
              <DollarSign className="w-12 h-12 opacity-75" />
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filtri</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Mese */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Mese
              </label>
              <select
                value={filtroMese}
                onChange={(e) => setFiltroMese(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti i mesi</option>
                {mesi.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Anno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anno
              </label>
              <select
                value={filtroAnno}
                onChange={(e) => setFiltroAnno(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti gli anni</option>
                {anni.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Azienda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azienda/Cliente
              </label>
              <input
                type="text"
                value={filtroAzienda}
                onChange={(e) => setFiltroAzienda(e.target.value)}
                placeholder="Cerca per nome..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Servizio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servizio
              </label>
              <input
                type="text"
                value={filtroServizio}
                onChange={(e) => setFiltroServizio(e.target.value)}
                placeholder="Tipo servizio..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato Pagamento
              </label>
              <select
                value={filtroStato}
                onChange={(e) => setFiltroStato(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti</option>
                <option value="pagato">Pagato</option>
                <option value="non_pagato">Non Pagato</option>
                <option value="ragazzi">Ragazzi</option>
              </select>
            </div>

            {/* Ordinamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordina per
              </label>
              <select
                value={ordinamento}
                onChange={(e) => setOrdinamento(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="data_desc">Data (più recente)</option>
                <option value="data_asc">Data (più vecchio)</option>
                <option value="importo_desc">Importo (maggiore)</option>
                <option value="importo_asc">Importo (minore)</option>
                <option value="entrate">Solo Entrate</option>
                <option value="uscite">Solo Uscite</option>
              </select>
            </div>

            {/* Reset Filtri */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltroMese("");
                  setFiltroAnno(new Date().getFullYear().toString());
                  setFiltroAzienda("");
                  setFiltroServizio("");
                  setFiltroCollaboratore("");
                  setFiltroStato("");
                  setOrdinamento("data_desc");
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ✖ Reset Filtri
              </button>
            </div>
          </div>
        </div>

        {/* Pulsanti Azione */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => setMostraFormEntrata(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Inserisci Entrata</span>
          </button>

          <button
            onClick={() => setMostraFormUscita(true)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          >
            <TrendingDown className="w-5 h-5" />
            <span className="font-medium">Inserisci Uscita</span>
          </button>
        </div>

        {/* Tabella Pagamenti */}
        <TabellaPagamenti
          pagamenti={pagamenti}
          onPagamentoAggiornato={handlePagamentoAggiornato}
          onPagamentoEliminato={handlePagamentoEliminato}
        />

        {/* Form Entrata Modal */}
        {mostraFormEntrata && (
          <FormEntrata
            onClose={() => setMostraFormEntrata(false)}
            onEntrataCreata={handleNuovaEntrata}
          />
        )}

        {/* Form Uscita Modal */}
        {mostraFormUscita && (
          <FormUscita
            onClose={() => setMostraFormUscita(false)}
            onUscitaCreata={handleNuovaUscita}
          />
        )}
      </div>
    </div>
  );
}

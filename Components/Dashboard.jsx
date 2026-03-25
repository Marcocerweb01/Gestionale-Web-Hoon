'use client';

import React, { useEffect, useState } from 'react';
import { useCollaboratoriWithGlobalRefresh } from '@/hooks/useCollaboratori'; // ✨ Importa il nuovo hook
import ListaCollaboratori from './Lista-collaboratori';
import ListaClienti from './Lista-clienti';
import TimelineWebDesigner from './timeline-web-designer'; // ✨ Uso TimelineWebDesigner al posto di ListaClientiWebDesigner
import TimelineLead from './TimelineLead';
import CreaLead from './CreaLead';
import VistaGoogleAdsCollaboratore from './VistaGoogleAdsCollaboratore';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { 
  UserPlus, 
  Users, 
  Building2, 
  CreditCard, 
  Download, 
  RotateCcw, 
  DollarSign,
  PlusCircle,
  Clock,
  MessageSquare,
  Settings,
  Monitor,
  Table,
  Sparkles,
  TrendingUp,
  Search,
  Target,
  Share2
} from 'lucide-react';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [sezioneAperta, setSezioneAperta] = useState(() => {
    // Recupera lo stato salvato da localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardSezioneAperta') || null;
    }
    return null;
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [fatture, setFatture] = useState([]);
  const [loadingFatture, setLoadingFatture] = useState(false);
  const [anniAperti, setAnniAperti] = useState({ 2025: true }); // Anno corrente aperto di default
  const [sottoMenuMarketing, setSottoMenuMarketing] = useState(false); // Stato per sotto-menu marketing
  
  // ✨ Usa il nuovo hook con refresh automatico
  const { collaboratori: data, loading, error, refreshCollaboratori } = useCollaboratoriWithGlobalRefresh();

  // ✨ Filtra solo collaboratori attivi per il Dashboard
  const collaboratoriAttivi = data.filter(collab => collab.status === 'attivo');

  // Stati per gestione lead commerciali
  const [leads, setLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroTimeline, setFiltroTimeline] = useState("tutti"); // Nuovo filtro timeline
  const [filtroData, setFiltroData] = useState(""); // Nuovo filtro data
  const [searchTerm, setSearchTerm] = useState("");
  const [mostraPassati, setMostraPassati] = useState(false);

  // Helper per verificare se l'utente ha un determinato ruolo
  const hasRole = (role) => {
    if (!session?.user) return false;
    
    console.log('🔍 hasRole check:', {
      lookingFor: role,
      subRoles: session.user.subRoles,
      subRole: session.user.subrole,
      hasSubRolesArray: session.user.subRoles && Array.isArray(session.user.subRoles)
    });
    
    // Supporta sia subRoles (array) che subRole (stringa) per retrocompatibilità
    if (session.user.subRoles && Array.isArray(session.user.subRoles)) {
      const result = session.user.subRoles.some(r => r.toLowerCase() === role.toLowerCase());
      console.log(`✅ Result (array): ${result}`);
      return result;
    }
    const result = session.user.subrole?.toLowerCase() === role.toLowerCase();
    console.log(`✅ Result (string): ${result}`);
    return result;
  };

  // Salva lo stato della sezione aperta in localStorage quando cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sezioneAperta) {
        localStorage.setItem('dashboardSezioneAperta', sezioneAperta);
      } else {
        localStorage.removeItem('dashboardSezioneAperta');
      }
    }
  }, [sezioneAperta]);

  // Carica lead se l'utente è un commerciale
  useEffect(() => {
    if (session?.user?.id) {
      const isCommerciale = session.user.subRoles 
        ? session.user.subRoles.some(r => r.toLowerCase() === 'commerciale')
        : session.user.subrole?.toLowerCase() === 'commerciale';
      
      if (isCommerciale) {
        fetchLeads();
      }
    }
  }, [session]);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const response = await fetch(`/api/leads?commerciale=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Errore caricamento lead:", error);
    } finally {
      setIsLoadingLeads(false);
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
    let risultato = [...leads]; // Copia per evitare mutazioni
    
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

    // Ordinamento speciale per "da_richiamare"
    if (filtroStato === "da_richiamare") {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);

      // Filtra le date passate di default, mostra tutto se checkbox attivo
      if (!mostraPassati) {
        risultato = risultato.filter(l => {
          if (!l.data_richiamo) return true; // Mostra lead senza data
          const dataRichiamo = new Date(l.data_richiamo);
          dataRichiamo.setHours(0, 0, 0, 0);
          return dataRichiamo >= oggi;
        });
      }

      risultato.sort((a, b) => {
        const dataA = a.data_richiamo ? new Date(a.data_richiamo) : null;
        const dataB = b.data_richiamo ? new Date(b.data_richiamo) : null;

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

        // Se entrambe passate o entrambe future, ordina per data (crescente: dal più vicino)
        return dataA - dataB;
      });
    }

    return risultato;
  };

  const conteggioPerStato = (stato) => {
    return leads.filter(l => l.stato_attuale === stato).length;
  };

  // Funzione per recuperare le fatture del collaboratore
  const fetchFatture = async () => {
    if (!session?.user?.id || !session?.user?.subrole) return;
    
    try {
      setLoadingFatture(true);
      const response = await fetch(`/api/fatturazione/collaboratore/${session.user.id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle fatture");
      }
      const data = await response.json();
      setFatture(data);
    } catch (err) {
      console.error("Errore recupero fatture:", err);
    } finally {
      setLoadingFatture(false);
    }
  };

  // Funzione per cambiare stato emissione fattura
  const handleToggleStatoEmissione = async (fatturaId, statoAttuale) => {
    try {
      const nuovoStato = statoAttuale === "non emessa" ? "emessa" : "non emessa";
      
      const response = await fetch(`/api/fatturazione/${fatturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statoCollaboratore: nuovoStato })
      });

      if (response.ok) {
        fetchFatture();
      } else {
        alert("Errore durante l'aggiornamento dello stato");
      }
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };

  // Formatta mese da YYYY-MM a "Mese Anno"
  const formatMese = (mese) => {
    const [anno, meseNum] = mese.split('-');
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${mesi[parseInt(meseNum) - 1]} ${anno}`;
  };

  // Raggruppa fatture per anno
  const raggruppaFatturePerAnno = () => {
    const gruppi = {};
    fatture.forEach(fattura => {
      const anno = fattura.mese.split('-')[0];
      if (!gruppi[anno]) {
        gruppi[anno] = [];
      }
      gruppi[anno].push(fattura);
    });
    return gruppi;
  };

  // Toggle accordion anno
  const toggleAnno = (anno) => {
    setAnniAperti(prev => ({
      ...prev,
      [anno]: !prev[anno]
    }));
  };

  // Carica fatture quando il componente viene montato
  useEffect(() => {
    if (session?.user?.subrole) {
      fetchFatture();
    }
  }, [session?.user?.id, session?.user?.subrole]);

  // Funzione per avviare il download di JSON ed Excel
  const downloadxlsx = async () => {
    try {
      console.log("🔄 Avvio download JSON ed Excel...");
      
      // Download JSON
      console.log("📦 Download JSON...");
      const jsonResponse = await fetch(`/api/export_complete?format=json`);
      
      if (!jsonResponse.ok) {
        throw new Error(`Errore download JSON: ${jsonResponse.status}`);
      }
      
      const jsonBlob = await jsonResponse.blob();
      const jsonUrl = window.URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      
      const jsonContentDisposition = jsonResponse.headers.get('Content-Disposition');
      const jsonFilename = jsonContentDisposition 
        ? jsonContentDisposition.split('filename=')[1].replace(/"/g, '')
        : `collaborazioni_${new Date().toISOString().split('T')[0]}.json`;
      
      jsonLink.download = jsonFilename;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      jsonLink.remove();
      window.URL.revokeObjectURL(jsonUrl);
      
      console.log("✅ Download JSON completato");
      
      // Piccolo delay per non sovrapporre i download
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Download Excel
      console.log("� Download Excel...");
      const excelResponse = await fetch(`/api/export_complete?format=excel`);
      
      if (!excelResponse.ok) {
        throw new Error(`Errore download Excel: ${excelResponse.status}`);
      }
      
      const excelBlob = await excelResponse.blob();
      const excelUrl = window.URL.createObjectURL(excelBlob);
      const excelLink = document.createElement("a");
      excelLink.href = excelUrl;
      
      const excelContentDisposition = excelResponse.headers.get('Content-Disposition');
      const excelFilename = excelContentDisposition 
        ? excelContentDisposition.split('filename=')[1].replace(/"/g, '')
        : `collaborazioni_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      excelLink.download = excelFilename;
      document.body.appendChild(excelLink);
      excelLink.click();
      excelLink.remove();
      window.URL.revokeObjectURL(excelUrl);
      
      console.log("✅ Download Excel completato");
      
      alert("✅ Download completati!\n\n📄 File JSON scaricato\n📊 File Excel scaricato");
    } catch (err) {
      console.error("❌ Errore durante il download:", err);
      alert(`❌ Errore durante il download: ${err.message}`);
    }
  };

  // Funzione per il reset dei post
  const handleResetPosts = async () => {
    const conferma = window.confirm(
      "⚠️ ATTENZIONE!\n\nQuesto reset azzererà TUTTI i contatori dei post fatti per TUTTE le collaborazioni.\n\nSei sicuro di voler continuare?"
    );

    if (!conferma) return;

    setResetLoading(true);
    try {
      const response = await fetch("/api/reset_posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Reset completato!\n${result.modifiedCount} collaborazioni aggiornate.`);
      } else {
        alert("❌ Errore durante il reset. Riprova.");
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("❌ Errore di connessione. Riprova.");
    } finally {
      setResetLoading(false);
    }
  };

  // Funzione per il reset dei trimestrali
  const handleResetTrimestrali = async () => {
    const conferma = window.confirm(
      "⚠️ ATTENZIONE!\n\nQuesto reset azzererà TUTTI i contatori trimestrali (fatti e totali) per TUTTE le collaborazioni.\n\nEsegui solo a fine trimestre!\n\nSei sicuro di voler continuare?"
    );

    if (!conferma) return;

    setResetLoading(true);
    try {
      const response = await fetch("/api/reset_trimestrali", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Reset trimestrali completato!\n${result.modifiedCount} collaborazioni azzerate.`);
      } else {
        alert("❌ Errore durante il reset trimestrali. Riprova.");
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("❌ Errore di connessione. Riprova.");
    } finally {
      setResetLoading(false);
    }
  };

  // Funzione per fix appuntamenti fatti dal 1 novembre
  const handleFixAppuntamenti = async () => {
    const conferma = window.confirm(
      "🔧 AGGIUNGI CAMPO APPUNTAMENTI FATTI\n\nQuesto script aggiungerà il campo 'appuntamenti_fatti' con valore 0 a tutte le collaborazioni che non ce l'hanno.\n\nSei sicuro di voler continuare?"
    );

    if (!conferma) return;

    setResetLoading(true);
    try {
      const response = await fetch("/api/fix_appuntamenti_fatti", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Campo aggiunto con successo!\n\nCollaborazioni processate: ${result.collaborazioni_processate}\nCollaborazioni modificate: ${result.collaborazioni_modificate}`);
      } else {
        const error = await response.json();
        alert(`❌ Errore: ${error.error || "Errore sconosciuto"}`);
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("❌ Errore di connessione. Riprova.");
    } finally {
      setResetLoading(false);
    }
  };

  // Funzione per generare i pagamenti mensili
  const handleGeneraPagamenti = async () => {
    const conferma = window.confirm(
      "⚠️ ATTENZIONE!\n\nQuesto genererà i pagamenti mensili per tutte le collaborazioni attive (escluso il collaboratore specificato).\n\nI pagamenti duplicati verranno ignorati automaticamente.\n\nSei sicuro di voler continuare?"
    );

    if (!conferma) return;

    setResetLoading(true);
    try {
      const response = await fetch("/api/pagamenti/genera_mensili", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Pagamenti generati con successo!\n${result.pagamentiCreati.length} nuovi pagamenti creati.`);
      } else {
        const error = await response.json();
        alert(`❌ Errore durante la generazione: ${error.error || "Errore sconosciuto"}`);
      }
    } catch (error) {
      console.error("Errore:", error);
      alert("❌ Errore di connessione. Riprova.");
    } finally {
      setResetLoading(false);
    }
  };

  // Funzione per migrare i campi dei collaboratori
  const handleMigrateCollaboratori = async () => {
    const conferma = window.confirm(
      "🔧 MIGRATION COLLABORATORI\n\nQuesto aggiungerà i campi per il nuovo sistema pagamenti a tutti i collaboratori:\n\n- percentuale_hoon (50/55/60/70%)\n- tot_fatturato (0)\n- guadagno_da_hoon (0)\n- totale_fatture_terzi (0)\n\nPercentuali speciali:\n• 70% → Marco Cerasa, Lorenzo Pietrini, Francesco Bizzarri\n• 55% → Agnese Furesi\n• 50% → Tutti gli altri\n\nContinuare?"
    );

    if (!conferma) return;

    setResetLoading(true);
    try {
      const response = await fetch("/api/collaboratori/migrate-fields", {
        method: "POST"
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ Migration completata!\n\n` +
          `Collaboratori totali: ${result.risultati.totali}\n` +
          `Aggiornati: ${result.risultati.aggiornati}\n` +
          `Errori: ${result.risultati.errori.length}`
        );
        
        // Ricarica i collaboratori per vedere i cambiamenti
        if (refreshCollaboratori) {
          refreshCollaboratori();
        }
      } else {
        const error = await response.json();
        alert(`❌ Errore: ${error.error || error.details || "Errore sconosciuto"}`);
      }
    } catch (error) {
      console.error("Errore migration:", error);
      alert("❌ Errore di connessione. Riprova.");
    } finally {
      setResetLoading(false);
    }
  };

  // Loading state
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-red-800 text-center">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 p-4 md:p-0">
      {/* Welcome Header - Mobile Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
              Benvenuto, {session?.user?.nome}
            </h1>
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm md:text-base text-gray-600">
                Ruolo: <span className="font-medium">{session?.user?.role}</span>
              </span>
              {session?.user?.subRoles && session.user.subRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {session.user.subRoles.map((role, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role}
                    </span>
                  ))}
                </div>
              ) : session?.user?.subrole && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                  {session?.user?.subrole}
                </span>
              )}
            </div>
          </div>
          
          {/* Bottone Faq & App - Solo per utenti non amministratori */}
          {session?.user?.role !== "amministratore" && (
            <button
              onClick={() => setSezioneAperta(sezioneAperta === 'faq-app' ? null : 'faq-app')}
              className={`flex items-center justify-center space-x-2 px-4 md:px-6 py-3 rounded-lg transition-colors duration-200 group flex-shrink-0 ${
                sezioneAperta === 'faq-app' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm md:text-base">Faq & App</span>
              <span className="ml-1">{sezioneAperta === 'faq-app' ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
        
        {/* Contenuto Sezione Faq & App - Giallo */}
        {session?.user?.role !== "amministratore" && sezioneAperta === 'faq-app' && (
          <div className="mt-6 grid grid-cols-3 gap-3 md:gap-4 border-t border-yellow-200 pt-6">
            <Link href="/Faq">
              <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 group">
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm md:text-base">FAQ</span>
              </button>
            </Link>
            
            <div 
              className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-60 pointer-events-none select-none"
              title="Disponibile solo per amministratori"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-medium text-sm md:text-base">Operations</span>
            </div>
            
            <Link href="/Dispense">
              <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 group">
                <Download className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm md:text-base">Dispense</span>
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Sezione Fatturazione - Solo per collaboratori - Mobile Responsive */}
      {/* TEMPORANEAMENTE NASCOSTA */}
      {/* {session?.user?.subrole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 p-4 md:p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Le Mie Fatture</h2>
                <p className="text-gray-600 text-xs md:text-sm mt-1">Storico delle tue fatture mensili</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {loadingFatture ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm md:text-base">Caricamento fatture...</p>
              </div>
            ) : fatture.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Nessuna Fattura</h3>
                <p className="text-gray-500 text-sm md:text-base">Non sono ancora state generate fatture per il tuo account.</p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {fatture.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-4 md:p-5 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl md:text-2xl">📄</span>
                      <h4 className="font-bold text-gray-900 text-sm md:text-base">Ultima Fattura</h4>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-base md:text-lg text-gray-900">{formatMese(fatture[0].mese)}</p>
                        <p className="text-xs md:text-sm text-gray-700 mt-1">
                          Totale: {fatture[0].totale ? `€${fatture[0].totale.toFixed(2)}` : 'Non impostato'}
                        </p>
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-3">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                            fatture[0].statoCollaboratore === 'emessa' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fatture[0].statoCollaboratore === 'emessa' ? '✓ Emessa' : '⏳ Non Emessa'}
                          </span>
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
                            fatture[0].statoAmministratore === 'pagata' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {fatture[0].statoAmministratore === 'pagata' ? '✓ Pagata' : '⏳ Non Pagata'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStatoEmissione(fatture[0]._id, fatture[0].statoCollaboratore)}
                        className={`px-3 md:px-4 py-2 rounded-lg font-medium text-xs md:text-sm transition-colors w-full sm:w-auto ${
                          fatture[0].statoCollaboratore === 'emessa'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={fatture[0].statoCollaboratore === 'emessa'}
                      >
                        {fatture[0].statoCollaboratore === 'non emessa' ? 'Segna come emessa' : '✓ Emessa'}
                      </button>
                    </div>
                  </div>
                )}

                {fatture.length > 1 && (
                  <div className="border-t pt-4 md:pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                      <span>📚</span> Storico Fatture
                    </h4>
                    
                    {Object.entries(raggruppaFatturePerAnno())
                      .sort(([annoA], [annoB]) => parseInt(annoB) - parseInt(annoA))
                      .map(([anno, fattureAnno]) => {
                        const fattureStorico = anno === fatture[0].mese.split('-')[0] 
                          ? fattureAnno.slice(1) 
                          : fattureAnno;
                        
                        if (fattureStorico.length === 0) return null;

                        return (
                          <div key={anno} className="mb-3 border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleAnno(anno)}
                              className="w-full flex justify-between items-center p-3 md:p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="font-medium text-gray-900 text-sm md:text-base">Anno {anno}</span>
                              <span className="text-gray-600 text-xs md:text-sm">
                                {anniAperti[anno] ? '▼' : '▶'} {fattureStorico.length} fatture
                              </span>
                            </button>
                            
                            {anniAperti[anno] && (
                              <div className="border-t">
                                {fattureStorico.map((fattura) => (
                                  <div key={fattura._id} className="p-3 md:p-4 border-b last:border-b-0 bg-white hover:bg-gray-50">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900 text-sm md:text-base">{formatMese(fattura.mese)}</p>
                                        <p className="text-xs md:text-sm text-gray-600 mt-1">
                                          Totale: {fattura.totale ? `€${fattura.totale.toFixed(2)}` : 'Non impostato'}
                                        </p>
                                        <div className="flex flex-wrap gap-2 md:gap-3 mt-2">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            fattura.statoCollaboratore === 'emessa' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {fattura.statoCollaboratore === 'emessa' ? '✓ Emessa' : '⏳ Non Emessa'}
                                          </span>
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            fattura.statoAmministratore === 'pagata' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {fattura.statoAmministratore === 'pagata' ? '✓ Pagata' : '⏳ Non Pagata'}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleToggleStatoEmissione(fattura._id, fattura.statoCollaboratore)}
                                        className="text-xs md:text-sm text-blue-600 hover:text-blue-800 transition-colors w-full sm:w-auto text-left sm:text-right"
                                        disabled={fattura.statoCollaboratore === 'emessa'}
                                      >
                                        {fattura.statoCollaboratore === 'non emessa' ? 'Segna come emessa' : '✓ Emessa'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* Admin Panel - Mobile Responsive */}
      {session?.user?.role === "amministratore" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6 flex items-center">
            <Settings className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
            Pannello Amministratore
          </h2>
          
          {/* Pulsanti principali - 3 in alto orizzontali */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            <Link href="/AddCollab">
              <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 group">
                <PlusCircle className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm md:text-base">Crea Collaborazione</span>
              </button>
            </Link>
            
            <Link href="/Register">
              <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 group">
                <UserPlus className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm md:text-base">Registra Utente</span>
              </button>
            </Link>

            <button
              onClick={() => setSezioneAperta(sezioneAperta === 'faq-app' ? null : 'faq-app')}
              className={`w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 rounded-lg transition-colors duration-200 group ${
                sezioneAperta === 'faq-app' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm md:text-base">Faq & App</span>
              <span className="ml-1">{sezioneAperta === 'faq-app' ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Sezioni espandibili - 3 in basso orizzontali */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {/* Bottone Sezione Pagamenti - Verde */}
            <button
              onClick={() => setSezioneAperta(sezioneAperta === 'pagamenti' ? null : 'pagamenti')}
              className={`flex items-center justify-center space-x-2 px-3 md:px-4 py-3 rounded-lg transition-colors duration-200 group ${
                sezioneAperta === 'pagamenti' 
                  ? 'bg-green-700 text-white' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm md:text-base">Pagamenti</span>
              <span className="ml-1">{sezioneAperta === 'pagamenti' ? '▲' : '▼'}</span>
            </button>

            {/* Bottone Clienti e Collaborazioni - Viola */}
            <button
              onClick={() => setSezioneAperta(sezioneAperta === 'collaborazioni' ? null : 'collaborazioni')}
              className={`flex items-center justify-center space-x-2 px-3 md:px-4 py-3 rounded-lg transition-colors duration-200 group ${
                sezioneAperta === 'collaborazioni' 
                  ? 'bg-purple-700 text-white' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              <Building2 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm md:text-base">Clienti e Collaborazioni</span>
              <span className="ml-1">{sezioneAperta === 'collaborazioni' ? '▲' : '▼'}</span>
            </button>

            {/* Bottone Funzioni - Arancione */}
            <button
              onClick={() => setSezioneAperta(sezioneAperta === 'funzioni' ? null : 'funzioni')}
              className={`flex items-center justify-center space-x-2 px-3 md:px-4 py-3 rounded-lg transition-colors duration-200 group ${
                sezioneAperta === 'funzioni' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm md:text-base">Funzioni</span>
              <span className="ml-1">{sezioneAperta === 'funzioni' ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Contenuto Sezione Pagamenti - Verde */}
          {sezioneAperta === 'pagamenti' && (
            <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4 border-t border-green-200 pt-4 md:pt-6">
              <Link href="/Pagamenti">
                <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 group">
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm md:text-base">Vai a Pagamenti</span>
                </button>
              </Link>
              
              <button 
                className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 group" 
                onClick={handleGeneraPagamenti}
                disabled={resetLoading}
              >
                <DollarSign className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${resetLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm md:text-base">{resetLoading ? "Generando..." : "Genera Pagamenti"}</span>
              </button>
            </div>
          )}

          {/* Contenuto Sezione Clienti e Collaborazioni - Viola */}
          {sezioneAperta === 'collaborazioni' && (
            <div className="mt-4 md:mt-6 space-y-3 md:space-y-4 border-t border-purple-200 pt-4 md:pt-6">
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <Link href="/Lista_clienti">
                  <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 group">
                    <Building2 className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm md:text-base">Lista Clienti</span>
                  </button>
                </Link>
                
                <Link href="/Lista_collaboratori">
                  <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 group">
                    <Users className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm md:text-base">Lista Collaboratori</span>
                  </button>
                </Link>
                
                <Link href="/Tabella-collaborazioni">
                  <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 group">
                    <Table className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm md:text-base">Tabella Collaborazioni</span>
                  </button>
                </Link>
              </div>
              
              {/* Gestione Collaborazioni Utente + Gestione Domini */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Link href="/Gestione-Collaborazioni-Utente">
                  <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 group border-2 border-purple-400">
                    <Users className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm md:text-base">🗂️ Gestione Collaborazioni</span>
                  </button>
                </Link>
                <Link href="/Gestione-Domini">
                  <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 group border-2 border-purple-400">
                    <Monitor className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm md:text-base">🌐 Gestione Domini Web Design</span>
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Contenuto Sezione Funzioni - Arancione */}
          {sezioneAperta === 'funzioni' && (
            <div className="mt-4 md:mt-6 grid grid-cols-3 gap-3 md:gap-4 border-t border-orange-200 pt-4 md:pt-6">
              <button 
                className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 group" 
                onClick={downloadxlsx}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm md:text-base">Download Dati</span>
              </button>
              
              <button 
                className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 group" 
                onClick={handleResetPosts}
                disabled={resetLoading}
              >
                <RotateCcw className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${resetLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm md:text-base">{resetLoading ? "Reset..." : "Reset Post"}</span>
              </button>
              
              <button 
                className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 group" 
                onClick={handleResetTrimestrali}
                disabled={resetLoading}
              >
                <RotateCcw className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${resetLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
                <span className="font-medium text-sm md:text-base">{resetLoading ? "Reset..." : "Reset Trimestrali"}</span>
              </button>
            </div>
          )}

          {/* Contenuto Sezione Faq & App - Giallo */}
          {sezioneAperta === 'faq-app' && (
            <div className="mt-4 md:mt-6 grid grid-cols-3 gap-3 md:gap-4 border-t border-yellow-200 pt-4 md:pt-6">
              <Link href="/Operations">
                <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 group">
                  <Settings className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm md:text-base">Operations</span>
                </button>
              </Link>
              
              <Link href="/Faq">
                <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 group">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm md:text-base">FAQ</span>
                </button>
              </Link>
              
              <Link href="/Dispense">
                <button className="w-full flex items-center justify-center space-x-2 px-3 md:px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 group">
                  <Download className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm md:text-base">Dispense</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Content - Mobile Responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
            {session?.user?.role === "amministratore" ? (
              <>
                <Users className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                Lista Collaboratori
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                Dashboard
              </>
            )}
          </h2>
        </div>
        
        <div className="p-4 md:p-6">
          {session?.user?.role === "amministratore" ? (
            <ListaCollaboratori collaboratori={collaboratoriAttivi} />
          ) : (
            <>
              {/* Lead Commerciali */}
              {hasRole("commerciale") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <MessageSquare className="w-6 h-6 mr-2 text-green-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Lead Commerciali</h3>
                  </div>
                  {session?.user?.id ? (
                    <LeadDashboard 
                      leads={leads}
                      isLoading={isLoadingLeads}
                      filtroStato={filtroStato}
                      setFiltroStato={setFiltroStato}
                      filtroTimeline={filtroTimeline}
                      setFiltroTimeline={setFiltroTimeline}
                      filtroData={filtroData}
                      setFiltroData={setFiltroData}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      leadsFiltrati={leadsFiltrati()}
                      conteggioPerStato={conteggioPerStato}
                      handleLeadCreato={handleLeadCreato}
                      handleLeadUpdate={handleLeadUpdate}
                      handleLeadDelete={handleLeadDelete}
                      commercialeId={session.user.id}
                      mostraPassati={mostraPassati}
                      setMostraPassati={setMostraPassati}
                    />
                  ) : (
                    <div className="text-center py-8 text-red-600">
                      ❌ Errore: ID utente non disponibile. Riprova ad effettuare il login.
                    </div>
                  )}
                </div>
              )}

              {/* Progetti Web Design */}
              {hasRole("web designer") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Clock className="w-6 h-6 mr-2 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">I tuoi progetti Web Design</h3>
                  </div>
                  {session?.user?.id ? (
                    <TimelineWebDesigner userId={session.user.id} />
                  ) : (
                    <div className="text-center py-8 text-red-600">
                      ❌ Errore: ID utente non disponibile. Riprova ad effettuare il login.
                    </div>
                  )}
                </div>
              )}

              {/* Social Media Manager */}
              {hasRole("smm") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Building2 className="w-6 h-6 mr-2 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Lista Clienti Social Media</h3>
                  </div>
                  {session?.user?.id ? (
                    <ListaClienti id={session.user.id} amministratore={false} />
                  ) : (
                    <div className="text-center py-8 text-red-600">
                      ❌ Errore: ID utente non disponibile. Riprova ad effettuare il login.
                    </div>
                  )}
                </div>
              )}

              {/* Google ADS */}
              {hasRole("google ads") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Target className="w-6 h-6 mr-2 text-orange-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Le mie Campagne Google ADS</h3>
                  </div>
                  <VistaGoogleAdsCollaboratore />
                </div>
              )}

              {/* Meta ADS */}
              {hasRole("meta ads") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Share2 className="w-6 h-6 mr-2 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Le mie Campagne Meta ADS</h3>
                  </div>
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Share2 className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                    <p className="text-gray-600 text-lg">Sezione Meta ADS in arrivo...</p>
                  </div>
                </div>
              )}

              {/* SEO */}
              {hasRole("seo") && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Search className="w-6 h-6 mr-2 text-purple-600" />
                    <h3 className="text-xl font-semibold text-gray-900">I miei Progetti SEO</h3>
                  </div>
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Search className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                    <p className="text-gray-600 text-lg">Sezione SEO in arrivo...</p>
                  </div>
                </div>
              )}

              {/* Nessun ruolo assegnato */}
              {!hasRole("commerciale") && !hasRole("web designer") && !hasRole("smm") && !hasRole("google ads") && !hasRole("meta ads") && !hasRole("seo") && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">Nessun ruolo assegnato</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente per la Dashboard Lead del Commerciale
const LeadDashboard = ({ 
  leads, 
  isLoading, 
  filtroStato, 
  setFiltroStato,
  filtroTimeline,
  setFiltroTimeline,
  filtroData,
  setFiltroData,
  searchTerm, 
  setSearchTerm, 
  leadsFiltrati, 
  conteggioPerStato,
  handleLeadCreato,
  handleLeadUpdate,
  handleLeadDelete,
  commercialeId,
  mostraPassati,
  setMostraPassati
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-6xl mb-4">⏳</div>
        <p className="text-gray-600">Caricamento lead...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar - Mobile Responsive */}
      <div className="bg-gray-50 rounded-lg p-4">
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
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-300">
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

          {/* Checkbox mostra passati - visibile solo quando filtro è da_richiamare */}
          {filtroStato === "da_richiamare" && (
            <label className="flex items-center gap-2 px-3 md:px-4 py-2 bg-yellow-50 rounded-full cursor-pointer hover:bg-yellow-100 transition-all">
              <input
                type="checkbox"
                checked={mostraPassati}
                onChange={(e) => setMostraPassati(e.target.checked)}
                className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
              />
              <span className="text-xs md:text-sm font-medium text-yellow-700">
                Mostra passati
              </span>
            </label>
          )}

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

      {/* Lista Lead */}
      {leadsFiltrati.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
          <div className="text-4xl md:text-6xl mb-4">📋</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            Nessun lead trovato
          </h3>
          <p className="text-sm md:text-base text-gray-500">
            {searchTerm || filtroStato !== "tutti"
              ? "Prova a modificare i filtri di ricerca"
              : "Inizia creando il tuo primo lead commerciale"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {leadsFiltrati.map(lead => (
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 md:p-6">
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
  );
};

export default Dashboard;

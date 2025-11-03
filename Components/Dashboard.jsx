'use client';

import React, { useEffect, useState } from 'react';
import { useCollaboratoriWithGlobalRefresh } from '@/hooks/useCollaboratori'; // ✨ Importa il nuovo hook
import ListaCollaboratori from './Lista-collaboratori';
import ListaClienti from './Lista-clienti';
import TimelineWebDesigner from './timeline-web-designer'; // ✨ Uso TimelineWebDesigner al posto di ListaClientiWebDesigner
import { useSession } from "next-auth/react";
import Link from 'next/link';
import FeedCommerciale from './feed-commerciale';
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
  Table
} from 'lucide-react';

const Dashboard = () => {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [fatture, setFatture] = useState([]);
  const [loadingFatture, setLoadingFatture] = useState(false);
  const [anniAperti, setAnniAperti] = useState({ 2025: true }); // Anno corrente aperto di default
  
  // ✨ Usa il nuovo hook con refresh automatico
  const { collaboratori: data, loading, error, refreshCollaboratori } = useCollaboratoriWithGlobalRefresh();

  // ✨ Filtra solo collaboratori attivi per il Dashboard
  const collaboratoriAttivi = data.filter(collab => collab.status === 'attivo');

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

  // Funzione per avviare il download
  const downloadxlsx = async () => {
    try {
      console.log("🔄 Avvio download dati...");
      const response = await fetch(`/api/download-excel`);
      
      console.log("📊 Response status:", response.status);
      console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Errore API export:", errorText);
        throw new Error(`Errore server: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log("📁 Blob creato, dimensione:", blob.size);
      
      if (blob.size === 0) {
        throw new Error("File Excel vuoto ricevuto dal server");
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `collaborazioni_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log("✅ Download completato con successo");
      alert("✅ Download completato con successo!");
    } catch (err) {
      console.error("❌ Errore dettagliato:", err);
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
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Benvenuto, {session?.user?.nome}
            </h1>
            <p className="text-gray-600 mt-2 flex items-center space-x-2">
              <span>Ruolo: <span className="font-medium">{session?.user?.role}</span></span>
              {session?.user?.subrole && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {session?.user?.subrole}
                </span>
              )}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sezione Fatturazione - Solo per collaboratori */}
      {session?.user?.subrole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Le Mie Fatture</h2>
                <p className="text-gray-600 text-sm mt-1">Storico delle tue fatture mensili</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loadingFatture ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Caricamento fatture...</p>
              </div>
            ) : fatture.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Fattura</h3>
                <p className="text-gray-500">Non sono ancora state generate fatture per il tuo account.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ultima Fattura Evidenziata */}
                {fatture.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 p-5 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">📄</span>
                      <h4 className="font-bold text-gray-900">Ultima Fattura</h4>
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-lg text-gray-900">{formatMese(fatture[0].mese)}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Totale: {fatture[0].totale ? `€${fatture[0].totale.toFixed(2)}` : 'Non impostato'}
                        </p>
                        <div className="flex gap-3 mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            fatture[0].statoCollaboratore === 'emessa' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {fatture[0].statoCollaboratore === 'emessa' ? '✓ Emessa' : '⏳ Non Emessa'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
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

                {/* Storico con Accordion per Anno */}
                {fatture.length > 1 && (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span>📚</span> Storico Fatture
                    </h4>
                    
                    {Object.entries(raggruppaFatturePerAnno())
                      .sort(([annoA], [annoB]) => parseInt(annoB) - parseInt(annoA))
                      .map(([anno, fattureAnno]) => {
                        // Salta il primo elemento (ultima fattura già mostrata)
                        const fattureStorico = anno === fatture[0].mese.split('-')[0] 
                          ? fattureAnno.slice(1) 
                          : fattureAnno;
                        
                        if (fattureStorico.length === 0) return null;

                        return (
                          <div key={anno} className="mb-3 border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleAnno(anno)}
                              className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="font-medium text-gray-900">Anno {anno}</span>
                              <span className="text-gray-600 text-sm">
                                {anniAperti[anno] ? '▼' : '▶'} {fattureStorico.length} fatture
                              </span>
                            </button>
                            
                            {anniAperti[anno] && (
                              <div className="border-t">
                                {fattureStorico.map((fattura) => (
                                  <div key={fattura._id} className="p-4 border-b last:border-b-0 bg-white hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-gray-900">{formatMese(fattura.mese)}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                          Totale: {fattura.totale ? `€${fattura.totale.toFixed(2)}` : 'Non impostato'}
                                        </p>
                                        <div className="flex gap-3 mt-2">
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
                                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
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
      )}

      {/* Admin Panel */}
      {session?.user?.role === "amministratore" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            Pannello Amministratore
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <Link href="/AddCollab">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 group">
                <PlusCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Crea Collaborazione</span>
              </button>
            </Link>
            
            <Link href="/Register">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 group">
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Registra Utente</span>
              </button>
            </Link>
            
            <Link href="/Lista_clienti">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 group">
                <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Lista Clienti</span>
              </button>
            </Link>
            
            <Link href="/Pagamenti">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 group">
                <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Pagamenti</span>
              </button>
            </Link>
            
            <Link href="/Lista_collaboratori">
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 group">
                <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Lista Collaboratori</span>
              </button>
            </Link>
            
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="black_btn w-full"
            >
              {isVisible ? "Nascondi Opzioni avanzate" : "Mostra Opzioni avanzate"}
            </button>
          </div>

          {isVisible && ( 
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <button 
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 group" 
              onClick={downloadxlsx}
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Download Dati</span>
            </button>
            
            <button 
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 group" 
              onClick={handleResetPosts}
              disabled={resetLoading}
            >
              <RotateCcw className={`w-5 h-5 transition-transform ${resetLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{resetLoading ? "Reset..." : "Reset Post"}</span>
            </button>
            
            <button 
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 group" 
              onClick={handleGeneraPagamenti}
              disabled={resetLoading}
            >
              <DollarSign className={`w-5 h-5 transition-transform ${resetLoading ? 'animate-spin' : 'group-hover:scale-110'}`} />
              <span className="font-medium">{resetLoading ? "Generando..." : "Genera Pagamenti"}</span>
            </button>
            
            <Link href="/Fatturazione" passHref>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200 group">
                <span className="text-xl group-hover:scale-110 transition-transform">💰</span>
                <span className="font-medium">Fatturazione</span>
              </button>
            </Link>
            
            <Link href="/Tabella-collaborazioni" passHref>
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 group">
                <Table className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Tabella Collaborazioni</span>
              </button>
            </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          {session?.user?.role === "amministratore" ? (
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              Lista Collaboratori
            </h2>
          ) : session?.user?.subrole === "commerciale" ? (
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-2 text-green-600" />
              Feed Commerciale
            </h2>
          ) : session?.user?.subrole === "smm" ? (
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building2 className="w-6 h-6 mr-2 text-purple-600" />
              Lista Clienti
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-orange-600" />
              I tuoi progetti Web Design
            </h2>
          )}
        </div>
        
        <div className="p-6">
          {session?.user?.role === "amministratore" ? (
            <ListaCollaboratori collaboratori={collaboratoriAttivi} />
          ) : session?.user?.subrole === "commerciale" ? (
            <FeedCommerciale id={session?.user.id} />
          ) : session?.user?.subrole === "smm" ? (
            <ListaClienti id={session?.user.id} amministratore={false} />
          ) : (
            <TimelineWebDesigner userId={session?.user.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

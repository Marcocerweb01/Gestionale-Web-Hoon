'use client';

import React, { useEffect, useState } from 'react';
import ListaCollaboratori from './Lista-collaboratori';
import ListaClienti from './Lista-clienti';
import ListaClientiWebDesigner from './Lista-clienti-webdesigner';
import TimelineWebDesigner from './timeline-web-designer';
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
  Monitor
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  // Funzione per recuperare la lista dei collaboratori
  const fetchCollaboratori = async () => {
    try {
      const response = await fetch(`/api/lista_collaboratori`);
      if (!response.ok) {
        throw new Error("Errore nel recupero dei collaboratori");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i dati dei collaboratori.");
    } finally {
      setLoading(false);
    }
  };

  // Funzione per avviare il download
  const downloadxlsx = async () => {
    try {
      const response = await fetch(`/api/export_data`);
      if (!response.ok) {
        throw new Error("Download non riuscito");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "collaborazioni.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Errore:", err);
      alert("❌ Errore durante il download. Riprova.");
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

  // Effetto per chiamare l'API al caricamento se amministratore
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "amministratore") {
      fetchCollaboratori();
    } else {
      setLoading(false);
    }
  }, [status, session]);

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
            <ListaCollaboratori collaboratori={data} />
          ) : session?.user?.subrole === "commerciale" ? (
            <FeedCommerciale id={session?.user.id} />
          ) : session?.user?.subrole === "smm" ? (
            <ListaClienti id={session?.user.id} amministratore={false} />
          ) : (
            <ListaClientiWebDesigner userId={session?.user.id} showWebDesignerLink={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

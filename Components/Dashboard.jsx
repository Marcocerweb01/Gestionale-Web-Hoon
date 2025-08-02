'use client';

import React, { useEffect, useState } from 'react';
import ListaCollaboratori from './Lista-collaboratori';
import ListaClienti from './Lista-clienti';
import TimelineWebDesigner from './timeline-web-designer';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import FeedCommerciale from './feed-commerciale';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { data: session, status } = useSession();

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

    setResetLoading(true); // Riusiamo lo stesso stato di loading
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
      <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Caricamento in corso...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 px-6 py-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 shadow-md rounded-lg mt-10 px-2 lg:px-6">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <h1 className="head_text">Ciao {session?.user?.nome}</h1>
        <p className="text-gray-600 mt-2">
          Ruolo: {session?.user?.role} 
          {session?.user?.subrole && ` - ${session?.user?.subrole}`}
        </p>
      </div>

      {/* Bottoni Amministratore */}
      {session?.user?.role === "amministratore" && (
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Pannello Amministratore</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/AddCollab">
              <button className="black_btn w-full">Crea Collaborazione</button>
            </Link>
            <Link href="/Register">
              <button className="black_btn w-full">Registra Utente</button>
            </Link>
            <Link href="/Lista_clienti">
              <button className="black_btn w-full">Lista Clienti</button>
            </Link>
            <Link href="/Pagamenti">
              <button className="black_btn w-full">Pagamenti</button>
            </Link>
            <Link href="/Lista_collaboratori">
              <button className="black_btn w-full">Lista Collaboratori</button>
            </Link>
            <button 
              className="black_btn w-full bg-blue-600 hover:bg-blue-700" 
              onClick={downloadxlsx}
            >
              📊 Download Dati
            </button>
            <button 
              className="black_btn w-full bg-red-500 hover:bg-red-600" 
              onClick={handleResetPosts}
              disabled={resetLoading}
            >
              {resetLoading ? "Reset..." : "🔄 Reset Post"}
            </button>
            <button 
              className="black_btn w-full bg-green-600 hover:bg-green-700" 
              onClick={handleGeneraPagamenti}
              disabled={resetLoading}
            >
              {resetLoading ? "Generando..." : "💰 Genera Pagamenti"}
            </button>
          </div>
        </div>
      )}

      {/* Contenuto principale */}
      <div className="p-5">
        {session?.user?.role === "amministratore" ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Lista Collaboratori</h2>
            <ListaCollaboratori collaboratori={data} />
          </div>
        ) : session?.user?.subrole === "commerciale" ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Feed Commerciale</h2>
            <FeedCommerciale id={session?.user.id} />
          </div>
        ) : session?.user?.subrole === "smm" ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Lista Clienti</h2>
            <ListaClienti id={session?.user.id} amministratore={false} />
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Timeline Web Designer</h2>
            <TimelineWebDesigner userId={session?.user.id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";

const FeedPage = ({ params }) => {
  const { collaboratoreId } = params;
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [selectedCollaborationId, setSelectedCollaborationId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingCollaborations, setLoadingCollaborations] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();

 // Fetch collaborazioni del collaboratore
 useEffect(() => {
  const fetchCollaborations = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/${collaboratoreId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setCollaborazioni(result);
      if (result.length > 0) {
        setSelectedCollaborationId(result[0].id); // Seleziona la prima collaborazione di default
      }
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare le collaborazioni.");
    } finally {
      setLoadingCollaborations(false);
    }
  };

  fetchCollaborations();
}, [collaboratoreId]);

// Fetch note della collaborazione selezionata
useEffect(() => {
  const fetchNotes = async () => {
    if (!selectedCollaborationId) return;

    setLoadingNotes(true);
    try {
      const response = await fetch(`/api/feed_note/${selectedCollaborationId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle note");
      }
      const result = await response.json();
      setNotes(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare le note.");
    } finally {
      setLoadingNotes(false);
    }
  };

  fetchNotes();
}, [selectedCollaborationId]);



  if (loadingCollaborations) return <div>Caricamento collaborazioni...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="relative w-full">
      {/* Header con hamburger menu */}
      <div className="fixed top-24 sm:top-16 md:top-16 left-0 lg:left-1/4 right-0 bg-gray-200 p-4 z-20 flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 hover:bg-gray-300 rounded"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-2xl font-bold">Feed delle Note</h1>
        <Link
          className={`black_btn ml-4 inline-block ${
            !selectedCollaborationId ? "opacity-50 pointer-events-none" : ""
          }`}
          href={`/AddNota/${selectedCollaborationId}`}
        >
          Aggiungi Nota
        </Link>
      </div>

      {/* Sidebar responsive */}
      <div className={`
        fixed left-0 top-24 sm:top-32 md:top-32 bottom-0 z-10 w-64 bg-gray-200 p-4 transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:w-1/4
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <h2 className="text-lg font-bold mb-4">Clienti</h2>
        <ul className="space-y-2">
          {collaborazioni.map((collaborazione) => (
            <li
              key={collaborazione.id}
              className={`cursor-pointer p-2 rounded ${
                selectedCollaborationId === collaborazione.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-300"
              }`}
              onClick={() => {
                setSelectedCollaborationId(collaborazione.id);
                // Chiudi sidebar su mobile dopo la selezione
                if (window.innerWidth < 1024) {
                  setIsSidebarOpen(false);
                }
              }}
            >
              {collaborazione.cliente}
            </li>
          ))}
        </ul>
      </div>

      {/* Overlay per chiudere sidebar su mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-0 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Feed Note con padding dinamico */}
      <div className={`
        fixed right-0 top-40 bottom-0 overflow-y-auto
        w-full lg:w-3/4 
        transition-all duration-300
        ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
        p-4 lg:p-6
      `}>
        {loadingNotes ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-gray-500">Nessuna nota trovata per questa collaborazione.</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note._id}
                className={`p-4 rounded shadow w-full lg:w-2/4 ${
                  note.tipo === "problema"
                    ? note.autoreId === session?.user?.id
                      ? "bg-red-100 ml-auto text-right" // Sfondo rosso e posizione a destra
                      : "bg-red-100 mr-auto text-left" // Sfondo rosso e posizione a sinistra
                    : note.autoreId === session?.user?.id
                    ? "bg-blue-100 ml-auto text-right" // Sfondo blu e posizione a destra
                    : "bg-gray-100 mr-auto text-left" // Sfondo grigio e posizione a sinistra
                }`}
              >
                <h3 className="font-bold">{note.tipo || "Nota Generica"}</h3>
                <p>{note.nota}</p>
                <p className="text-sm text-gray-500">Autore: {note.autore}</p>
                <p className="text-sm text-gray-500">
                  Data: {new Date(note.data).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
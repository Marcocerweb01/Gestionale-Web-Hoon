'use client';

import React, { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { 
Plus
} from 'lucide-react';

export const dynamic = 'force-dynamic';
const FeedPage = ({ params }) => {
  const { collaboratoreId } = use(params);
  const searchParams = useSearchParams();
  const collaborazioneIdFromQuery = searchParams.get("collaborazioneId");

  const [collaborazioni, setCollaborazioni] = useState([]);
  const [selectedCollaborationId, setSelectedCollaborationId] = useState(null);
  const [selectedCollaborationcliente, setSelectedCollaborationcliente] = useState("null");
  const [notes, setNotes] = useState([]);
  const [loadingCollaborations, setLoadingCollaborations] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const { data: session } = useSession();
  const feedContainerRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Stati per ricerca e filtro per tipo
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // vuoto = tutti i tipi

  // Fetch delle collaborazioni
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
          if (collaborazioneIdFromQuery) {
            const collFound = result.find(
              (collab) => collab.id === collaborazioneIdFromQuery
            );
            if (collFound) {
              setSelectedCollaborationId(collaborazioneIdFromQuery);
              setSelectedCollaborationcliente(collFound.cliente);
            } else {
              setSelectedCollaborationId(result[0].id);
              setSelectedCollaborationcliente(result[0].cliente);
            }
          } else {
            setSelectedCollaborationId(result[0].id);
            setSelectedCollaborationcliente(result[0].cliente);
          }
        }
      } catch (err) {
        console.error("Errore:", err);
        setError("Non è stato possibile recuperare le collaborazioni.");
      } finally {
        setLoadingCollaborations(false);
      }
    };

    fetchCollaborations();
  }, [collaboratoreId, collaborazioneIdFromQuery]);

  // Fetch delle note
  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedCollaborationId) return;

      setLoadingNotes(true);
      try {
        const response = await fetch(
          `/api/feed_note/${selectedCollaborationId}`
        );
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

  // Effetto per chiudere i filtri automaticamente quando si svuotano
  useEffect(() => {
    // Se non ci sono filtri attivi e il pannello è aperto, chiudilo automaticamente dopo un po'
    if (!searchQuery && !typeFilter && showFilters) {
      const timer = setTimeout(() => {
        setShowFilters(false);
      }, 3000); // Chiude dopo 3 secondi se non ci sono filtri attivi
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, typeFilter, showFilters]);

  // Effetto per scroll automatico alla fine delle note
  useEffect(() => {
    const scrollToBottom = () => {
      if (feedContainerRef.current) {
        const container = feedContainerRef.current;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    };

    // Scroll al bottom quando cambiano le note
    if (notes.length > 0 && !loadingNotes) {
      scrollToBottom();
    }
  }, [notes, loadingNotes]);

  // Effetto per scroll automatico quando cambia il cliente selezionato
  useEffect(() => {
    if (selectedCollaborationId && feedContainerRef.current) {
      const container = feedContainerRef.current;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 200); // Tempo leggermente maggiore per permettere il caricamento
    }
  }, [selectedCollaborationId]);

  // Funzioni per modifica, aggiornamento e cancellazione note
  const handleEdit = (note) => {
    setEditingNote(note);
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n))
    );
  };

  const handleDelete = async (noteId) => {
    try {
      const response = await fetch("/api/delete_note", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: noteId,
          userRole: session?.user?.role,
        }),
      });
      if (!response.ok) {
        const res = await response.json();
        throw new Error(
          res.message || "Errore durante l'eliminazione della nota."
        );
      }
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note._id !== noteId)
      );
    } catch (err) {
      console.error("Errore eliminazione nota:", err);
      setError("Non è stato possibile eliminare la nota.");
    }
  };

  // Filtro: se c'è una search query o un filtro per tipo, creiamo un array filtrato
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      searchQuery === "" ||
      note.nota.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      typeFilter === "" || note.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loadingCollaborations) return <div className="flex items-center justify-center h-[100dvh]">Caricamento collaborazioni...</div>;
  if (error) return <div className="flex items-center justify-center h-[100dvh] text-red-500">{error}</div>;

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex flex-col bg-gray-50 overflow-hidden overscroll-none">

      {/* Barra di Ricerca - Solo Desktop */}
      <div className="flex-shrink-0 hidden md:block bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Cerca nelle note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-lg">✕</span>
                  </button>
                )}
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white min-w-[160px]"
              >
                <option value="">Tutti i tipi</option>
                <option value="appuntamento">📅 Appuntamento</option>
                <option value="generico">📝 Generico</option>
                <option value="problema">⚠️ Problema</option>
                <option value="post_mancante">📱 Post Mancante!</option>
              </select>

              {(searchQuery || typeFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("");
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  title="Pulisci filtri"
                >
                  <span className="text-sm">🗑️</span>
                </button>
              )}
            </div>
          </div>
      </div>

      {/* Layout Container - Mobile First WhatsApp Style */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Sidebar Sinistra - Mobile Popup Centrato */}
        <div className={`transform transition-all duration-300 ease-in-out ${
          isSidebarOpen 
            ? "fixed inset-0 z-40 lg:relative lg:translate-x-0 lg:inset-auto" 
            : "hidden lg:flex lg:relative"
        } lg:w-80 lg:border-r lg:border-gray-200 lg:bg-white lg:shadow-none`}>
          
          {/* Mobile Popup Container */}
          <div className={`lg:hidden fixed inset-0 flex items-center justify-center p-4 ${
            isSidebarOpen ? "block" : "hidden"
          }`}>
            {/* Background Overlay */}
            <div 
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Popup Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden">
              {/* Popup Header */}
              <div className="flex-shrink-0 border-b border-gray-200 bg-white rounded-t-2xl">
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                </div>
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">👥</span>
                    </div>
                    <h2 className="font-semibold text-gray-900 text-base">
                      Seleziona Cliente
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-gray-400 text-lg">✕</span>
                  </button>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {collaborazioni.map((collaborazione) => (
                    <button
                      key={collaborazione.id}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                        selectedCollaborationId === collaborazione.id
                          ? "bg-blue-50 border-blue-200 shadow-sm ring-2 ring-blue-100"
                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => {
                        setSelectedCollaborationId(collaborazione.id);
                        setSelectedCollaborationcliente(collaborazione.cliente);
                        setTimeout(() => {
                          setIsSidebarOpen(false);
                        }, 150);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedCollaborationId === collaborazione.id 
                            ? "bg-blue-500" 
                            : "bg-gray-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate text-base ${
                            selectedCollaborationId === collaborazione.id
                              ? "text-blue-900"
                              : "text-gray-900"
                          }`}>
                            {collaborazione.cliente}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            ID: {collaborazione.id}
                          </p>
                        </div>
                        {selectedCollaborationId === collaborazione.id && (
                          <div className="text-blue-500">
                            <span className="text-lg">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {collaborazioni.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <p className="text-gray-500 text-base mb-2">Nessuna collaborazione trovata</p>
                      <p className="text-gray-400 text-sm">
                        Le collaborazioni verranno mostrate qui quando disponibili
                      </p>
                    </div>
                  )}
                </div>

                {/* Suggerimento */}
                {collaborazioni.length > 0 && (
                  <div className="p-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800 text-center">
                        💡 Tocca un cliente per visualizzare le sue note
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar (rimane invariata) */}
          <div className="hidden lg:flex flex-col h-full w-80 bg-white border-r border-gray-200">
            <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">👥</span>
                </div>
                <h2 className="font-semibold text-gray-900 text-base">Clienti</h2>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="p-4 space-y-2">
                {collaborazioni.map((collaborazione) => (
                  <button
                    key={collaborazione.id}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedCollaborationId === collaborazione.id
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedCollaborationId(collaborazione.id);
                      setSelectedCollaborationcliente(collaborazione.cliente);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedCollaborationId === collaborazione.id 
                          ? "bg-blue-500" 
                          : "bg-gray-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          selectedCollaborationId === collaborazione.id
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}>
                          {collaborazione.cliente}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          ID: {collaborazione.id}
                        </p>
                      </div>
                      {selectedCollaborationId === collaborazione.id && (
                        <div className="text-blue-500">
                          <span className="text-lg">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {collaborazioni.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-gray-500 text-base">Nessuna collaborazione trovata</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area - Destra */}
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0 min-h-0 overflow-hidden">
          {/* Chat Header - Mobile Optimized */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-2 sm:px-4 py-1.5 sm:py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {selectedCollaborationcliente ? (
                    <>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">🏢</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">
                          {selectedCollaborationcliente}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          <span className="hidden sm:inline">ID: {selectedCollaborationId}</span>
                          <span className="sm:hidden">Tocca 👥 per cambiare</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">💬</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">Feed</h3>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Tocca 👥 per selezionare
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {/* Bottone Sidebar - Solo mobile per cambiare collaborazione */}
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden inline-flex items-center px-1.5 py-1 font-medium rounded-lg transition-colors text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                    title="Cambia collaborazione"
                  >
                    <span className="text-sm">👥</span>
                  </button>

                  {/* Bottone Ricerca - Mobile Optimized */}
                  <button
                    onClick={() => setShowFilters((prev) => !prev)}
                    className={`md:hidden inline-flex items-center px-1.5 py-1 font-medium rounded-lg transition-colors text-xs ${
                      showFilters 
                        ? "bg-blue-600 text-white shadow-md" 
                        : (searchQuery || typeFilter)
                        ? "bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                    title={showFilters ? "Chiudi ricerca" : "Apri ricerca"}
                  >
                    <span className="text-sm">
                      {showFilters ? "✕" : "🔍"}
                    </span>
                    {(searchQuery || typeFilter) && !showFilters && (
                      <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-1.5 h-1.5"></span>
                    )}
                  </button>

                  {/* Bottone Nuova Nota - Mobile Optimized */}
                  {selectedCollaborationId && (
                    <Link
                      className="inline-flex items-center px-1.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-xs"
                      href={`/AddNota/${selectedCollaborationId}?cliente=${selectedCollaborationcliente}&collaboratoreId=${collaboratoreId}`}
                    >
                      <Plus size={16} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages Area - Mobile Optimized Full Height */}
          <div 
            ref={feedContainerRef}
            className="flex-1 overflow-y-auto p-1.5 sm:p-4 space-y-2 sm:space-y-4 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Pannello di ricerca mobile - Compatto */}
            {showFilters && (
              <div className="md:hidden sticky top-0 z-20 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cerca..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 pl-8 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-xs">🔍</span>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-sm">✕</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Tutti</option>
                      <option value="appuntamento">📅 App.</option>
                      <option value="generico">📝 Gen.</option>
                      <option value="problema">⚠️ Prob.</option>
                      <option value="post_mancante">📱 Post</option>
                    </select>

                    {(searchQuery || typeFilter) && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setTypeFilter("");
                        }}
                        className="px-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Indicatore filtri attivi - Compatto */}
            {(searchQuery || typeFilter) && !showFilters && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-2 py-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-blue-800 flex-1 min-w-0">
                    <span className="text-xs">🔍</span>
                    <span className="text-xs font-medium truncate">
                      {searchQuery && <span className="italic">&ldquo;{searchQuery.substring(0, 8)}...&rdquo;</span>}
                      {typeFilter && <span className="ml-1">• {typeFilter}</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("");
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium flex-shrink-0 ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {loadingNotes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-xl p-4">
                      <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
                      <div className="h-12 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-6 px-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xl sm:text-2xl">
                      {(searchQuery || typeFilter) ? "🔍" : "💬"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm sm:text-base mb-1">
                    {(searchQuery || typeFilter)
                      ? "Nessun risultato"
                      : selectedCollaborationId 
                      ? "Nessuna nota trovata" 
                      : "Benvenuto nel Feed"}
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {(searchQuery || typeFilter)
                      ? "Modifica i filtri"
                      : selectedCollaborationId 
                      ? "Nessuna nota" 
                      : "Tocca 👥 per iniziare"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredNotes.map((note) => {
                  const isOwn = note.autoreId === session?.user?.id;
                  const isProblem = note.tipo === "problema";
                  const isPostMancante = note.tipo === "post_mancante";
                  
                  // Feeling Report abilitato solo per questi SMM
                  const FEELING_ENABLED_USERS = ['678e57e508b3d51f4e9466e2', '678e582008b3d51f4e9466e8'];
                  const isFeelingEnabled = FEELING_ENABLED_USERS.includes(note.autoreId?.toString() || '');
                  
                  return (
                    <div
                      key={note._id}
                      className={`group transition-all duration-150 flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`relative rounded-xl shadow-sm border p-2.5 sm:p-3 max-w-[85%] sm:max-w-md ${
                          isProblem
                            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                            : isPostMancante
                            ? "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                            : isOwn
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {/* Header della nota - Compatto */}
                        <div className={`flex items-center justify-between mb-1.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <div className={`flex items-center space-x-1.5 ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] ${
                              isProblem
                                ? "bg-red-500 text-white"
                                : note.tipo === "post_mancante"
                                ? "bg-orange-500 text-white"
                                : isOwn
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {note.tipo === "appuntamento" ? "📅" :
                               note.tipo === "problema" ? "⚠️" :
                               note.tipo === "post_mancante" ? "📱" : "📝"}
                            </div>
                            <p className={`text-[10px] sm:text-xs font-medium ${
                              isProblem ? "text-red-900" :
                              isPostMancante ? "text-orange-900" :
                              isOwn ? "text-white/90" : "text-gray-600"
                            }`}>
                              {note.autore.split(' ')[0]}
                            </p>
                          </div>
                          
                          <div className={`flex space-x-0.5 ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <button
                              onClick={() => handleEdit(note)}
                              className={`p-0.5 rounded transition-colors ${
                                isOwn 
                                  ? "text-white/70 active:bg-white/20" 
                                  : "text-amber-600 active:bg-amber-50"
                              }`}
                              title="Modifica"
                            >
                              <span className="text-xs">✏️</span>
                            </button>
                            {session?.user?.role === "amministratore" && (
                              <button
                                onClick={() => handleDelete(note._id)}
                                className={`p-0.5 rounded transition-colors ${
                                  isOwn 
                                    ? "text-white/70 active:bg-white/20" 
                                    : "text-red-600 active:bg-red-50"
                                }`}
                                title="Elimina"
                              >
                                <span className="text-xs">🗑️</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Data appuntamento se presente - Compatto */}
                        {note.tipo === "appuntamento" && note.data_appuntamento && (
                          <div className={`mb-1.5 px-2 py-1 rounded text-[10px] sm:text-xs ${
                            isProblem ? "bg-red-100 text-red-800" :
                            isPostMancante ? "bg-orange-100 text-orange-800" :
                            isOwn ? "bg-white/20 text-white" : "bg-blue-50 text-blue-800"
                          }`}>
                            📅 {new Date(note.data_appuntamento).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                        )}

                        {/* Contenuto della nota - Compatto */}
                        <div className="mb-1">
                          <p className={`leading-snug whitespace-pre-wrap text-[13px] sm:text-sm ${
                            isProblem ? "text-red-900" :
                            isPostMancante ? "text-orange-900" :
                            isOwn ? "text-white" : "text-gray-800"
                          }`}>
                            {note.nota}
                          </p>
                        </div>

                        {/* Feeling Report - Se presente e utente abilitato */}
                        {note.tipo === "appuntamento" && note.feeling_emoji && isFeelingEnabled && (
                          <div className={`mb-2 px-2 py-2 rounded-lg ${
                            isOwn ? "bg-white/20" : "bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300"
                          }`}>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-xs font-semibold ${isOwn ? "text-white/90" : "text-gray-700"}`}>Feeling</span>
                              <span className="text-2xl">{note.feeling_emoji}</span>
                            </div>
                            {note.feeling_note && (
                              <p className={`text-xs italic ${isOwn ? "text-white/80" : "text-gray-600"}`}>
                                {note.feeling_note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Footer con timestamp - Compatto */}
                        <div className={`flex items-center text-[10px] sm:text-xs ${
                          isOwn ? "justify-start text-white/60" : "justify-end text-gray-400"
                        }`}>
                          <span>
                            {new Date(note.data).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal per la modifica della nota */}
      {editingNote && (
        <EditNoteModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onUpdateNote={handleUpdateNote}
        />
      )}
    </div>
  );
};

const EditNoteModal = ({ note, onClose, onUpdateNote }) => {
  const [tipo, setTipo] = useState(note.tipo || "");
  const [nota, setNota] = useState(note.nota || "");
  const [feelingEmoji, setFeelingEmoji] = useState(note.feeling_emoji || "");
  const [feelingNote, setFeelingNote] = useState(note.feeling_note || "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data_appuntamento, setDataAppuntamento] = useState(
    note.data_appuntamento ? note.data_appuntamento.split("T")[0] : ""
  );
  
  // Feeling Report abilitato solo per questi SMM
  const FEELING_ENABLED_USERS = ['678e57e508b3d51f4e9466e2', '678e582008b3d51f4e9466e8'];
  const isFeelingEnabled = FEELING_ENABLED_USERS.includes(note.autoreId?.toString() || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    // Validazione: se il tipo è appuntamento e l'utente ha feeling abilitato, l'emoji è obbligatoria
    if (tipo === "appuntamento" && isFeelingEnabled && !feelingEmoji) {
      setError("L'emoji del Feeling Report è obbligatoria per gli appuntamenti!");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/edit_note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note._id,
          updatedData: { 
            tipo, 
            nota, 
            data_appuntamento,
            feeling_emoji: tipo === "appuntamento" && isFeelingEnabled ? feelingEmoji : "",
            feeling_note: tipo === "appuntamento" && isFeelingEnabled ? feelingNote : "",
          },
        }),
      });
      
      if (!response.ok) {
        const res = await response.json();
        throw new Error(
          res.message || "Errore durante l'aggiornamento della nota."
        );
      }
      
      const result = await response.json();
      onUpdateNote(result.updatedNote);
      onClose();
    } catch (err) {
      console.error("Errore:", err);
      setError("Errore durante l'aggiornamento della nota.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto transform transition-all max-h-[95vh] overflow-y-auto">
        {/* Header - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-base sm:text-lg">✏️</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              <span className="hidden sm:inline">Modifica Nota</span>
              <span className="sm:hidden">Modifica</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <span className="text-gray-400 text-lg">✕</span>
          </button>
        </div>

        {/* Content - Mobile Optimized */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Tipo Nota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Nota
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
              disabled={isLoading}
            >
              <option value="generico">📝 Generico</option>
              <option value="appuntamento">📅 Appuntamento</option>
              <option value="problema">⚠️ Problema</option>
              <option value="post_mancante">📱 Post Mancante!</option>
            </select>
          </div>

          {/* Data Appuntamento - Mobile Optimized */}
          {tipo === "appuntamento" && (
            <>
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  📅 Data Appuntamento
                </label>
                <input
                  type="date"
                  value={data_appuntamento || ""}
                  onChange={(e) => setDataAppuntamento(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm sm:text-base"
                  disabled={isLoading}
                />
              </div>
              
              {/* Feeling Report - Solo per utenti abilitati */}
              {isFeelingEnabled && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-3 sm:p-4 space-y-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">👉</span>
                  <h4 className="text-sm font-bold text-gray-900">Feeling Report</h4>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-800 mb-2">
                    Come sono uscito dall'incontro? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { emoji: '😄', label: 'Molto positivo, carico' },
                      { emoji: '🙂', label: 'Buono, sereno' },
                      { emoji: '😐', label: 'Neutro' },
                      { emoji: '😕', label: 'Qualcosa non ha convinto' },
                      { emoji: '😤', label: 'Teso, frustrante' },
                      { emoji: '😵💫', label: 'Confuso' },
                      { emoji: '🔥', label: 'Super gas' },
                      { emoji: '🧊', label: 'Freddo' },
                    ].map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFeelingEmoji(emoji)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          feelingEmoji === emoji
                            ? 'bg-yellow-400 border-yellow-600 shadow-md scale-105'
                            : 'bg-white border-gray-300 hover:border-yellow-400'
                        }`}
                        title={label}
                        disabled={isLoading}
                      >
                        <span className="text-2xl">{emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Perché? (Opzionale)
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs resize-none"
                    value={feelingNote}
                    onChange={(e) => setFeelingNote(e.target.value)}
                    placeholder="Spiega brevemente..."
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
              </div>
              )}
            </>
          )}

          {/* Contenuto Nota - Mobile Optimized */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenuto della Nota
            </label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full p-3 sm:p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm sm:text-base"
              rows={4}
              placeholder="Scrivi qui il contenuto della nota..."
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message - Mobile Optimized */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Footer Actions - Mobile Optimized */}
          <div className="flex space-x-2 sm:space-x-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              disabled={isLoading}
            >
              <span>❌</span>
              <span>Annulla</span>
            </button>
            <button
              type="submit"
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={isLoading || !nota.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Salvando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span className="hidden sm:inline">Salva Modifiche</span>
                  <span className="sm:hidden">Salva</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedPage;
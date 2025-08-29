'use client';

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { 
Plus
} from 'lucide-react';
const FeedPage = ({ params }) => {
  const { collaboratoreId } = params;
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

  if (loadingCollaborations) return <div>Caricamento collaborazioni...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Header Principale - Compatto e Mobile-First */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-14 px-3 sm:px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={18} className="text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs sm:text-sm font-bold">📝</span>
              </div>
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">Feed delle Note</span>
                <span className="sm:hidden">Feed</span>
              </h1>
            </div>
          </div>

          {/* Spazio per mantenere il layout bilanciato */}
          <div className="w-10"></div>
        </div>
      </div>

      {/* Barra di Ricerca - Sempre Visibile */}
      <div className="fixed top-14 left-0 right-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        {/* Desktop search bar - Sempre visibile */}
        <div className="hidden md:block">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Cerca nelle note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
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
              </select>

              {(searchQuery || typeFilter) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("");
                  }}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                  title="Pulisci filtri"
                >
                  <span className="text-sm">�️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout Container - Mobile First WhatsApp Style */}
      <div className="flex flex-1 pt-24 sm:pt-28">
        
        {/* Sidebar Sinistra - Mobile Popup Centrato */}
        <div className={`transform transition-all duration-300 ease-in-out ${
          isSidebarOpen 
            ? "fixed inset-0 z-30 lg:relative lg:translate-x-0 lg:inset-auto" 
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
        <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
          {/* Chat Header - Mobile Optimized */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
            <div className="px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  {selectedCollaborationcliente ? (
                    <>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm font-bold">🏢</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {selectedCollaborationcliente}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          <span className="hidden sm:inline">ID: {selectedCollaborationId}</span>
                          <span className="sm:hidden lg:hidden">👆 Tocca &ldquo;Clienti&rdquo; per cambiare</span>
                          <span className="hidden lg:inline">ID: {selectedCollaborationId}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm sm:text-base">💬</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                          <span className="hidden sm:inline">Feed delle Note</span>
                          <span className="sm:hidden">Feed</span>
                        </h3>
                        <p className="text-xs text-gray-500">
                          <span className="hidden sm:inline lg:inline">Seleziona un cliente per iniziare</span>
                          <span className="sm:hidden lg:hidden">Tocca &ldquo;Clienti&rdquo; per iniziare</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  {/* Bottone Sidebar - Solo mobile per cambiare collaborazione */}
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`lg:hidden inline-flex items-center px-2 py-1.5 font-medium rounded-lg transition-colors text-xs bg-gray-100 hover:bg-gray-200 text-gray-700`}
                    title="Cambia collaborazione"
                  >
                    <span className="text-sm">👥</span>
                  </button>

                  {/* Bottone Ricerca - Mobile Optimized */}
                  <button
                    onClick={() => setShowFilters((prev) => !prev)}
                    className={`md:hidden inline-flex items-center px-2 py-1.5 font-medium rounded-lg transition-colors text-xs ${
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
                      className="inline-flex items-center px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-xs"
                      href={`/AddNota/${selectedCollaborationId}?cliente=${selectedCollaborationcliente}`}
                    >
                      <span className="text-sm"><Plus /></span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages Area - Mobile Optimized */}
          <div 
            ref={feedContainerRef}
            className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {/* Pannello di ricerca mobile - Completamente Mobile Optimized */}
            {showFilters && (
              <div className="md:hidden sticky top-0 z-20 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm mx-1 sm:mx-0">
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cerca nelle note..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-10 pr-9 sm:pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">🔍</span>
                    </div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <span className="text-sm sm:text-lg">✕</span>
                      </button>
                    )}
                  </div>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Tutti i tipi</option>
                    <option value="appuntamento">📅 Appuntamento</option>
                    <option value="generico">📝 Generico</option>
                    <option value="problema">⚠️ Problema</option>
                  </select>

                  {(searchQuery || typeFilter) && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setTypeFilter("");
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm"
                    >
                      <span>🗑️</span>
                      <span>Pulisci filtri</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Indicatore filtri attivi - Mobile Optimized */}
            {(searchQuery || typeFilter) && (
              <div className="sticky top-0 z-10 bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 mx-1 sm:mx-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-blue-800 flex-1 min-w-0">
                    <span className="text-xs sm:text-sm flex-shrink-0">🔍</span>
                    <span className="text-xs sm:text-sm font-medium truncate">
                      <span className="hidden xs:inline">Filtri attivi:</span>
                      <span className="xs:hidden">Filtri:</span>
                      {searchQuery && <span className="ml-1 italic">&ldquo;{searchQuery.length > 10 ? searchQuery.substring(0, 10) + '...' : searchQuery}&rdquo;</span>}
                      {typeFilter && <span className="ml-1">• {typeFilter}</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setTypeFilter("");
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex-shrink-0 ml-2"
                  >
                    <span className="hidden xs:inline">Pulisci</span>
                    <span className="xs:hidden">✕</span>
                  </button>
                </div>
              </div>
            )}

            {loadingNotes ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 rounded-2xl p-6">
                      <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                      <div className="h-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-8 sm:py-12 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">
                      {(searchQuery || typeFilter) ? "🔍" : "💬"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg mb-2">
                    {(searchQuery || typeFilter)
                      ? "Nessun risultato"
                      : selectedCollaborationId 
                      ? "Nessuna nota trovata" 
                      : "Benvenuto nel Feed"}
                  </p>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {(searchQuery || typeFilter)
                      ? "Modifica i filtri di ricerca"
                      : selectedCollaborationId 
                      ? "Nessuna nota per questa collaborazione" 
                      : "Seleziona un cliente dalla sidebar"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredNotes.map((note) => {
                  const isOwn = note.autoreId === session?.user?.id;
                  const isProblem = note.tipo === "problema";
                  
                  return (
                    <div
                      key={note._id}
                      className={`group transition-all duration-200 flex px-1 sm:px-0 ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`relative rounded-2xl shadow-sm border p-3 sm:p-4 max-w-xs sm:max-w-lg w-full sm:w-auto ${
                          isProblem
                            ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
                            : isOwn
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-300 text-white"
                            : "bg-white border-gray-200"
                        } hover:shadow-md transition-all duration-200`}
                      >
                        {/* Header della nota - Mobile Optimized */}
                        <div className={`flex items-start justify-between mb-2 sm:mb-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <div className={`flex items-center space-x-1.5 sm:space-x-2 ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs ${
                              isProblem
                                ? "bg-red-500 text-white"
                                : isOwn
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {note.tipo === "appuntamento" ? "📅" :
                               note.tipo === "problema" ? "⚠️" : "📝"}
                            </div>
                            <div className={isOwn ? "text-right" : "text-left"}>
                              <p className={`text-xs font-medium ${
                                isProblem ? "text-red-900" :
                                isOwn ? "text-white/90" : "text-gray-600"
                              }`}>
                                {note.autore.length > 15 ? note.autore.substring(0, 15) + '...' : note.autore}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`flex space-x-1 ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}>
                            <button
                              onClick={() => handleEdit(note)}
                              className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                                isOwn 
                                  ? "text-white/70 hover:bg-white/20" 
                                  : "text-amber-600 hover:bg-amber-50"
                              }`}
                              title="Modifica nota"
                            >
                              <span className="text-xs sm:text-sm">✏️</span>
                            </button>
                            {session?.user?.role === "amministratore" && (
                              <button
                                onClick={() => handleDelete(note._id)}
                                className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                                  isOwn 
                                    ? "text-white/70 hover:bg-white/20" 
                                    : "text-red-600 hover:bg-red-50"
                                }`}
                                title="Elimina nota"
                              >
                                <span className="text-xs sm:text-sm">🗑️</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Data appuntamento se presente - Mobile Optimized */}
                        {note.tipo === "appuntamento" && note.data_appuntamento && (
                          <div className={`mb-2 sm:mb-3 p-2 rounded-lg text-xs ${
                            isProblem ? "bg-red-100 text-red-800" :
                            isOwn ? "bg-white/20 text-white" : "bg-blue-50 text-blue-800"
                          }`}>
                            📅 {new Date(note.data_appuntamento).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit'
                            })}
                          </div>
                        )}

                        {/* Contenuto della nota - Mobile Optimized */}
                        <div className="mb-2">
                          <p className={`leading-relaxed whitespace-pre-wrap text-sm sm:text-base ${
                            isProblem ? "text-red-900" :
                            isOwn ? "text-white" : "text-gray-800"
                          }`}>
                            {note.nota}
                          </p>
                        </div>

                        {/* Footer con timestamp - Mobile Optimized */}
                        <div className={`flex items-center text-xs ${
                          isOwn ? "justify-start text-white/70" : "justify-end text-gray-500"
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

                        {/* Indicatore chat bubble - Mobile Optimized */}
                        <div className={`absolute top-3 sm:top-4 w-0 h-0 ${
                          isOwn 
                            ? "right-0 transform translate-x-1 border-l-6 sm:border-l-8 border-l-blue-500 border-t-3 sm:border-t-4 border-t-transparent border-b-3 sm:border-b-4 border-b-transparent"
                            : "left-0 transform -translate-x-1 border-r-6 sm:border-r-8 border-r-white border-t-3 sm:border-t-4 border-t-transparent border-b-3 sm:border-b-4 border-b-transparent"
                        }`} />
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
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data_appuntamento, setDataAppuntamento] = useState(
    note.data_appuntamento ? note.data_appuntamento.split("T")[0] : ""
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/edit_note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note._id,
          updatedData: { tipo, nota, data_appuntamento },
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
            </select>
          </div>

          {/* Data Appuntamento - Mobile Optimized */}
          {tipo === "appuntamento" && (
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

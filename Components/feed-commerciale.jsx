'use client';

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Plus, Trash2, Pencil, Search } from 'lucide-react';

dayjs.extend(utc);

const FeedCommerciale = ({ id }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [count, setCount] = useState(0);
  const [editingNote, setEditingNote] = useState(null);
  const { data: session } = useSession();
  const [showFilters, setShowFilters] = useState(false);

  // Stati per ricerca e filtro per tipo
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // vuoto = tutti i tipi

  // Fetch note del commerciale
  useEffect(() => {
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const query = new URLSearchParams();
        if (startDate) query.append("startDate", startDate);
        if (endDate) query.append("endDate", endDate);

        const response = await fetch(`/api/feed_note_comm/${id}?${query.toString()}`);
        if (!response.ok) {
          throw new Error("Errore nel recupero delle note");
        }
        const result = await response.json();
        setNotes(result);
        setCount(result.length);
      } catch (err) {
        console.error("Errore:", err);
        setError("Non è stato possibile recuperare le note.");
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [id, startDate, endDate]);

  // Filtro: creiamo un array filtrato in base alla search query e al filtro per tipo
  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        searchQuery === "" ||
        note.nota.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "" || note.mainCategoria === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Ordina solo gli appuntamenti per data_appuntamento (dal più vicino)
      if (a.mainCategoria === "appuntamento" && b.mainCategoria === "appuntamento") {
        const dataA = a.data_appuntamento ? new Date(a.data_appuntamento) : null;
        const dataB = b.data_appuntamento ? new Date(b.data_appuntamento) : null;
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        // Senza data vanno in fondo
        if (!dataA && !dataB) return 0;
        if (!dataA) return 1;
        if (!dataB) return -1;

        // Date passate sempre in cima
        const aPassata = dataA < oggi;
        const bPassata = dataB < oggi;

        if (aPassata && !bPassata) return -1;
        if (!aPassata && bPassata) return 1;

        // Ordina per data (crescente: dal più vicino al più lontano)
        return dataA - dataB;
      }
      
      // Se uno è appuntamento e l'altro no, appuntamenti prima
      if (a.mainCategoria === "appuntamento") return -1;
      if (b.mainCategoria === "appuntamento") return 1;
      
      // Altrimenti ordina per data di creazione (più recenti prima)
      return new Date(b.data) - new Date(a.data);
    });

  // Scroll (opzionale)
  useEffect(() => {
    const feedContainer = document.getElementById("feed-container");
    if (feedContainer) {
      feedContainer.scrollTop = feedContainer.scrollHeight;
    }
  }, [notes]);

  const handleAddNote = async (newNote) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
  };

  const handleDelete = async (noteId) => {
    try {
      const response = await fetch(`/api/delete_note_comm`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: noteId,
          userRole: session?.user?.role,
        }),
      });
      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante l'eliminazione della nota.");
      }
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note._id !== noteId)
      );
    } catch (err) {
      console.error("Errore eliminazione nota:", err);
      setError("Non è stato possibile eliminare la nota.");
    }
  };

  const handleUpdateNote = (updatedNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note._id === updatedNote._id ? updatedNote : note))
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header mobile-friendly riprogettato */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex-shrink-0">
        {/* Titolo e contatore */}
        <div className="flex items-center justify-center mb-3">
          <h2 className="text-xl font-bold text-gray-900 mr-2">📝 Note Commerciali</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
            {count}
          </span>
        </div>
        
        {/* Bottoni sotto il titolo */}
        <div className="flex items-center justify-center space-x-3">
          <button
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm touch-manipulation shadow-sm"
            onClick={() => setIsPopupOpen(true)}
          >
            <span className="mr-1"><Plus /></span>
            <span>Aggiungi</span>
          </button>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors text-sm touch-manipulation shadow-sm"
          >
            <span className="mr-1"><Search /></span>
            <span>{showFilters ? "Nascondi" : "Filtri"}</span>
          </button>
        </div>
      </div>

      {/* Popup filtri per tutte le dimensioni dello schermo */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm overflow-hidden">
            {/* Header popup */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="text-lg font-bold text-gray-900">🔍 Filtri</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none touch-manipulation"
              >
                ×
              </button>
            </div>

            {/* Content popup */}
            <div className="p-4 space-y-4">
              {/* Date filters per amministratori */}
              {session?.user?.role === "amministratore" && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Filtro per Data</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inizio</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fine</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Search and filter */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Ricerca e Filtri</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cerca nel testo</label>
                  <input
                    type="text"
                    placeholder="Scrivi qui per cercare..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo di nota</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tutti i tipi</option>
                    <option value="appuntamento">📅 Appuntamento</option>
                    <option value="contatto">📞 Contatto</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer popup */}
            <div className="border-t bg-gray-50 p-4">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors touch-manipulation"
              >
                ✅ Applica Filtri
              </button>
            </div>
          </div>
        </div>
      )}    
      {/* Popups */}
      {isPopupOpen && (
        <PopupForm
          onClose={() => setIsPopupOpen(false)}
          onAddNote={handleAddNote}
          autoreId={session?.user?.id}
          autoreNome={session?.user?.nome}
        />
      )}
      {editingNote && (
        <EditForm
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onUpdateNote={handleUpdateNote}
        />
      )}

      {/* Feed container - occupa tutto lo spazio rimanente */}
      <div className="flex-1 overflow-hidden">
        <div
          id="feed-container"
          className="h-full overflow-y-auto px-4 py-3"
        >
          {loadingNotes ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2 w-1/2"></div>
                  <div className="h-16 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna nota trovata</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Non ci sono note per questo utente. Inizia creando la prima nota!
              </p>
              <button
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                onClick={() => setIsPopupOpen(true)}
              >
                <Plus /> Crea prima nota
              </button>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {filteredNotes.map((note) => (
                <div
                  key={note._id}
                  className={`p-4 rounded-lg shadow-sm border max-w-md ${
                    note.autoreId === session?.user?.id
                      ? "bg-blue-50 border-blue-200 ml-auto"
                      : "bg-gray-50 border-gray-200 mr-auto"
                  }`}
                >
                  {/* Header della nota */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      note.mainCategoria === "appuntamento" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {note.mainCategoria === "appuntamento" ? "📅 Appuntamento" : "📞 Contatto"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {dayjs(note.data).utc().format("DD/MM HH:mm")}
                    </span>
                  </div>

                  {/* Contenuto appuntamento */}
                  {note.mainCategoria === "appuntamento" && (
                    <div className="mb-3 p-2 bg-white rounded border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 mb-1">
                        📅 {dayjs(note.data_appuntamento).utc().format("DD/MM/YYYY HH:mm")}
                      </p>
                      {note.luogo_appuntamento && (
                        <p className="text-sm text-gray-600">📍 {note.luogo_appuntamento}</p>
                      )}
                    </div>
                  )}

                  {/* Contenuto della nota */}
                  <div className="mb-3">
                    <p className="text-gray-900 text-sm leading-relaxed">{note.nota}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>👤 {note.autore}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(note)}
                        className="inline-flex items-center px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded text-xs transition-colors touch-manipulation"
                      >
                        <Pencil />
                      </button>
                      {session?.user?.role === "amministratore" && (
                        <button
                          onClick={() => handleDelete(note._id)}
                          className="inline-flex items-center px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-medium rounded text-xs transition-colors touch-manipulation"
                        >
                          <Trash2 />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



const EditForm = ({ note, onClose, onUpdateNote }) => {
  const [mainCategoria, setMainCategoria] = useState(note.mainCategoria || "appuntamento");
  const [tipoContatto, setTipoContatto] = useState(note.tipoContatto || "");
  const [comeArrivato, setComeArrivato] = useState(note.comeArrivato || "");
  const [referal, setReferal] = useState(note.referal || "");
  const [nomeAzienda, setNomeAzienda] = useState(note.nomeAzienda || "");
  const [luogo, setLuogo] = useState(note.luogo || "");
  const [indirizzo, setIndirizzo] = useState(note.indirizzo || "");
  const [numeroTelefono, setNumeroTelefono] = useState(note.numeroTelefono || "");
  const [referente, setReferente] = useState(note.referente || "");
  const [nota, setNota] = useState(note.nota || "");
  const [dataAppuntamento, setDataAppuntamento] = useState(note.data_appuntamento?.split("T")[0] || "");
  const [oraAppuntamento, setOraAppuntamento] = useState(note.data_appuntamento?.split("T")[1]?.substring(0, 5) || "");
  const [luogo_appuntamento, setLuogoAppuntamento] = useState(note.luogo_appuntamento||"");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/edit_note_comm", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note._id,
          updatedData: {
            mainCategoria,
            tipoContatto: mainCategoria === "contatto" ? tipoContatto : undefined,
            comeArrivato: mainCategoria === "contatto" ? comeArrivato : undefined,
            referal: comeArrivato === "referal" ? referal : undefined,
            nomeAzienda: mainCategoria === "contatto" ? nomeAzienda : undefined,
            luogo: mainCategoria === "contatto" ? luogo : undefined,
            indirizzo: mainCategoria === "contatto" ? indirizzo : undefined,
            numeroTelefono: mainCategoria === "contatto" ? numeroTelefono : undefined,
            referente: mainCategoria === "contatto" ? referente : undefined,
            nota,
            data_appuntamento:
              mainCategoria === "appuntamento" && dataAppuntamento && oraAppuntamento
                ? `${dataAppuntamento}T${oraAppuntamento}`
                : undefined,
            luogo_appuntamento:
              mainCategoria === "appuntamento" ? luogo_appuntamento : undefined,
          },
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante l'aggiornamento della nota.");
      }

      const result = await response.json();
      onUpdateNote(result.updatedNote);
      onClose();
    } catch (err) {
      console.error("Errore:", err);
      setError("Errore durante l'aggiornamento della nota.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fisso */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h3 className="text-lg font-bold text-gray-900">✏️ Modifica Nota</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none touch-manipulation"
          >
            ×
          </button>
        </div>

        {/* Form scrollabile */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principale:</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={mainCategoria}
                onChange={(e) => setMainCategoria(e.target.value)}
              >
                <option value="appuntamento">📅 Appuntamento</option>
                <option value="contatto">📞 Contatto</option>
              </select>
            </div>

            {mainCategoria === "contatto" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo di Contatto:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={tipoContatto}
                    onChange={(e) => setTipoContatto(e.target.value)}
                  >
                    <option value="chiamata">📞 Chiamata</option>
                    <option value="visita">🏢 Visita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Come è Arrivato:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={comeArrivato}
                    onChange={(e) => setComeArrivato(e.target.value)}
                  >
                    <option value="ricerca">🔍 Ricerca</option>
                    <option value="referal">👥 Referal</option>
                    <option value="chiamata">📞 Chiamata</option>
                    <option value="in azienda">🏢 In Azienda</option>
                  </select>
                </div>
                {comeArrivato === "referal" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referal:</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      value={referal}
                      onChange={(e) => setReferal(e.target.value)}
                      placeholder="Nome del referral"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={nomeAzienda}
                    onChange={(e) => setNomeAzienda(e.target.value)}
                    placeholder="Nome dell'azienda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luogo:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={luogo}
                    onChange={(e) => setLuogo(e.target.value)}
                    placeholder="Città"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={indirizzo}
                    onChange={(e) => setIndirizzo(e.target.value)}
                    placeholder="Via, numero civico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Telefono:</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referente:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={referente}
                    onChange={(e) => setReferente(e.target.value)}
                    placeholder="Nome del referente"
                  />
                </div>
              </>
            )}

            {mainCategoria === "appuntamento" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Appuntamento:</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={dataAppuntamento}
                    onChange={(e) => setDataAppuntamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ora Appuntamento:</label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={oraAppuntamento}
                    onChange={(e) => setOraAppuntamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luogo Appuntamento:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={luogo_appuntamento}
                    onChange={(e) => setLuogoAppuntamento(e.target.value)}
                    placeholder="Dove si svolgerà l'appuntamento"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota:</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[100px] resize-y"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Scrivi qui i dettagli..."
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">❌ {error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer fisso con buttons */}
        <div className="border-t bg-gray-50 p-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors touch-manipulation"
          >
            ❌ Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors touch-manipulation"
          >
            ✅ Salva
          </button>
        </div>
      </div>
    </div>
  );
};



const PopupForm = ({ onClose, onAddNote, autoreId, autoreNome }) => {
  const [mainCategoria, setMainCategoria] = useState("appuntamento");
  const [tipoContatto, setTipoContatto] = useState("chiamata");
  const [comeArrivato, setComeArrivato] = useState("ricerca");
  const [referal, setReferal] = useState(""); // Nuovo stato per il referral
  const [nomeAzienda, setNomeAzienda] = useState("");
  const [luogo, setLuogo] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [referente, setReferente] = useState("");
  const [nota, setNota] = useState("");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [oraAppuntamento, setOraAppuntamento] = useState("");
  const [luogo_appuntamento, setLuogoAppuntamento] = useState("");
  const [error, setError] = useState("");

  const handleTipoContattoChange = (newTipo) => {
    setTipoContatto(newTipo);
    if (newTipo === 'chiamata') {
      setComeArrivato('ricerca');
    } else {
      setComeArrivato('in azienda');
    }
    setReferal(''); // Reset referral quando cambia il tipo
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Aggiungi validazione per il referral
    if (comeArrivato === 'referal' && !referal) {
      setError("Il nome del referral è obbligatorio.");
      return;
    }

    if (
      mainCategoria === "contatto" &&
      (!tipoContatto || !comeArrivato || !nomeAzienda || !luogo || !indirizzo || !numeroTelefono || !referente)
    ) {
      setError("Tutti i campi per 'contatto' sono obbligatori.");
      return;
    }

    if (mainCategoria === "appuntamento" && (!dataAppuntamento || !oraAppuntamento)) {
      setError("La data e l'ora dell'appuntamento sono obbligatorie.");
      return;
    }

    try {
      const response = await fetch("/api/note_comm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainCategoria,
          tipoContatto: mainCategoria === "contatto" ? tipoContatto : undefined,
          comeArrivato: mainCategoria === "contatto" ? comeArrivato : undefined,
          referal: comeArrivato === 'referal' ? referal : undefined, // Includi referral solo se necessario
          nomeAzienda: mainCategoria === "contatto" ? nomeAzienda : undefined,
          luogo: mainCategoria === "contatto" ? luogo : undefined,
          indirizzo: mainCategoria === "contatto" ? indirizzo : undefined,
          numeroTelefono: mainCategoria === "contatto" ? numeroTelefono : undefined,
          referente: mainCategoria === "contatto" ? referente : undefined,
          nota,
          autoreId,
          autore: autoreNome,
          data_appuntamento: mainCategoria === "appuntamento" ? `${dataAppuntamento}T${oraAppuntamento}` : undefined,
          luogo_appuntamento: mainCategoria === "appuntamento" ? luogo_appuntamento : undefined,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante la creazione della nota.");
      }

      const result = await response.json();
      onAddNote(result.newNote);
      onClose();
    } catch (err) {
      console.error("Errore:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header fisso */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <h3 className="text-lg font-bold text-gray-900">➕ Crea Nota</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none touch-manipulation"
          >
            ×
          </button>
        </div>

        {/* Form scrollabile */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principale:</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                value={mainCategoria}
                onChange={(e) => setMainCategoria(e.target.value)}
              >
                <option value="appuntamento">📅 Appuntamento</option>
                <option value="contatto">📞 Contatto</option>
              </select>
            </div>

            {mainCategoria === "contatto" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo di Contatto:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={tipoContatto}
                    onChange={(e) => handleTipoContattoChange(e.target.value)}
                  >
                    <option value="chiamata">📞 Chiamata</option>
                    <option value="visita">🏢 Visita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Come è Arrivato:</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={comeArrivato}
                    onChange={(e) => {
                      setComeArrivato(e.target.value);
                      if (e.target.value !== 'referal') {
                        setReferal('');
                      }
                    }}
                  >
                    {tipoContatto === 'visita' ? (
                      <>
                        <option value="in azienda">🏢 In Azienda</option>
                        <option value="chiamata">📞 Chiamata</option>
                        <option value="referal">👥 Referal</option>
                      </>
                    ) : (
                      <>
                        <option value="ricerca">🔍 Ricerca</option>
                        <option value="referal">👥 Referal</option>
                      </>
                    )}
                  </select>
                </div>
                
                {comeArrivato === 'referal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Referal:</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      value={referal}
                      onChange={(e) => setReferal(e.target.value)}
                      placeholder="Chi ci ha raccomandato?"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Azienda:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={nomeAzienda}
                    onChange={(e) => setNomeAzienda(e.target.value)}
                    placeholder="Nome dell'azienda"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luogo:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={luogo}
                    onChange={(e) => setLuogo(e.target.value)}
                    placeholder="Città"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indirizzo:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={indirizzo}
                    onChange={(e) => setIndirizzo(e.target.value)}
                    placeholder="Via, numero civico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero di Telefono:</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                    placeholder="+39 123 456 7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Referente:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={referente}
                    onChange={(e) => setReferente(e.target.value)}
                    placeholder="Nome del referente"
                  />
                </div>
              </>
            )}

            {mainCategoria === "appuntamento" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Appuntamento:</label>
                  <input
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={dataAppuntamento}
                    onChange={(e) => setDataAppuntamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ora Appuntamento:</label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={oraAppuntamento}
                    onChange={(e) => setOraAppuntamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Luogo Appuntamento:</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    value={luogo_appuntamento}
                    onChange={(e) => setLuogoAppuntamento(e.target.value)}
                    placeholder="Dove si svolgerà l'appuntamento"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota:</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[100px] resize-y"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Scrivi qui i dettagli..."
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">❌ {error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer fisso con buttons */}
        <div className="border-t bg-gray-50 p-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors touch-manipulation"
          >
            ❌ Annulla
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors touch-manipulation"
          >
            ✅ Crea Nota
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedCommerciale;

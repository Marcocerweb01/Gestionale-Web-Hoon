'use client';

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";

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

  // Effetto per scroll automatico
  useEffect(() => {
    const scrollToBottom = () => {
      if (feedContainerRef.current && notes.length > 0) {
        const container = feedContainerRef.current;
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 100);
      }
    };

    scrollToBottom();
  }, [notes]);

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
    <div className="relative w-full">
      {/* Header */}
      <div className="fixed top-24 sm:top-16 md:top-16 left-0 lg:left-1/4 right-0 bg-gray-200 p-4 sm:pb-0 z-20 ">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden p-2 hover:bg-gray-300 rounded"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-l font-bold">Feed delle Note</h1>
        <Link
          className={`black_btn ml-4 inline-block ${
            !selectedCollaborationId ? "opacity-50 pointer-events-none" : ""
          }`}
          href={`/AddNota/${selectedCollaborationId}?cliente=${selectedCollaborationcliente}`}
        >
          Aggiungi Nota
        </Link>
         {/* Bottone per mostrare/nascondere i filtri in mobile */}
         <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="bg-gray-300 text-black px-3 py-1 rounded ml-auto text-sm lg:hidden"
        >
          {showFilters ? "Nascondi filtri" : "Mostra filtri"}
        </button>
        <div className="flex gap-4 sm:hidden">
          <input
            type="text"
            placeholder="Cerca note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Tutti i tipi</option>
            <option value="appuntamento">Appuntamento</option>
            <option value="generico">Generico</option>
            <option value="problema">Problema</option>
          </select>
        </div>
        </div>
        <div className="lg:hidden md:hidden left-0 right-0 bg-gray-200 p-4 z-20 flex items-center justify-center  gap-4"> <p className="text-center"><b>Collaborazione Selezionata: {selectedCollaborationcliente}</b></p></div> 
          
          {/* Campi per ricerca e filtro */}
      
      <div className= {`lg:hidden md:hidden sm:top-52 md:top-16 left-0 lg:left-1/4 right-0 bg-gray-200 p-4 z-20 flex items-center justify-center gap-4 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:w-1/4 ${ showFilters ? "visible" : "hidden"
        }`}>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Cerca note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Tutti i tipi</option>
            <option value="appuntamento">Appuntamento</option>
            <option value="generico">Generico</option>
            <option value="problema">Problema</option>
          </select>
        </div>
      </div>
      </div>
      
 

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-24 sm:top-40 md:top-32 bottom-0 z-10 w-64 bg-gray-200 p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:w-1/4 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
                setSelectedCollaborationcliente(collaborazione.cliente);
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

      {/* Overlay per chiudere la sidebar su mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-0 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      

      {/* Feed delle Note */}
      <div
        ref={feedContainerRef}
        className={`fixed right-0 top-40 bottom-0 overflow-y-auto w-full lg:w-3/4 transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "ml-0"
        } p-4 lg:p-6 scroll-smooth`}
      >
        {loadingNotes ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="text-gray-500">
            Nessuna nota trovata per questa collaborazione.
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredNotes.map((note) => (
              <li
                key={note._id}
                className={`p-4 rounded shadow w-full lg:w-2/4 ${
                  note.tipo === "problema"
                    ? note.autoreId === session?.user?.id
                      ? "bg-red-100 ml-auto text-right"
                      : "bg-red-100 mr-auto text-left"
                    : note.autoreId === session?.user?.id
                    ? "bg-blue-100 ml-auto text-right"
                    : "bg-gray-100 mr-auto text-left"
                }`}
              >
                <h3 className="font-bold">
                  {note.tipo || "Nota Generica"}
                </h3>
                {note.tipo === "appuntamento" && (
                  <p className="text-sm text-gray-500">
                    Data Appuntamento:{" "}
                    {new Date(note.data_appuntamento).toLocaleDateString()}
                  </p>
                )}
                <p>{note.nota}</p>
                <p className="text-sm text-gray-500">
                  Autore: {note.autore}
                </p>
                <p className="text-sm text-gray-500">
                  Data: {new Date(note.data).toLocaleDateString()}
                </p>
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Modifica
                  </button>
                  {session?.user?.role === "amministratore" && (
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
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
  const [data_appuntamento, setDataAppuntamento] = useState(
    note.data_appuntamento ? note.data_appuntamento.split("T")[0] : ""
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">Modifica Nota</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Tipo Nota:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="appuntamento">Appuntamento</option>
              <option value="generico">Generico</option>
            </select>
          </div>
          {tipo === "appuntamento" && (
            <div className="mt-4">
              <label className="block font-medium">Data Appuntamento:</label>
              <input
                type="date"
                value={data_appuntamento || ""}
                onChange={(e) => setDataAppuntamento(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          )}
          <div>
            <label className="block font-medium">Nota:</label>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedPage;

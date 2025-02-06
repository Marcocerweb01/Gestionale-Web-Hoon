"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";

const FeedPage = ({ params }) => {
  // Recupera l'id dell'utente (collaboratore) dalla route
  const { collaboratoreId } = params;
  // Usa useSearchParams per ottenere i parametri dalla query string
  const searchParams = useSearchParams();
  const collaborazioneIdFromQuery = searchParams.get("collaborazioneId");

  const [collaborazioni, setCollaborazioni] = useState([]);
  const [selectedCollaborationId, setSelectedCollaborationId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingCollaborations, setLoadingCollaborations] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const { data: session } = useSession();
  const feedContainerRef = useRef(null);

  // Fetch delle collaborazioni del collaboratore
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
          // Se nella query string è presente un id di collaborazione e lo troviamo nella lista, lo impostiamo
          if (collaborazioneIdFromQuery) {
            const collFound = result.find(
              (collab) => collab.id === collaborazioneIdFromQuery
            );
            if (collFound) {
              setSelectedCollaborationId(collaborazioneIdFromQuery);
            } else {
              setSelectedCollaborationId(result[0].id);
            }
          } else {
            setSelectedCollaborationId(result[0].id);
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

  // Fetch delle note della collaborazione selezionata
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

  // Scroll automatico verso il fondo del feed
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

  // Apertura del modal per la modifica della nota
  const handleEdit = (note) => {
    setEditingNote(note);
  };

  // Aggiornamento della nota nel feed dopo la modifica
  const handleUpdateNote = (updatedNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n._id === updatedNote._id ? updatedNote : n))
    );
  };

  // Eliminazione della nota (solo per amministratori)
  const handleDelete = async (noteId) => {
    try {
      const response = await fetch("/api/delete_note", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
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

  if (loadingCollaborations) return <div>Caricamento collaborazioni...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="relative w-full">
      {/* Header */}
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
        ) : notes.length === 0 ? (
          <p className="text-gray-500">
            Nessuna nota trovata per questa collaborazione.
          </p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/edit_note", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: note._id,
          updatedData: { tipo, nota },
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
            <input
              type="text"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
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

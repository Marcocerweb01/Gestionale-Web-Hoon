"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const FeedCommerciale = ({ id }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Stato per gestire il popup
  const { data: session } = useSession();

  // Fetch note del commerciale
  useEffect(() => {
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        const response = await fetch(`/api/feed_note_comm/${id}`);
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
  }, [id]);

  const handleAddNote = async (newNote) => {
    // Aggiungi la nuova nota al feed locale
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  return (
    <div className="relative w-full h-full" >
      <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="text-xl font-bold">Feed delle Note</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setIsPopupOpen(true)}
        >
          Aggiungi Nota
        </button>
      </div>

      {isPopupOpen && (
        <PopupForm
          onClose={() => setIsPopupOpen(false)}
          onAddNote={handleAddNote}
          autoreId={session?.user?.id}
          autoreNome={session?.user?.nome}
        />
      )}

      {/* Feed Note */}
      <div
        className={` overflow-y-auto w-full lg:w-3/4 p-4 lg:p-6`}
        style={{
        
          height: 'calc(100vh - 100px)', // Altezza dinamica in base alla pagina
          overflowY: 'auto',
          zIndex:'10'
        }}
      >
        {loadingNotes ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-gray-500">Nessuna nota trovata per questo Utente.</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note._id}
                className={`p-4 rounded shadow w-full lg:w-2/4 ${
                  note.autoreId === session?.user?.id
                    ? "bg-blue-100 ml-auto text-right"
                    : "bg-gray-100 mr-auto text-left"
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

// PopupForm Component
const PopupForm = ({ onClose, onAddNote, autoreId, autoreNome }) => {
  const [nota, setNota] = useState("");
  const [tipo, setTipo] = useState("visita");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/note_comm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota,
          autoreId,
          autore: autoreNome,
          tipo,
          data_appuntamento: tipo === "appuntamento" ? dataAppuntamento : undefined,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante la creazione della nota.");
      }

      const result = await response.json();
      onAddNote(result.newNote);
      setNota("");
      setTipo("visita");
      setDataAppuntamento("");
      onClose();
    } catch (err) {
      console.error("Errore:", err);
      setError("Errore durante la creazione della nota.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-150">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex flex-row mb-5">
        <h3 className="text-xl font-bold w-5/6">Crea Nota</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 w-1/6  text-4xl flex items-center align-middle justify-center"
          style={{ lineHeight: "1.6rem" }}
          >
            &times;
          </button>

        
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block font-medium">Tipo:</label>
            <select
              className="w-full p-2 border rounded"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="visita">Visita</option>
              <option value="appuntamento">Appuntamento</option>
            </select>
          </div>
          {tipo === "appuntamento" && (
            <div>
              <label className="block font-medium">Data Appuntamento:</label>
              <input
                type="date"
                className="w-full p-2 border rounded"
                value={dataAppuntamento}
                onChange={(e) => setDataAppuntamento(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block font-medium">Nota:</label>
            <textarea
              className="w-full p-2 border rounded"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Salva
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default FeedCommerciale;

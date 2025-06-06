'use client';

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

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
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      searchQuery === "" ||
      note.nota.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "" || note.mainCategoria === typeFilter;
    return matchesSearch && matchesType;
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
    <div className="relative w-full h-3/5">
      <h2 className="text-xl font-bold mb-4">Trovate {count} note</h2>
      <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">Feed delle Note</h2>
      <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setIsPopupOpen(true)}
        >
          Aggiungi Nota
        </button>
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="bg-gray-300 text-black px-3 py-1 rounded  text-sm lg:hidden"
        >
          {showFilters ? "Nascondi filtri" : "Mostra filtri"}
        </button>
        </div>
      <div className={`${ showFilters ? "sm:visible" : "sm:hidden"
        }`}>
      <div className={`flex justify-between items-center mb-4`}>
        
        {session?.user?.role === "amministratore" && (
          <div className="flex space-x-4">
            <div>
              <label className="block font-medium">Data Inizio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div>
              <label className="block font-medium">Data Fine</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
          </div>
        )}

        
      </div>

      {/* Campi per ricerca e filtro */}
      <div className="flex gap-4 mb-4">
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
          <option value="contatto">Contatto</option>
        </select>
      </div>
      </div>    
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

      <div
        id="feed-container"
        className="overflow-y-auto w-full lg:w-3/4 p-2 lg:p-6"
        style={{
          height: "75vh",
          overflowY: "auto",
          width: "100%",
        }}
      >
        {loadingNotes ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4 w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded mb-4 w-1/2"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <p className="text-gray-500">Nessuna nota trovata per questo Utente.</p>
        ) : (
          <ul className="space-y-4">
            {filteredNotes.map((note) => (
              <li
                key={note._id}
                className={`p-4 rounded shadow w-full lg:w-2/4 ${
                  note.autoreId === session?.user?.id
                    ? "bg-blue-100 ml-auto text-right"
                    : "bg-gray-100 mr-auto text-left"
                }`}
              >
                <h3 className="font-bold">
                  {note.mainCategoria === "appuntamento" ? "Appuntamento" : "Contatto"}
                </h3>
                {note.mainCategoria === "appuntamento" && (
                  <>
                  <p className="text-sm text-gray-500">
                    Data Appuntamento:{" "}
                    {dayjs(note.data_appuntamento).utc().format("DD/MM/YYYY HH:mm")}
                  </p>
                  <p className="text-sm text-gray-500">Luogo: {note.luogo_appuntamento}</p>
                  </>
                )}
                <p>{note.nota}</p>
                <p className="text-sm text-gray-500">Autore: {note.autore}</p>
                <p className="text-sm text-gray-500">
                  Data: {dayjs(note.data).utc().format("DD/MM/YYYY HH:mm")}
                </p>
                <div
                  className="mt-2 flex justify-end space-x-2"
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.5rem",
                  }}
                >
                  {session?.user?.role === "amministratore" && (
                    <button
                      onClick={() => handleDelete(note._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.25rem",
                      }}
                    >
                      Elimina
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(note)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "#fff",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "0.25rem",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    Modifica
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh] p-6">
        <h3 className="text-xl font-bold mb-4">Modifica Nota</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Categoria Principale:</label>
            <select
              className="w-full p-2 border rounded"
              value={mainCategoria}
              onChange={(e) => setMainCategoria(e.target.value)}
            >
              <option value="appuntamento">Appuntamento</option>
              <option value="contatto">Contatto</option>
            </select>
          </div>

          {mainCategoria === "contatto" && (
            <>
              <div>
                <label className="block font-medium">Tipo di Contatto:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={tipoContatto}
                  onChange={(e) => setTipoContatto(e.target.value)}
                >
                  <option value="chiamata">Chiamata</option>
                  <option value="visita">Visita</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Come è Arrivato:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={comeArrivato}
                  onChange={(e) => setComeArrivato(e.target.value)}
                >
                  <option value="ricerca">Ricerca</option>
                  <option value="referal">Referal</option>
                  <option value="chiamata">Chiamata</option>
                  <option value="in azienda">In Azienda</option>
                </select>
              </div>
              {comeArrivato === "referal" && (
                <div>
                  <label className="block font-medium">Referal:</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={referal}
                    onChange={(e) => setReferal(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label className="block font-medium">Nome Azienda:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={nomeAzienda}
                  onChange={(e) => setNomeAzienda(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Luogo:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={luogo}
                  onChange={(e) => setLuogo(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Indirizzo:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Numero di Telefono:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={numeroTelefono}
                  onChange={(e) => setNumeroTelefono(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Referente:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={referente}
                  onChange={(e) => setReferente(e.target.value)}
                />
              </div>
            </>
          )}

          {mainCategoria === "appuntamento" && (
            <>
              <div>
                <label className="block font-medium">Data Appuntamento:</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={dataAppuntamento}
                  onChange={(e) => setDataAppuntamento(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Ora Appuntamento:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded"
                  value={oraAppuntamento}
                  onChange={(e) => setOraAppuntamento(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Luogo Appuntamento:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={luogo_appuntamento}
                  onChange={(e) => setLuogoAppuntamento(e.target.value)}
                />
              </div>
             
            </>
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
          {error && <p className="text-red-500">{error}</p>}
          <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "1rem", // space-x-4 => 1rem (16px)
  }}
>
  <button
    type="button"
    style={{
      backgroundColor: "#6b7280", // bg-gray-500 => #6b7280
      color: "#fff",             // text-white
      padding: "0.5rem 1rem",    // px-4 => 1rem, py-2 => 0.5rem
      borderRadius: "0.25rem",   // rounded => 4px
      transition: "background-color 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4b5563")} // hover:bg-gray-600 => #4b5563
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6b7280")}
    onClick={onClose}
  >
    Annulla
  </button>

  <button
    type="submit"
    style={{
      backgroundColor: "#3b82f6", // bg-blue-500 => #3b82f6
      color: "#fff",
      padding: "0.5rem 1rem",
      borderRadius: "0.25rem",
      transition: "background-color 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")} // hover:bg-blue-600 => #2563eb
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
  >
    Salva
  </button>
</div>

        </form>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pt-32">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh] p-6 pt-24" style={{
    backgroundColor: "white", // bg-white
    borderRadius: "0.5rem", // rounded-lg (equivale a 8px)
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", // shadow-lg
    width: "100%", // w-full
    maxWidth: "28rem", // max-w-md (equivale a 448px)
    overflowY: "auto", // overflow-y-auto
    maxHeight: "90vh", // max-h-[90vh]
    padding: "1.5rem", // p-6 (24px)
    paddingTop: "6rem", // pt-24 (96px)
  }}>
        <div className="flex flex-row mb-5">
          <h3 className="text-xl font-bold w-5/6">Crea Nota</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 w-1/6 text-4xl flex items-center justify-center" style={{

              color: "rgb(107, 114, 128)", // text-gray-500
              width: "16.666667%", // w-1/6
              fontSize: "2.25rem", // text-4xl
              display: "flex", // flex
              alignItems: "center", // items-center
              justifyContent: "center", // justify-center
            }}
            onMouseEnter={(e) => (e.target.style.color = "rgb(31, 41, 55)")} // hover:text-gray-800
            onMouseLeave={(e) => (e.target.style.color = "rgb(107, 114, 128)")}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Categoria Principale:</label>
            <select
              className="w-full p-2 border rounded sm:p-3"
              value={mainCategoria}
              onChange={(e) => setMainCategoria(e.target.value)}
            >
              <option value="appuntamento">Appuntamento</option>
              <option value="contatto">Contatto</option>
            </select>
          </div>

          {mainCategoria === "contatto" && (
            <>
              <div>
                <label className="block font-medium">Tipo di Contatto:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={tipoContatto}
                  onChange={(e) => handleTipoContattoChange(e.target.value)}
                >
                  <option value="chiamata">Chiamata</option>
                  <option value="visita">Visita</option>
                </select>
              </div>
              <div>
                <label className="block font-medium">Come è Arrivato:</label>
                <select
                  className="w-full p-2 border rounded"
                  value={comeArrivato}
                  onChange={(e) => {
                    setComeArrivato(e.target.value);
                    if (e.target.value !== 'referal') {
                      setReferal(''); // Reset referral quando si cambia l'origine
                    }
                  }}
                >
                  {tipoContatto === 'visita' ? (
                    <>
                      <option value="in azienda">In Azienda</option>
                      <option value="chiamata">Chiamata</option>
                      <option value="referal">Referal</option>
                    </>
                  ) : (
                    <>
                      <option value="ricerca">Ricerca</option>
                      <option value="referal">Referal</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* Campo Referral condizionale */}
              {comeArrivato === 'referal' && (
                <div>
                  <label className="block font-medium">Nome Referal:</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={referal}
                    onChange={(e) => setReferal(e.target.value)}
                    placeholder="Inserisci il nome del referral"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium">Nome Azienda:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={nomeAzienda}
                  onChange={(e) => setNomeAzienda(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Luogo:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={luogo}
                  onChange={(e) => setLuogo(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Indirizzo:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={indirizzo}
                  onChange={(e) => setIndirizzo(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Numero di Telefono:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={numeroTelefono}
                  onChange={(e) => setNumeroTelefono(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Referente:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={referente}
                  onChange={(e) => setReferente(e.target.value)}
                />
              </div>
            </>
          )}

          {mainCategoria === "appuntamento" && (
            <>
              <div>
                <label className="block font-medium">Data Appuntamento:</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded sm:p-3"
                  value={dataAppuntamento}
                  onChange={(e) => setDataAppuntamento(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Ora Appuntamento:</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded sm:p-3"
                  value={oraAppuntamento}
                  onChange={(e) => setOraAppuntamento(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium">Luogo Appuntamento:</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded sm:p-3"
                  value={luogo_appuntamento}
                  onChange={(e) => setLuogoAppuntamento(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-medium">Nota:</label>
            <textarea
              className="w-full p-2 border rounded sm:p-3"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              required
            />
          </div>

          <div className="sticky bottom-0 bg-white p-4 border-t">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
            >
              Salva
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default FeedCommerciale;

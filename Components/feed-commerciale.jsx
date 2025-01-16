"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { format } from 'date-fns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

const FeedCommerciale = ({ id }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false); // Stato per gestire il popup
  const { data: session } = useSession();
  const [startDate, setStartDate]= useState();
  const [endDate, setEndDate]= useState();
  const [count, setCount] =useState();
  dayjs.extend(utc);
dayjs.extend(timezone);
  // Fetch note del commerciale
  useEffect(() => {
    const fetchNotes = async () => {
      setLoadingNotes(true);
      try {
        // Costruisci i parametri di query
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
  }, [id, startDate, endDate]); // Aggiungi `startDate` e `endDate` come dipendenze
  
  const handleAddNote = async (newNote) => {
    // Aggiungi la nuova nota al feed locale
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  return (
    <div className="relative w-full h-3/5" >
      <h2 className="text-xl font-bold">Trovate {count}</h2>
      <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="text-xl font-bold">Feed delle Note</h2>
        {session?.user?.role === "amministratore" ? (
        <div className="flex space-x-4 mb-4">
          <div>
              <label>Data Inizio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <div className="ml-5">
              <label>Data Fine</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 rounded"
              />
            </div> </div>):(<></>)}
    
         

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
  className="overflow-y-auto w-full lg:w-3/4 p-4 lg:p-6"
  style={{
    width: "100%",
    height: "75vh", // Altezza dinamica in base alla pagina
    overflowY: "auto",
    zIndex: "10",
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
          {/* Mostra informazioni sulla nota */}
          <h3 className="font-bold">
            {note.mainCategoria === "appuntamento" ? "Appuntamento" : "Contatto"}
          </h3>
          {note.mainCategoria === "contatto" && (
            <>
              <p className="text-sm text-gray-700">
                <b>Tipo di Contatto:</b> {note.tipoContatto}
              </p>
              <p className="text-sm text-gray-700">
                <b>Come Arrivato:</b> {note.comeArrivato}
              </p>
              <p className="text-sm text-gray-700">
                <b>Nome Azienda:</b> {note.nomeAzienda}
              </p>
              <p className="text-sm text-gray-700">
                <b>Luogo:</b> {note.luogo}
              </p>
              <p className="text-sm text-gray-700">
                <b>Indirizzo:</b> {note.indirizzo}
              </p>
              <p className="text-sm text-gray-700">
                <b>Numero di Telefono:</b> {note.numeroTelefono}
              </p>
              <p className="text-sm text-gray-700">
                <b>Referente:</b> {note.referente}
              </p>
            </>
          )}
          {note.mainCategoria === "appuntamento" && (
            <p className="text-sm text-gray-700">
              <b>Data Appuntamento:</b>{" "}
              {dayjs(note.data_appuntamento).utc().format("DD/MM/YYYY HH:mm")}
            </p>
          )}
          <p className="text-sm text-gray-700">
            <b>Nota:</b> {note.nota}
          </p>
          <p className="text-sm text-gray-500">Autore: {note.autore}</p>
          <p className="text-sm text-gray-500">
            Data Creazione: {dayjs(note.data).utc().format("DD/MM/YYYY HH:mm")}
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
  const [mainCategoria, setMainCategoria] = useState("appuntamento"); // Categoria principale
  const [tipoContatto, setTipoContatto] = useState("chiamata"); // Tipo di contatto
  const [comeArrivato, setComeArrivato] = useState("chiamata"); // Come è arrivato il contatto
  const [nomeAzienda, setNomeAzienda] = useState(""); // Nome azienda
  const [luogo, setLuogo] = useState(""); // Luogo
  const [indirizzo, setIndirizzo] = useState(""); // Indirizzo
  const [numeroTelefono, setNumeroTelefono] = useState(""); // Numero di telefono
  const [referente, setReferente] = useState(""); // Referente
  const [nota, setNota] = useState(""); // Nota
  const [dataAppuntamento, setDataAppuntamento] = useState(""); // Data appuntamento
  const [error, setError] = useState(""); // Gestione errori

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    // Verifica campi obbligatori
    if (mainCategoria === "contatto" && (!tipoContatto || !comeArrivato || !nomeAzienda || !luogo || !indirizzo || !numeroTelefono || !referente)) {
      setError("Tutti i campi per 'contatto' sono obbligatori.");
      return;
    }
  
    if (mainCategoria === "appuntamento" && !dataAppuntamento) {
      setError("La data dell'appuntamento è obbligatoria.");
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
          nomeAzienda: mainCategoria === "contatto" ? nomeAzienda : undefined,
          luogo: mainCategoria === "contatto" ? luogo : undefined,
          indirizzo: mainCategoria === "contatto" ? indirizzo : undefined,
          numeroTelefono: mainCategoria === "contatto" ? numeroTelefono : undefined,
          referente: mainCategoria === "contatto" ? referente : undefined,
          nota,
          autoreId,
          autore: autoreNome,
          data_appuntamento: mainCategoria === "appuntamento" ? dataAppuntamento : undefined,
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
    <div className="fixed top-40 inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div
    className="bg-white rounded-lg shadow-lg w-full max-w-md"
    style={{
      maxHeight: "90vh", // Limita l'altezza del popup
      overflowY: "auto", // Abilita lo scroll verticale
      padding: "1.5rem",
    }}
  >
    <div className="flex flex-row mb-5">
      <h3 className="text-xl font-bold w-5/6">Crea Nota</h3>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-800 w-1/6 text-4xl flex items-center align-middle justify-center"
      >
        &times;
      </button>
    </div>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campi del form */}
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
                  <option value="chiamata">Chiamata</option>
                  <option value="in azienda">In Azienda</option>
                  <option value="referal">Referal</option>
                </select>
              </div>
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
        <div>
          <label className="block font-medium">Data Appuntamento:</label>
          <input
            type="date"
            className="w-full p-2 border rounded sm:p-3"
            value={dataAppuntamento}
            onChange={(e) => setDataAppuntamento(e.target.value)}
          />
        </div>
      )}

      {/* Nota */}
      <div>
        <label className="block font-medium">Nota:</label>
        <textarea
          className="w-full p-2 border rounded sm:p-3"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          required
        />
      </div>

      {/* Pulsante Salva */}
      <div
        className="fixed bottom-0 left-0 w-full bg-white p-4 border-t"
        style={{ position: "sticky", bottom: 0, zIndex: 150 }}
      >
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

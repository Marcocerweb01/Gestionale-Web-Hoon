"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

const FeedCommerciale = ({ id }) => {
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [error, setError] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [count, setCount] = useState(0);

  const { data: session } = useSession();

  dayjs.extend(utc);

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

  const handleAddNote = async (newNote) => {
    setNotes((prevNotes) => [newNote, ...prevNotes]);
  };

  return (
    <div className="relative w-full h-3/5">
      <h2 className="text-xl font-bold mb-4">Trovate {count} note</h2>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Feed delle Note</h2>
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

      <div
        className="overflow-y-auto w-full lg:w-3/4 p-2 lg:p-6"
        style={{
          height: "75vh",
          overflowY: "auto",
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
                <h3 className="font-bold">
                  {note.mainCategoria === "appuntamento" ? "Appuntamento" : "Contatto"}
                </h3>
                {note.mainCategoria === "contatto" && (
                  <>
                    <p className="text-sm text-gray-700"><b>Tipo di Contatto:</b> {note.tipoContatto}</p>
                    <p className="text-sm text-gray-700"><b>Come Arrivato:</b> {note.comeArrivato}</p>
                     {note.comeArrivato === "referal" && note.referral && (
                      <p className="text-sm text-gray-700">
                        <b>Referral:</b> {note.referral}
                      </p>
                    )}
                    <p className="text-sm text-gray-700"><b>Nome Azienda:</b> {note.nomeAzienda}</p>
                    <p className="text-sm text-gray-700"><b>Luogo:</b> {note.luogo}</p>
                    <p className="text-sm text-gray-700"><b>Indirizzo:</b> {note.indirizzo}</p>
                    <p className="text-sm text-gray-700"><b>Numero di Telefono:</b> {note.numeroTelefono}</p>
                    <p className="text-sm text-gray-700"><b>Referente:</b> {note.referente}</p>
                  </>
                )}
                {note.mainCategoria === "appuntamento" && (
                  <p className="text-sm text-gray-700">
                    <b>Data Appuntamento:</b> {dayjs(note.data_appuntamento).utc().format("DD/MM/YYYY HH:mm")}
                  </p>
                )}
                <p className="text-sm text-gray-700"><b>Nota:</b> {note.nota}</p>
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


const PopupForm = ({ onClose, onAddNote, autoreId, autoreNome }) => {
  const [mainCategoria, setMainCategoria] = useState("appuntamento");
  const [tipoContatto, setTipoContatto] = useState("chiamata");
  const [comeArrivato, setComeArrivato] = useState("ricerca");
  const [referral, setReferral] = useState(""); // Nuovo stato per il referral
  const [nomeAzienda, setNomeAzienda] = useState("");
  const [luogo, setLuogo] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");
  const [referente, setReferente] = useState("");
  const [nota, setNota] = useState("");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [oraAppuntamento, setOraAppuntamento] = useState("");
  const [error, setError] = useState("");

  const handleTipoContattoChange = (newTipo) => {
    setTipoContatto(newTipo);
    if (newTipo === 'chiamata') {
      setComeArrivato('ricerca');
    } else {
      setComeArrivato('in azienda');
    }
    setReferral(''); // Reset referral quando cambia il tipo
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Aggiungi validazione per il referral
    if (comeArrivato === 'referal' && !referral) {
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
          referral: comeArrivato === 'referal' ? referral : undefined, // Includi referral solo se necessario
          nomeAzienda: mainCategoria === "contatto" ? nomeAzienda : undefined,
          luogo: mainCategoria === "contatto" ? luogo : undefined,
          indirizzo: mainCategoria === "contatto" ? indirizzo : undefined,
          numeroTelefono: mainCategoria === "contatto" ? numeroTelefono : undefined,
          referente: mainCategoria === "contatto" ? referente : undefined,
          nota,
          autoreId,
          autore: autoreNome,
          data_appuntamento: mainCategoria === "appuntamento" ? `${dataAppuntamento}T${oraAppuntamento}` : undefined,
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
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh] p-6 pt-24">
        <div className="flex flex-row mb-5">
          <h3 className="text-xl font-bold w-5/6">Crea Nota</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 w-1/6 text-4xl flex items-center justify-center"
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
                      setReferral(''); // Reset referral quando si cambia l'origine
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
                  <label className="block font-medium">Nome Referral:</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
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

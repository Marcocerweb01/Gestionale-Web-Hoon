"use client";

import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaClock, FaPhone, FaCalendar, FaMapMarkerAlt, FaEnvelope, FaStickyNote, FaEdit } from "react-icons/fa";

const STATI = [
  { key: "contatto", label: "Contatto", icon: FaPhone },
  { key: "appuntamento", label: "Appuntamento", icon: FaCalendar },
  { key: "preventivo", label: "Preventivo", icon: FaStickyNote },
  { key: "contratto", label: "Contratto", icon: FaCheck }
];

export default function TimelineLead({ lead, onUpdate, onDelete, onArchive }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dataRicontatto, setDataRicontatto] = useState("");
  
  // Editing nota generale
  const [isEditingNota, setIsEditingNota] = useState(false);
  const [notaGenerale, setNotaGenerale] = useState(lead.nota_generale || "");
  
  // Nuovo stato selezionato
  const [nuovoStato, setNuovoStato] = useState(lead.stato_attuale || "in_lavorazione");
  const [mostraDataRichiamo, setMostraDataRichiamo] = useState(false);

  // Sincronizza nuovoStato quando lead.stato_attuale cambia
  useEffect(() => {
    setNuovoStato(lead.stato_attuale || "in_lavorazione");
    
    // Se lo stato è "da_richiamare", precompila e mostra il campo data
    if (lead.stato_attuale === "da_richiamare") {
      if (lead.data_richiamo) {
        setDataRicontatto(new Date(lead.data_richiamo).toISOString().split('T')[0]);
      }
      setMostraDataRichiamo(true);
    }
  }, [lead.stato_attuale, lead.data_richiamo]);

  const getStatoAttuale = () => {
    return lead.stato_attuale || "nuovo";
  };

  const isStatoCompletato = (statoKey) => {
    if (!lead.timeline || !lead.timeline[statoKey]) return false;
    return lead.timeline[statoKey]?.completato === true;
  };

  const getDataCompletamento = (statoKey) => {
    if (!lead.timeline || !lead.timeline[statoKey]) return null;
    const data = lead.timeline[statoKey]?.data_completamento;
    if (!data) return null;
    return new Date(data).toLocaleDateString("it-IT");
  };

  const handleToggleStato = async (statoKey) => {
    // Ordine della timeline
    const ordineStati = ["contatto", "appuntamento", "preventivo", "contratto"];
    const indiceCliccato = ordineStati.indexOf(statoKey);
    
    const currentValue = isStatoCompletato(statoKey);
    
    if (currentValue) {
      // Se è già spuntato, deseleziona QUESTO e tutti quelli DOPO
      await aggiornaTimelineProgressiva(indiceCliccato, false, statoKey);
    } else {
      // Se non è spuntato, spunta QUESTO e tutti quelli PRIMA
      await aggiornaTimelineProgressiva(indiceCliccato, true, statoKey);
    }
  };

  const aggiornaTimelineProgressiva = async (indiceTarget, completare, statoKey) => {
    setIsUpdating(true);
    try {
      const ordineStati = ["contatto", "appuntamento", "preventivo", "contratto"];
      const updateData = {};
      
      if (completare) {
        // Spunta tutti gli stati da 0 fino all'indice cliccato (incluso)
        for (let i = 0; i <= indiceTarget; i++) {
          const stato = ordineStati[i];
          updateData[`timeline.${stato}.completato`] = true;
          updateData[`timeline.${stato}.data_completamento`] = new Date().toISOString();
        }
        
        // Se clicca su "contratto", imposta stato_attuale a "completato"
        if (statoKey === 'contratto') {
          updateData.stato_attuale = 'completato';
        }
      } else {
        // Deseleziona dall'indice cliccato fino alla fine
        for (let i = indiceTarget; i < ordineStati.length; i++) {
          const stato = ordineStati[i];
          updateData[`timeline.${stato}.completato`] = false;
          updateData[`timeline.${stato}.data_completamento`] = null;
        }
        
        // Se toglie "contratto", riporta lo stato a "in_lavorazione"
        if (statoKey === 'contratto') {
          updateData.stato_attuale = 'in_lavorazione';
        }
      }

      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error("Errore aggiornamento");

      const updatedLead = await response.json();
      onUpdate(updatedLead);
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore durante l'aggiornamento");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCambioStato = async () => {
    if (nuovoStato === lead.stato_attuale) {
      alert("⚠️ Questo stato è già impostato");
      return;
    }

    if (nuovoStato === "da_richiamare" && !dataRicontatto) {
      alert("⚠️ Inserisci una data per programmare il richiamo");
      return;
    }

    const messaggi = {
      "in_lavorazione": "🔵 IN LAVORAZIONE\n\nLead attivo, in fase di contatto.",
      "non_interessato": "❌ NON INTERESSATO\n\nIl cliente non è interessato.",
      "da_richiamare": `📅 DA RICHIAMARE\n\nData richiamo: ${new Date(dataRicontatto).toLocaleDateString('it-IT')}`,
      "completato": "✅ COMPLETATO\n\nContratto firmato."
    };

    const conferma = confirm(
      `${messaggi[nuovoStato]}\n\nConfermi il cambio di stato?`
    );
    
    if (!conferma) return;

    setIsUpdating(true);
    try {
      const updateData = {
        stato_attuale: nuovoStato
      };

      if (nuovoStato === "da_richiamare") {
        updateData.data_richiamo = dataRicontatto;
      }

      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error("Errore aggiornamento");

      const updatedLead = await response.json();
      onUpdate(updatedLead);
      setDataRicontatto("");
      setMostraDataRichiamo(false);
      alert("✅ Stato aggiornato con successo");
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore durante l'aggiornamento");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSalvaNota = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota_generale: notaGenerale
        })
      });

      if (!response.ok) throw new Error("Errore salvataggio nota");

      const updatedLead = await response.json();
      onUpdate(updatedLead);
      setIsEditingNota(false);
      alert("✅ Nota salvata");
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore durante il salvataggio della nota");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleElimina = async () => {
    if (!confirm(`Eliminare definitivamente il lead "${lead.nome_attivita}"?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Errore eliminazione");

      onDelete(lead._id);
    } catch (error) {
      console.error("Errore:", error);
      alert("Errore durante l'eliminazione");
    } finally {
      setIsUpdating(false);
    }
  };

  const statoAttuale = getStatoAttuale();
  const isArchiviato = lead.archiviato;

  return (
    <>
      <div className={`border rounded-lg p-3 md:p-4 mb-3 shadow-sm transition-all ${
        isArchiviato ? "bg-gray-100 opacity-75" : "bg-white hover:shadow-md"
      }`}>
        {/* Header Lead - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold text-gray-800 break-words">{lead.nome_attivita}</h3>
            {lead.referente && (
              <p className="text-xs md:text-sm text-gray-600">📞 {lead.referente}</p>
            )}
            <p className="text-xs md:text-sm text-blue-600 font-medium">{lead.numero_telefono}</p>
          </div>
          
          <div className="flex flex-col items-start sm:items-end gap-1 flex-shrink-0">
            <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold ${
              statoAttuale === "in_lavorazione" ? "bg-blue-100 text-blue-800" :
              statoAttuale === "non_interessato" ? "bg-red-100 text-red-800" :
              statoAttuale === "da_richiamare" ? "bg-yellow-100 text-yellow-800" :
              statoAttuale === "completato" ? "bg-green-100 text-green-800" :
              "bg-gray-100 text-gray-800"
            }`}>
              {statoAttuale === "in_lavorazione" ? "IN LAVORAZIONE" :
               statoAttuale === "non_interessato" ? "NON INTERESSATO" :
               statoAttuale === "da_richiamare" ? "DA RICHIAMARE" :
               statoAttuale === "completato" ? "COMPLETATO" :
               statoAttuale.toUpperCase()}
            </span>
            
            {lead.data_richiamo && statoAttuale === "da_richiamare" && (
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                📅 {new Date(lead.data_richiamo).toLocaleDateString('it-IT')}
              </span>
            )}
            
            {isArchiviato && (
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                ARCHIVIATO
              </span>
            )}
          </div>
        </div>

        {/* Info Date - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 mb-3 text-xs text-gray-600">
          {lead.createdAt && (
            <span className="bg-gray-100 px-2 py-1 rounded inline-block">
              📅 Creato: {new Date(lead.createdAt).toLocaleDateString('it-IT')}
            </span>
          )}
          {lead.data_cambio_stato && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
              🔄 Ultimo cambio: {new Date(lead.data_cambio_stato).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>

        {/* Timeline Stati - Desktop: 4 in fila, Mobile: 2x2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          {STATI.map((stato, idx) => {
            const Icon = stato.icon;
            const completato = isStatoCompletato(stato.key);
            const dataComp = getDataCompletamento(stato.key);

            return (
              <button
                key={stato.key}
                onClick={() => !isUpdating && !isArchiviato && handleToggleStato(stato.key)}
                disabled={isUpdating || isArchiviato}
                className={`p-2 md:p-3 rounded-lg border-2 transition-all ${
                  completato 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                } ${isArchiviato ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon className={`text-base md:text-xl ${completato ? "text-green-600" : "text-gray-400"}`} />
                  <span className={`text-[10px] md:text-xs font-medium ${completato ? "text-green-700" : "text-gray-600"} text-center leading-tight`}>
                    {stato.label}
                  </span>
                  {completato && (
                    <>
                      <FaCheck className="text-green-600 text-xs md:text-sm" />
                      {dataComp && (
                        <span className="text-[8px] md:text-[10px] text-gray-500 text-center">{dataComp}</span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* NOTA GENERALE - Sempre Visibile - Mobile Responsive */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <FaStickyNote className="text-yellow-600" />
              <span className="font-semibold text-gray-700 text-sm">Nota Generale</span>
            </div>
            {!isArchiviato && (
              <button
                onClick={() => {
                  if (isEditingNota) {
                    handleSalvaNota();
                  } else {
                    setIsEditingNota(true);
                  }
                }}
                disabled={isUpdating}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 self-start"
              >
                <FaEdit />
                {isEditingNota ? "Salva" : "Modifica"}
              </button>
            )}
          </div>
          
          {isEditingNota ? (
            <textarea
              value={notaGenerale}
              onChange={(e) => setNotaGenerale(e.target.value)}
              placeholder="Aggiungi note, dettagli, promemoria..."
              className="w-full border border-yellow-300 rounded p-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-yellow-400"
              disabled={isUpdating}
            />
          ) : (
            <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap">
              {notaGenerale || <span className="text-gray-400 italic">Nessuna nota inserita...</span>}
            </p>
          )}
          
          {isEditingNota && (
            <button
              onClick={() => {
                setNotaGenerale(lead.nota_generale || "");
                setIsEditingNota(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
              disabled={isUpdating}
            >
              Annulla modifiche
            </button>
          )}
        </div>

        {/* Dettagli Aggiuntivi - Mobile Responsive */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-xs md:text-sm">
            {lead.indirizzo && (
              <p className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {lead.indirizzo}
                  {lead.citta && <span className="text-gray-600"> - {lead.citta}</span>}
                </span>
              </p>
            )}
            {lead.email && (
              <p className="flex items-start gap-2">
                <FaEnvelope className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="break-all">{lead.email}</span>
              </p>
            )}
            {lead.secondo_numero && (
              <p className="flex items-start gap-2">
                <FaPhone className="text-gray-400 mt-0.5 flex-shrink-0" />
                <span>{lead.secondo_numero}</span>
              </p>
            )}
          </div>
        )}

        {/* Azioni - Mobile Responsive */}
        {!isArchiviato && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium self-start"
              >
                {isExpanded ? "Nascondi dettagli ▲" : "Mostra dettagli ▼"}
              </button>

              <button
                onClick={handleElimina}
                disabled={isUpdating}
                className="text-xs text-red-600 hover:text-red-800 font-medium self-start sm:ml-auto"
              >
                Elimina
              </button>
            </div>

            {/* Cambio Stato con Select - Mobile Responsive */}
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 space-y-3">
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                📊 Cambia Stato Lead
              </label>
              
              <select
                value={nuovoStato}
                onChange={(e) => {
                  setNuovoStato(e.target.value);
                  if (e.target.value === "da_richiamare") {
                    setMostraDataRichiamo(true);
                  } else {
                    setMostraDataRichiamo(false);
                  }
                }}
                className="w-full border-2 border-gray-300 rounded-lg px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUpdating}
              >
                <option value="in_lavorazione">🔵 In Lavorazione</option>
                <option value="da_richiamare">📅 Da Richiamare</option>
                <option value="non_interessato">❌ Non Interessato</option>
                <option value="completato">✅ Completato</option>
              </select>

              {/* Campo data se seleziona "da_richiamare" - Mobile Responsive */}
              {(nuovoStato === "da_richiamare" || mostraDataRichiamo) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <label className="text-xs md:text-sm font-medium text-gray-700">
                    Data richiamo:
                  </label>
                  <input
                    type="date"
                    value={dataRicontatto}
                    onChange={(e) => setDataRicontatto(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    disabled={isUpdating}
                  />
                </div>
              )}

              {/* Pulsante Salva - Mobile Responsive */}
              {(nuovoStato !== lead.stato_attuale || (nuovoStato === "da_richiamare" && dataRicontatto && dataRicontatto !== (lead.data_richiamo ? new Date(lead.data_richiamo).toISOString().split('T')[0] : ""))) && (
                <button
                  onClick={handleCambioStato}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 text-xs md:text-sm"
                >
                  {isUpdating ? "Salvataggio..." : "💾 Salva Nuovo Stato"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

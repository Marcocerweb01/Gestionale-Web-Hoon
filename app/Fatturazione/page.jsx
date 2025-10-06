"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const FatturazionePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meseSelezionato, setMeseSelezionato] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTotale, setEditingTotale] = useState("");

  // Genera il mese corrente in formato YYYY-MM
  const getMeseCorrente = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Genera lista ultimi 12 mesi
  const getUltimiMesi = () => {
    const mesi = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mese = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      mesi.push(mese);
    }
    return mesi;
  };

  // Formatta mese da YYYY-MM a "Mese Anno"
  const formatMese = (mese) => {
    const [anno, meseNum] = mese.split('-');
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${mesi[parseInt(meseNum) - 1]} ${anno}`;
  };

  useEffect(() => {
    if (status === "loading") return; // Aspetta che la sessione sia caricata
    
    if (status === "unauthenticated") {
      router.push("/Login");
      return;
    }
    
    if (session?.user?.role !== "amministratore") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  useEffect(() => {
    setMeseSelezionato(getMeseCorrente());
  }, []);

  useEffect(() => {
    if (meseSelezionato) {
      fetchFatture();
    }
  }, [meseSelezionato]);

  const fetchFatture = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fatturazione?mese=${meseSelezionato}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle fatture");
      }
      const data = await response.json();
      setFatture(data);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare le fatture.");
    } finally {
      setLoading(false);
    }
  };

  const generaFattureMensili = async () => {
    try {
      const conferma = window.confirm(
        `Vuoi generare le fatture per ${formatMese(meseSelezionato)}?\n\nVerranno create le fatture per tutti i collaboratori attivi.`
      );
      
      if (!conferma) return;

      console.log('🚀 Inizio generazione fatture per mese:', meseSelezionato);

      // Aggiungi timeout di 30 secondi
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch('/api/fatturazione/genera_mensili', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mese: meseSelezionato }),
          credentials: 'include',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Errore dalla risposta:', errorText);
          alert(`❌ Errore ${response.status}: ${errorText}`);
          return;
        }

        const result = await response.json();
        console.log('✅ Risultato:', result);

        alert(`✅ ${result.fatture_create} fatture create!\n${result.fatture_esistenti > 0 ? `⚠️ ${result.fatture_esistenti} già esistenti` : ''}`);
        fetchFatture();
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('⏱️ Timeout: la richiesta ha impiegato troppo tempo');
          alert('⏱️ Timeout: la richiesta ha impiegato troppo tempo (>30s)');
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error("❌ Errore completo:", err);
      alert(`Errore durante la generazione delle fatture: ${err.message}`);
    }
  };

  const generaTutteLeFattureMancanti = async () => {
    try {
      const conferma = window.confirm(
        `Vuoi generare le fatture per il mese corrente?\n\nVerranno create le fatture per tutti i collaboratori attivi.`
      );
      
      if (!conferma) return;

      // Genera solo per il mese corrente
      const dataCorrente = new Date();
      const anno = dataCorrente.getFullYear();
      const mese = String(dataCorrente.getMonth() + 1).padStart(2, '0');
      const meseCorrente = `${anno}-${mese}`;

      const response = await fetch('/api/fatturazione/genera_mensili', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mese: meseCorrente }),
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Completato!\n\n${result.fatture_create} fatture create\n${result.fatture_esistenti} già esistenti`);
        fetchFatture();
      } else {
        alert("❌ Errore durante la generazione");
      }
    } catch (err) {
      alert(`❌ Errore: ${err.message}`);
    }
  };

  const resetTutteLeFatture = async () => {
    try {
      const conferma = window.confirm(
        `⚠️ ATTENZIONE!\n\nSei sicuro di voler ELIMINARE TUTTE le fatture?\n\nQuesta operazione è IRREVERSIBILE!`
      );
      
      if (!conferma) return;

      const secondaConferma = window.confirm(
        `🚨 ULTIMA CONFERMA\n\nConfermi di voler eliminare TUTTE le fatture dal database?`
      );

      if (!secondaConferma) return;

      const response = await fetch('/api/fatturazione/reset', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Reset completato!\n\n${result.fatture_eliminate} fatture eliminate`);
        fetchFatture();
      } else {
        alert("❌ Errore durante il reset");
      }
    } catch (err) {
      alert(`❌ Errore: ${err.message}`);
    }
  };

  const handleEditTotale = (fatturaId, totaleAttuale) => {
    setEditingId(fatturaId);
    setEditingTotale(totaleAttuale || "");
  };

  const handleSaveTotale = async (fatturaId) => {
    try {
      const totaleNumerico = parseFloat(editingTotale);
      
      if (isNaN(totaleNumerico) || totaleNumerico < 0) {
        alert("Inserisci un importo valido");
        return;
      }

      const response = await fetch(`/api/fatturazione/${fatturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totale: totaleNumerico })
      });

      if (response.ok) {
        setEditingId(null);
        setEditingTotale("");
        fetchFatture();
      } else {
        alert("Errore durante il salvataggio");
      }
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore durante il salvataggio");
    }
  };

  const handleToggleStatoPagamento = async (fatturaId, statoAttuale) => {
    try {
      const nuovoStato = statoAttuale === "non pagata" ? "pagata" : "non pagata";
      
      const response = await fetch(`/api/fatturazione/${fatturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statoAmministratore: nuovoStato })
      });

      if (response.ok) {
        fetchFatture();
      } else {
        alert("Errore durante l'aggiornamento dello stato");
      }
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  if (session?.user?.role !== "amministratore") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Gestione Fatturazione</h1>
            <div className="flex flex-col sm:flex-row gap-3">
        
              <button
                onClick={generaFattureMensili}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                📅 Genera Fatture Mese Selezionato
              </button>
            </div>
          </div>

          {/* Filtro Mese */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleziona Mese
            </label>
            <select
              value={meseSelezionato}
              onChange={(e) => setMeseSelezionato(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {getUltimiMesi().map((mese) => (
                <option key={mese} value={mese}>
                  {formatMese(mese)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabella Fatture */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collaboratore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mese
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totale Fattura (€)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato Emissione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fatture.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      Nessuna fattura trovata per questo mese.
                      <br />
                      <button
                        onClick={generaFattureMensili}
                        className="mt-4 text-blue-600 hover:text-blue-800 underline"
                      >
                        Genera le fatture per {formatMese(meseSelezionato)}
                      </button>
                    </td>
                  </tr>
                ) : (
                  fatture.map((fattura) => (
                    <tr key={fattura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {fattura.collaboratoreNome} {fattura.collaboratoreCognome}
                        </div>
                        <div className="text-sm text-gray-500">{fattura.collaboratoreEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatMese(fattura.mese)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === fattura.id ? (
                          <input
                            type="number"
                            value={editingTotale}
                            onChange={(e) => setEditingTotale(e.target.value)}
                            className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {fattura.totale !== null ? `€ ${fattura.totale.toFixed(2)}` : "Non compilato"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            fattura.statoCollaboratore === "emessa"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {fattura.statoCollaboratore}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatoPagamento(fattura.id, fattura.statoAmministratore)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                            fattura.statoAmministratore === "pagata"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {fattura.statoAmministratore}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingId === fattura.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveTotale(fattura.id)}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Salva
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditingTotale("");
                              }}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditTotale(fattura.id, fattura.totale)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Modifica Totale
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Legenda */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Istruzioni:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Clicca "Genera Fatture Mese" per creare le fatture di tutti i collaboratori attivi</li>
              <li>• Inserisci il totale della fattura per ogni collaboratore</li>
              <li>• Lo stato "emessa" viene aggiornato dal collaboratore sul suo profilo</li>
              <li>• Clicca sullo stato pagamento per cambiarlo da "non pagata" a "pagata"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FatturazionePage;

'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";

const PagamentiTable = () => {
  const [pagamenti, setPagamenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [checkedPagamenti, setCheckedPagamenti] = useState({});
  const [initialCheckedPagamenti, setInitialCheckedPagamenti] = useState({});
  const [filtro, setFiltro] = useState("tutti"); // filtro di esclusione (tutti, pagati, nonpagati, ragazzi)
  const [ordinamento, setOrdinamento] = useState("alfabetico"); // ordinamento (alfabetico, collaboratore)
  const [searchTerm, setSearchTerm] = useState(""); // nuovo stato per la ricerca
  const [meseSelezionato, setMeseSelezionato] = useState(""); // Mese/anno selezionato
  
  // Stati per il modal configurazione ragazzi
  const [showModalRagazzi, setShowModalRagazzi] = useState(false);
  const [aziendeRagazzi, setAziendeRagazzi] = useState([]);
  const [tutteAziende, setTutteAziende] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [searchAzienda, setSearchAzienda] = useState("");

  // Genera il mese corrente in formato YYYY-MM
  const getMeseCorrente = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Genera lista ultimi 24 mesi
  const getUltimiMesi = () => {
    const mesi = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const data = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const valore = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const etichetta = data.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      mesi.push({ valore, etichetta });
    }
    return mesi;
  };

  // Inizializza con il mese corrente
  useEffect(() => {
    if (!meseSelezionato) {
      setMeseSelezionato(getMeseCorrente());
    }
  }, []);

  useEffect(() => {
    if (!meseSelezionato) return;
    
    setLoading(true);
    fetch(`/api/pagamenti?mese=${meseSelezionato}`)
      .then((res) => res.json())
      .then((data) => {
        // Rimuovi duplicati mantenendo solo il record più recente per cliente
        const pagamentiUnivoci = {};
        
        data.forEach((pagamento) => {
          const cliente = pagamento.cliente;
          const id = pagamento.id || pagamento._id;
          
          if (!pagamentiUnivoci[cliente]) {
            pagamentiUnivoci[cliente] = pagamento;
          } else {
            // Se esiste già, mantieni quello con ID più recente (stringa più grande)
            if (id > (pagamentiUnivoci[cliente].id || pagamentiUnivoci[cliente]._id)) {
              pagamentiUnivoci[cliente] = pagamento;
            }
          }
        });
        
        // Converti l'oggetto in array
        const pagamentiFiltrati = Object.values(pagamentiUnivoci);
        
        console.log(`Ridotti da ${data.length} a ${pagamentiFiltrati.length} pagamenti`);
        
        setPagamenti(pagamentiFiltrati);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [meseSelezionato]);

  const handleStatusChange = (id, status) => {
    setCheckedPagamenti((prev) => ({ ...prev, [id]: status }));
  };

  // Funzione per aprire il modal e caricare la configurazione
  const apriModalRagazzi = async () => {
    setShowModalRagazzi(true);
    setLoadingConfig(true);
    
    try {
      const response = await fetch('/api/configurazione-ragazzi');
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Dati configurazione ricevuti:", data);
        setAziendeRagazzi(data.aziende_ragazzi || []);
        setTutteAziende(data.tutte_aziende || []);
        console.log(`✅ ${data.aziende_ragazzi?.length || 0} aziende con stato ragazzi`);
      } else {
        const error = await response.json();
        console.error("Errore response:", error);
        alert("Errore nel caricamento della configurazione: " + error.error);
      }
    } catch (error) {
      console.error("Errore caricamento configurazione:", error);
      alert("Errore nel caricamento della configurazione");
    } finally {
      setLoadingConfig(false);
    }
  };

  // Funzione per salvare la configurazione
  const salvaConfigurazioneRagazzi = async () => {
    setLoadingConfig(true);
    
    try {
      const response = await fetch('/api/configurazione-ragazzi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aziende_ragazzi: aziendeRagazzi.map(a => a._id)
        })
      });
      
      if (response.ok) {
        alert("✅ Configurazione salvata con successo!");
        setShowModalRagazzi(false);
      } else {
        alert("❌ Errore nel salvataggio");
      }
    } catch (error) {
      console.error("Errore salvataggio:", error);
      alert("❌ Errore nel salvataggio");
    } finally {
      setLoadingConfig(false);
    }
  };

  // Funzione per aggiungere un'azienda alla lista ragazzi
  const aggiungiAzienda = (azienda) => {
    if (!aziendeRagazzi.find(a => a._id === azienda._id)) {
      setAziendeRagazzi([...aziendeRagazzi, azienda]);
    }
  };

  // Funzione per rimuovere un'azienda dalla lista ragazzi
  const rimuoviAzienda = (aziendaId) => {
    setAziendeRagazzi(aziendeRagazzi.filter(a => a._id !== aziendaId));
  };

  // Filtraggio per ricerca in tempo reale ed esclusione collaboratore Hoon Web
  let pagamentiFiltrati = pagamenti.filter((pagamento) => {
    // Escludi il collaboratore Hoon Web (per nome completo o parziale)
    const collaboratoreNome = (pagamento.collaboratore || "").toLowerCase();
    if (collaboratoreNome.includes("hoon web") || 
        collaboratoreNome.includes("hoon") ||
        pagamento.collaboratore_id === "686be44dc04a68e29f1770f3") {
      return false;
    }
    
    if (!searchTerm) return true;
    
    const cliente = (pagamento.cliente || "").toLowerCase();
    const ragioneSociale = (pagamento.ragione_sociale || "").toLowerCase();
    const collaboratore = (pagamento.collaboratore || "").toLowerCase();
    const termineRicerca = searchTerm.toLowerCase();
    
    return cliente.includes(termineRicerca) || 
           ragioneSociale.includes(termineRicerca) || 
           collaboratore.includes(termineRicerca);
  });

  // Filtraggio per stato (esclusione)
  if (filtro === "pagati") {
    pagamentiFiltrati = pagamentiFiltrati.filter((p) => p.stato === "si");
  } else if (filtro === "nonpagati") {
    pagamentiFiltrati = pagamentiFiltrati.filter((p) => p.stato === "no");
  } else if (filtro === "ragazzi") {
    pagamentiFiltrati = pagamentiFiltrati.filter((p) => p.stato === "ragazzi");
  }

  // Ordinamento
  let pagamentiOrdinati = [...pagamentiFiltrati];
  if (ordinamento === "alfabetico") {
    pagamentiOrdinati.sort((a, b) => {
      if ((a.cliente || "") < (b.cliente || "")) return -1;
      if ((a.cliente || "") > (b.cliente || "")) return 1;
      return 0;
    });
  } else if (ordinamento === "collaboratore") {
    pagamentiOrdinati.sort((a, b) => {
      if ((a.collaboratore || "") < (b.collaboratore || "")) return -1;
      if ((a.collaboratore || "") > (b.collaboratore || "")) return 1;
      return 0;
    });
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Caricamento pagamenti...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Selettore Mese/Anno */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            📅 Visualizza mese:
          </label>
          <select
            value={meseSelezionato}
            onChange={(e) => setMeseSelezionato(e.target.value)}
            className="flex-1 max-w-xs border-2 border-blue-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {getUltimiMesi().map(({ valore, etichetta }) => (
              <option key={valore} value={valore}>
                {etichetta}
              </option>
            ))}
          </select>
          {meseSelezionato !== getMeseCorrente() && (
            <button
              onClick={() => setMeseSelezionato(getMeseCorrente())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-all"
            >
              📍 Torna a Oggi
            </button>
          )}
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ordina per:</h3>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                ordinamento === "alfabetico" 
                  ? "bg-cyan-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setOrdinamento("alfabetico")}
            >
              📝 Alfabetico Aziende
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                ordinamento === "collaboratore" 
                  ? "bg-blue-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setOrdinamento("collaboratore")}
            >
              👤 Alfabetico Collaboratore
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Filtra per stato:</h3>
          <div className="flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === "tutti" 
                  ? "bg-gray-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setFiltro("tutti")}
            >
              🔄 Tutti
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === "pagati" 
                  ? "bg-green-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setFiltro("pagati")}
            >
              ✅ Solo Pagati
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === "nonpagati" 
                  ? "bg-red-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setFiltro("nonpagati")}
            >
              ❌ Solo Non Pagati
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtro === "ragazzi" 
                  ? "bg-purple-500 text-white shadow-md" 
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
              onClick={() => setFiltro("ragazzi")}
            >
              👥 Solo Ragazzi
            </button>
          </div>
        </div>
      </div>

      {/* Azioni */}
      <div className="flex justify-between gap-3">
        {/* Barra di Ricerca */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex-1">
        <div className="flex items-center gap-4">
            <label htmlFor="search" className="flex items-center justify-center text-lg font-medium text-gray-700">
              🔍
            </label>
            <input
              id="search"
              type="text"
              placeholder="Digita il nome del cliente o la ragione sociale..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
         
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cancella ricerca"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            📊 {pagamentiOrdinati.length} risultat{pagamentiOrdinati.length === 1 ? 'o' : 'i'} per &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
      {/*bottone edit*/}
        {!editMode ? (
          <div className="flex gap-3">
          <button
            className="btn-editpayments"
            onClick={() => {
              const initialChecked = {};
              // Usa l'array originale NON ordinato per evitare inconsistenze
              pagamenti.forEach((p) => {
                // Assicurati che ogni pagamento abbia un valore definito
                const id = p.id || p._id;
                initialChecked[id] = p.stato || "no";
              });
              setCheckedPagamenti(initialChecked);
              setInitialCheckedPagamenti(initialChecked);
              setEditMode(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifica Pagamenti
          </button>
          <button
            className="btn-editpayments"
            onClick={apriModalRagazzi}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
             Pagamenti Ragazzi
          </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              className="btn-success"
              onClick={async () => {
                setLoading(true);
                const today = new Date().toISOString().slice(0, 10);
                const updates = pagamenti
                  .filter((p) => {
                    const id = p.id || p._id;
                    const currentStatus = checkedPagamenti[id];
                    const originalStatus = initialCheckedPagamenti[id];
                    
                    // Solo se entrambi sono definiti e diversi
                    return currentStatus !== undefined && 
                           originalStatus !== undefined && 
                           currentStatus !== originalStatus;
                  })
                  .map((p) => {
                    const id = p.id || p._id;
                    const newStatus = checkedPagamenti[id];
                    let updateData = { stato: newStatus };
                    
                    if (newStatus === "si") {
                      updateData.data_pagato = today;
                    } else {
                      updateData.data_pagato = null;
                    }
                    
                    return fetch(`/api/pagamenti/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updateData),
                    });
                  });
                await Promise.all(updates);
                setEditMode(false);
                setCheckedPagamenti({});
                setInitialCheckedPagamenti({});
                fetch(`/api/pagamenti?mese=${meseSelezionato}`)
                  .then((res) => res.json())
                  .then((data) => {
                    setPagamenti(data);
                    setLoading(false);
                  });
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salva Modifiche
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditMode(false);
                setCheckedPagamenti({});
                setInitialCheckedPagamenti({});
              }}
            >
              Annulla
            </button>
          </div>
        )}
      </div>

      {/* Statistiche Mese */}
      {!loading && pagamenti.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 Statistiche del mese</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{pagamenti.length}</div>
              <div className="text-xs text-gray-600 mt-1">Totale Clienti</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {pagamenti.filter(p => p.stato === "si").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">✅ Pagati</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {pagamenti.filter(p => p.stato === "no").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">❌ Non Pagati</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">
                {pagamenti.filter(p => p.stato === "ragazzi").length}
              </div>
              <div className="text-xs text-gray-600 mt-1">👥 Ragazzi</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabella */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ragione Sociale</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Collaboratore</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Fattura</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Pagamento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                {editMode && <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Stato</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagamentiOrdinati.length === 0 ? (
                <tr>
                  <td colSpan={editMode ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <div className="text-4xl mb-2">🔍</div>
                        <div className="text-lg font-medium">Nessun risultato trovato</div>
                        <div className="text-sm">Prova a modificare i termini di ricerca</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📄</div>
                        <div className="text-lg font-medium">Nessun pagamento disponibile</div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                pagamentiOrdinati.map((p) => (
                <tr key={p.id || p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {p.cliente_id ? (
                      <Link 
                        href={`/User/${p.cliente_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {p.cliente || "N/A"}
                      </Link>
                    ) : (
                      <span>{p.cliente || "N/A"}</span>
                    )}
                    {p.data_fattura && (
                      <div className="text-xs text-gray-500 mt-1">
                        Fattura: {new Date(p.data_fattura).toLocaleDateString('it-IT')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {p.ragione_sociale || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {p.collaboratore_id ? (
                      <Link 
                        href={`/User/${p.collaboratore_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {p.collaboratore || "N/A"}
                      </Link>
                    ) : (
                      <span>{p.collaboratore || "N/A"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.data_fattura ? new Date(p.data_fattura).toLocaleDateString('it-IT') : "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.data_pagato ? new Date(p.data_pagato).toLocaleDateString('it-IT') : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      p.stato === "si" 
                        ? "bg-green-100 text-green-800" 
                        : p.stato === "ragazzi"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {p.stato === "si" ? "✅ Pagato" : 
                       p.stato === "ragazzi" ? "👥 Ragazzi" : 
                       "❌ Non pagato"}
                    </span>
                  </td>
                  {editMode && (
                    <td className="px-6 py-4 text-center">
                      <select
                        value={checkedPagamenti[p.id || p._id] !== undefined ? checkedPagamenti[p.id || p._id] : (p.stato || "no")}
                        onChange={(e) => handleStatusChange(p.id || p._id, e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="no">❌ Non pagato</option>
                        <option value="si">✅ Pagato</option>
                        <option value="ragazzi">👥 Ragazzi</option>
                      </select>
                    </td>
                  )}
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Configurazione Ragazzi */}
      {showModalRagazzi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    👥 Configurazione Stato "Ragazzi"
                  </h2>
                  <p className="text-purple-100 mt-1 text-sm">
                    Gestisci quali clienti avranno automaticamente lo stato "Ragazzi" nei pagamenti mensili
                  </p>
                </div>
                <button
                  onClick={() => setShowModalRagazzi(false)}
                  className="text-white hover:bg-purple-500 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {loadingConfig ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lista Aziende con stato Ragazzi */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {aziendeRagazzi.length}
                      </span>
                      Clienti con stato "Ragazzi"
                    </h3>
                    <div className="space-y-2 bg-purple-50 rounded-lg p-4 border-2 border-purple-200 min-h-[400px]">
                      {aziendeRagazzi.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nessun cliente configurato</p>
                      ) : (
                        aziendeRagazzi.map((azienda) => (
                          <div
                            key={azienda._id}
                            className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{azienda.etichetta}</p>
                              {azienda.ragioneSociale && (
                                <p className="text-xs text-gray-500">{azienda.ragioneSociale}</p>
                              )}
                            </div>
                            <button
                              onClick={() => rimuoviAzienda(azienda._id)}
                              className="text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"
                              title="Rimuovi"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Tutte le Aziende disponibili */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tutti i Clienti
                    </h3>
                    
                    {/* Ricerca */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder="🔍 Cerca cliente..."
                        value={searchAzienda}
                        onChange={(e) => setSearchAzienda(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2 bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[400px] overflow-y-auto">
                      {tutteAziende
                        .filter((azienda) => {
                          if (!searchAzienda) return true;
                          const search = searchAzienda.toLowerCase();
                          return (
                            azienda.etichetta?.toLowerCase().includes(search) ||
                            azienda.ragioneSociale?.toLowerCase().includes(search)
                          );
                        })
                        .map((azienda) => {
                          const isInRagazzi = aziendeRagazzi.find(a => a._id === azienda._id);
                          
                          return (
                            <div
                              key={azienda._id}
                              className={`bg-white rounded-lg p-3 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow ${
                                isInRagazzi ? 'opacity-50' : ''
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{azienda.etichetta}</p>
                                {azienda.ragioneSociale && (
                                  <p className="text-xs text-gray-500">{azienda.ragioneSociale}</p>
                                )}
                              </div>
                              <button
                                onClick={() => aggiungiAzienda(azienda)}
                                disabled={isInRagazzi}
                                className={`${
                                  isInRagazzi
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-green-600 hover:bg-green-50'
                                } rounded-lg p-2 transition-colors`}
                                title={isInRagazzi ? 'Già aggiunto' : 'Aggiungi'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <p className="text-sm text-gray-600">
                💡 I clienti selezionati avranno automaticamente lo stato "Ragazzi" nei pagamenti generati
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModalRagazzi(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={salvaConfigurazioneRagazzi}
                  disabled={loadingConfig}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingConfig ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Salva Configurazione
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagamentiTable;
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const AziendaCollab = ({ aziendaId }) => {
  const { data: session } = useSession();
  const canDelete = session?.user?.role === "amministratore";
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]); // Lista dei collaboratori
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [collaboratoreSearch, setCollaboratoreSearch] = useState(""); // Ricerca collaboratore
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false); // Mostra dropdown collaboratori
  const collaboratoreDropdownRef = useRef(null); // Ref per il dropdown collaboratori

  // Stato per la gestione post
  const [editingPostRow, setEditingPostRow] = useState(null);
  const [tempPostData, setTempPostData] = useState({});
  const [savingPost, setSavingPost] = useState(false);

  // Funzione per recuperare le collaborazioni dell'azienda
  const fetchCollaborazioni = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/clienti/${aziendaId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setCollaborazioni(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare le collaborazioni.");
    } finally {
      setLoading(false);
    }
  };

  // Funzione per recuperare la lista dei collaboratori
  const fetchCollaboratori = async () => {
    try {
      const response = await fetch(`/api/lista_collaboratori`);
      if (!response.ok) {
        throw new Error("Errore nel recupero dei collaboratori");
      }
      const result = await response.json();
      setCollaboratori(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i collaboratori.");
    }
  };

  // Recupera le collaborazioni e i collaboratori al caricamento del componente
  useEffect(() => {
    fetchCollaborazioni();
    fetchCollaboratori();
  }, [aziendaId]); // Solo aziendaId come dipendenza per evitare loop infiniti

  // Gestione modifica
  const handleEditClick = (rowId) => {
    setEditingRow(rowId);
    const rowData = collaborazioni.find((row) => row.id === rowId);
    setTempData({ ...rowData });
    setCollaboratoreSearch(""); // Resetta la ricerca
  };
  // Funzione per eliminare una collaborazione
const handleDelete = async (rowId) => {
  try {
    const response = await fetch(`/api/collaborazioni/delete/${rowId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Errore durante l'eliminazione della collaborazione");
    }

    console.log("Collaborazione eliminata con successo!");

    // Aggiorna la lista delle collaborazioni
    await fetchCollaborazioni();
  } catch (err) {
    console.error("Errore:", err);
    setError("Non è stato possibile eliminare la collaborazione.");
  }
};
  // Salva modifiche
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/edit-cliente/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collaboratoreId: tempData.collaboratoreId, // Solo il collaboratore viene aggiornato
        }),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }

      console.log("Modifica salvata con successo!");

      // Aggiorna la lista delle collaborazioni
      await fetchCollaborazioni();

      // Resetta lo stato di modifica
      setEditingRow(null);
      setTempData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare la collaborazione.");
    }
  };

  // Filtra i collaboratori in base alla ricerca
  const filteredCollaboratori = collaboratori.filter((collab) =>
    `${collab.nome} ${collab.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );

  // Helper per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Gestione modifica post
  const handleEditPostClick = (rowId) => {
    const rowData = collaborazioni.find((row) => row.id === rowId);
    setEditingPostRow(rowId);
    setTempPostData({
      appuntamenti: rowData.appuntamenti || 0,
      postIg_fb: rowData.postIg_fb || 0,
      postTiktok: rowData.postTiktok || 0,
      postLinkedin: rowData.postLinkedin || 0,
      post_totali_previsti: rowData.post_totali_previsti || 0,
      appuntamenti_totali_previsti: rowData.appuntamenti_totali_previsti || 0,
      durata_contratto: rowData.durata_contratto || '',
      data_inizio_contratto: rowData.data_inizio_contratto ? new Date(rowData.data_inizio_contratto).toISOString().split('T')[0] : '',
      data_fine_contratto: rowData.data_fine_contratto ? new Date(rowData.data_fine_contratto).toISOString().split('T')[0] : '',
    });
  };

  const handlePostIncrement = (field) => {
    setTempPostData((prev) => ({ ...prev, [field]: (prev[field] || 0) + 1 }));
  };

  const handlePostDecrement = (field) => {
    setTempPostData((prev) => ({ ...prev, [field]: Math.max(0, (prev[field] || 0) - 1) }));
  };

  const handlePostSave = async () => {
    if (savingPost) return;
    setSavingPost(true);
    try {
      const payload = {
        numero_appuntamenti: tempPostData.appuntamenti,
        post_ig_fb: tempPostData.postIg_fb,
        post_tiktok: tempPostData.postTiktok,
        post_linkedin: tempPostData.postLinkedin,
        post_totali_previsti: tempPostData.post_totali_previsti,
        appuntamenti_totali_previsti: tempPostData.appuntamenti_totali_previsti,
        durata_contratto: tempPostData.durata_contratto || null,
        data_inizio_contratto: tempPostData.data_inizio_contratto || null,
        data_fine_contratto: tempPostData.data_fine_contratto || null,
      };
      const response = await fetch(`/api/collaborazioni/adminedit/${editingPostRow}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Errore durante l'aggiornamento");
      await fetchCollaborazioni();
      setEditingPostRow(null);
      setTempPostData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare i dati.");
    } finally {
      setSavingPost(false);
    }
  };

  // Gestione click fuori dal dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collaboratoreDropdownRef.current && !collaboratoreDropdownRef.current.contains(event.target)) {
        setShowCollaboratoriDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Caricamento collaborazioni...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-2">⚠️</span>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header della sezione */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">🤝</span>
        <h3 className="text-lg font-semibold text-gray-900">Collaboratori Assegnati</h3>
      </div>

      {/* Tabella con design moderno - ✨ Rimosso overflow-hidden per permettere dropdown */}
      <div className="overflow-x-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Collaboratore</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
          {collaborazioni.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap relative">
                {editingRow === row.id ? (
                  <div className="relative" ref={collaboratoreDropdownRef}>
                    <input
                      type="text"
                      value={collaboratoreSearch}
                      onChange={(e) => {
                        setCollaboratoreSearch(e.target.value);
                        setShowCollaboratoriDropdown(true);
                      }}
                      onFocus={() => setShowCollaboratoriDropdown(true)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="Cerca collaboratore..."
                    />
                    {showCollaboratoriDropdown && (
                      <>
                        {/* Backdrop per chiudere cliccando fuori */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowCollaboratoriDropdown(false)}
                        />
                        {/* Dropdown che appare sopra tutto */}
                        <div className="fixed z-50 bg-white border-2 border-blue-400 rounded-lg shadow-2xl max-h-60 overflow-auto min-w-[300px]"
                          style={{
                            top: collaboratoreDropdownRef.current?.getBoundingClientRect().bottom + 4,
                            left: collaboratoreDropdownRef.current?.getBoundingClientRect().left,
                            width: collaboratoreDropdownRef.current?.getBoundingClientRect().width
                          }}
                        >
                          {filteredCollaboratori.length > 0 ? (
                            filteredCollaboratori.map((collaboratore) => (
                              <div
                                key={collaboratore.id}
                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                onClick={() => {
                                  setTempData((prev) => ({
                                    ...prev,
                                    collaboratoreId: collaboratore.id,
                                  }));
                                  setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
                                  setShowCollaboratoriDropdown(false);
                                }}
                              >
                                <div className="font-medium text-gray-900">
                                  {`${collaboratore.nome} ${collaboratore.cognome}`}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500 text-center">Nessun collaboratore trovato</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    <a
                      href={`/User/${row.collaboratoreId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {`${row.collaboratorenome} ${row.collaboratorecognome}`}
                    </a>
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {editingRow === row.id ? (
                    <>
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                      >
                        ✅ Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingRow(null);
                          setCollaboratoreSearch("");
                          setShowCollaboratoriDropdown(false);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                      >
                        ❌ Annulla
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(row.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                      >
                        ✏️ Modifica
                      </button>
                      {canDelete && (
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                      >
                        🗑️ Elimina
                      </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>

    {/* Messaggio se non ci sono dati */}
    {collaborazioni.length === 0 && (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <span className="text-xl">🤝</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun collaboratore assegnato</h3>
        <p className="text-gray-500">Non ci sono ancora collaboratori assegnati a questa azienda.</p>
      </div>
    )}

    {/* Sezione Gestione Post */}
    {collaborazioni.length > 0 && (
      <div className="mt-6 space-y-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-xl">📊</span>
          <h3 className="text-lg font-semibold text-gray-900">Gestione Post per Collaborazione</h3>
        </div>
        {collaborazioni.map((row) => (
          <div key={row.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600">👤</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {row.collaboratorenome} {row.collaboratorecognome}
                    </h4>
                    {row.durata_contratto && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        ⏱️ {row.durata_contratto}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingPostRow !== row.id ? (
                    <button
                      onClick={() => handleEditPostClick(row.id)}
                      disabled={editingPostRow !== null}
                      className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✏️ Modifica Post
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handlePostSave}
                        disabled={savingPost}
                        className={`inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation ${savingPost ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {savingPost ? <><span className="animate-spin mr-2">⏳</span>Salvataggio...</> : <>✅ Salva</>}
                      </button>
                      <button
                        onClick={() => { setEditingPostRow(null); setTempPostData({}); }}
                        disabled={savingPost}
                        className="inline-flex items-center px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation disabled:opacity-50"
                      >
                        ❌ Annulla
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Body Card */}
            <div className="p-4">
              {/* Totali Generali */}
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                <h5 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                  <span className="mr-2">📊</span> Totali Generali (Previsti nel Contratto)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Post Previsti</p>
                    {editingPostRow === row.id ? (
                      <input
                        type="number"
                        min="0"
                        value={tempPostData.post_totali_previsti}
                        onChange={(e) => setTempPostData(prev => ({ ...prev, post_totali_previsti: Math.max(0, Number(e.target.value)) }))}
                        className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-xl font-bold text-purple-600">{row.post_totali_previsti || 0}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">App. Previsti</p>
                    {editingPostRow === row.id ? (
                      <input
                        type="number"
                        min="0"
                        value={tempPostData.appuntamenti_totali_previsti}
                        onChange={(e) => setTempPostData(prev => ({ ...prev, appuntamenti_totali_previsti: Math.max(0, Number(e.target.value)) }))}
                        className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-xl font-bold text-purple-600">{row.appuntamenti_totali_previsti || 0}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Inizio</p>
                    {editingPostRow === row.id ? (
                      <input
                        type="date"
                        value={tempPostData.data_inizio_contratto}
                        onChange={(e) => setTempPostData(prev => ({ ...prev, data_inizio_contratto: e.target.value }))}
                        className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-700">{formatDate(row.data_inizio_contratto)}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase">Fine</p>
                    {editingPostRow === row.id ? (
                      <input
                        type="date"
                        value={tempPostData.data_fine_contratto}
                        onChange={(e) => setTempPostData(prev => ({ ...prev, data_fine_contratto: e.target.value }))}
                        className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-700">{formatDate(row.data_fine_contratto)}</p>
                    )}
                  </div>
                </div>
                {editingPostRow === row.id && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 uppercase mb-1">Durata Contratto</p>
                    <select
                      value={tempPostData.durata_contratto}
                      onChange={(e) => setTempPostData(prev => ({ ...prev, durata_contratto: e.target.value }))}
                      className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Seleziona durata...</option>
                      <option value="1 mese">1 mese</option>
                      <option value="3 mesi">3 mesi</option>
                      <option value="6 mesi">6 mesi</option>
                      <option value="1 anno">1 anno</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Dati Mensili */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { key: "appuntamenti", label: "Appuntamenti", emoji: "📅", color: "text-blue-600" },
                  { key: "postIg_fb", label: "IG & FB", emoji: "📸", color: "text-pink-600" },
                  { key: "postTiktok", label: "TikTok", emoji: "🎵", color: "text-gray-900" },
                  { key: "postLinkedin", label: "LinkedIn", emoji: "💼", color: "text-blue-700" },
                ].map(({ key, label, emoji, color }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-2">{emoji} {label}</p>
                    {editingPostRow === row.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handlePostDecrement(key)}
                          disabled={savingPost}
                          className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold text-lg">{tempPostData[key]}</span>
                        <button
                          onClick={() => handlePostIncrement(key)}
                          disabled={savingPost}
                          className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <p className={`text-2xl font-bold ${color}`}>{row[key] || 0}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  );
};

export default AziendaCollab;
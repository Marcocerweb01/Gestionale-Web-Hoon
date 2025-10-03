"use client";

import React, { useState, useEffect, useRef } from "react";

const AziendaCollab = ({ aziendaId }) => {
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]); // Lista dei collaboratori
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [collaboratoreSearch, setCollaboratoreSearch] = useState(""); // Ricerca collaboratore
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false); // Mostra dropdown collaboratori
  const collaboratoreDropdownRef = useRef(null); // Ref per il dropdown collaboratori

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
  }, [aziendaId, fetchCollaborazioni]); // ✨ Fix: aggiungi fetchCollaborazioni alle dipendenze

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

      {/* Tabella con design moderno */}
      <div className="overflow-x-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
              <td className="px-4 py-4 whitespace-nowrap">
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
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCollaboratori.length > 0 ? (
                          filteredCollaboratori.map((collaboratore) => (
                            <div
                              key={collaboratore.id}
                              className="p-2 hover:bg-blue-100 cursor-pointer"
                              onClick={() => {
                                setTempData((prev) => ({
                                  ...prev,
                                  collaboratoreId: collaboratore.id,
                                }));
                                setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
                                setShowCollaboratoriDropdown(false);
                              }}
                            >
                              {`${collaboratore.nome} ${collaboratore.cognome}`}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">Nessun collaboratore trovato</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-medium text-gray-900">
                    {`${row.collaboratorenome} ${row.collaboratorecognome}`}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  {editingRow === row.id ? (
                    <button
                      onClick={handleSave}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                    >
                      ✅ Salva
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                    >
                      ✏️ Modifica
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                  >
                    🗑️ Elimina
                  </button>
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
    </div>
  );
};

export default AziendaCollab;
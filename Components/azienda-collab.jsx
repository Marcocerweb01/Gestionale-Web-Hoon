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
  }, [aziendaId]);

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

  if (loading) return <div>Caricamento in corso...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-black text-left">
        <thead>
          <tr>
            <th>Collaboratore</th>
            <th>Azione</th>
          </tr>
        </thead>
        <tbody>
          {collaborazioni.map((row) => (
            <tr key={row.id}>
              <td>
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
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
                  `${row.collaboratorenome} ${row.collaboratorecognome}`
                )}
              </td>
              <td>
  {editingRow === row.id ? (
    <button
      onClick={handleSave}
      className="bg-green-500 text-white px-2 py-1 rounded"
    >
      Salva
    </button>
  ) : (
    <button
      onClick={() => handleEditClick(row.id)}
      className="bg-blue-500 text-white px-2 py-1 rounded"
    >
      Modifica
    </button>
  )}
  <button
    onClick={() => handleDelete(row.id)}
    className="bg-red-500 text-white px-2 py-1 rounded ml-2"
  >
    Elimina
  </button>
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AziendaCollab;
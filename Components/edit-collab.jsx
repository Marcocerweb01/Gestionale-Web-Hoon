import React, { useState, useEffect } from "react";

const AdminCollaborationsList = ({ id }) => {
  const [data, setData] = useState([]);
  const [editingRow, setEditingRow] = useState();
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Funzione per recuperare le collaborazioni
  const fetchCollaborazioni = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError("Non è stato possibile recuperare i dati.");
    } finally {
      setLoading(false);
    }
  };

  // Recupera le collaborazioni al caricamento del componente
  useEffect(() => {
    fetchCollaborazioni();
  }, [id]); // ✅ Fix: rimosso fetchCollaborazioni per evitare loop infinito

  // Gestione modifica
  const handleEditClick = (rowId) => {
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    setTempData({ ...rowData });
  };

  // Incrementa/Decrementa valori
  const handleIncrement = (field) => {
    setTempData((prev) => ({
      ...prev,
      [field]: prev[field] + 1,
    }));
  };

  const handleDecrement = (field) => {
    setTempData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1),
    }));
  };

  // Salva modifiche
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/collaborazioni/adminedit/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_appuntamenti: tempData.appuntamenti,
          post_ig_fb: tempData.postIg_fb,
          post_tiktok: tempData.postTiktok,
          post_linkedin: tempData.postLinkedin,
        }),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }

      console.log("Modifica salvata con successo!");

      // Richiama la funzione per aggiornare i dati
      await fetchCollaborazioni();

      // Resetta lo stato di modifica
      setEditingRow(null);
      setTempData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare i dati.");
    }
  };

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
        <span className="text-xl">📊</span>
        <h3 className="text-lg font-semibold text-gray-900">Gestione Collaborazioni</h3>
      </div>

      {/* Tabella con design moderno */}
      <div className="overflow-x-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Appuntamenti</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Post IG & FB</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Post TikTok</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Post LinkedIn</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{row.cliente}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingRow === row.id ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("appuntamenti")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.appuntamenti}</span>
                    <button 
                      onClick={() => handleIncrement("appuntamenti")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  row.appuntamenti
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingRow === row.id ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postIg_fb")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postIg_fb}</span>
                    <button 
                      onClick={() => handleIncrement("postIg_fb")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  row.postIg_fb
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingRow === row.id ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postTiktok")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postTiktok}</span>
                    <button 
                      onClick={() => handleIncrement("postTiktok")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  row.postTiktok
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingRow === row.id ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postLinkedin")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postLinkedin}</span>
                    <button 
                      onClick={() => handleIncrement("postLinkedin")}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  row.postLinkedin
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingRow === row.id ? (
                  <button 
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                  >
                    ✅ Salva
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEditClick(row.id)}
                    className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation"
                  >
                    Modifica
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>

    {/* Messaggio se non ci sono dati */}
    {data.length === 0 && (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
          <span className="text-xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna collaborazione trovata</h3>
        <p className="text-gray-500">Non ci sono ancora collaborazioni da gestire.</p>
      </div>
    )}
    </div>
  );
};

export default AdminCollaborationsList;
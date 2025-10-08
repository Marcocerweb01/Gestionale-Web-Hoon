import React, { useState, useEffect, useCallback } from "react";

const AdminCollaborationsList = ({ id }) => {
  console.log("🔄 RENDER - AdminCollaborationsList", new Date().toLocaleTimeString());
  
  const [data, setData] = useState([]);
  const [editingRow, setEditingRow] = useState();
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Stato per prevenire click multipli
  const [error, setError] = useState("");

  console.log("   📊 State:", { 
    dataLength: data.length, 
    editingRow, 
    tempData, 
    loading, 
    saving 
  });

  // Funzione per recuperare le collaborazioni
  const fetchCollaborazioni = async () => {
    console.log("🌐 FETCH Collaborazioni - ID:", id);
    try {
      const response = await fetch(`/api/collaborazioni/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      console.log("✅ Collaborazioni ricevute:", result);
      setData(result);
    } catch (err) {
      console.error("❌ Errore fetch:", err);
      setError("Non è stato possibile recuperare i dati.");
    } finally {
      setLoading(false);
    }
  };

  // Recupera le collaborazioni al caricamento del componente
  useEffect(() => {
    console.log("⚡ useEffect triggered - ID:", id);
    fetchCollaborazioni();
  }, [id]); // ✅ Fix: rimosso fetchCollaborazioni per evitare loop infinito

  // Gestione modifica
  const handleEditClick = useCallback((rowId) => {
    console.log("🔵 CLICK MODIFICA - rowId:", rowId);
    console.log("📊 Data corrente:", data);
    
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    
    if (!rowData) {
      console.error("❌ Riga non trovata per rowId:", rowId);
      return;
    }
    
    console.log("✅ Riga trovata:", rowData);
    
    // Salva solo i campi modificabili
    const newTempData = {
      appuntamenti: rowData.appuntamenti || 0,
      postIg_fb: rowData.postIg_fb || 0,
      postTiktok: rowData.postTiktok || 0,
      postLinkedin: rowData.postLinkedin || 0
    };
    
    console.log("📝 TempData impostato:", newTempData);
    setTempData(newTempData);
  }, [data]);

  // Incrementa/Decrementa valori
  const handleIncrement = useCallback((field) => {
    console.log("➕ INCREMENT - Campo:", field);
    setTempData((prev) => {
      const newValue = (prev[field] || 0) + 1;
      console.log(`   ${field}: ${prev[field]} → ${newValue}`);
      return {
        ...prev,
        [field]: newValue,
      };
    });
  }, []);

  const handleDecrement = useCallback((field) => {
    console.log("➖ DECREMENT - Campo:", field);
    setTempData((prev) => {
      const newValue = Math.max(0, (prev[field] || 0) - 1);
      console.log(`   ${field}: ${prev[field]} → ${newValue}`);
      return {
        ...prev,
        [field]: newValue,
      };
    });
  }, []);

  // Salva modifiche
  const handleSave = useCallback(async () => {
    console.log("💾 SALVA CLICCATO");
    console.log("   Saving state:", saving);
    console.log("   EditingRow:", editingRow);
    console.log("   TempData:", tempData);
    
    if (saving) {
      console.warn("⚠️ Salvataggio già in corso, ignoro click");
      return;
    }
    
    console.log("🚀 Inizio salvataggio...");
    setSaving(true);
    
    try {
      const payload = {
        numero_appuntamenti: tempData.appuntamenti,
        post_ig_fb: tempData.postIg_fb,
        post_tiktok: tempData.postTiktok,
        post_linkedin: tempData.postLinkedin,
      };
      
      console.log("📤 Payload da inviare:", payload);
      
      const response = await fetch(`/api/collaborazioni/adminedit/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Errore response:", errorText);
        throw new Error("Errore durante l'aggiornamento");
      }

      const responseData = await response.json();
      console.log("✅ Risposta server:", responseData);

      // Aggiorna solo la riga modificata invece di ricaricare tutto
      setData(prevData => {
        const newData = prevData.map(row => 
          row.id === editingRow 
            ? { 
                ...row, 
                appuntamenti: tempData.appuntamenti,
                postIg_fb: tempData.postIg_fb,
                postTiktok: tempData.postTiktok,
                postLinkedin: tempData.postLinkedin
              }
            : row
        );
        console.log("🔄 Data aggiornata localmente:", newData);
        return newData;
      });

      // Resetta lo stato di modifica
      console.log("🧹 Reset stato modifica");
      setEditingRow(null);
      setTempData({});
      
    } catch (err) {
      console.error("❌ ERRORE CATCH:", err);
      setError("Non è stato possibile aggiornare i dati.");
    } finally {
      console.log("🏁 Salvataggio completato, setSaving(false)");
      setSaving(false);
    }
  }, [saving, editingRow, tempData]);

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
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.appuntamenti}</span>
                    <button 
                      onClick={() => handleIncrement("appuntamenti")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postIg_fb}</span>
                    <button 
                      onClick={() => handleIncrement("postIg_fb")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postTiktok}</span>
                    <button 
                      onClick={() => handleIncrement("postTiktok")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold">{tempData.postLinkedin}</span>
                    <button 
                      onClick={() => handleIncrement("postLinkedin")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={saving}
                    className={`inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation ${
                      saving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {saving ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Salvataggio...
                      </>
                    ) : (
                      <>✅ Salva</>
                    )}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleEditClick(row.id)}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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
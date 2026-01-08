import React, { useState, useEffect, useCallback } from "react";

const AdminCollaborationsList = ({ id }) => {
  console.log("🔄 RENDER - AdminCollaborationsList", new Date().toLocaleTimeString());
  
  const [data, setData] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Stato per prevenire click multipli
  const [azzerandoTotali, setAzzerandoTotali] = useState(null); // ID della collaborazione in azzeramento
  const [error, setError] = useState("");

  console.log("   📊 State:", { 
    dataLength: data.length, 
    editingRow, 
    tempData, 
    loading, 
    saving 
  });

  // Funzione per recuperare le collaborazioni con retry logic
  const fetchCollaborazioni = async (retryCount = 0) => {
    console.log("🌐 FETCH Collaborazioni - ID:", id, "Retry:", retryCount);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(`/api/collaborazioni/${id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 500 && retryCount < 3) {
          // Retry con backoff esponenziale per errori 500
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`⏱️ Retry ${retryCount + 1} dopo ${delay}ms per errore 500`);
          setTimeout(() => fetchCollaborazioni(retryCount + 1), delay);
          return;
        }
        throw new Error(`Errore ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log("✅ Collaborazioni ricevute:", result);
      setData(result);
      setError(null); // Reset error on success
    } catch (err) {
      console.error("❌ Errore fetch:", err);
      if (err.name === 'AbortError') {
        setError("Richiesta timeout - Server non risponde");
      } else if (retryCount >= 3) {
        setError("Impossibile recuperare i dati dopo 3 tentativi. Verifica la connessione.");
      } else {
        setError("Errore temporaneo nel recupero dei dati.");
      }
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
      postLinkedin: rowData.postLinkedin || 0,
      post_totali: rowData.post_totali || 0,
      appuntamenti_totali: rowData.appuntamenti_totali || 0,
      durata_contratto: rowData.durata_contratto || '',
      data_inizio_contratto: rowData.data_inizio_contratto ? new Date(rowData.data_inizio_contratto).toISOString().split('T')[0] : '',
      data_fine_contratto: rowData.data_fine_contratto ? new Date(rowData.data_fine_contratto).toISOString().split('T')[0] : ''
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
        post_totali: tempData.post_totali,
        appuntamenti_totali: tempData.appuntamenti_totali,
        durata_contratto: tempData.durata_contratto || null,
        data_inizio_contratto: tempData.data_inizio_contratto || null,
        data_fine_contratto: tempData.data_fine_contratto || null,
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
                postLinkedin: tempData.postLinkedin,
                post_totali: tempData.post_totali,
                appuntamenti_totali: tempData.appuntamenti_totali,
                durata_contratto: tempData.durata_contratto,
                data_inizio_contratto: tempData.data_inizio_contratto,
                data_fine_contratto: tempData.data_fine_contratto
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

  // Funzione per azzerare i totali generali
  const handleAzzeraTotali = useCallback(async (collaborazioneId) => {
    if (azzerandoTotali) return;
    
    // Conferma prima di azzerare
    if (!window.confirm('Sei sicuro di voler azzerare i totali generali (Post Totali e Appuntamenti Totali)?')) {
      return;
    }

    setAzzerandoTotali(collaborazioneId);
    
    try {
      const response = await fetch(`/api/collaborazioni/azzera-totali/${collaborazioneId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Errore durante l'azzeramento");
      }

      // Aggiorna i dati localmente
      setData(prevData => {
        return prevData.map(row => 
          row.id === collaborazioneId 
            ? { ...row, post_totali: 0, appuntamenti_totali: 0 }
            : row
        );
      });

      console.log("✅ Totali azzerati con successo");
      
    } catch (err) {
      console.error("❌ Errore azzeramento totali:", err);
      setError("Non è stato possibile azzerare i totali.");
    } finally {
      setAzzerandoTotali(null);
    }
  }, [azzerandoTotali]);

  // Helper per formattare le date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    <div className="space-y-6">
      {/* Header della sezione */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-xl">📊</span>
        <h3 className="text-lg font-semibold text-gray-900">Gestione Collaborazioni</h3>
      </div>

      {/* Cards per ogni collaborazione */}
      {data.map((row) => (
        <div key={row.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">🏢</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{row.cliente}</h4>
                  {row.durata_contratto && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      ⏱️ {row.durata_contratto}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingRow !== row.id && (
                  <>
                    <button 
                      onClick={() => handleEditClick(row.id)}
                      disabled={saving || editingRow !== null}
                      className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✏️ Modifica
                    </button>
                    <button 
                      onClick={() => handleAzzeraTotali(row.id)}
                      disabled={azzerandoTotali === row.id}
                      className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {azzerandoTotali === row.id ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Azzeramento...
                        </>
                      ) : (
                        <>🔄 Azzera Generali</>
                      )}
                    </button>
                  </>
                )}
                {editingRow === row.id && (
                  <>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className={`inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors shadow-sm text-sm touch-manipulation ${
                        saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
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
                    <button 
                      onClick={() => { setEditingRow(null); setTempData({}); }}
                      disabled={saving}
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
            {/* Sezione Totali Generali */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
              <h5 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                <span className="mr-2">📊</span> Totali Generali
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Post Totali</p>
                  {editingRow === row.id ? (
                    <input
                      type="number"
                      min="0"
                      value={tempData.post_totali}
                      onChange={(e) => setTempData(prev => ({ ...prev, post_totali: Math.max(0, Number(e.target.value)) }))}
                      className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-xl font-bold text-purple-600">{row.post_totali || 0}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">App. Totali</p>
                  {editingRow === row.id ? (
                    <input
                      type="number"
                      min="0"
                      value={tempData.appuntamenti_totali}
                      onChange={(e) => setTempData(prev => ({ ...prev, appuntamenti_totali: Math.max(0, Number(e.target.value)) }))}
                      className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  ) : (
                    <p className="text-xl font-bold text-purple-600">{row.appuntamenti_totali || 0}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Inizio</p>
                  {editingRow === row.id ? (
                    <input
                      type="date"
                      value={tempData.data_inizio_contratto}
                      onChange={(e) => setTempData(prev => ({ ...prev, data_inizio_contratto: e.target.value }))}
                      className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{formatDate(row.data_inizio_contratto)}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Fine</p>
                  {editingRow === row.id ? (
                    <input
                      type="date"
                      value={tempData.data_fine_contratto}
                      onChange={(e) => setTempData(prev => ({ ...prev, data_fine_contratto: e.target.value }))}
                      className="w-full mt-1 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-700">{formatDate(row.data_fine_contratto)}</p>
                  )}
                </div>
              </div>
              {editingRow === row.id && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Durata Contratto</p>
                  <select
                    value={tempData.durata_contratto}
                    onChange={(e) => setTempData(prev => ({ ...prev, durata_contratto: e.target.value }))}
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

            {/* Sezione Dati Mensili */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase mb-2">📅 Appuntamenti</p>
                {editingRow === row.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("appuntamenti")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-lg">{tempData.appuntamenti}</span>
                    <button 
                      onClick={() => handleIncrement("appuntamenti")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{row.appuntamenti}</p>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase mb-2">📸 IG & FB</p>
                {editingRow === row.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postIg_fb")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-lg">{tempData.postIg_fb}</span>
                    <button 
                      onClick={() => handleIncrement("postIg_fb")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-pink-600">{row.postIg_fb}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase mb-2">🎵 TikTok</p>
                {editingRow === row.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postTiktok")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-lg">{tempData.postTiktok}</span>
                    <button 
                      onClick={() => handleIncrement("postTiktok")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{row.postTiktok}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase mb-2">💼 LinkedIn</p>
                {editingRow === row.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleDecrement("postLinkedin")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-lg">{tempData.postLinkedin}</span>
                    <button 
                      onClick={() => handleIncrement("postLinkedin")}
                      disabled={saving}
                      className="inline-flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-700">{row.postLinkedin}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

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
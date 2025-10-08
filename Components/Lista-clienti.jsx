"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const ListaClienti = ({ id, amministratore }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [saving, setSaving] = useState(false); // Stato per prevenire click multipli
  const [appuntamenti, setAppuntamenti] = useState({});
  const [problemi, setProblemi]=useState({});

  const fetchCollaborazioni = useCallback(async (retryCount = 0) => {
    console.log("🌐 FETCH Lista Clienti - ID:", id, "Retry:", retryCount);
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
      console.log("✅ Lista Clienti ricevuti:", result);
      setData(result);
      setError(null); // Reset error on success
    } catch (err) {
      console.error("❌ Errore fetch Lista Clienti:", err);
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
  }, [id]);

  const fetchAppuntamenti = async (collaborazioneId) => {
    try {
      if (!collaborazioneId) return;


      const response = await fetch(`/api/appuntamenti_fatti/${collaborazioneId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero degli appuntamenti");
      }
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare gli appuntamenti.");
    }
  };

  const fetchProblemi = async (collaborazioneId) => {
    try {
      if (!collaborazioneId) return;


      const response = await fetch(`/api/problemi/${collaborazioneId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero dei problemi");
      }
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i problemi");
    }
  };


  useEffect(() => {
    console.log("⚡ useEffect triggered - ID:", id);
    if (id) {
      fetchCollaborazioni();
    } else {
      setError("ID utente non fornito.");
      setLoading(false);
    }
  }, [id, fetchCollaborazioni]); // ✅ Fix: ora fetchCollaborazioni è useCallback


  useEffect(() => {
    const loadAdditionalData = async () => {
      if (data.length === 0) return;
      
      console.log("🔄 Caricamento dati aggiuntivi per", data.length, "collaborazioni");
      
      try {
        // Crea le promesse per tutte le chiamate API in parallelo
        const appuntamentiPromises = data.map(row => fetchAppuntamenti(row.feed));
        const problemiPromises = data.map(row => fetchProblemi(row.feed));
        
        // Esegui tutte le chiamate in parallelo
        const [appuntamentiResults, problemiResults] = await Promise.all([
          Promise.all(appuntamentiPromises),
          Promise.all(problemiPromises)
        ]);
        
        // Costruisci gli oggetti dei risultati
        const appuntamentiData = {};
        const problemiData = {};
        
        data.forEach((row, index) => {
          appuntamentiData[row.feed] = appuntamentiResults[index] || 0;
          problemiData[row.feed] = problemiResults[index] || 0;
        });
        
        console.log("✅ Dati aggiuntivi caricati:", { appuntamentiData, problemiData });
        setAppuntamenti(appuntamentiData);
        setProblemi(problemiData);
        
      } catch (err) {
        console.error("❌ Errore nel caricamento dati aggiuntivi:", err);
        setError("Errore nel caricamento di alcuni dati aggiuntivi");
      }
    };

    loadAdditionalData();
  }, [data]);

  const handleEditClick = useCallback((rowId) => {
    console.log("🔵 CLICK MODIFICA Lista Clienti - rowId:", rowId);
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    
    if (!rowData) {
      console.error("❌ Riga non trovata per rowId:", rowId);
      return;
    }
    
    setTempData({ ...rowData });
  }, [data]);

  const handleIncrement = useCallback((field) => {
    console.log("➕ INCREMENT Lista Clienti - Campo:", field);
    setTempData((prev) => ({
      ...prev,
      [field]: prev[field] + 1,
    }));
  }, []);

  const handleDecrement = useCallback((field) => {
    console.log("➖ DECREMENT Lista Clienti - Campo:", field);
    setTempData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    console.log("💾 SALVA CLICCATO Lista Clienti");
    console.log("   Saving state:", saving);
    console.log("   EditingRow:", editingRow);
    
    if (saving) {
      console.warn("⚠️ Salvataggio già in corso, ignoro click");
      return;
    }
    
    console.log("🚀 Inizio salvataggio Lista Clienti...");
    setSaving(true);
    
    try {
      const response = await fetch(`/api/collaborazioni/edit/${editingRow}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_ig_fb_fatti: tempData.post_ig_fb_fatti,
          post_tiktok_fatti: tempData.post_tiktok_fatti,
          post_linkedin_fatti: tempData.post_linkedin_fatti,
        }),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Errore response:", errorText);
        throw new Error("Errore durante l'aggiornamento");
      }

      const updatedCollaborazione = await response.json();
      console.log("✅ Risposta server:", updatedCollaborazione);

      setData((prevData) =>
        prevData.map((item) =>
          item.id === editingRow ? { ...item, ...updatedCollaborazione.collaborazione } : item
        )
      );

      console.log("🧹 Reset stato modifica Lista Clienti");
      setEditingRow(null);
      setTempData({});
      
    } catch (err) {
      console.error("❌ ERRORE CATCH Lista Clienti:", err);
      setError("Non è stato possibile aggiornare i dati.");
    } finally {
      console.log("🏁 Salvataggio completato Lista Clienti, setSaving(false)");
      setSaving(false);
    }
  }, [saving, editingRow, tempData]);


  const CounterEditor = ({ value, valuetot, onIncrement, onDecrement, disabled = false }) => (
    <div className="flex items-center space-x-3 w-full">
      <button 
        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onDecrement}
        disabled={disabled}
      >
        -
      </button>
      <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 font-medium min-w-[4rem] text-center">
        {valuetot === 0 ? "N/A" : value}
      </span>
      <button 
        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onIncrement}
        disabled={disabled}
      >
        +
      </button>
    </div>
  );

  // Componente per la visualizzazione desktop
  const DesktopView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feed</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Appuntamenti mensili</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Post IG & FB</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Post TikTok</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Post LinkedIn</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Problemi</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
        {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`User/${row.clienteId}`} className="text-primary hover:text-primary-600 font-medium"> 
                    {row.cliente} 
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Link 
                    href={`/Feed-2/${id}?collaborazioneId=${row.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                   Visualizza
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-900">
                  <span className="font-medium">{appuntamenti[row.feed] || 0}</span>
                  <span className="text-gray-500">/{row.appuntamenti}</span>
                </td>
              
                <td className="px-6 py-4">
                {editingRow === row.id ? (
                  row.postIg_fb === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDecrement("post_ig_fb_fatti")}
                        disabled={saving}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                        {tempData.post_ig_fb_fatti || 0}
                      </span>
                      <button
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleIncrement("post_ig_fb_fatti")}
                        disabled={saving}
                      >
                        +
                      </button>
                    </div>
                  )
                ) : row.postIg_fb === 0 ? (
                  <span className="text-gray-500 italic">Non disponibile</span>
                ) : (
                  <span>
                    <span className="font-medium">{row.post_ig_fb_fatti}</span>
                    <span className="text-gray-500"> / {row.postIg_fb}</span>
                  </span>
                )}
                </td>
                
                <td className="px-6 py-4">
                {editingRow === row.id ? (
                    row.postTiktok === 0 ? (
                      <span className="text-gray-500 italic">Non disponibile</span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDecrement("post_tiktok_fatti")}
                          disabled={saving}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                          {tempData.post_tiktok_fatti || 0}
                        </span>
                        <button
                          className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleIncrement("post_tiktok_fatti")}
                          disabled={saving}
                        >
                          +
                        </button>
                      </div>
                    )
                  ) : row.postTiktok === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <span>
                      <span className="font-medium">{row.post_tiktok_fatti}</span>
                      <span className="text-gray-500"> / {row.postTiktok}</span>
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4">
                {editingRow === row.id ? (
                  row.postLinkedin === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDecrement("post_linkedin_fatti")}
                        disabled={saving}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                        {tempData.post_linkedin_fatti || 0}
                      </span>
                      <button
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleIncrement("post_linkedin_fatti")}
                        disabled={saving}
                      >
                        +
                      </button>
                    </div>
                  )
                ) : row.postLinkedin === 0 ? (
                  <span className="text-gray-500 italic">Non disponibile</span>
                ) : (
                  <span>
                    <span className="font-medium">{row.post_linkedin_fatti}</span>
                    <span className="text-gray-500"> / {row.postLinkedin}</span>
                  </span>
                )}
                </td>
                
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg">
                    {problemi[row.feed] || 0}
                  </span>
                </td>
               
                <td className="px-6 py-4">
                  {editingRow === row.id ? (
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
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
                        'Salva'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row.id)}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  );

  // Componente per la visualizzazione mobile
  const MobileView = () => (
    <div className="space-y-4">
      {data.map((row) => (
        <div key={row.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{row.cliente}</h3>
              <Link 
                href={`/Feed-2/${id}?collaborazioneId=${row.id}`}
                className="inline-flex items-center mt-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Visualizza Feed
              </Link>
            </div>
            {editingRow === row.id ? (
              <button 
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salva...
                  </>
                ) : (
                  '✅ Salva'
                )}
              </button>
            ) : (
              <button
                onClick={() => handleEditClick(row.id)}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Modifica
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Appuntamenti:</p>
              <p className="text-lg">
                <span className="font-semibold text-gray-900">{appuntamenti[row.feed] || 0}</span>
                <span className="text-gray-500">/{row.appuntamenti}</span>
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Post IG & FB:</p>
              {editingRow === row.id ? (
                row.postIg_fb === 0 ? (
                  <span className="text-gray-500 italic">Non disponibile</span>
                ) : (
                  <CounterEditor
                    value={tempData.post_ig_fb_fatti}
                    valuetot={tempData.postIg_fb}
                    onIncrement={() => handleIncrement("post_ig_fb_fatti")}
                    onDecrement={() => handleDecrement("post_ig_fb_fatti")}
                    disabled={saving}
                  />
                )
              ) : (
                <p className="text-lg">
                  {row.postIg_fb === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">{row.post_ig_fb_fatti}</span>
                      <span className="text-gray-500"> / {row.postIg_fb}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Post TikTok:</p>
              {editingRow === row.id ? (
                row.postTiktok === 0 ? (
                  <span className="text-gray-500 italic">Non disponibile</span>
                ) : (
                  <CounterEditor
                    value={tempData.post_tiktok_fatti}
                    valuetot={tempData.postTiktok}
                    onIncrement={() => handleIncrement("post_tiktok_fatti")}
                    onDecrement={() => handleDecrement("post_tiktok_fatti")}
                    disabled={saving}
                  />
                )
              ) : (
                <p className="text-lg">
                  {row.postTiktok === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">{row.post_tiktok_fatti}</span>
                      <span className="text-gray-500"> / {row.postTiktok}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-2">Post LinkedIn:</p>
              {editingRow === row.id ? (
                row.postLinkedin === 0 ? (
                  <span className="text-gray-500 italic">Non disponibile</span>
                ) : (
                  <CounterEditor
                    value={tempData.post_linkedin_fatti}
                    valuetot={tempData.postLinkedin}
                    onIncrement={() => handleIncrement("post_linkedin_fatti")}
                    onDecrement={() => handleDecrement("post_linkedin_fatti")}
                    disabled={saving}
                  />
                )
              ) : (
                <p className="text-lg">
                  {row.postLinkedin === 0 ? (
                    <span className="text-gray-500 italic">Non disponibile</span>
                  ) : (
                    <>
                      <span className="font-semibold text-gray-900">{row.post_linkedin_fatti}</span>
                      <span className="text-gray-500"> / {row.postLinkedin}</span>
                    </>
                  )}
                </p>
              )}
            </div>
            
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600 mb-1">Problemi riscontrati:</p>
              <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg">
                {problemi[row.feed] || 0}
              </span>
            </div>
            
            {amministratore && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-600 mb-1">Pagato:</p>
                <p className="text-lg font-medium text-gray-900">{row.pagato}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-3 text-gray-600">Caricamento in corso...</span>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
      <div className="flex items-center">
        <div className="w-5 h-5 text-red-500">⚠️</div>
        <p className="ml-2 text-red-700">{error}</p>
      </div>
    </div>
  );
  
  if (data.length === 0) return (
    <div className="text-center p-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-2xl">📊</span>
      </div>
      <p className="text-gray-500 text-lg">Nessuna collaborazione trovata.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {amministratore ? <DesktopView /> : <MobileView />}
    </div>
  );
};

export default ListaClienti;
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

const ListaClienti = ({ id, amministratore }) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState(null);
  const [tempData, setTempData] = useState({});
  const [appuntamenti, setAppuntamenti] = useState({});
  const [problemi, setProblemi]=useState({});

  const fetchCollaborazioni = async () => {
    console.log("PARTITO")
    try {
      const response = await fetch(`/api/collaborazioni/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle collaborazioni");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile recuperare i dati.");
    } finally {
      setLoading(false);
    }
  };


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
    if (id) {
      fetchCollaborazioni();
    } else {
      setError("ID utente non fornito.");
      setLoading(false);
    }
  }, [id, fetchCollaborazioni]); // ✨ Fix: sintassi corretta per le dipendenze


  useEffect(() => {
    const loadAppuntamenti = async () => {
      const appuntamentiData = {};
      for (const row of data) {
        const result = await fetchAppuntamenti(row.feed);
        appuntamentiData[row.feed] = result || 0;
      }
      setAppuntamenti(appuntamentiData);
    };


    if (data.length > 0) {
      loadAppuntamenti();
     
    }
  }, [data]);

  useEffect(() => {
    const loadProblemi = async () => {
      const problemiData = {};
      for (const row of data) {
        const result = await fetchProblemi(row.feed);
        problemiData[row.feed] = result || 0;
      }
      setProblemi(problemiData);
    };


    if (data.length > 0) {
      loadProblemi();
    }
  }, [data]);

  const handleEditClick = (rowId) => {
    setEditingRow(rowId);
    const rowData = data.find((row) => row.id === rowId);
    setTempData({ ...rowData });
  };


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


  const handleSave = async () => {
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


      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento");
      }


      const updatedCollaborazione = await response.json();


      setData((prevData) =>
        prevData.map((item) =>
          item.id === editingRow ? { ...item, ...updatedCollaborazione.collaborazione } : item
        )
      );


      setEditingRow(null);
      setTempData({});
    } catch (err) {
      console.error("Errore:", err);
      setError("Non è stato possibile aggiornare i dati.");
    }
  };


  const CounterEditor = ({ value, valuetot, onIncrement, onDecrement }) => (
    <div className="flex items-center space-x-3 w-full">
      <button 
        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors flex items-center justify-center"
        onClick={onDecrement}
      >
        -
      </button>
      <span className="px-3 py-1 bg-white rounded-lg border border-gray-200 font-medium min-w-[4rem] text-center">
        {valuetot === 0 ? "N/A" : value}
      </span>
      <button 
        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors flex items-center justify-center"
        onClick={onIncrement}
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
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
                        onClick={() => handleDecrement("post_ig_fb_fatti")}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                        {tempData.post_ig_fb_fatti || 0}
                      </span>
                      <button
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors"
                        onClick={() => handleIncrement("post_ig_fb_fatti")}
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
                          className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
                          onClick={() => handleDecrement("post_tiktok_fatti")}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                          {tempData.post_tiktok_fatti || 0}
                        </span>
                        <button
                          className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors"
                          onClick={() => handleIncrement("post_tiktok_fatti")}
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
                        className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-colors"
                        onClick={() => handleDecrement("post_linkedin_fatti")}
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium min-w-[3rem] text-center">
                        {tempData.post_linkedin_fatti || 0}
                      </span>
                      <button
                        className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 font-bold transition-colors"
                        onClick={() => handleIncrement("post_linkedin_fatti")}
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
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Salva
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row.id)}
                      className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
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
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                ✅ Salva
              </button>
            ) : (
              <button
                onClick={() => handleEditClick(row.id)}
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
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
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
  const [postMancanti, setPostMancanti]=useState({});

  const fetchCollaborazioni = useCallback(async (retryCount = 0) => {
    console.log("🌐 FETCH Lista Clienti - ID:", id, "Retry:", retryCount);
    
    // ✅ Controllo robusto dell'ID prima di fare il fetch
    if (!id || id === 'undefined' || id === 'null') {
      console.error("❌ ID non valido:", id);
      setError("ID collaboratore non valido");
      setLoading(false);
      return;
    }
    
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

  const fetchPostMancanti = async (collaborazioneId) => {
    try {
      if (!collaborazioneId) return;

      const response = await fetch(`/api/post-mancanti/${collaborazioneId}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero dei post mancanti");
      }
      const result = await response.json();
      return result;
    } catch (err) {
      console.error("Errore:", err);
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
        const postMancantiPromises = data.map(row => fetchPostMancanti(row.feed));
        
        // Esegui tutte le chiamate in parallelo
        const [appuntamentiResults, problemiResults, postMancantiResults] = await Promise.all([
          Promise.all(appuntamentiPromises),
          Promise.all(problemiPromises),
          Promise.all(postMancantiPromises)
        ]);
        
        // Costruisci gli oggetti dei risultati
        const appuntamentiData = {};
        const problemiData = {};
        const postMancantiData = {};
        
        data.forEach((row, index) => {
          appuntamentiData[row.feed] = appuntamentiResults[index] || 0;
          problemiData[row.feed] = problemiResults[index] || 0;
          postMancantiData[row.feed] = postMancantiResults[index] || 0;
        });
        
        console.log("✅ Dati aggiuntivi caricati:", { appuntamentiData, problemiData, postMancantiData });
        setAppuntamenti(appuntamentiData);
        setProblemi(problemiData);
        setPostMancanti(postMancantiData);
        
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
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 w-[10%]">Cliente</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-900 w-[6%]" title="Post Instagram & Facebook">
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/><path d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8z"/><circle cx="18.406" cy="5.594" r="1.44"/></svg>
                </span>
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-green-700 bg-green-50 w-[5%]" title="Trimestrale Instagram">📊</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-900 w-[6%]" title="Post TikTok">
                <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-green-700 bg-green-50 w-[5%]" title="Trimestrale TikTok">📊</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-900 w-[6%]" title="Post LinkedIn">
                <svg className="w-4 h-4 mx-auto text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-green-700 bg-green-50 w-[5%]" title="Trimestrale LinkedIn">📊</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-orange-700 bg-orange-50 w-[5%]" title="Problemi">⚠️</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-red-700 bg-red-50 w-[5%]" title="Post Mancanti">📱</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-900 w-[6%]">App.</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-green-700 bg-green-50 w-[6%]" title="Appuntamenti Trimestrale">📅 Tr</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-purple-700 bg-purple-50 w-[5%]" title="Post Totali Generali">Tot.P</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-purple-700 bg-purple-50 w-[5%]" title="Appuntamenti Totali Generali">Tot.A</th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-900 w-[7%]">Azione</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
        {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2">
                  <Link 
                    href={`/Feed-2/${id}?collaborazioneId=${row.id}`}
                    className="text-primary hover:text-primary-600 font-medium text-sm truncate block"
                  > 
                    {row.cliente} 
                  </Link>
                </td>
              
                {/* Instagram */}
                <td className="px-2 py-2 text-center">
                {editingRow === row.id ? (
                  row.postIg_fb === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition-colors disabled:opacity-50"
                        onClick={() => handleDecrement("post_ig_fb_fatti")}
                        disabled={saving}
                      >-</button>
                      <span className="px-1 bg-gray-100 rounded text-xs font-medium min-w-[2rem] text-center">
                        {tempData.post_ig_fb_fatti || 0}
                      </span>
                      <button
                        className="w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-600 font-bold text-xs transition-colors disabled:opacity-50"
                        onClick={() => handleIncrement("post_ig_fb_fatti")}
                        disabled={saving}
                      >+</button>
                    </div>
                  )
                ) : row.postIg_fb === 0 ? (
                  <span className="text-gray-400 text-xs">-</span>
                ) : (
                  <span className="text-sm">
                    <span className="font-medium">{row.post_ig_fb_fatti}</span>
                    <span className="text-gray-500">/{row.postIg_fb}</span>
                  </span>
                )}
                </td>
                
                {/* Trimestrale Instagram */}
                <td className="px-2 py-2 text-center bg-green-50">
                  {row.postIg_fb === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                      {row.instagram_trim_fatti || 0}/{row.instagram_trim_totali || 0}
                    </span>
                  )}
                </td>
                
                {/* TikTok */}
                <td className="px-2 py-2 text-center">
                {editingRow === row.id ? (
                    row.postTiktok === 0 ? (
                      <span className="text-gray-400 text-xs">-</span>
                    ) : (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition-colors disabled:opacity-50"
                          onClick={() => handleDecrement("post_tiktok_fatti")}
                          disabled={saving}
                        >-</button>
                        <span className="px-1 bg-gray-100 rounded text-xs font-medium min-w-[2rem] text-center">
                          {tempData.post_tiktok_fatti || 0}
                        </span>
                        <button
                          className="w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-600 font-bold text-xs transition-colors disabled:opacity-50"
                          onClick={() => handleIncrement("post_tiktok_fatti")}
                          disabled={saving}
                        >+</button>
                      </div>
                    )
                  ) : row.postTiktok === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <span className="text-sm">
                      <span className="font-medium">{row.post_tiktok_fatti}</span>
                      <span className="text-gray-500">/{row.postTiktok}</span>
                    </span>
                  )}
                </td>
                
                {/* Trimestrale TikTok */}
                <td className="px-2 py-2 text-center bg-green-50">
                  {row.postTiktok === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                      {row.tiktok_trim_fatti || 0}/{row.tiktok_trim_totali || 0}
                    </span>
                  )}
                </td>
                
                {/* LinkedIn */}
                <td className="px-2 py-2 text-center">
                {editingRow === row.id ? (
                  row.postLinkedin === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs transition-colors disabled:opacity-50"
                        onClick={() => handleDecrement("post_linkedin_fatti")}
                        disabled={saving}
                      >-</button>
                      <span className="px-1 bg-gray-100 rounded text-xs font-medium min-w-[2rem] text-center">
                        {tempData.post_linkedin_fatti || 0}
                      </span>
                      <button
                        className="w-6 h-6 rounded bg-green-100 hover:bg-green-200 text-green-600 font-bold text-xs transition-colors disabled:opacity-50"
                        onClick={() => handleIncrement("post_linkedin_fatti")}
                        disabled={saving}
                      >+</button>
                    </div>
                  )
                ) : row.postLinkedin === 0 ? (
                  <span className="text-gray-400 text-xs">-</span>
                ) : (
                  <span className="text-sm">
                    <span className="font-medium">{row.post_linkedin_fatti}</span>
                    <span className="text-gray-500">/{row.postLinkedin}</span>
                  </span>
                )}
                </td>
                
                {/* Trimestrale LinkedIn */}
                <td className="px-2 py-2 text-center bg-green-50">
                  {row.postLinkedin === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded">
                      {row.linkedin_trim_fatti || 0}/{row.linkedin_trim_totali || 0}
                    </span>
                  )}
                </td>
                
                {/* Colonna Problemi */}
                <td className="px-2 py-2 text-center bg-orange-50">
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    {problemi[row.feed] || 0}
                  </span>
                </td>
                
                {/* Colonna Post Mancanti */}
                <td className="px-2 py-2 text-center bg-red-50">
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                    {postMancanti[row.feed] || 0}
                  </span>
                </td>
                
                {/* Appuntamenti mensili */}
                <td className="px-2 py-2 text-center text-sm text-gray-900">
                  <span className="font-medium">{appuntamenti[row.feed] || 0}</span>
                  <span className="text-gray-500">/{row.appuntamenti}</span>
                </td>
                
                {/* Colonna Appuntamenti Trimestrali */}
                <td className="px-2 py-2 text-center bg-green-50">
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded" title="Appuntamenti fatti / Appuntamenti previsti nel trimestre">
                    {row.appuntamenti_trimestrale_fatti || 0}/{row.appuntamenti_trimestrale_totali || 0}
                  </span>
                </td>
                
                {/* Colonna Post Totali Generali */}
                <td className="px-2 py-2 text-center bg-purple-50">
                  {row.post_totali_previsti > 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded" title="Post fatti totali / Post previsti totali">
                      {row.post_totali || 0}/{row.post_totali_previsti}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                
                {/* Colonna Appuntamenti Totali Generali */}
                <td className="px-2 py-2 text-center bg-purple-50">
                  {row.appuntamenti_totali_previsti > 0 ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded" title="Appuntamenti fatti totali / Appuntamenti previsti totali">
                      {row.appuntamenti_totali || 0}/{row.appuntamenti_totali_previsti}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
               
                <td className="px-2 py-2 text-center">
                  {editingRow === row.id ? (
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className={`inline-flex items-center px-2 py-1 text-white text-xs font-medium rounded transition-colors ${
                        saving 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {saving ? '⏳' : '✓ Salva'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(row.id)}
                      disabled={saving}
                      className="inline-flex items-center px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                    >
                      ✏️
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
            
            {/* Sezione Problemi e Post Mancanti */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-1">⚠️ Problemi:</p>
                <span className="inline-flex items-center px-2.5 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg">
                  {problemi[row.feed] || 0}
                </span>
              </div>
              <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                <p className="text-sm font-medium text-red-700 mb-1">📱 Post Mancanti:</p>
                <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-lg">
                  {postMancanti[row.feed] || 0}
                </span>
              </div>
            </div>
            
            {/* Sezione Valutazione Trimestrale */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-2">📈 Valutazione Trimestrale per Tipo</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-green-100 rounded p-2 border border-green-300">
                  <p className="text-xs text-green-700 mb-1">Instagram</p>
                  <span className="inline-flex items-center px-2 py-1 bg-green-200 text-green-800 text-sm font-bold rounded">
                    {row.instagram_trim_fatti || 0}/{row.instagram_trim_totali || 0}
                  </span>
                </div>
                <div className="bg-green-100 rounded p-2 border border-green-300">
                  <p className="text-xs text-green-700 mb-1">TikTok</p>
                  <span className="inline-flex items-center px-2 py-1 bg-green-200 text-green-800 text-sm font-bold rounded">
                    {row.tiktok_trim_fatti || 0}/{row.tiktok_trim_totali || 0}
                  </span>
                </div>
                <div className="bg-green-100 rounded p-2 border border-green-300">
                  <p className="text-xs text-green-700 mb-1">LinkedIn</p>
                  <span className="inline-flex items-center px-2 py-1 bg-green-200 text-green-800 text-sm font-bold rounded">
                    {row.linkedin_trim_fatti || 0}/{row.linkedin_trim_totali || 0}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-green-700 mb-1">Appuntamenti Trimestrali</p>
                <span className="inline-flex items-center px-3 py-1.5 bg-green-200 text-green-800 text-lg font-bold rounded-lg">
                  {row.appuntamenti_trimestrale_fatti || 0} / {row.appuntamenti_trimestrale_totali || 0}
                </span>
              </div>
            </div>
            
            {/* Sezione Totali Generali */}
            {(row.post_totali_previsti > 0 || row.appuntamenti_totali_previsti > 0) && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-sm font-semibold text-purple-700 mb-2">📊 Totali Generali</p>
                <div className="grid grid-cols-2 gap-3">
                  {row.post_totali_previsti > 0 && (
                    <div>
                      <p className="text-xs text-purple-600">Post Totali</p>
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-lg">
                        {row.post_totali || 0}/{row.post_totali_previsti}
                      </span>
                    </div>
                  )}
                  {row.appuntamenti_totali_previsti > 0 && (
                    <div>
                      <p className="text-xs text-purple-600">App. Totali</p>
                      <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-lg">
                        {row.appuntamenti_totali || 0}/{row.appuntamenti_totali_previsti}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
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
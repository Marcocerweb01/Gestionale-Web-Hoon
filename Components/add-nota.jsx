"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const CreaNota = ({ collaborazioneId, autoreId, autorenome, collaboratoreId }) => {
  const [nota, setNota] = useState("");
  const [tipo, setTipo] = useState("generico");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // Inizializza il router

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: new Date().toISOString(),
          nota,
          autoreId: autoreId,
          autore: autorenome,
          collaborazione: collaborazioneId,
          tipo,
          data_appuntamento: tipo === "appuntamento" ? dataAppuntamento : undefined,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante la creazione della nota.");
      }

      setNota("");
      setDataAppuntamento("");
      setSuccess(true);

      // Reindirizza al link precedente dopo il successo
      router.push(`/Feed-2/${collaboratoreId}?collaborazioneId=${collaborazioneId}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo:
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="generico">📝 Generico</option>
            <option value="appuntamento">📅 Appuntamento</option>
            <option value="problema">⚠️ Problema</option>
            <option value="post_mancante">📱 Post Mancante!</option>
          </select>
        </div>
        
        {tipo === "appuntamento" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Appuntamento:
            </label>
            <input
              type="datetime-local"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              value={dataAppuntamento}
              onChange={(e) => setDataAppuntamento(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nota:
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base min-h-[120px] resize-y"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Scrivi qui la tua nota..."
            required
          />
        </div>
        
        {/* Button container mobile-friendly */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button 
            type="submit" 
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors text-base touch-manipulation"
          >
            ➕ Crea Nota
          </button>
          
          <button 
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-medium rounded-lg transition-colors text-base touch-manipulation"
          >
            ← Indietro
          </button>
        </div>
        
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">✅ Nota creata con successo!</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">❌ {error}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreaNota;

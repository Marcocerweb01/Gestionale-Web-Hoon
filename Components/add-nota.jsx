"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const CreaNota = ({ collaborazioneId, autoreId, autorenome, collaboratoreId }) => {
  const [nota, setNota] = useState("");
  const [tipo, setTipo] = useState("generico");
  const [dataAppuntamento, setDataAppuntamento] = useState("");
  const [feelingEmoji, setFeelingEmoji] = useState("");
  const [feelingNote, setFeelingNote] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter(); // Inizializza il router
  
  // Feeling Report abilitato solo per questi SMM
  const FEELING_ENABLED_USERS = ['678e57e508b3d51f4e9466e2', '678e582008b3d51f4e9466e8'];
  const isFeelingEnabled = FEELING_ENABLED_USERS.includes(autoreId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validazione: se il tipo è appuntamento e l'utente ha feeling abilitato, l'emoji è obbligatoria
    if (tipo === "appuntamento" && isFeelingEnabled && !feelingEmoji) {
      setError("L'emoji del Feeling Report è obbligatoria per gli appuntamenti!");
      return;
    }

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
          feeling_emoji: tipo === "appuntamento" && isFeelingEnabled ? feelingEmoji : undefined,
          feeling_note: tipo === "appuntamento" && isFeelingEnabled ? feelingNote : undefined,
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.message || "Errore durante la creazione della nota.");
      }

      setNota("");
      setDataAppuntamento("");
      setFeelingEmoji("");
      setFeelingNote("");
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
          <>
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
          </>
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
        
        {tipo === "appuntamento" && isFeelingEnabled && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">👉</span>
                <h3 className="text-base font-bold text-gray-900">Feeling Report</h3>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  Come sono uscito dall'incontro? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { emoji: '😄', label: 'Molto positivo, carico' },
                    { emoji: '🙂', label: 'Buono, sereno' },
                    { emoji: '😐', label: 'Neutro, senza particolari sensazioni' },
                    { emoji: '😕', label: 'Qualcosa non ha convinto' },
                    { emoji: '😤', label: 'Teso, frustrante' },
                    { emoji: '😵💫', label: 'Confuso, poco chiaro' },
                    { emoji: '🔥', label: 'Super gas, energia alta' },
                    { emoji: '🧊', label: 'Freddo, distaccato' },
                  ].map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFeelingEmoji(emoji)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        feelingEmoji === emoji
                          ? 'bg-yellow-400 border-yellow-600 shadow-lg scale-110'
                          : 'bg-white border-gray-300 hover:border-yellow-400'
                      }`}
                      title={label}
                    >
                      <span className="text-3xl">{emoji}</span>
                    </button>
                  ))}
                </div>
                
                {/* Tabella legenda emoji */}
                <div className="mt-4 bg-white rounded-lg border border-gray-300 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-yellow-100 to-orange-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300">Emoji</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300">Significato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { emoji: '😄', label: 'Molto positivo, carico' },
                        { emoji: '🙂', label: 'Buono, sereno' },
                        { emoji: '😐', label: 'Neutro, senza particolari sensazioni' },
                        { emoji: '😕', label: 'Qualcosa non ha convinto' },
                        { emoji: '😤', label: 'Teso, frustrante' },
                        { emoji: '😵💫', label: 'Confuso, poco chiaro' },
                        { emoji: '🔥', label: 'Super gas, energia alta' },
                        { emoji: '🧊', label: 'Freddo, distaccato' },
                      ].map(({ emoji, label }, index) => (
                        <tr key={emoji} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-3 py-2 text-2xl border-b border-gray-200">{emoji}</td>
                          <td className="px-3 py-2 text-gray-700 border-b border-gray-200">{label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Perché? (Opzionale)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-base min-h-[80px] resize-y"
                  value={feelingNote}
                  onChange={(e) => setFeelingNote(e.target.value)}
                  placeholder="Spiega brevemente cosa ti ha fatto sentire così..."
                />
              </div>
            </div>
            )}
        
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

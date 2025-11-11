"use client";

import { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";

export default function CreaLead({ commercialeId, onLeadCreato }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Campi obbligatori
  const [nomeAttivita, setNomeAttivita] = useState("");
  const [numeroTelefono, setNumeroTelefono] = useState("");

  // Campi opzionali
  const [referente, setReferente] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [citta, setCitta] = useState("");
  const [email, setEmail] = useState("");
  const [secondoNumero, setSecondoNumero] = useState("");
  const [notaGenerale, setNotaGenerale] = useState("");

  const resetForm = () => {
    setNomeAttivita("");
    setNumeroTelefono("");
    setReferente("");
    setIndirizzo("");
    setCitta("");
    setEmail("");
    setSecondoNumero("");
    setNotaGenerale("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nomeAttivita.trim() || !numeroTelefono.trim()) {
      alert("Nome attività e numero di telefono sono obbligatori!");
      return;
    }

    setIsCreating(true);

    try {
      const nuovoLead = {
        nome_attivita: nomeAttivita.trim(),
        numero_telefono: numeroTelefono.trim(),
        referente: referente.trim(),
        indirizzo: indirizzo.trim(),
        citta: citta.trim(),
        email: email.trim(),
        secondo_numero: secondoNumero.trim(),
        nota_generale: notaGenerale.trim(),
        commerciale: commercialeId
      };

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuovoLead)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore creazione lead");
      }

      const leadCreato = await response.json();
      
      onLeadCreato(leadCreato);
      resetForm();
      setIsOpen(false);
      
      alert("✅ Lead creato con successo!");

    } catch (error) {
      console.error("Errore:", error);
      alert(`❌ Errore: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Pulsante Apri Modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-semibold"
      >
        <FaPlus />
        Nuovo Lead
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Crea Nuovo Lead</h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={isCreating}
              >
                <FaTimes />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Campi Obbligatori */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-blue-800 mb-3">📋 Informazioni Obbligatorie</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Attività *
                  </label>
                  <input
                    type="text"
                    value={nomeAttivita}
                    onChange={(e) => setNomeAttivita(e.target.value)}
                    placeholder="Es: Pizzeria Da Mario"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numero Telefono *
                  </label>
                  <input
                    type="tel"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                    placeholder="Es: +39 333 1234567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Campi Opzionali */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-800 mb-3">📝 Informazioni Aggiuntive (Opzionali)</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referente
                  </label>
                  <input
                    type="text"
                    value={referente}
                    onChange={(e) => setReferente(e.target.value)}
                    placeholder="Es: Mario Rossi"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={indirizzo}
                      onChange={(e) => setIndirizzo(e.target.value)}
                      placeholder="Es: Via Roma 123"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città
                    </label>
                    <input
                      type="text"
                      value={citta}
                      onChange={(e) => setCitta(e.target.value)}
                      placeholder="Es: Milano"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Es: info@pizzeria.it"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondo Numero
                  </label>
                  <input
                    type="tel"
                    value={secondoNumero}
                    onChange={(e) => setSecondoNumero(e.target.value)}
                    placeholder="Es: +39 02 1234567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nota Generale
                  </label>
                  <textarea
                    value={notaGenerale}
                    onChange={(e) => setNotaGenerale(e.target.value)}
                    placeholder="Inserisci note o dettagli aggiuntivi..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Pulsanti */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={isCreating}
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Creazione...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Crea Lead
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

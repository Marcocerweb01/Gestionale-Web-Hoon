"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function FormUscita({ onClose, onUscitaCreata }) {
  const [isLoading, setIsLoading] = useState(false);
  const [collaboratori, setCollaboratori] = useState([]);
  const [aziende, setAziende] = useState([]);

  const [formData, setFormData] = useState({
    importo: "",
    destinatario_tipo: "collaboratore",
    destinatario_id: "",
    nome_destinatario: "",
    stato_pagamento: "non_pagato",
    data_pagamento: new Date().toISOString().split('T')[0],
    note: "",
    ricorrente: false
  });

  useEffect(() => {
    fetchCollaboratori();
    fetchAziende();
  }, []);

  const fetchCollaboratori = async () => {
    try {
      const response = await fetch("/api/lista_collaboratori");
      if (response.ok) {
        const data = await response.json();
        setCollaboratori(data.filter(c => c.status === "attivo"));
      }
    } catch (error) {
      console.error("Errore caricamento collaboratori:", error);
    }
  };

  const fetchAziende = async () => {
    try {
      const response = await fetch("/api/lista_aziende");
      if (response.ok) {
        const data = await response.json();
        setAziende(data);
      }
    } catch (error) {
      console.error("Errore caricamento aziende:", error);
    }
  };

  const handleDestinatarioChange = (id) => {
    if (formData.destinatario_tipo === "collaboratore") {
      const collab = collaboratori.find(c => c._id === id);
      if (collab) {
        setFormData({
          ...formData,
          destinatario_id: id,
          nome_destinatario: `${collab.nome} ${collab.cognome}`
        });
      }
    } else {
      const azienda = aziende.find(a => a._id === id);
      if (azienda) {
        setFormData({
          ...formData,
          destinatario_id: id,
          nome_destinatario: azienda.etichetta || azienda.ragioneSociale || azienda.nome || ""
        });
      }
    }
  };

  const handleTipoChange = (tipo) => {
    setFormData({
      ...formData,
      destinatario_tipo: tipo,
      destinatario_id: "",
      nome_destinatario: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/pagamenti-nuovi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "uscita",
          ...formData,
          importo: parseFloat(formData.importo)
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUscitaCreata(data);
        onClose();
      } else {
        alert("Errore nella creazione dell'uscita");
      }
    } catch (error) {
      console.error("Errore submit uscita:", error);
      alert("Errore nella creazione dell'uscita");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">📤 Nuova Uscita</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Importo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importo (€) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.importo}
              onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="0.00"
            />
          </div>

          {/* Tipo Destinatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A chi si paga *
            </label>
            <select
              required
              value={formData.destinatario_tipo}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="collaboratore">Collaboratore</option>
              <option value="azienda_esterna">Azienda Esterna</option>
              <option value="servizio_esterno">Servizio Esterno</option>
            </select>
          </div>

          {/* Destinatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.destinatario_tipo === "collaboratore" 
                ? "Seleziona Collaboratore *" 
                : formData.destinatario_tipo === "azienda_esterna"
                ? "Seleziona Azienda *"
                : "Nome Servizio Esterno *"}
            </label>

            {formData.destinatario_tipo === "collaboratore" ? (
              <select
                required
                value={formData.destinatario_id}
                onChange={(e) => handleDestinatarioChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Seleziona collaboratore...</option>
                {collaboratori.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.nome} {c.cognome} - {c.subRole}
                  </option>
                ))}
              </select>
            ) : formData.destinatario_tipo === "azienda_esterna" ? (
              <select
                required
                value={formData.destinatario_id}
                onChange={(e) => handleDestinatarioChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Seleziona azienda...</option>
                {aziende.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.etichetta || a.ragioneSociale || a.nome}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={formData.nome_destinatario}
                onChange={(e) => setFormData({ ...formData, nome_destinatario: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Es: Google Ads, Facebook Ads, Fornitore..."
              />
            )}
          </div>

          {/* Stato Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stato Pagamento
            </label>
            <select
              value={formData.stato_pagamento}
              onChange={(e) => setFormData({ ...formData, stato_pagamento: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="non_pagato">Non Pagato</option>
              <option value="pagato">Pagato</option>
              <option value="ragazzi">Ragazzi</option>
            </select>
          </div>

          {/* Data Pagamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Pagamento
            </label>
            <input
              type="date"
              value={formData.data_pagamento}
              onChange={(e) => setFormData({ ...formData, data_pagamento: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Ricorrente */}
          <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="ricorrente"
              checked={formData.ricorrente}
              onChange={(e) => setFormData({ ...formData, ricorrente: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="ricorrente" className="text-sm font-medium text-gray-700 cursor-pointer">
              🔁 Uscita ricorrente (verrà rigenerata automaticamente ogni mese)
            </label>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note
            </label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
              placeholder="Note aggiuntive..."
            />
          </div>

          {/* Pulsanti */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {isLoading ? "Creazione..." : "Crea Uscita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function FormEntrata({ onClose, onEntrataCreata }) {
  const [isLoading, setIsLoading] = useState(false);
  const [clienti, setClienti] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [servizi, setServizi] = useState([]);
  const [nuovoServizio, setNuovoServizio] = useState("");
  const [mostraAggiungiServizio, setMostraAggiungiServizio] = useState(false);

  const [formData, setFormData] = useState({
    chi_paga: {
      cliente_id: "",
      nome_cliente: "",
      etichetta: "",
      ragione_sociale: ""
    },
    importo: "",
    destinatario_entrata: "collaboratori",
    servizio: "",
    collaboratori: [
      {
        collaboratore_id: "",
        usa_percentuale: true,
        percentuale: null,
        cifra_fissa: null
      }
    ],
    stato_pagamento: "non_pagato",
    data_pagamento: new Date().toISOString().split('T')[0],
    note: ""
  });

  useEffect(() => {
    fetchClienti();
    fetchCollaboratori();
    fetchServizi();
  }, []);

  const fetchClienti = async () => {
    try {
      const response = await fetch("/api/lista_aziende");
      if (response.ok) {
        const data = await response.json();
        setClienti(data);
      }
    } catch (error) {
      console.error("Errore caricamento clienti:", error);
    }
  };

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

  const fetchServizi = async () => {
    try {
      const response = await fetch("/api/servizi");
      if (response.ok) {
        const data = await response.json();
        setServizi(data);
      }
    } catch (error) {
      console.error("Errore caricamento servizi:", error);
    }
  };

  const handleClienteChange = (clienteId) => {
    const cliente = clienti.find(c => c._id === clienteId);
    if (cliente) {
      setFormData({
        ...formData,
        chi_paga: {
          cliente_id: cliente._id,
          nome_cliente: cliente.nome || "",
          etichetta: cliente.etichetta || "",
          ragione_sociale: cliente.ragioneSociale || ""
        }
      });
    }
  };

  const handleCollaboratoreChange = (index, field, value) => {
    const nuoviCollaboratori = [...formData.collaboratori];
    
    if (field === "collaboratore_id") {
      const collab = collaboratori.find(c => c._id === value);
      nuoviCollaboratori[index].collaboratore_id = value;
      // Se usa percentuale, imposta quella del collaboratore di default
      if (nuoviCollaboratori[index].usa_percentuale && collab) {
        nuoviCollaboratori[index].percentuale = collab.percentuale_hoon;
      }
    } else if (field === "usa_percentuale") {
      nuoviCollaboratori[index].usa_percentuale = value;
      if (value) {
        // Imposta percentuale del collaboratore
        const collab = collaboratori.find(c => c._id === nuoviCollaboratori[index].collaboratore_id);
        nuoviCollaboratori[index].percentuale = collab?.percentuale_hoon || 50;
        nuoviCollaboratori[index].cifra_fissa = null;
      } else {
        nuoviCollaboratori[index].percentuale = null;
        nuoviCollaboratori[index].cifra_fissa = 0;
      }
    } else {
      nuoviCollaboratori[index][field] = value;
    }

    setFormData({ ...formData, collaboratori: nuoviCollaboratori });
  };

  const aggiungiCollaboratore = () => {
    setFormData({
      ...formData,
      collaboratori: [
        ...formData.collaboratori,
        {
          collaboratore_id: "",
          usa_percentuale: true,
          percentuale: null,
          cifra_fissa: null
        }
      ]
    });
  };

  const rimuoviCollaboratore = (index) => {
    const nuoviCollaboratori = formData.collaboratori.filter((_, i) => i !== index);
    setFormData({ ...formData, collaboratori: nuoviCollaboratori });
  };

  const handleAggiungiServizio = async () => {
    if (!nuovoServizio.trim()) return;

    try {
      const response = await fetch("/api/servizi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nuovoServizio })
      });

      if (response.ok) {
        await fetchServizi();
        setFormData({ ...formData, servizio: nuovoServizio });
        setNuovoServizio("");
        setMostraAggiungiServizio(false);
      }
    } catch (error) {
      console.error("Errore aggiunta servizio:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/pagamenti-nuovi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "entrata",
          ...formData,
          importo: parseFloat(formData.importo)
        })
      });

      if (response.ok) {
        const data = await response.json();
        onEntrataCreata(data.entrata);
        onClose();
      } else {
        alert("Errore nella creazione dell'entrata");
      }
    } catch (error) {
      console.error("Errore submit entrata:", error);
      alert("Errore nella creazione dell'entrata");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">📥 Nuova Entrata</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Chi Paga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chi Paga (Cliente) *
            </label>
            <select
              required
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleziona cliente...</option>
              {clienti.map(cliente => (
                <option key={cliente._id} value={cliente._id}>
                  {cliente.etichetta || cliente.ragioneSociale || cliente.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Importo Totale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Importo Totale (€) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.importo}
              onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0.00"
            />
          </div>

          {/* Servizio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Servizio *
            </label>
            <div className="flex gap-2">
              <select
                required
                value={formData.servizio}
                onChange={(e) => setFormData({ ...formData, servizio: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleziona servizio...</option>
                {servizi.map(serv => (
                  <option key={serv._id} value={serv.nome}>
                    {serv.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setMostraAggiungiServizio(!mostraAggiungiServizio)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {mostraAggiungiServizio && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={nuovoServizio}
                  onChange={(e) => setNuovoServizio(e.target.value)}
                  placeholder="Nome nuovo servizio..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleAggiungiServizio}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Aggiungi
                </button>
              </div>
            )}
          </div>

          {/* Collaboratori */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Collaboratori di Riferimento *
              </label>
              <button
                type="button"
                onClick={aggiungiCollaboratore}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Aggiungi
              </button>
            </div>

            <div className="space-y-3">
              {formData.collaboratori.map((collab, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      {/* Seleziona Collaboratore */}
                      <select
                        required
                        value={collab.collaboratore_id}
                        onChange={(e) => handleCollaboratoreChange(index, "collaboratore_id", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Seleziona collaboratore...</option>
                        {collaboratori.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.nome} {c.cognome} ({c.percentuale_hoon}%)
                          </option>
                        ))}
                      </select>

                      {/* Tipo Compenso */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={collab.usa_percentuale}
                            onChange={() => handleCollaboratoreChange(index, "usa_percentuale", true)}
                          />
                          <span className="text-sm">Usa percentuale</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={!collab.usa_percentuale}
                            onChange={() => handleCollaboratoreChange(index, "usa_percentuale", false)}
                          />
                          <span className="text-sm">Cifra fissa</span>
                        </label>
                      </div>

                      {/* Input Percentuale o Cifra */}
                      {collab.usa_percentuale ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={collab.percentuale || ""}
                          onChange={(e) => handleCollaboratoreChange(index, "percentuale", parseFloat(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Percentuale %"
                        />
                      ) : (
                        <input
                          type="number"
                          step="0.01"
                          value={collab.cifra_fissa || ""}
                          onChange={(e) => handleCollaboratoreChange(index, "cifra_fissa", parseFloat(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Importo fisso €"
                        />
                      )}
                    </div>

                    {/* Pulsante Rimuovi */}
                    {formData.collaboratori.length > 1 && (
                      <button
                        type="button"
                        onClick={() => rimuoviCollaboratore(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {isLoading ? "Creazione..." : "Crea Entrata"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';

const TabellaGoogleAdsAdmin = () => {
  const [campagne, setCampagne] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStato, setFiltroStato] = useState("tutti");

  useEffect(() => {
    fetchCampagne();
  }, []);

  const fetchCampagne = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-ads');
      if (response.ok) {
        const data = await response.json();
        setCampagne(data);
      }
    } catch (error) {
      console.error("Errore nel caricamento delle campagne:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questa campagna?")) return;

    try {
      const response = await fetch(`/api/google-ads/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCampagne(campagne.filter(c => c._id !== id));
        alert("Campagna eliminata con successo");
      }
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
      alert("Errore nell'eliminazione della campagna");
    }
  };

  const handleToggleField = async (id, field, currentValue) => {
    try {
      const response = await fetch(`/api/google-ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      });

      if (response.ok) {
        const updated = await response.json();
        setCampagne(campagne.map(c => c._id === id ? updated : c));
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento:", error);
    }
  };

  // Filtra campagne in base a ricerca e filtro stato
  const campagneFiltrate = campagne.filter(campagna => {
    const matchSearch = 
      campagna.clienteEtichetta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campagna.collaboratoreNome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campagna.collaboratoreCognome?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchStato = true;
    if (filtroStato === "contattati") {
      matchStato = campagna.contattato;
    } else if (filtroStato === "avviate") {
      matchStato = campagna.campagnaAvviata;
    } else if (filtroStato === "terminate") {
      matchStato = campagna.campagnaTerminata;
    } else if (filtroStato === "attive") {
      matchStato = campagna.campagnaAvviata && !campagna.campagnaTerminata;
    }

    return matchSearch && matchStato;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            📢 Google Ads - Amministrazione
          </h1>
          <button
            onClick={fetchCampagne}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* Statistiche Veloci */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{campagne.length}</div>
            <div className="text-sm text-gray-600">Totale Campagne</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {campagne.filter(c => c.contattato).length}
            </div>
            <div className="text-sm text-gray-600">Contattati</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {campagne.filter(c => c.campagnaAvviata && !c.campagnaTerminata).length}
            </div>
            <div className="text-sm text-gray-600">Attive</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-600">
              {campagne.filter(c => c.campagnaTerminata).length}
            </div>
            <div className="text-sm text-gray-600">Terminate</div>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cerca per cliente o collaboratore..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="tutti">Tutti gli stati</option>
            <option value="contattati">Contattati</option>
            <option value="avviate">Campagne Avviate</option>
            <option value="attive">Campagne Attive</option>
            <option value="terminate">Campagne Terminate</option>
          </select>
        </div>

        {/* Tabella */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-purple-100 border-b-2 border-purple-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Collaboratore</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Contattato</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Campagna Avviata</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Terminata</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Note</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {campagneFiltrate.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    Nessuna campagna trovata
                  </td>
                </tr>
              ) : (
                campagneFiltrate.map((campagna) => (
                  <tr key={campagna._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {campagna.collaboratoreNome} {campagna.collaboratoreCognome}
                      </div>
                      <div className="text-sm text-gray-500">{campagna.collaboratore?.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{campagna.clienteEtichetta}</div>
                      <div className="text-sm text-gray-500">{campagna.cliente?.email}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleField(campagna._id, 'contattato', campagna.contattato)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          campagna.contattato
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {campagna.contattato ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleField(campagna._id, 'campagnaAvviata', campagna.campagnaAvviata)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          campagna.campagnaAvviata
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {campagna.campagnaAvviata ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleToggleField(campagna._id, 'campagnaTerminata', campagna.campagnaTerminata)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          campagna.campagnaTerminata
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {campagna.campagnaTerminata ? 'Sì' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700 max-w-xs truncate">
                        {campagna.note || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleDelete(campagna._id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabellaGoogleAdsAdmin;

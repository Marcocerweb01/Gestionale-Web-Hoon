'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { RefreshCw, Save, CheckCircle } from 'lucide-react';

const VistaGoogleAdsCollaboratore = () => {
  const { data: session } = useSession();
  const [campagne, setCampagne] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState({});

  useEffect(() => {
    if (session?.user?.id) {
      fetchCampagne();
    }
  }, [session]);

  const fetchCampagne = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-ads?collaboratoreId=${session.user.id}`);
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

  const handleToggle = async (id, field, currentValue) => {
    setSalvando(prev => ({ ...prev, [id]: true }));
    
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
      alert("Errore nell'aggiornamento");
    } finally {
      setTimeout(() => {
        setSalvando(prev => ({ ...prev, [id]: false }));
      }, 500);
    }
  };

  const handleNoteChange = async (id, note) => {
    // Aggiorna localmente subito
    setCampagne(campagne.map(c => c._id === id ? { ...c, note } : c));
  };

  const handleNoteSave = async (id, note) => {
    setSalvando(prev => ({ ...prev, [id]: true }));
    
    try {
      const response = await fetch(`/api/google-ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      if (response.ok) {
        const updated = await response.json();
        setCampagne(campagne.map(c => c._id === id ? updated : c));
      }
    } catch (error) {
      console.error("Errore nel salvataggio note:", error);
      alert("Errore nel salvataggio delle note");
    } finally {
      setSalvando(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (campagne.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            📢 Nessuna campagna Google Ads assegnata
          </h2>
          <p className="text-gray-500">
            Contatta l'amministratore per assegnare campagne Google Ads
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            📢 Le Mie Campagne Google Ads
          </h1>
          <button
            onClick={fetchCampagne}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* Statistiche Personali */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {campagne.filter(c => c.contattato).length}
            </div>
            <div className="text-sm text-gray-600">Contattati</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {campagne.filter(c => c.campagnaAvviata && !c.campagnaTerminata).length}
            </div>
            <div className="text-sm text-gray-600">Attive</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {campagne.filter(c => c.campagnaTerminata).length}
            </div>
            <div className="text-sm text-gray-600">Terminate</div>
          </div>
        </div>

        {/* Card Campagne in Layout Orizzontale */}
        <div className="space-y-6">
          {campagne.map((campagna) => (
            <div
              key={campagna._id}
              className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-md p-6 border-2 border-purple-200 hover:border-purple-400 transition-all"
            >
              {/* Nome Cliente */}
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="bg-purple-600 text-white px-3 py-1 rounded-lg mr-3">
                  {campagna.clienteEtichetta}
                </span>
                {salvando[campagna._id] && (
                  <span className="text-green-600 text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Salvato
                  </span>
                )}
              </h3>

              {/* Stati in Riga Orizzontale Compatta */}
              <div className="flex flex-wrap items-center gap-6 mb-4">
                {/* Contattato */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Contattato:</label>
                  <button
                    onClick={() => handleToggle(campagna._id, 'contattato', campagna.contattato)}
                    className={`w-16 h-8 rounded-full transition-all duration-300 relative ${
                      campagna.contattato
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    disabled={salvando[campagna._id]}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        campagna.contattato ? 'transform translate-x-8' : ''
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${campagna.contattato ? 'text-green-700' : 'text-gray-500'}`}>
                    {campagna.contattato ? 'Sì' : 'No'}
                  </span>
                </div>

                {/* Campagna Avviata */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Campagna Avviata:</label>
                  <button
                    onClick={() => handleToggle(campagna._id, 'campagnaAvviata', campagna.campagnaAvviata)}
                    className={`w-16 h-8 rounded-full transition-all duration-300 relative ${
                      campagna.campagnaAvviata
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    disabled={salvando[campagna._id]}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        campagna.campagnaAvviata ? 'transform translate-x-8' : ''
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${campagna.campagnaAvviata ? 'text-blue-700' : 'text-gray-500'}`}>
                    {campagna.campagnaAvviata ? 'Sì' : 'No'}
                  </span>
                </div>

                {/* Terminata */}
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Terminata:</label>
                  <button
                    onClick={() => handleToggle(campagna._id, 'campagnaTerminata', campagna.campagnaTerminata)}
                    className={`w-16 h-8 rounded-full transition-all duration-300 relative ${
                      campagna.campagnaTerminata
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    disabled={salvando[campagna._id]}
                  >
                    <div
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        campagna.campagnaTerminata ? 'transform translate-x-8' : ''
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${campagna.campagnaTerminata ? 'text-red-700' : 'text-gray-500'}`}>
                    {campagna.campagnaTerminata ? 'Sì' : 'No'}
                  </span>
                </div>
              </div>

              {/* Campo Note con Textarea */}
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Note</label>
                <textarea
                  value={campagna.note || ''}
                  onChange={(e) => handleNoteChange(campagna._id, e.target.value)}
                  onBlur={(e) => handleNoteSave(campagna._id, e.target.value)}
                  placeholder="Aggiungi note sulla campagna..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows="3"
                  disabled={salvando[campagna._id]}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VistaGoogleAdsCollaboratore;

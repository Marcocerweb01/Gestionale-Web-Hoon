'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const AddGoogleAdsCollabForm = () => {
  const [formData, setFormData] = useState({
    clienteId: '',
    collaboratoreId: '',
    contattato: false,
    campagnaAvviata: false,
    campagnaTerminata: false,
    note: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [clienti, setClienti] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  
  const [clienteSearch, setClienteSearch] = useState('');
  const [collaboratoreSearch, setCollaboratoreSearch] = useState('');
  
  const [showClientiDropdown, setShowClientiDropdown] = useState(false);
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false);

  const clienteDropdownRef = useRef(null);
  const collaboratoreDropdownRef = useRef(null);

  // Gestione click fuori dai dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setShowClientiDropdown(false);
      }
      if (collaboratoreDropdownRef.current && !collaboratoreDropdownRef.current.contains(event.target)) {
        setShowCollaboratoriDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowClientiDropdown(false);
        setShowCollaboratoriDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientiRes, collaboratoriRes] = await Promise.all([
          fetch('/api/lista_aziende'),
          fetch('/api/lista_collaboratori')
        ]);

        const clientiData = await clientiRes.json();
        const collaboratoriData = await collaboratoriRes.json();

        console.log('📊 Tutti i collaboratori:', collaboratoriData);

        // Filtra solo collaboratori con ruolo "google ads" (case-insensitive)
        const googleAdsCollaboratori = collaboratoriData.filter(collab => {
          // Supporta sia subRoles (array) che subRole (stringa) per retrocompatibilità
          if (collab.subRoles && Array.isArray(collab.subRoles)) {
            const hasGoogleAds = collab.subRoles.some(role => 
              role.toLowerCase() === 'google ads'
            );
            if (hasGoogleAds) {
              console.log('✅ Collaboratore con Google ADS (array):', collab.nome, collab.cognome, collab.subRoles);
            }
            return hasGoogleAds;
          }
          const hasGoogleAds = collab.subRole?.toLowerCase() === 'google ads';
          if (hasGoogleAds) {
            console.log('✅ Collaboratore con Google ADS (single):', collab.nome, collab.cognome, collab.subRole);
          }
          return hasGoogleAds;
        });

        console.log('🎯 Collaboratori Google ADS trovati:', googleAdsCollaboratori.length);

        setClienti(clientiData);
        setCollaboratori(googleAdsCollaboratori);
      } catch (err) {
        console.error('❌ Errore caricamento dati:', err);
        setError('Errore nel caricamento dei dati');
      }
    };

    fetchData();
  }, []);

  const filteredClienti = clienti.filter(cliente => 
    cliente.etichetta?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    cliente.ragioneSociale?.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredCollaboratori = collaboratori.filter(collab => 
    `${collab.nome} ${collab.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.clienteId || !formData.collaboratoreId) {
      setError('Seleziona sia il cliente che il collaboratore');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/google-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la creazione della campagna');
      }

      setSuccess('Campagna Google Ads creata con successo!');
      setFormData({ 
        clienteId: '', 
        collaboratoreId: '', 
        contattato: false,
        campagnaAvviata: false,
        campagnaTerminata: false,
        note: ''
      });
      setClienteSearch('');
      setCollaboratoreSearch('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectCliente = (cliente) => {
    setFormData(prev => ({ ...prev, clienteId: cliente.id }));
    setClienteSearch(cliente.etichetta || cliente.ragioneSociale);
    setShowClientiDropdown(false);
  };

  const selectCollaboratore = (collaboratore) => {
    setFormData(prev => ({ ...prev, collaboratoreId: collaboratore.id }));
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <X className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          ✅ {success}
        </div>
      )}

      {/* Cliente Dropdown */}
      <div className="relative" ref={clienteDropdownRef}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Cliente *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={clienteSearch}
            onChange={(e) => {
              setClienteSearch(e.target.value);
              setShowClientiDropdown(true);
            }}
            onFocus={() => setShowClientiDropdown(true)}
            placeholder="Cerca cliente..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {showClientiDropdown && filteredClienti.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredClienti.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => selectCliente(cliente)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="font-medium text-gray-900">{cliente.etichetta || cliente.ragioneSociale}</div>
                {cliente.email && (
                  <div className="text-sm text-gray-500">{cliente.email}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Collaboratore Dropdown */}
      <div className="relative" ref={collaboratoreDropdownRef}>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Collaboratore Google ADS *
        </label>
        {collaboratori.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
            ⚠️ Non ci sono collaboratori con il ruolo "Google ADS". Assegna il ruolo a un collaboratore prima di creare una campagna.
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={collaboratoreSearch}
                onChange={(e) => {
                  setCollaboratoreSearch(e.target.value);
                  setShowCollaboratoriDropdown(true);
                }}
                onFocus={() => setShowCollaboratoriDropdown(true)}
                placeholder="Cerca collaboratore..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {showCollaboratoriDropdown && filteredCollaboratori.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCollaboratori.map((collaboratore) => (
                  <button
                    key={collaboratore.id}
                    type="button"
                    onClick={() => selectCollaboratore(collaboratore)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="font-medium text-gray-900">
                      {collaboratore.nome} {collaboratore.cognome}
                    </div>
                    <div className="text-sm text-gray-500">{collaboratore.email}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stati Campagna */}
      <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Stato Campagna
        </label>
        
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.contattato}
            onChange={(e) => setFormData(prev => ({ ...prev, contattato: e.target.checked }))}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">✅ Contattato</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.campagnaAvviata}
            onChange={(e) => setFormData(prev => ({ ...prev, campagnaAvviata: e.target.checked }))}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">🚀 Campagna Avviata</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.campagnaTerminata}
            onChange={(e) => setFormData(prev => ({ ...prev, campagnaTerminata: e.target.checked }))}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">🏁 Campagna Terminata</span>
        </label>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Note
        </label>
        <textarea
          value={formData.note}
          onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
          placeholder="Inserisci note sulla campagna..."
          rows="4"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || collaboratori.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Creazione in corso...
          </>
        ) : (
          <>
            📢 Crea Campagna Google ADS
          </>
        )}
      </button>
    </form>
  );
};

export default AddGoogleAdsCollabForm;

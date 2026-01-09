'use client';

import { useState, useEffect, useRef } from 'react';

const AddCollabForm = () => {
  const [formData, setFormData] = useState({
    aziendaId: '',
    collaboratoreId: '',
    note: '',
    numero_appuntamenti:0,
    post_ig_fb:0,
    post_tiktok:0,
    post_linkedin:0,
    post_totali_previsti: 0,
    appuntamenti_totali_previsti: 0,
    durata_contratto: '',
    data_inizio_contratto: '',
    data_fine_contratto: '',
    escludi_reset_trimestrale: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [aziende, setAziende] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  
  const [aziendaSearch, setAziendaSearch] = useState('');
  const [collaboratoreSearch, setCollaboratoreSearch] = useState('');
  
  const [showAziendeDropdown, setShowAziendeDropdown] = useState(false);
  const [showCollaboratoriDropdown, setShowCollaboratoriDropdown] = useState(false);

  // Refs per i dropdown
  const aziendaDropdownRef = useRef(null);
  const collaboratoreDropdownRef = useRef(null);

  // Gestione click fuori dai dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aziendaDropdownRef.current && !aziendaDropdownRef.current.contains(event.target)) {
        setShowAziendeDropdown(false);
      }
      if (collaboratoreDropdownRef.current && !collaboratoreDropdownRef.current.contains(event.target)) {
        setShowCollaboratoriDropdown(false);
      }
    };

    // Gestione tasto ESC
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowAziendeDropdown(false);
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
        const [aziendeRes, collaboratoriRes] = await Promise.all([
          fetch('/api/lista_aziende'),
          fetch('/api/lista_collaboratori')
        ]);

        const aziendeData = await aziendeRes.json();
        const collaboratoriData = await collaboratoriRes.json();

        setAziende(aziendeData);
        setCollaboratori(collaboratoriData);
      } catch (err) {
        setError('Errore nel caricamento dei dati');
      }
    };

    fetchData();
  }, []);

  const filteredAziende = aziende.filter(azienda => 
    azienda.etichetta.toLowerCase().includes(aziendaSearch.toLowerCase())
  );

  const filteredCollaboratori = collaboratori.filter(collab => 
    `${collab.nome} ${collab.cognome}`.toLowerCase().includes(collaboratoreSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/crea_collaborazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Errore durante la creazione della collaborazione');
      }

      setSuccess('Collaborazione creata con successo!');
      setFormData({ aziendaId: '', collaboratoreId: '', note: '',  numero_appuntamenti:'',
        post_ig_fb:'',
        post_tiktok:'',
        post_linkedin:'',
        post_totali_previsti: 0,
        appuntamenti_totali_previsti: 0,
        durata_contratto: '',
        data_inizio_contratto: '',
        data_fine_contratto: '',
        escludi_reset_trimestrale: false});
      setAziendaSearch('');
      setCollaboratoreSearch('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

// Aggiungi questi console.log dopo selectAzienda e selectCollaboratore
const selectAzienda = (azienda) => {
    setFormData(prev => ({ ...prev, aziendaId: azienda.id }));
    console.log(azienda.id)
    setAziendaSearch(azienda.etichetta);
    setShowAziendeDropdown(false);
    console.log('Dopo select azienda:', formData); // Verifica i valori
};

const selectCollaboratore = (collaboratore) => {
    setFormData(prev => ({ ...prev, collaboratoreId: collaboratore.id }));
    setCollaboratoreSearch(`${collaboratore.nome} ${collaboratore.cognome}`);
    setShowCollaboratoriDropdown(false);
    console.log('Dopo select collaboratore:', formData); // Verifica i valori
};

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
     {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📱</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Nuova Collaborazione SMM</h2>
              <p className="text-gray-600 mt-1">Crea una nuova collaborazione per gestioni social </p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Azienda Searchable Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              🏢 Azienda <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={aziendaDropdownRef}>
              <input
                type="text"
                value={aziendaSearch}
                onChange={(e) => {
                  setAziendaSearch(e.target.value);
                  setShowAziendeDropdown(true);
                }}
                onFocus={() => setShowAziendeDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                placeholder="Cerca e seleziona un'azienda..."
              />
              {showAziendeDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredAziende.length > 0 ? (
                    filteredAziende.map((azienda) => (
                      <div
                        key={azienda._id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => selectAzienda(azienda)}
                      >
                        <div className="font-medium text-gray-900">{azienda.etichetta}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">Nessuna azienda trovata</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Collaboratore Searchable Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              📱 Collaboratore <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={collaboratoreDropdownRef}>
              <input
                type="text"
                value={collaboratoreSearch}
                onChange={(e) => {
                  setCollaboratoreSearch(e.target.value);
                  setShowCollaboratoriDropdown(true);
                }}
                onFocus={() => setShowCollaboratoriDropdown(true)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder-gray-400"
                placeholder="Cerca e seleziona un collaboratore..."
              />
              {showCollaboratoriDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {filteredCollaboratori.length > 0 ? (
                    filteredCollaboratori.map((collaboratore) => (
                      <div
                        key={collaboratore._id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() => selectCollaboratore(collaboratore)}
                      >
                        <div className="font-medium text-gray-900">
                          {`${collaboratore.nome} ${collaboratore.cognome}`}
                        </div>
                        <div className="text-sm text-gray-500">{collaboratore.email}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">Nessun collaboratore trovato</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid per i campi numerici */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                📅 Numero Appuntamenti mensili
              </label>
              <input
                type='number'
                min="0"
                name="appuntamenti"
                value={formData.numero_appuntamenti}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_appuntamenti: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ​📁​ Post Instagram & Facebook
              </label>
              <input
                type='number'
                min="0"
                name="post_if&fb"
                value={formData.post_ig_fb}
                onChange={(e) => setFormData(prev => ({ ...prev, post_ig_fb: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ​📁​ Post TikTok
              </label>
              <input
                type='number'
                min="0"
                name="post_tiktok"
                value={formData.post_tiktok}
                onChange={(e) => setFormData(prev => ({ ...prev, post_tiktok: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                ​📁​ Post LinkedIn
              </label>
              <input
                type='number'
                min="0"
                name="post_linkedin"
                value={formData.post_linkedin}
                onChange={(e) => setFormData(prev => ({ ...prev, post_linkedin: Math.max(0, Number(e.target.value))}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="0"
              />
            </div>
          </div>

          {/* Sezione Totali e Contratto */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">📊</span> Gestione Contratto
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📝 Post Totali Previsti
                </label>
                <input
                  type='number'
                  min="0"
                  name="post_totali_previsti"
                  value={formData.post_totali_previsti}
                  onChange={(e) => setFormData(prev => ({ ...prev, post_totali_previsti: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Totale post previsti dal contratto</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📅 Appuntamenti Totali Previsti
                </label>
                <input
                  type='number'
                  min="0"
                  name="appuntamenti_totali_previsti"
                  value={formData.appuntamenti_totali_previsti}
                  onChange={(e) => setFormData(prev => ({ ...prev, appuntamenti_totali_previsti: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500">Totale appuntamenti previsti dal contratto</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  ⏱️ Durata Contratto
                </label>
                <select
                  name="durata_contratto"
                  value={formData.durata_contratto}
                  onChange={(e) => setFormData(prev => ({ ...prev, durata_contratto: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Seleziona durata...</option>
                  <option value="1 mese">1 mese</option>
                  <option value="3 mesi">3 mesi</option>
                  <option value="6 mesi">6 mesi</option>
                  <option value="1 anno">1 anno</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📆 Data Inizio Contratto <span className="text-gray-500">(opzionale)</span>
                </label>
                <input
                  type='date'
                  name="data_inizio_contratto"
                  value={formData.data_inizio_contratto}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_inizio_contratto: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700">
                  📆 Data Fine Contratto <span className="text-gray-500">(opzionale)</span>
                </label>
                <input
                  type='date'
                  name="data_fine_contratto"
                  value={formData.data_fine_contratto}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_fine_contratto: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Checkbox per escludere dal reset trimestrale */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="escludi_reset_trimestrale"
                    checked={formData.escludi_reset_trimestrale}
                    onChange={(e) => setFormData(prev => ({ ...prev, escludi_reset_trimestrale: e.target.checked }))}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    📊 Escludi dal reset trimestrale
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-8">Se attivo, i contatori trimestrali di questa collaborazione non verranno azzerati con il reset trimestrale</p>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              📝 Note <span className="text-gray-500">(opzionale)</span>
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              rows={4}
              placeholder="Inserisci eventuali note aggiuntive..."
            />
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-green-500 mr-2">✅</div>
                <p className="text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !formData.aziendaId || !formData.collaboratoreId}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creazione in corso...
                </>
              ) : (
                <>
                  <span className="mr-2">👥</span>
                  Crea Collaborazione
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCollabForm;
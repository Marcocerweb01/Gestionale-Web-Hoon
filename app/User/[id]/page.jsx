"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TimelineWebDesigner from "@/Components/timeline-web-designer"; // Dashboard per Web Designer
import FeedCommerciale from "@/Components/feed-commerciale"; // Dashboard per Commerciali
import AdminCollaborationsList from "@/Components/edit-collab"; // Dashboard per Social Media Manager
import AziendaCollab from "@/Components/azienda-collab"; // Dashboard per Cliente

const UserDetails = ({ params }) => {
  const { id } = params; // ID utente dalla route
  const [user, setUser] = useState(null);
  const [collaborazioni, setCollab] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({}); // Stato del form per modifica
  const [fatture, setFatture] = useState([]); // Stato per fatture
  const [loadingFatture, setLoadingFatture] = useState(false); // Loading fatture
  const { data: session, status } = useSession();
  const router = useRouter();

  // Funzione per recuperare le fatture del collaboratore
  const fetchFatture = async () => {
    if (!id) return;
    
    try {
      setLoadingFatture(true);
      const response = await fetch(`/api/fatturazione/collaboratore/${id}`);
      if (!response.ok) {
        throw new Error("Errore nel recupero delle fatture");
      }
      const data = await response.json();
      console.log('📊 Fatture recuperate:', data);
      setFatture(data);
    } catch (err) {
      console.error("Errore recupero fatture:", err);
    } finally {
      setLoadingFatture(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          throw new Error("Errore nel recupero dei dettagli utente");
        }
        const data = await response.json();
        
        console.log('👤 Utente caricato:', data);
        console.log('🔍 SubRole:', data.subRole || data.subrole);
        console.log('🔍 Ha subRole?', !!(data.subRole || data.subrole));
        
        // ✨ Assicurati che noteAmministratore sia sempre presente
        if ((data.subRole || data.subrole) && !data.noteAmministratore) {
          data.noteAmministratore = "";
        }
        
        setUser(data);
        setFormData(data); // Imposta i dati iniziali del form
        
        // Se è un collaboratore, carica le fatture
        if (data.subRole || data.subrole) {
          console.log('✅ È un collaboratore, carico le fatture...');
          fetchFatture();
        } else {
          console.log('❌ NON è un collaboratore, niente fatture');
        }
      } catch (err) {
        console.error(err);
        setError("Non è stato possibile recuperare i dettagli utente.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCollab = async () => {
      try {
        const response = await fetch(`/api/collaborazioni/clienti/${id}`);
        if (!response.ok) {
          throw new Error("Errore nel recupero delle collaborazioni");
        }
        const data = await response.json();
        setCollab(data);
      } catch (err) {
        console.error(err);
        setError("Non è stato possibile recuperare le collaborazioni.");
      }
    };

    if (id) {
      fetchUser();
      fetchCollab();
    }
  }, [id]);

  // Funzione per aggiornare lo stato fattura del collaboratore
  const handleToggleStatoEmissione = async (fatturaId, statoAttuale) => {
    try {
      const nuovoStato = statoAttuale === "non emessa" ? "emessa" : "non emessa";
      
      const response = await fetch(`/api/fatturazione/${fatturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statoCollaboratore: nuovoStato })
      });

      if (response.ok) {
        fetchFatture(); // Ricarica le fatture
      } else {
        alert("Errore durante l'aggiornamento dello stato");
      }
    } catch (err) {
      console.error("Errore:", err);
      alert("Errore durante l'aggiornamento dello stato");
    }
  };

  // Formatta mese da YYYY-MM a "Mese Anno"
  const formatMese = (mese) => {
    const [anno, meseNum] = mese.split('-');
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${mesi[parseInt(meseNum) - 1]} ${anno}`;
  };

  // Gestione input del form
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Campo modificato: ${name} = "${value}"`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Salva modifiche
  const handleSave = async () => {
    try {
      console.log('📤 Dati inviati per il salvataggio:', formData);
      
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento dell'utente");
      }

      const updatedUser = await response.json();
      console.log('✅ Utente aggiornato ricevuto dal server:', updatedUser);
      setUser(updatedUser);
      setFormData(updatedUser); // ✨ Aggiorna anche formData con i dati salvati
      setEditMode(false); // Esci dalla modalità modifica
    } catch (err) {
      console.error(err);
      setError("Non è stato possibile aggiornare i dettagli utente.");
    }
  };

  // Toggle rapido dello status
  const toggleStatus = async () => {
    try {
      const newStatus = user.status === 'attivo' ? 'non_attivo' : 'attivo';
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Errore durante l'aggiornamento dello status");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setFormData(updatedUser);
      
      // ✨ FORZA AGGIORNAMENTO GLOBALE IMMEDIATO
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('collaboratori-updated'));
        // Doppio trigger per sicurezza in produzione
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('collaboratori-updated'));
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError("Non è stato possibile aggiornare lo status del collaboratore.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dettagli utente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-xl mr-2">⚠️</span>
            <h3 className="text-lg font-semibold text-red-800">Errore</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Sezione dettagli utente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 sm:mb-8">
          {/* Header della card - Ottimizzato per mobile */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center bg-slate-400 text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">
                    {editMode ? "🔧 Modifica Utente" : "👤 Dettagli Utente"}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                    <p className="text-gray-600 text-sm sm:text-base truncate">
                      {user?.subRole && `${user.subRole} • `}
                      {user?.subrole && `${user.subrole} • `}
                      {user?.email}
                    </p>
                    {(user?.subRole || user?.subrole) && (
                      <a
                        href="#fatturazione"
                        className="inline-flex items-center px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-semibold rounded-full transition-colors self-start"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('fatturazione')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        💰 Le mie fatture
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              {session?.user?.role === "amministratore" && !editMode && (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {user?.subRole && (
                    <button
                      onClick={() => toggleStatus()}
                      className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                        user.status === 'attivo' 
                          ? 'bg-red-500 hover:bg-red-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {user.status === 'attivo' ? '🔴 Disattiva' : '🟢 Attiva'}
                    </button>
                  )}
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    ✏️ Modifica
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenuto della card - Ottimizzato per mobile */}
          <div className="p-4 sm:p-6">
            {user && (
              <div>
                {editMode ? (
                  <form className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {typeof user.etichetta !== "undefined" && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            🏷️ Etichetta
                          </label>
                          <input
                            type="text"
                            name="etichetta"
                            value={formData.etichetta || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                            placeholder="Inserisci etichetta"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          👤 Nome *
                        </label>
                        <input
                          type="text"
                          name="nome"
                          value={formData.nome || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          placeholder="Inserisci nome"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          👤 Cognome *
                        </label>
                        <input
                          type="text"
                          name="cognome"
                          value={formData.cognome || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          placeholder="Inserisci cognome"
                          required
                        />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          📧 Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ""}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          placeholder="Inserisci email"
                          required
                        />
                      </div>
                      
                      {user.subRole && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            💼 Ruolo
                          </label>
                          <select
                            name="subRole"
                            value={formData.subRole || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          >
                            <option value="commerciale">💼 Commerciale</option>
                            <option value="smm">📱 Social Media Manager</option>
                            <option value="web designer">💻 Web Designer</option>
                          </select>
                        </div>
                      )}
                      
                      {user.subRole && session?.user?.role === "amministratore" && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            🔄 Status Collaboratore
                          </label>
                          <select
                            name="status"
                            value={formData.status || "attivo"}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          >
                            <option value="attivo">🟢 Attivo - Il collaboratore può accedere normalmente</option>
                            <option value="non_attivo">🔴 Non Attivo - Il collaboratore non può accedere</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            ⚠️ <strong>Importante:</strong> I collaboratori con status &quot;Non Attivo&quot; non potranno effettuare il login
                          </p>
                        </div>
                      )}
                      
                      {user.subRole && session?.user?.role === "amministratore" && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            📝 Note Amministratore
                          </label>
                          <textarea
                            name="noteAmministratore"
                            value={formData.noteAmministratore || ""}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base resize-none"
                            placeholder="Inserisci note private sul collaboratore (visibili solo agli amministratori)..."
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            🔒 Queste note sono <strong>private</strong> e visibili solo agli amministratori
                          </p>
                        </div>
                      )}
                      
                      {user.partitaIva && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            📄 Partita IVA
                          </label>
                          <input
                            type="text"
                            name="partitaIva"
                            value={formData.partitaIva || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                            placeholder="Inserisci partita IVA"
                          />
                        </div>
                      )}
                      
                      {user.ragioneSociale && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            🏢 Ragione Sociale
                          </label>
                          <input
                            type="text"
                            name="ragioneSociale"
                            value={formData.ragioneSociale || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                            placeholder="Inserisci ragione sociale"
                          />
                        </div>
                      )}
                      
                      {user.indirizzo && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            📍 Indirizzo
                          </label>
                          <input
                            type="text"
                            name="indirizzo"
                            value={formData.indirizzo || ""}
                            onChange={handleChange}
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                            placeholder="Inserisci indirizzo"
                          />
                        </div>
                      )}
                      
                      {typeof user.pagamento !== "undefined" && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-semibold text-gray-900 mb-2">
                            💳 Stato Pagamento
                          </label>
                          <select
                            name="pagamento"
                            value={formData.pagamento ? "pagato" : "non pagato"}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                pagamento: e.target.value === "pagato",
                              }))
                            }
                            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-base"
                          >
                            <option value="pagato">✅ Pagato</option>
                            <option value="non pagato">❌ Non Pagato</option>
                          </select>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-base touch-manipulation order-2 sm:order-1 m-3"
                      >
                        ✅ Salva Modifiche
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors text-base touch-manipulation order-1 sm:order-2 m-3"
                      >
                        ❌ Annulla
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {typeof user.etichetta !== "undefined" && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">🏷️</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Etichetta</p>
                            <p className="font-semibold text-gray-900 truncate">{user.etichetta}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg flex-shrink-0">👤</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Nome Completo</p>
                          <p className="font-semibold text-gray-900 truncate">{user.nome} {user.cognome}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg flex-shrink-0">📧</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {user.subRole && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">💼</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Ruolo</p>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {user.subRole === 'web designer' ? '💻 Web Designer' : 
                               user.subRole === 'smm' ? '📱 Social Media Manager' : 
                               user.subRole === 'commerciale' ? '💼 Commerciale' : user.subRole}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.subRole && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">🔄</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Status</p>
                            <p className={`font-semibold text-sm sm:text-base flex items-center space-x-1 ${
                              user.status === 'attivo' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <span>{user.status === 'attivo' ? '🟢' : '🔴'}</span>
                              <span>{user.status === 'attivo' ? 'Attivo' : 'Non Attivo'}</span>
                            </p>
                            {user.status === 'non_attivo' && (
                              <p className="text-xs text-red-500 mt-1">⚠️ Non può accedere al sistema</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.subRole && user.noteAmministratore && session?.user?.role === "amministratore" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-3">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg flex-shrink-0">📝</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                              Note Amministratore 
                              <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">🔒 Privato</span>
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{user.noteAmministratore}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.partitaIva && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">📄</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Partita IVA</p>
                            <p className="font-semibold text-gray-900 truncate">{user.partitaIva}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.ragioneSociale && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">🏢</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Ragione Sociale</p>
                            <p className="font-semibold text-gray-900 truncate">{user.ragioneSociale}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {user.indirizzo && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">📍</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Indirizzo</p>
                            <p className="font-semibold text-gray-900 text-sm break-words">{user.indirizzo}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {typeof user.pagamento !== "undefined" && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg flex-shrink-0">💳</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-600">Stato Pagamento</p>
                            <p className={`font-semibold ${user.pagamento ? 'text-green-600' : 'text-red-600'}`}>
                              {user.pagamento ? '✅ Pagato' : '❌ Non Pagato'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sezione Dashboard/Collaborazioni - Ottimizzata per mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header della dashboard */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <span className="text-xl sm:text-2xl">📊</span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Dashboard Collaborazioni</h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {(user?.subRole === "web designer" || user?.subrole === "web designer") && "Gestisci i tuoi progetti di web design"}
                  {(user?.subRole === "commerciale" || user?.subrole === "commerciale") && "Monitora le tue attività commerciali"}
                  {(user?.subRole === "smm" || user?.subrole === "smm") && "Gestisci le campagne social media"}
                  {user?.ragioneSociale && "Vista collaborazioni aziendali"}
                </p>
              </div>
            </div>
          </div>

          {/* Contenuto della dashboard */}
          <div className="p-4 sm:p-6">
            {/* Render condizionale in base al ruolo */}
            {(user?.subRole === "web designer" || user?.subrole === "web designer") && (
              <TimelineWebDesigner userId={user._id} />
            )}

            {(user?.subRole === "commerciale" || user?.subrole === "commerciale") && (
              <FeedCommerciale id={user._id} />
            )}

            {(user?.subRole === "smm" || user?.subrole === "smm") && (
              <AdminCollaborationsList id={user._id} amministratore={false} />
            )}

            {user?.ragioneSociale && (
              <AziendaCollab aziendaId={user._id} />
            )}

            {/* Messaggio di fallback - Ottimizzato per mobile */}
            {!["web designer", "commerciale", "smm"].includes(user?.subRole || user?.subrole) && !user?.ragioneSociale && (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                  <span className="text-xl sm:text-2xl">📋</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nessuna Dashboard Disponibile</h3>
                <p className="text-gray-500 text-sm sm:text-base px-4">Non ci sono dashboard specifiche disponibili per questo tipo di utente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sezione Fatturazione - Solo per collaboratori */}
        {/* COMMENTATO: Non più necessario, storico fatture ora nella pagina Fatturazione
        {(user?.subRole || user?.subrole) && (
          <div id="fatturazione" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-20">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <span className="text-xl sm:text-2xl">💰</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Fatturazione</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Storico delle tue fatture mensili
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {loadingFatture ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Caricamento fatture...</div>
                </div>
              ) : fatture.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                    <span className="text-xl">📄</span>
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Nessuna Fattura</h3>
                  <p className="text-gray-500 text-sm">Non sono ancora state generate fatture per il tuo account.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fatture.map((fattura) => (
                    <div
                      key={fattura.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">📅</span>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatMese(fattura.mese)}
                            </h3>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 font-medium min-w-[100px]">Totale:</span>
                              {fattura.totale !== null ? (
                                <span className="text-lg font-bold text-green-600">
                                  € {fattura.totale.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">
                                  ⏳ Non ancora disponibile
                                </span>
                              )}
                            </div>

                            {fattura.totale !== null && (
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 font-medium min-w-[100px]">Emissione:</span>
                                  <button
                                    onClick={() => handleToggleStatoEmissione(fattura.id, fattura.statoCollaboratore)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                                      fattura.statoCollaboratore === "emessa"
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    }`}
                                  >
                                    {fattura.statoCollaboratore === "emessa" ? "✅ Emessa" : "⏳ Non Emessa"}
                                  </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 font-medium min-w-[100px]">Pagamento:</span>
                                  <span
                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                      fattura.statoAmministratore === "pagata"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {fattura.statoAmministratore === "pagata" ? "✅ Pagata" : "⏳ Non Pagata"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {fattura.totale !== null && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            💡 Clicca su &quot;Non Emessa&quot; quando hai emesso la fattura. Lo stato pagamento verrà aggiornato dall&apos;amministratore.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
};

export default UserDetails;

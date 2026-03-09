'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from '@/Components/Header';
import { Users, Trash2, ArrowLeft, ChevronDown, ChevronUp, Facebook, Globe, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function GestioneCollaborazioniUtentePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [utenteEspanso, setUtenteEspanso] = useState(null);
  const [eliminandoCollab, setEliminandoCollab] = useState(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "amministratore") {
      caricaDati();
    }
  }, [status, session]);

  const caricaDati = async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/collaborazioni-utente');
      if (res.ok) {
        const data = await res.json();
        setUtenti(data);
      } else {
        console.error("Errore caricamento collaborazioni");
      }
    } catch (error) {
      console.error("Errore caricamento dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminaCollaborazione = async (collabId, tipo, utenteRagioneSociale) => {
    const tipoNome = tipo === 'social' ? 'Social' : tipo === 'webdesign' ? 'Web Design' : 'Google Ads';
    
    if (!confirm(`Sei sicuro di voler eliminare questa collaborazione ${tipoNome} per ${utenteRagioneSociale}?`)) {
      return;
    }
    
    try {
      setEliminandoCollab(collabId);
      
      const res = await fetch(`/api/collaborazioni-utente/${tipo}/${collabId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Ricarica i dati
        await caricaDati();
      } else {
        alert("Errore durante l'eliminazione");
      }
    } catch (error) {
      console.error("Errore eliminazione collaborazione:", error);
      alert("Errore durante l'eliminazione");
    } finally {
      setEliminandoCollab(null);
    }
  };

  const toggleUtente = (userId) => {
    setUtenteEspanso(utenteEspanso === userId ? null : userId);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "amministratore") {
    router.push("/Login");
    return null;
  }

  // Filtra gli utenti che hanno almeno una collaborazione
  const utentiConCollaborazioni = utenti.filter(
    u => u.social.length > 0 || u.webDesign.length > 0 || u.googleAds.length > 0
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Link>
            
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Gestione Collaborazioni per Utente
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Visualizza e gestisci tutte le collaborazioni di ogni cliente
            </p>
          </div>

          {/* Statistiche */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Clienti Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{utentiConCollaborazioni.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Collab. Social</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {utentiConCollaborazioni.reduce((acc, u) => acc + u.social.length, 0)}
                  </p>
                </div>
                <Facebook className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Collab. Siti</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {utentiConCollaborazioni.reduce((acc, u) => acc + u.webDesign.length, 0)}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Collab. Marketing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {utentiConCollaborazioni.reduce((acc, u) => acc + u.googleAds.length, 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Lista Utenti */}
          {utentiConCollaborazioni.length > 0 ? (
            <div className="space-y-4">
              {utentiConCollaborazioni.map((utente) => {
                const totalCollab = utente.social.length + utente.webDesign.length + utente.googleAds.length;
                const isExpanded = utenteEspanso === utente._id;
                
                return (
                  <div
                    key={utente._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                  >
                    {/* Header Utente */}
                    <div 
                      onClick={() => toggleUtente(utente._id)}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {utente.ragioneSociale}
                        </h3>
                        <p className="text-sm text-gray-600">{utente.email}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-4 mr-4">
                          {utente.social.length > 0 && (
                            <span className="flex items-center space-x-1 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                              <Facebook className="w-4 h-4" />
                              <span>{utente.social.length}</span>
                            </span>
                          )}
                          {utente.webDesign.length > 0 && (
                            <span className="flex items-center space-x-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                              <Globe className="w-4 h-4" />
                              <span>{utente.webDesign.length}</span>
                            </span>
                          )}
                          {utente.googleAds.length > 0 && (
                            <span className="flex items-center space-x-1 text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                              <TrendingUp className="w-4 h-4" />
                              <span>{utente.googleAds.length}</span>
                            </span>
                          )}
                        </div>
                        
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Dettaglio Collaborazioni */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-6">
                        {/* Collaborazioni Social */}
                        {utente.social.length > 0 && (
                          <div>
                            <h4 className="flex items-center space-x-2 text-lg font-semibold text-purple-700 mb-3">
                              <Facebook className="w-5 h-5" />
                              <span>Collaborazioni Social ({utente.social.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {utente.social.map((collab) => (
                                <div
                                  key={collab._id}
                                  className="bg-white rounded-lg border border-purple-200 p-4 flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      Collaboratore: {collab.collaboratore}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        collab.stato === 'attiva' ? 'bg-green-100 text-green-700' :
                                        collab.stato === 'terminata' ? 'bg-gray-100 text-gray-700' :
                                        'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {collab.stato}
                                      </span>
                                      <span>Inizio: {new Date(collab.dataInizio).toLocaleDateString('it-IT')}</span>
                                      {collab.dataFine && (
                                        <span>Fine: {new Date(collab.dataFine).toLocaleDateString('it-IT')}</span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleEliminaCollaborazione(collab._id, 'social', utente.ragioneSociale)}
                                    disabled={eliminandoCollab === collab._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Elimina collaborazione"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collaborazioni Web Design */}
                        {utente.webDesign.length > 0 && (
                          <div>
                            <h4 className="flex items-center space-x-2 text-lg font-semibold text-green-700 mb-3">
                              <Globe className="w-5 h-5" />
                              <span>Collaborazioni Siti Web ({utente.webDesign.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {utente.webDesign.map((collab) => (
                                <div
                                  key={collab._id}
                                  className="bg-white rounded-lg border border-green-200 p-4 flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      Web Designer: {collab.collaboratore}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {collab.tipoProgetto}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        collab.stato === 'in corso' ? 'bg-green-100 text-green-700' :
                                        collab.stato === 'terminata' ? 'bg-gray-100 text-gray-700' :
                                        'bg-yellow-100 text-yellow-700'
                                      }`}>
                                        {collab.stato}
                                      </span>
                                      <span>{new Date(collab.dataInizioContratto).toLocaleDateString('it-IT')} - {new Date(collab.dataFineContratto).toLocaleDateString('it-IT')}</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleEliminaCollaborazione(collab._id, 'webdesign', utente.ragioneSociale)}
                                    disabled={eliminandoCollab === collab._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Elimina collaborazione"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collaborazioni Google Ads */}
                        {utente.googleAds.length > 0 && (
                          <div>
                            <h4 className="flex items-center space-x-2 text-lg font-semibold text-orange-700 mb-3">
                              <TrendingUp className="w-5 h-5" />
                              <span>Collaborazioni Marketing ({utente.googleAds.length})</span>
                            </h4>
                            <div className="space-y-2">
                              {utente.googleAds.map((collab) => (
                                <div
                                  key={collab._id}
                                  className="bg-white rounded-lg border border-orange-200 p-4 flex items-center justify-between"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      Collaboratore: {collab.collaboratore}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                      {collab.contattato && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                          Contattato
                                        </span>
                                      )}
                                      {collab.campagnaAvviata && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                          Campagna avviata
                                        </span>
                                      )}
                                      {collab.campagnaTerminata && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                          Campagna terminata
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleEliminaCollaborazione(collab._id, 'googleads', utente.ragioneSociale)}
                                    disabled={eliminandoCollab === collab._id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Elimina collaborazione"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                Nessun cliente con collaborazioni attive al momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const GestioneDomini = () => {
  const [domini, setDomini] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('tutti'); // tutti, in_scadenza, scaduti, ok
  const [invioAlert, setInvioAlert] = useState(false);
  const [messaggioAlert, setMessaggioAlert] = useState(null);

  useEffect(() => {
    caricaDomini();
  }, []);

  const caricaDomini = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/domini/scadenze');
      if (!response.ok) throw new Error('Errore nel caricamento dei domini');
      
      const data = await response.json();
      setDomini(data);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviaAlertManuali = async () => {
    try {
      setInvioAlert(true);
      const response = await fetch('/api/domini/scadenze', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Errore invio alert');
      
      const data = await response.json();
      setMessaggioAlert({
        tipo: 'success',
        testo: data.message
      });
      
      // Ricarica i domini
      await caricaDomini();
      
      // Nascondi messaggio dopo 5 secondi
      setTimeout(() => setMessaggioAlert(null), 5000);
    } catch (error) {
      console.error('Errore:', error);
      setMessaggioAlert({
        tipo: 'error',
        testo: 'Errore nell\'invio degli alert'
      });
    } finally {
      setInvioAlert(false);
    }
  };

  const dominiFiltrati = domini.filter(dominio => {
    if (!dominio.dominio?.dataScadenza) return false;
    
    if (filtro === 'in_scadenza') return dominio.inScadenza && !dominio.scaduto;
    if (filtro === 'scaduti') return dominio.scaduto;
    if (filtro === 'ok') return !dominio.inScadenza && !dominio.scaduto;
    return true; // tutti
  });

  const statistiche = {
    totali: domini.filter(d => d.dominio?.dataScadenza).length,
    inScadenza: domini.filter(d => d.inScadenza && !d.scaduto).length,
    scaduti: domini.filter(d => d.scaduto).length,
    ok: domini.filter(d => !d.inScadenza && !d.scaduto && d.dominio?.dataScadenza).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600 text-lg">Caricamento domini...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🌐 Gestione Domini</h1>
          <p className="text-gray-600">Monitora le scadenze dei domini dei tuoi clienti</p>
        </div>

        {/* Messaggio Alert */}
        {messaggioAlert && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messaggioAlert.tipo === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {messaggioAlert.testo}
          </div>
        )}

        {/* Cards Statistiche - Sempre in Orizzontale */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 xl:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <p className="text-xs md:text-sm text-gray-600 mb-1">Totali</p>
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-gray-900">{statistiche.totali}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <p className="text-xs md:text-sm text-orange-600 mb-1 font-medium">In Scadenza</p>
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-orange-600">{statistiche.inScadenza}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <p className="text-xs md:text-sm text-red-600 mb-1 font-medium">Scaduti</p>
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-red-600">{statistiche.scaduti}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-4 md:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <p className="text-xs md:text-sm text-green-600 mb-1 font-medium">OK</p>
              <p className="text-xl md:text-2xl xl:text-3xl font-bold text-green-600">{statistiche.ok}</p>
            </div>
          </div>
        </div>

        {/* Azioni e Filtri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro('tutti')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === 'tutti'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutti ({statistiche.totali})
              </button>
              <button
                onClick={() => setFiltro('in_scadenza')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === 'in_scadenza'
                    ? 'bg-orange-100 text-orange-700 border border-orange-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Scadenza ({statistiche.inScadenza})
              </button>
              <button
                onClick={() => setFiltro('scaduti')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === 'scaduti'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Scaduti ({statistiche.scaduti})
              </button>
              <button
                onClick={() => setFiltro('ok')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtro === 'ok'
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                OK ({statistiche.ok})
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={caricaDomini}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Ricarica
              </button>
              <button
                onClick={inviaAlertManuali}
                disabled={invioAlert || statistiche.inScadenza === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {invioAlert ? 'Invio in corso...' : 'Invia Alert Manuale'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabella Domini */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Dominio</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Web Designer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Acquisto</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data Scadenza</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dominiFiltrati.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Nessun dominio trovato con i filtri selezionati
                    </td>
                  </tr>
                ) : (
                  dominiFiltrati.map((dominio) => (
                    <tr key={dominio._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{dominio.cliente.etichetta}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {dominio.dominio.urlDominio ? (
                            <>
                              <span className="text-gray-900">{dominio.dominio.urlDominio}</span>
                              <a 
                                href={`https://${dominio.dominio.urlDominio}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Non specificato</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {dominio.webDesigner.nome} {dominio.webDesigner.cognome}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {dominio.dominio.dataAcquisto 
                            ? new Date(dominio.dominio.dataAcquisto).toLocaleDateString('it-IT')
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 font-medium">
                          {new Date(dominio.dominio.dataScadenza).toLocaleDateString('it-IT')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {dominio.scaduto ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            🚨 Scaduto ({Math.abs(dominio.giorniMancanti)}gg fa)
                          </span>
                        ) : dominio.inScadenza ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            ⚠️ {dominio.giorniMancanti} giorni
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✅ OK ({dominio.giorniMancanti} giorni)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/User/${dominio.webDesigner._id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          Visualizza →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestioneDomini;

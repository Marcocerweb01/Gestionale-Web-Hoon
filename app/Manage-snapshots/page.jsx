"use client";

import { useState, useEffect } from 'react';

export default function ManageSnapshots() {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const months = [
    { value: 0, name: 'Gennaio' },
    { value: 1, name: 'Febbraio' },
    { value: 2, name: 'Marzo' },
    { value: 3, name: 'Aprile' },
    { value: 4, name: 'Maggio' },
    { value: 5, name: 'Giugno' },
    { value: 6, name: 'Luglio' },
    { value: 7, name: 'Agosto' },
    { value: 8, name: 'Settembre' },
    { value: 9, name: 'Ottobre' },
    { value: 10, name: 'Novembre' },
    { value: 11, name: 'Dicembre' }
  ];

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manage-snapshots');
      const data = await response.json();
      
      if (data.success) {
        setSnapshots(data.snapshots);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Errore nel caricamento degli snapshot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSnapshot = async (month, year, monthName) => {
    if (!confirm(`Sei sicuro di voler eliminare lo snapshot per ${monthName}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/manage-snapshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          month: month,
          year: year
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        loadSnapshots(); // Ricarica la lista
      } else {
        alert(`Errore: ${data.error}`);
      }
    } catch (err) {
      alert('Errore nell\'eliminazione dello snapshot');
      console.error(err);
    }
  };

  const downloadCurrentMonth = () => {
    // Scarica il mese corrente (sempre aggiornato)
    const url = '/api/export_data';
    window.open(url, '_blank');
  };

  const downloadSnapshot = (month, year, monthName) => {
    // Scarica uno snapshot specifico
    const url = `/api/export_data?month=${month}&year=${year}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento snapshot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestione Snapshot Collaborazioni</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Sezione Scarica Mese Corrente */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">� Scarica Mese Corrente</h2>
            <p className="text-sm text-gray-600 mb-3">
              Scarica i dati del mese in corso con lo stato attuale (aggiornato in tempo reale).
              <br />
              <strong>💡 Perfetto per:</strong> Controlli intermedi, report parziali, backup durante il mese.
            </p>
            <div className="bg-green-100 p-2 rounded mb-3 text-sm">
              <strong>📅 Oggi:</strong> Scarichi tutti i dati di Agosto 2025 fino ad oggi (29 Agosto).
            </div>
            <button 
              onClick={() => downloadCurrentMonth()} 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 font-semibold"
            >
              📊 Scarica Agosto 2025 (Stato Corrente)
            </button>
          </div>

          {/* Lista Snapshot Storici */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              📚 Snapshot Storici ({snapshots.length})
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Tutti gli snapshot dei mesi passati, creati automaticamente il 1° di ogni mese.
            </p>
            
            {snapshots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                📭 Nessun snapshot storico trovato.<br />
                <small>I mesi passati appariranno qui automaticamente dopo il 1° del mese.</small>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 text-left">Mese/Anno</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Collaborazioni</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Stato</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Ultimo Aggiornamento</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((snapshot) => (
                      <tr key={snapshot.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          {snapshot.meseNome}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {snapshot.numeroCollaborazioni}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            snapshot.stato === 'attivo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : snapshot.stato === 'completato'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {snapshot.stato === 'attivo' ? '🔄 In Corso' 
                             : snapshot.stato === 'completato' ? '✅ Completato'
                             : '📦 Esportato'}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                          {new Date(snapshot.dataAggiornamento).toLocaleDateString('it-IT')}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => downloadSnapshot(snapshot.mese, snapshot.anno, snapshot.meseNome)}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              📥 Scarica Excel
                            </button>
                            {snapshot.stato !== 'attivo' && (
                              <button
                                onClick={() => deleteSnapshot(snapshot.mese, snapshot.anno, snapshot.meseNome)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                              >
                                🗑️ Elimina
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Informazioni di Sistema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📋 Come Funziona il Sistema</h2>
          <div className="text-sm text-gray-600 space-y-3">
            
            <div className="bg-blue-50 p-3 rounded">
              <p><strong>🔄 Durante il Mese:</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Gli SMM lavorano normalmente, aggiornando i post fatti</li>
                <li>Puoi scaricare lo "Stato Corrente" in qualsiasi momento</li>
                <li>I dati si aggiornano in tempo reale</li>
              </ul>
            </div>

            <div className="bg-green-50 p-3 rounded">
              <p><strong>🤖 Il 1° del Mese (Automatico):</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Cron job automatico alle 00:01</li>
                <li>Crea lo snapshot del mese precedente (dati fissi)</li>
                <li>Azzera tutti i post_*_fatti per il nuovo mese</li>
                <li>Il mese precedente appare nella lista "Snapshot Storici"</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-3 rounded">
              <p><strong>📥 Download Options:</strong></p>
              <ul className="ml-4 list-disc space-y-1">
                <li><strong>Stato Corrente:</strong> Dati del mese in corso, aggiornati</li>
                <li><strong>Snapshot Storici:</strong> Dati fissi dei mesi completati</li>
                <li>Tutti i download sono in formato Excel</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <p><strong>🛠️ Setup Cron Job:</strong></p>
              <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-2">
                <p># Aggiungi al crontab del server:</p>
                <p>1 0 1 * * curl -X POST https://tuodominio.com/api/cron-monthly</p>
              </div>
              <p className="mt-2"><em>Esegue automaticamente ogni 1° del mese alle 00:01</em></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

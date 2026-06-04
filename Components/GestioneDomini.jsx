'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, Plus, Trash2, Pencil, X, RotateCcw } from 'lucide-react';
import Link from 'next/link';

const formVuoto = (primoDesigner = '') => ({
  urlDominio: '',
  dataScadenza: '',
  webDesigner: primoDesigner,
  isEsterno: false,
  note: '',
});

const GestioneDomini = () => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'amministratore';

  const [domini, setDomini] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('tutti');
  const [filtroDesigner, setFiltroDesigner] = useState('tutti');
  const [messaggioAlert, setMessaggioAlert] = useState(null);

  // Form aggiunta/modifica
  const [mostraForm, setMostraForm] = useState(false);
  const [formData, setFormData] = useState(formVuoto());
  const [modificandoId, setModificandoId] = useState(null);
  const [salvataggio, setSalvataggio] = useState(false);

  // Rinnovo
  const [rinnovoId, setRinnovoId] = useState(null);
  const [rinnovoData, setRinnovoData] = useState('');
  const [salvaRinnovo, setSalvaRinnovo] = useState(false);

  useEffect(() => {
    caricaDomini();
    caricaDesigners();
  }, []);

  const caricaDesigners = async () => {
    try {
      const res = await fetch('/api/domini/webdesigners');
      if (res.ok) {
        const data = await res.json();
        setDesigners(data);
      }
    } catch (e) {
      console.error('Errore carica designers:', e);
    }
  };

  const caricaDomini = async () => {
    try {
      setLoading(true);
      const [resCollab, resStandalone] = await Promise.all([
        fetch('/api/domini/scadenze'),
        fetch('/api/domini'),
      ]);
      const dataCollab = resCollab.ok ? await resCollab.json() : [];
      const dataStandalone = resStandalone.ok ? await resStandalone.json() : [];

      const normCollab = dataCollab.map(c => ({
        _id: c._id,
        clienteNome: c.cliente?.etichetta || c.aziendaRagioneSociale || '-',
        clienteId: c.cliente?._id || null,
        urlDominio: c.dominio?.urlDominio || '',
        webDesignerNome: `${c.webDesigner?.nome || ''} ${c.webDesigner?.cognome || ''}`.trim(),
        webDesignerId: c.webDesigner?._id || null,
        dataAcquisto: c.dominio?.dataAcquisto || null,
        dataScadenza: c.dominio?.dataScadenza,
        giorniMancanti: c.giorniMancanti,
        scaduto: c.scaduto,
        inScadenza: c.inScadenza,
        isEsterno: false,
        note: '',
        fonte: 'collaborazione',
      }));

      const normStandalone = dataStandalone.map(d => ({
        _id: d._id,
        clienteNome: '-',
        clienteId: null,
        urlDominio: d.urlDominio,
        webDesignerNome: d.webDesigner,
        webDesignerId: null,
        dataAcquisto: null,
        dataScadenza: d.dataScadenza,
        giorniMancanti: d.giorniMancanti,
        scaduto: d.scaduto,
        inScadenza: d.inScadenza,
        isEsterno: d.isEsterno,
        note: d.note,
        fonte: 'standalone',
      }));

      const tutti = [...normCollab, ...normStandalone].sort(
        (a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza)
      );
      setDomini(tutti);
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const mostraMessaggio = (tipo, testo) => {
    setMessaggioAlert({ tipo, testo });
    setTimeout(() => setMessaggioAlert(null), 5000);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const apriModifica = (d) => {
    if (d.fonte !== 'standalone') return;
    setFormData({
      urlDominio: d.urlDominio,
      dataScadenza: d.dataScadenza ? new Date(d.dataScadenza).toISOString().split('T')[0] : '',
      webDesigner: d.webDesignerNome,
      isEsterno: d.isEsterno,
      note: d.note,
    });
    setModificandoId(d._id);
    setMostraForm(true);
  };

  const chiudiForm = () => {
    setMostraForm(false);
    setFormData(formVuoto(designers[0] || ''));
    setModificandoId(null);
  };

  const apriRinnovo = (d) => {
    const nuovaScadenza = new Date(d.dataScadenza);
    nuovaScadenza.setFullYear(nuovaScadenza.getFullYear() + 1);
    setRinnovoData(nuovaScadenza.toISOString().split('T')[0]);
    setRinnovoId(d._id);
  };

  const handleRinnovo = async () => {
    if (!rinnovoData) return;
    setSalvaRinnovo(true);
    try {
      const res = await fetch(`/api/domini/${rinnovoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataScadenza: rinnovoData, alertInviato: false }),
      });
      if (!res.ok) throw new Error();
      mostraMessaggio('success', 'Dominio rinnovato!');
      setRinnovoId(null);
      setRinnovoData('');
      await caricaDomini();
    } catch {
      mostraMessaggio('error', 'Errore durante il rinnovo');
    } finally {
      setSalvaRinnovo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvataggio(true);
    try {
      const url = modificandoId ? `/api/domini/${modificandoId}` : '/api/domini';
      const method = modificandoId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Errore salvataggio');
      mostraMessaggio('success', modificandoId ? 'Dominio aggiornato!' : 'Dominio aggiunto!');
      chiudiForm();
      await caricaDomini();
    } catch {
      mostraMessaggio('error', 'Errore durante il salvataggio');
    } finally {
      setSalvataggio(false);
    }
  };

  const handleElimina = async (id) => {
    if (!confirm('Eliminare questo dominio?')) return;
    try {
      const res = await fetch(`/api/domini/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      mostraMessaggio('success', 'Dominio eliminato');
      await caricaDomini();
    } catch {
      mostraMessaggio('error', "Errore durante l'eliminazione");
    }
  };

  const dominiFiltrati = domini.filter(d => {
    if (!d.dataScadenza) return false;
    const passFiltro =
      filtro === 'tutti' ? true :
      filtro === 'in_scadenza' ? (d.inScadenza && !d.scaduto) :
      filtro === 'scaduti' ? d.scaduto :
      (!d.inScadenza && !d.scaduto);
    const passDesigner =
      filtroDesigner === 'tutti' ? true :
      d.webDesignerNome.toLowerCase().includes(filtroDesigner.toLowerCase());
    return passFiltro && passDesigner;
  });

  const statistiche = {
    totali: domini.length,
    inScadenza: domini.filter(d => d.inScadenza && !d.scaduto).length,
    scaduti: domini.filter(d => d.scaduto).length,
    ok: domini.filter(d => !d.inScadenza && !d.scaduto).length,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🌐 Gestione Domini</h1>
            <p className="text-gray-600">Monitora le scadenze dei domini dei tuoi clienti</p>
          </div>
          <button
            onClick={() => { chiudiForm(); setMostraForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Dominio
          </button>
        </div>

        {/* Form aggiunta/modifica */}
        {mostraForm && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {modificandoId ? '✏️ Modifica Dominio' : '➕ Aggiungi Dominio'}
              </h2>
              <button onClick={chiudiForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dominio *</label>
                <input
                  type="text"
                  name="urlDominio"
                  value={formData.urlDominio}
                  onChange={handleFormChange}
                  placeholder="es. miosito.it"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Scadenza *</label>
                <input
                  type="date"
                  name="dataScadenza"
                  value={formData.dataScadenza}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Web Designer *</label>
                <select
                  name="webDesigner"
                  value={formData.webDesigner}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {designers.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleFormChange}
                  placeholder="Annotazioni opzionali"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-4 mt-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isEsterno"
                    checked={formData.isEsterno}
                    onChange={handleFormChange}
                    className="rounded"
                  />
                  Dominio esterno
                </label>
              </div>
              <div className="md:col-span-3 flex gap-3 justify-end">
                <button type="button" onClick={chiudiForm} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={salvataggio}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                >
                  {salvataggio ? 'Salvataggio...' : modificandoId ? 'Salva Modifiche' : 'Aggiungi'}
                </button>
              </div>
            </form>
          </div>
        )}

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

        {/* Cards Statistiche */}
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
              <p className="text-xs md:text-sm text-orange-600 mb-1 font-medium">In Scadenza (60gg)</p>
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

        {/* Filtri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'tutti', label: `Tutti (${statistiche.totali})` },
                { key: 'in_scadenza', label: `⚠️ In Scadenza (${statistiche.inScadenza})` },
                { key: 'scaduti', label: `🚨 Scaduti (${statistiche.scaduti})` },
                { key: 'ok', label: `✅ OK (${statistiche.ok})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtro === f.key
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="border-l border-gray-200 mx-1" />
              {['tutti', ...designers].map(d => (
                <button
                  key={d}
                  onClick={() => setFiltroDesigner(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filtroDesigner === d
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d === 'tutti' ? 'Tutti i designer' : d}
                </button>
              ))}
            </div>
            <button
              onClick={caricaDomini}
              className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabella Domini */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Dominio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Web Designer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Data Scadenza</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Stato</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dominiFiltrati.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Nessun dominio trovato con i filtri selezionati
                    </td>
                  </tr>
                ) : (
                  dominiFiltrati.map(d => (
                    <tr key={`${d.fonte}-${d._id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {d.urlDominio ? (
                            <>
                              <span className="font-medium text-gray-900">{d.urlDominio}</span>
                              <a
                                href={`https://${d.urlDominio}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </>
                          ) : (
                            <span className="text-gray-400 italic text-sm">Non specificato</span>
                          )}
                          {d.isEsterno && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">esterno</span>
                          )}
                        </div>
                        {d.clienteNome !== '-' && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {d.clienteId ? (
                              <Link href={`/User/${d.clienteId}`} className="hover:underline text-indigo-500">{d.clienteNome}</Link>
                            ) : d.clienteNome}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          d.webDesignerNome.toLowerCase().includes('marco')
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {d.webDesignerNome}
                          {d.webDesignerId && (
                            <Link href={`/User/${d.webDesignerId}`} className="text-indigo-400 hover:text-indigo-600 ml-1">↗</Link>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900 font-medium text-sm">
                          {new Date(d.dataScadenza).toLocaleDateString('it-IT')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.scaduto ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🚨 Scaduto ({Math.abs(d.giorniMancanti)}gg fa)
                          </span>
                        ) : d.inScadenza ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ⚠️ {d.giorniMancanti} giorni
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ {d.giorniMancanti}gg
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {d.note || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {d.fonte === 'standalone' && (
                            <>
                              <button
                                onClick={() => apriRinnovo(d)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Rinnova"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => apriModifica(d)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                title="Modifica"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleElimina(d._id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Elimina"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {d.fonte === 'collaborazione' && d.webDesignerId && (
                            <Link
                              href={`/User/${d.webDesignerId}`}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Visualizza →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Rinnovo */}
      {rinnovoId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🔄 Rinnova Dominio</h3>
              <button onClick={() => setRinnovoId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Imposta la nuova data di scadenza. Il ciclo di alert riparte da zero.</p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuova data scadenza</label>
            <input
              type="date"
              value={rinnovoData}
              onChange={e => setRinnovoData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRinnovoId(null)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleRinnovo}
                disabled={salvaRinnovo || !rinnovoData}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {salvaRinnovo ? 'Salvataggio...' : 'Conferma Rinnovo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneDomini;

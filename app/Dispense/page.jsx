'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from '@/Components/Header';
import { BookOpen, ArrowLeft, ChevronDown, ChevronRight, Search, List, Plus, X, Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function DispensePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openCategorie, setOpenCategorie] = useState({});
  const [ricerca, setRicerca] = useState('');
  const [dispense, setDispense] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stati admin
  const [mostraFormItem, setMostraFormItem] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Nuovo item
  const [nuovoItem, setNuovoItem] = useState({ categoria: '', item: '' });
  const [usaNuovaCategoria, setUsaNuovaCategoria] = useState(false);
  const [nuovaCategoriaNome, setNuovaCategoriaNome] = useState('');
  const [nuovaCategoriaIcona, setNuovaCategoriaIcona] = useState('📄');

  // Modifica item
  const [modificandoItem, setModificandoItem] = useState(null);
  const [itemModificato, setItemModificato] = useState('');

  // Modifica categoria
  const [modificandoCategoria, setModificandoCategoria] = useState(null);
  const [nuovoNomeCategoria, setNuovoNomeCategoria] = useState('');
  const [nuovaIconaCategoria, setNuovaIconaCategoria] = useState('');
  const [eliminandoCategoria, setEliminandoCategoria] = useState(null);

  const isAdmin = session?.user?.role === "amministratore";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    } else if (status === "authenticated") {
      pulisciECarica();
    }
  }, [status, session, router]);

  const pulisciECarica = async () => {
    try {
      if (isAdmin) {
        // Prima rimuovi eventuali duplicati (solo admin)
        await fetch('/api/dispense/migra', { method: 'DELETE' });
      }
      // Poi carica i dati
      await caricaDati();
    } catch (error) {
      console.error("Errore pulizia:", error);
      await caricaDati();
    }
  };

  const caricaDati = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dispense');
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          // Prima volta: migra i dati statici
          const resMigra = await fetch('/api/dispense/migra', { method: 'POST' });
          if (resMigra.ok && resMigra.status === 201) {
            const res2 = await fetch('/api/dispense');
            if (res2.ok) {
              setDispense(await res2.json());
            }
          }
        } else {
          setDispense(data);
        }
      }
    } catch (error) {
      console.error("Errore caricamento dispense:", error);
    } finally {
      setLoading(false);
    }
  };

  // Raggruppa dispense per categoria
  const dispensaCategorie = useMemo(() => {
    const map = {};
    dispense.forEach(d => {
      if (!map[d.categoria]) {
        map[d.categoria] = { categoria: d.categoria, icona: d.icona || '📄', items: [] };
      }
      map[d.categoria].items.push(d);
    });
    return Object.values(map);
  }, [dispense]);

  const categorie = useMemo(() => dispensaCategorie.map(c => c.categoria), [dispensaCategorie]);

  const categorieFiltrate = useMemo(() => {
    if (!ricerca.trim()) return dispensaCategorie;
    const q = ricerca.toLowerCase();
    return dispensaCategorie
      .map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.item.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.items.length > 0 || cat.categoria.toLowerCase().includes(q));
  }, [ricerca, dispensaCategorie]);

  useEffect(() => {
    if (ricerca.trim()) {
      const open = {};
      categorieFiltrate.forEach(cat => { open[cat.categoria] = true; });
      setOpenCategorie(open);
    }
  }, [ricerca, categorieFiltrate]);

  const toggleCategoria = (nome) => {
    setOpenCategorie(prev => ({ ...prev, [nome]: !prev[nome] }));
  };

  const apriTutte = () => {
    const open = {};
    dispensaCategorie.forEach(cat => { open[cat.categoria] = true; });
    setOpenCategorie(open);
  };

  const chiudiTutte = () => {
    setOpenCategorie({});
  };

  const totaleItems = dispense.length;

  // === Operazioni CRUD Admin ===

  const handleAggiungiItem = async (e) => {
    e.preventDefault();
    const categoriaFinale = usaNuovaCategoria ? nuovaCategoriaNome : nuovoItem.categoria;
    const iconaFinale = usaNuovaCategoria ? nuovaCategoriaIcona : (dispensaCategorie.find(c => c.categoria === nuovoItem.categoria)?.icona || '📄');

    if (!categoriaFinale || !nuovoItem.item) {
      alert("Compila tutti i campi");
      return;
    }

    try {
      setSalvando(true);
      const res = await fetch('/api/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: categoriaFinale,
          icona: iconaFinale,
          item: nuovoItem.item,
        })
      });

      if (res.ok) {
        setNuovoItem({ categoria: '', item: '' });
        setNuovaCategoriaNome('');
        setNuovaCategoriaIcona('📄');
        setUsaNuovaCategoria(false);
        setMostraFormItem(false);
        await caricaDati();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante il salvataggio");
    } finally {
      setSalvando(false);
    }
  };

  const handleEliminaItem = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questo argomento?")) return;
    try {
      const res = await fetch(`/api/dispense/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await caricaDati();
      } else {
        alert("Errore durante l'eliminazione");
      }
    } catch (error) {
      console.error("Errore eliminazione:", error);
    }
  };

  const iniziaModificaItem = (item) => {
    setModificandoItem(item._id);
    setItemModificato(item.item);
  };

  const annullaModificaItem = () => {
    setModificandoItem(null);
    setItemModificato('');
  };

  const handleModificaItem = async (id) => {
    if (!itemModificato.trim()) {
      alert("L'argomento non può essere vuoto");
      return;
    }
    try {
      const res = await fetch(`/api/dispense/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemModificato })
      });
      if (res.ok) {
        setModificandoItem(null);
        setItemModificato('');
        await caricaDati();
      } else {
        alert("Errore durante la modifica");
      }
    } catch (error) {
      console.error("Errore modifica:", error);
    }
  };

  const handleEliminaCategoria = async (categoria) => {
    const itemsCount = dispensaCategorie.find(c => c.categoria === categoria)?.items.length || 0;
    const messaggio = itemsCount > 0
      ? `Sei sicuro di voler eliminare la categoria "${categoria}"?\nVerranno eliminati anche ${itemsCount} argomenti associati.`
      : `Sei sicuro di voler eliminare la categoria "${categoria}"?`;

    if (!confirm(messaggio)) return;

    try {
      setEliminandoCategoria(categoria);
      const res = await fetch(`/api/dispense/categoria/${encodeURIComponent(categoria)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await caricaDati();
      } else {
        alert("Errore durante l'eliminazione della categoria");
      }
    } catch (error) {
      console.error("Errore eliminazione categoria:", error);
    } finally {
      setEliminandoCategoria(null);
    }
  };

  const iniziaModificaCategoria = (cat) => {
    setModificandoCategoria(cat.categoria);
    setNuovoNomeCategoria(cat.categoria);
    setNuovaIconaCategoria(cat.icona);
  };

  const annullaModificaCategoria = () => {
    setModificandoCategoria(null);
    setNuovoNomeCategoria('');
    setNuovaIconaCategoria('');
  };

  const handleModificaCategoria = async (vecchioNome) => {
    if (!nuovoNomeCategoria.trim()) {
      alert("Inserisci un nome per la categoria");
      return;
    }

    try {
      const res = await fetch(`/api/dispense/categoria/${encodeURIComponent(vecchioNome)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nuovoNome: nuovoNomeCategoria,
          nuovaIcona: nuovaIconaCategoria 
        })
      });
      if (res.ok) {
        setModificandoCategoria(null);
        setNuovoNomeCategoria('');
        setNuovaIconaCategoria('');
        await caricaDati();
      } else {
        alert("Errore durante la modifica della categoria");
      }
    } catch (error) {
      console.error("Errore modifica categoria:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Link>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <BookOpen className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Dispensa Hoon
                </h1>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setMostraFormItem(!mostraFormItem)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {mostraFormItem ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{mostraFormItem ? 'Annulla' : 'Aggiungi Argomento'}</span>
                </button>
              )}
            </div>
            <p className="text-gray-600 text-lg">
              Guida operativa per la gestione dei contenuti social per ogni tipologia di attività
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <List className="w-4 h-4" />
                {dispensaCategorie.length} categorie
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {totaleItems} argomenti totali
              </span>
            </div>
          </div>

          {/* Form Aggiungi Argomento */}
          {isAdmin && mostraFormItem && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Aggiungi Nuovo Argomento</h3>
              <form onSubmit={handleAggiungiItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                  <div className="space-y-2">
                    <select
                      value={usaNuovaCategoria ? '_nuova_' : nuovoItem.categoria}
                      onChange={(e) => {
                        if (e.target.value === '_nuova_') {
                          setUsaNuovaCategoria(true);
                          setNuovoItem({ ...nuovoItem, categoria: '' });
                        } else {
                          setUsaNuovaCategoria(false);
                          setNuovoItem({ ...nuovoItem, categoria: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required={!usaNuovaCategoria}
                    >
                      <option value="">Seleziona una categoria...</option>
                      {categorie.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="_nuova_">➕ Nuova categoria...</option>
                    </select>

                    {usaNuovaCategoria && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nuovaCategoriaNome}
                          onChange={(e) => setNuovaCategoriaNome(e.target.value)}
                          placeholder="Nome nuova categoria"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          required
                        />
                        <input
                          type="text"
                          value={nuovaCategoriaIcona}
                          onChange={(e) => setNuovaCategoriaIcona(e.target.value)}
                          placeholder="Emoji"
                          className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-xl"
                          maxLength={4}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Argomento</label>
                  <input
                    type="text"
                    value={nuovoItem.item}
                    onChange={(e) => setNuovoItem({ ...nuovoItem, item: e.target.value })}
                    placeholder="es. Storia / chi siamo"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{salvando ? 'Salvataggio...' : 'Salva Argomento'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Barra ricerca + azioni */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca argomento..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={apriTutte} className="px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Apri tutte
              </button>
              <button onClick={chiudiTutte} className="px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Chiudi tutte
              </button>
            </div>
          </div>

          {/* Lista categorie */}
          <div className="space-y-3">
            {categorieFiltrate.map((cat) => {
              const isOpen = openCategorie[cat.categoria];
              return (
                <div key={cat.categoria} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header categoria */}
                  {modificandoCategoria === cat.categoria ? (
                    <div className="p-4 md:p-5 bg-blue-50 border-b border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Edit2 className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Modifica Categoria</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={nuovaIconaCategoria}
                          onChange={(e) => setNuovaIconaCategoria(e.target.value)}
                          className="w-16 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl"
                          maxLength={4}
                          placeholder="🔹"
                        />
                        <input
                          type="text"
                          value={nuovoNomeCategoria}
                          onChange={(e) => setNuovoNomeCategoria(e.target.value)}
                          className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="Nome categoria"
                          autoFocus
                        />
                        <button
                          onClick={() => handleModificaCategoria(cat.categoria)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          ✓ Salva
                        </button>
                        <button
                          onClick={annullaModificaCategoria}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleCategoria(cat.categoria)}
                        className="flex-1 flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icona}</span>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">{cat.categoria}</h2>
                            <p className="text-sm text-gray-500">{cat.items.length} argomenti</p>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1 pr-4">
                          <button
                            onClick={() => iniziaModificaCategoria(cat)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifica categoria"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminaCategoria(cat.categoria)}
                            disabled={eliminandoCategoria === cat.categoria}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Elimina categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-4 md:px-5 py-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {cat.items.map((item) => (
                          <div
                            key={item._id}
                            className="group flex items-center gap-2 p-2.5 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            {modificandoItem === item._id ? (
                              <div className="flex items-center gap-2 w-full">
                                <input
                                  type="text"
                                  value={itemModificato}
                                  onChange={(e) => setItemModificato(e.target.value)}
                                  className="flex-1 px-2 py-1 border border-green-400 rounded focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleModificaItem(item._id);
                                    if (e.key === 'Escape') annullaModificaItem();
                                  }}
                                />
                                <button
                                  onClick={() => handleModificaItem(item._id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Salva"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={annullaModificaItem}
                                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                  title="Annulla"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Circle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 flex-1">{item.item}</span>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => iniziaModificaItem(item)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Modifica"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEliminaItem(item._id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Elimina"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {categorieFiltrate.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nessun risultato per &quot;{ricerca}&quot;</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from '@/Components/Header';
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft, Plus, X, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function FaqPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);
  const [categorie, setCategorie] = useState([]);
  const [categoriaSelezionata, setCategoriaSelezionata] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostraForm, setMostraForm] = useState(false);
  const [nuovaFaq, setNuovaFaq] = useState({
    categoria: '',
    titolo: '',
    testo: ''
  });
  const [nuovaCategoria, setNuovaCategoria] = useState('');
  const [usaNuovaCategoria, setUsaNuovaCategoria] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [eliminandoCategoria, setEliminandoCategoria] = useState(null);
  const [modificandoCategoria, setModificandoCategoria] = useState(null);
  const [nuovoNomeCategoria, setNuovoNomeCategoria] = useState('');

  useEffect(() => {
    if (status === "authenticated") {
      caricaDati();
    }
  }, [status]);

  const caricaDati = async () => {
    try {
      setLoading(true);
      
      // Carica tutte le FAQ
      const resFaqs = await fetch('/api/faq');
      if (resFaqs.ok) {
        const dataFaqs = await resFaqs.json();
        setFaqs(dataFaqs);
        
        // Estrai categorie uniche
        const catUniche = [...new Set(dataFaqs.map(f => f.categoria))];
        setCategorie(catUniche);
        
        // Seleziona la prima categoria
        if (catUniche.length > 0 && !categoriaSelezionata) {
          setCategoriaSelezionata(catUniche[0]);
        }
      }
    } catch (error) {
      console.error("Errore caricamento FAQ:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAggiungi = async (e) => {
    e.preventDefault();
    
    const categoriaFinale = usaNuovaCategoria ? nuovaCategoria : nuovaFaq.categoria;
    
    if (!categoriaFinale || !nuovaFaq.titolo || !nuovaFaq.testo) {
      alert("Compila tutti i campi");
      return;
    }
    
    try {
      setSalvando(true);
      
      const res = await fetch('/api/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: categoriaFinale,
          titolo: nuovaFaq.titolo,
          testo: nuovaFaq.testo
        })
      });
      
      if (res.ok) {
        setNuovaFaq({ categoria: '', titolo: '', testo: '' });
        setNuovaCategoria('');
        setUsaNuovaCategoria(false);
        setMostraForm(false);
        await caricaDati();
      } else {
        const error = await res.json();
        alert(`Errore: ${error.error}`);
      }
    } catch (error) {
      console.error("Errore salvataggio FAQ:", error);
      alert("Errore durante il salvataggio");
    } finally {
      setSalvando(false);
    }
  };

  const handleElimina = async (id) => {
    if (!confirm("Sei sicuro di voler eliminare questa FAQ?")) return;
    
    try {
      const res = await fetch(`/api/faq/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        await caricaDati();
      } else {
        alert("Errore durante l'eliminazione");
      }
    } catch (error) {
      console.error("Errore eliminazione FAQ:", error);
    }
  };

  const handleEliminaCategoria = async (categoria) => {
    const faqInCategoria = faqs.filter(f => f.categoria === categoria).length;
    
    const messaggio = faqInCategoria > 0
      ? `Sei sicuro di voler eliminare la categoria "${categoria}"?\nVerranno eliminate anche ${faqInCategoria} FAQ associate.`
      : `Sei sicuro di voler eliminare la categoria "${categoria}"?`;
    
    if (!confirm(messaggio)) return;
    
    try {
      setEliminandoCategoria(categoria);
      
      const res = await fetch(`/api/faq/categoria/${encodeURIComponent(categoria)}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        // Se la categoria eliminata era quella selezionata, resettiamo
        if (categoriaSelezionata === categoria) {
          setCategoriaSelezionata(null);
        }
        await caricaDati();
      } else {
        alert("Errore durante l'eliminazione della categoria");
      }
    } catch (error) {
      console.error("Errore eliminazione categoria:", error);
      alert("Errore durante l'eliminazione della categoria");
    } finally {
    

  const handleRinominaCategoria = async (vecchioNome) => {
    if (!nuovoNomeCategoria.trim()) {
      alert("Inserisci un nuovo nome per la categoria");
      return;
    }
    
    try {
      const res = await fetch(`/api/faq/categoria/${encodeURIComponent(vecchioNome)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuovoNome: nuovoNomeCategoria })
      });
      
      if (res.ok) {
        // Se la categoria rinominata era quella selezionata, aggiorna la selezione
        if (categoriaSelezionata === vecchioNome) {
          setCategoriaSelezionata(nuovoNomeCategoria);
        }
        setModificandoCategoria(null);
        setNuovoNomeCategoria('');
        await caricaDati();
      } else {
        alert("Errore durante la rinomina della categoria");
      }
    } catch (error) {
      console.error("Errore rinomina categoria:", error);
      alert("Errore durante la rinomina della categoria");
    }
  };  setEliminandoCategoria(null);
    }
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const faqsFiltrate = faqs.filter(f => f.categoria === categoriaSelezionata);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/Login");
    return null;
  }

  const isAdmin = session?.user?.role === "amministratore";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Dashboard
            </Link>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  FAQ - Domande Frequenti
                </h1>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => setMostraForm(!mostraForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {mostraForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{mostraForm ? 'Annulla' : 'Aggiungi FAQ'}</span>
                </button>
              )}
            </div>
            <p className="text-gray-600 text-lg">
              Trova risposte alle domande più comuni sulla piattaforma
            </p>
          </div>

          {/* Form Aggiungi FAQ (solo admin) */}
          {isAdmin && mostraForm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Crea Nuova FAQ</h3>
              <form onSubmit={handleAggiungi} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <div className="space-y-2">
                    <select
                      value={usaNuovaCategoria ? '_nuova_' : nuovaFaq.categoria}
                      onChange={(e) => {
                        if (e.target.value === '_nuova_') {
                          setUsaNuovaCategoria(true);
                          setNuovaFaq({...nuovaFaq, categoria: ''});
                        } else {
                          setUsaNuovaCategoria(false);
                          setNuovaFaq({...nuovaFaq, categoria: e.target.value});
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleziona una categoria...</option>
                      {categorie.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="_nuova_">➕ Nuova categoria...</option>
                    </select>
                    
                    {usaNuovaCategoria && (
                      <input
                        type="text"
                        value={nuovaCategoria}
                        onChange={(e) => setNuovaCategoria(e.target.value)}
                        placeholder="Nome nuova categoria"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo Domanda
                  </label>
                  <input
                    type="text"
                    value={nuovaFaq.titolo}
                    onChange={(e) => setNuovaFaq({...nuovaFaq, titolo: e.target.value})}
                    placeholder="es. Come creare una nuova collaborazione?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risposta
                  </label>
                  <textarea
                    value={nuovaFaq.testo}
                    onChange={(e) => setNuovaFaq({...nuovaFaq, testo: e.target.value})}
                    placeholder="Scrivi la risposta dettagliata..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={salvando}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{salvando ? 'Salvataggio...' : 'Salva FAQ'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Tab Categorie */}
          {categorie.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {categorie.map((cat) => (
                  <div key={cat} className="relative group">
                    {modificandoCategoria === cat ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nuovoNomeCategoria}
                          onChange={(e) => setNuovoNomeCategoria(e.target.value)}
                          placeholder={cat}
                          className="px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRinominaCategoria(cat)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          title="Salva"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setModificandoCategoria(null);
                            setNuovoNomeCategoria('');
                          }}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                          title="Annulla"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setCategoriaSelezionata(cat)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            categoriaSelezionata === cat
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${isAdmin ? 'pr-16' : ''}`}
                        >
                          {cat}
                        </button>
                        {isAdmin && (
                          <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 transition-opacity ${
                            categoriaSelezionata === cat 
                              ? 'opacity-100' 
                              : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <button
                              onClick={() => {
                                setModificandoCategoria(cat);
                                setNuovoNomeCategoria(cat);
                              }}
                              className={`p-1.5 rounded-md transition-all ${
                                categoriaSelezionata === cat
                                  ? 'text-white hover:bg-blue-500'
                                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title="Modifica categoria"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEliminaCategoria(cat)}
                              disabled={eliminandoCategoria === cat}
                              className={`p-1.5 rounded-md transition-all ${
                                categoriaSelezionata === cat
                                  ? 'text-white hover:bg-red-500'
                                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              } ${eliminandoCategoria === cat ? 'opacity-50' : ''}`}
                              title="Elimina categoria"
                            >
                              <X className="w-3.5 h-3.5" />
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

          {/* FAQ List */}
          {faqsFiltrate.length > 0 ? (
            <div className="space-y-4">
              {faqsFiltrate.map((faq) => (
                <div
                  key={faq._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div 
                      onClick={() => toggleFaq(faq._id)}
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-semibold text-gray-900 text-lg pr-4">
                        {faq.titolo}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <button
                          onClick={() => handleElimina(faq._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleFaq(faq._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {openFaq === faq._id ? (
                          <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {openFaq === faq._id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {faq.testo}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {categorie.length === 0 
                  ? 'Nessuna FAQ disponibile. Gli amministratori possono aggiungerne.'
                  : 'Nessuna FAQ in questa categoria.'}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Non trovi la risposta?</h3>
            <p className="text-blue-700">
              Contatta il supporto tecnico per ricevere assistenza personalizzata.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

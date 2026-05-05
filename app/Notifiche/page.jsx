'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react';

const ICONE = {
  nota_problema: '⚠️',
  dominio_scadenza: '🌐',
  fine_mese: '📊',
};

const LABELS = {
  nota_problema: 'Nota Problema',
  dominio_scadenza: 'Dominio in Scadenza',
  fine_mese: 'Fine Mese',
};

export default function NotifichePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('non_lette'); // tutte | non_lette | lette

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/Login');
    if (status === 'authenticated' && session.user.role !== 'amministratore') router.push('/unauthorized');
  }, [status]);

  const carica = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifiche');
      if (!res.ok) return;
      const data = await res.json();
      setNotifiche(data.notifiche);
      setNonLette(data.nonLette);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') carica();
  }, [status]);

  const segnaLetta = async (id) => {
    await fetch(`/api/notifiche/${id}`, { method: 'PATCH' });
    carica();
  };

  const elimina = async (id) => {
    await fetch(`/api/notifiche/${id}`, { method: 'DELETE' });
    carica();
  };

  const eliminaTutteLette = async () => {
    if (!confirm('Eliminare tutte le notifiche già lette?')) return;
    await fetch('/api/notifiche', { method: 'DELETE' });
    carica();
  };

  const segnaLetteTutte = async () => {
    const nonLetteList = notifiche.filter(n => !n.letta);
    await Promise.all(nonLetteList.map(n => fetch(`/api/notifiche/${n._id}`, { method: 'PATCH' })));
    carica();
  };

  const filtrate = notifiche.filter(n => {
    if (filtro === 'non_lette') return !n.letta;
    if (filtro === 'lette') return n.letta;
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header pagina */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-indigo-600" />
              Centro Notifiche
            </h1>
            {nonLette > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{nonLette} non {nonLette === 1 ? 'letta' : 'lette'}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={carica}
              className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              title="Aggiorna"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {nonLette > 0 && (
              <button
                onClick={segnaLetteTutte}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Segna tutte lette
              </button>
            )}
            <button
              onClick={eliminaTutteLette}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Elimina lette
            </button>
          </div>
        </div>

        {/* Filtri */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'non_lette', label: `Non lette (${nonLette})` },
            { key: 'lette', label: `Lette (${notifiche.length - nonLette})` },
            { key: 'tutte', label: `Tutte (${notifiche.length})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filtro === f.key
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filtrate.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center text-gray-400">
              Nessuna notifica
            </div>
          ) : (
            filtrate.map(n => (
              <div
                key={n._id}
                className={`bg-white rounded-xl border px-4 py-4 flex items-start gap-4 transition-colors ${
                  !n.letta ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{ICONE[n.tipo] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.tipo === 'nota_problema' ? 'bg-red-100 text-red-700' :
                      n.tipo === 'dominio_scadenza' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {LABELS[n.tipo]}
                    </span>
                    {!n.letta && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                  </div>
                  <p className={`text-sm text-gray-900 ${!n.letta ? 'font-semibold' : 'font-medium'}`}>
                    {n.titolo}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.messaggio}</p>
                  {n.link && (
                    <a
                      href={n.link}
                      className="text-xs text-indigo-600 hover:underline mt-1 inline-block"
                    >
                      Vai alla pagina →
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString('it-IT', {
                      weekday: 'short', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {!n.letta && (
                    <button
                      onClick={() => segnaLetta(n._id)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Segna come letta"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => elimina(n._id)}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

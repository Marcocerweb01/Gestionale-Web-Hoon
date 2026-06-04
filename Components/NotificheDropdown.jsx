'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ICONE = {
  nota_problema: '⚠️',
  dominio_scadenza: '🌐',
  fine_mese: '📊',
};

export default function NotificheDropdown() {
  const [aperto, setAperto] = useState(false);
  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const ref = useRef(null);
  const router = useRouter();

  const carica = async () => {
    try {
      const res = await fetch('/api/notifiche?limit=5');
      if (!res.ok) return;
      const data = await res.json();
      setNotifiche(data.notifiche);
      setNonLette(data.nonLette);
    } catch {}
  };

  // Esegui i check automatici una volta per sessione (usa sessionStorage per evitare spam)
  const eseguiCheck = async () => {
    const chiave = 'notifiche_check_' + new Date().toDateString();
    if (sessionStorage.getItem(chiave)) return;
    sessionStorage.setItem(chiave, '1');
    try {
      await Promise.all([
        fetch('/api/notifiche/check-domini'),
        fetch('/api/notifiche/check-fine-mese'),
      ]);
    } catch {}
    carica();
  };

  // Carica al mount e poi ogni 60 secondi
  useEffect(() => {
    eseguiCheck();
    const interval = setInterval(carica, 60000);
    return () => clearInterval(interval);
  }, []);

  // Chiudi cliccando fuori
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAperto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const segnaLetta = async (id, e) => {
    e.stopPropagation();
    await fetch(`/api/notifiche/${id}`, { method: 'PATCH' });
    carica();
  };

  const handleClick = async (n) => {
    if (!n.letta) {
      await fetch(`/api/notifiche/${n._id}`, { method: 'PATCH' });
      carica();
    }
    setAperto(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Campanella */}
      <button
        onClick={() => setAperto(prev => !prev)}
        className="relative inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifiche"
      >
        <Bell className="w-5 h-5" />
        {nonLette > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {nonLette > 99 ? '99+' : nonLette}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {aperto && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-800 text-sm">Notifiche</span>
            <div className="flex items-center gap-2">
              {nonLette > 0 && (
                <span className="text-xs text-gray-500">{nonLette} non lette</span>
              )}
              <button onClick={() => setAperto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista notifiche */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifiche.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nessuna notifica
              </div>
            ) : (
              notifiche.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !n.letta ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{ICONE[n.tipo] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-gray-900 truncate ${!n.letta ? 'font-semibold' : ''}`}>
                      {n.titolo}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{n.messaggio}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('it-IT', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!n.letta && (
                    <button
                      onClick={(e) => segnaLetta(n._id, e)}
                      className="text-blue-400 hover:text-blue-600 flex-shrink-0 mt-1"
                      title="Segna come letta"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <Link
              href="/Notifiche"
              onClick={() => setAperto(false)}
              className="flex items-center justify-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Vedi tutte le notifiche
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

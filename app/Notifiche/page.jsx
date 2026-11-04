'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeDollarSign,
  Bell,
  CalendarDays,
  CalendarClock,
  Camera,
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Globe2,
  Loader2,
  Mail,
  Monitor,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';

const TYPE_META = {
  nota_problema: {
    label: 'Nota problema',
    Icon: AlertTriangle,
    iconClass: 'text-red-600 bg-red-50',
    badgeClass: 'bg-red-50 text-red-700',
  },
  dominio_scadenza: {
    label: 'Dominio in scadenza',
    Icon: Globe2,
    iconClass: 'text-amber-600 bg-amber-50',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
  fine_mese: {
    label: 'Fine mese',
    Icon: CalendarClock,
    iconClass: 'text-blue-600 bg-blue-50',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  commerciale: {
    label: 'Commerciale',
    Icon: BadgeDollarSign,
    iconClass: 'text-emerald-600 bg-emerald-50',
    badgeClass: 'bg-emerald-50 text-emerald-700',
  },
  evento_disponibilita: {
    label: 'Disponibilità evento',
    Icon: CalendarDays,
    iconClass: 'text-violet-600 bg-violet-50',
    badgeClass: 'bg-violet-50 text-violet-700',
  },
  shooting_disponibilita: {
    label: 'Disponibilità shooting',
    Icon: Camera,
    iconClass: 'text-fuchsia-600 bg-fuchsia-50',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700',
  },
  seo_assegnazione: {
    label: 'Assegnazione SEO',
    Icon: Search,
    iconClass: 'text-cyan-700 bg-cyan-50',
    badgeClass: 'bg-cyan-50 text-cyan-800',
  },
};

function TypeIcon({ type, className = '' }) {
  const meta = TYPE_META[type];
  const Icon = meta?.Icon || Bell;
  return (
    <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${meta?.iconClass || 'bg-slate-100 text-slate-600'} ${className}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

function ChannelSwitch({ checked, disabled, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

function PreferencesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState(null);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/notifiche/preferenze', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Impossibile caricare le preferenze');
      setData(payload);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = async (type, channel, value) => {
    if (!data) return;
    const key = `${type}:${channel}`;
    const previous = data.preferences;
    const next = {
      ...previous,
      [type]: { ...previous[type], [channel]: value },
    };

    setData((current) => ({ ...current, preferences: next }));
    setSaving(key);
    setMessage(null);

    try {
      const response = await fetch('/api/notifiche/preferenze', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: { [type]: { [channel]: value } } }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Salvataggio non riuscito');
      setData((current) => ({ ...current, preferences: payload.preferences }));
      setMessage({ type: 'success', text: 'Preferenza salvata' });
    } catch (error) {
      setData((current) => ({ ...current, preferences: previous }));
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" aria-label="Caricamento preferenze" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p>{message?.text || 'Impossibile caricare le preferenze.'}</p>
        <button type="button" onClick={loadPreferences} className="mt-3 font-semibold underline underline-offset-4">
          Riprova
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="preferences-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 id="preferences-title" className="text-lg font-semibold text-slate-950">Canali per categoria</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Queste scelte valgono solo per l&apos;account {data.account.nome}. Gli avvisi critici per problemi sono attivi anche via email per impostazione predefinita.
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:text-right">
            <span className="block font-medium text-slate-800">Destinazione email</span>
            <span className="break-all">{data.account.email}</span>
          </div>
        </div>
      </div>

      <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:grid">
        <span>Tipo di avviso</span>
        <span className="flex items-center justify-center gap-2"><Monitor className="h-4 w-4" /> Gestionale</span>
        <span className="flex items-center justify-center gap-2"><Mail className="h-4 w-4" /> Email</span>
      </div>

      <div className="divide-y divide-slate-100">
        {data.catalog.map((item) => {
          const preferences = data.preferences[item.type];
          return (
            <div key={item.type} className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_8rem_8rem] sm:items-center sm:px-6">
              <div className="flex items-start gap-3">
                <TypeIcon type={item.type} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                    {item.type === 'nota_problema' && (
                      <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">Critica</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-center">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:hidden"><Monitor className="h-4 w-4" /> Gestionale</span>
                <ChannelSwitch
                  checked={preferences.inApp}
                  disabled={Boolean(saving)}
                  label={`${preferences.inApp ? 'Disattiva' : 'Attiva'} notifica nel gestionale per ${item.label}`}
                  onChange={(value) => updatePreference(item.type, 'inApp', value)}
                />
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-center">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:hidden"><Mail className="h-4 w-4" /> Email</span>
                <ChannelSwitch
                  checked={preferences.email}
                  disabled={Boolean(saving)}
                  label={`${preferences.email ? 'Disattiva' : 'Attiva'} email per ${item.label}`}
                  onChange={(value) => updatePreference(item.type, 'email', value)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-12 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:px-6">
        {saving ? (
          <p className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Salvataggio in corso…</p>
        ) : message ? (
          <p className={`flex items-center gap-2 text-sm ${message.type === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
            {message.type === 'error' ? <CircleAlert className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
            {message.text}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Le modifiche vengono salvate automaticamente.</p>
        )}
      </div>
    </section>
  );
}

export default function NotifichePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState('notifications');
  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('non_lette');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/Login');
    if (status === 'authenticated' && !['amministratore', 'collaboratore'].includes(session.user.role)) router.push('/unauthorized');
  }, [router, session, status]);

  const carica = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/notifiche', { cache: 'no-store' });
      if (!res.ok) throw new Error('Impossibile caricare le notifiche');
      const data = await res.json();
      setNotifiche(data.notifiche);
      setNonLette(data.nonLette);
    } catch (error) {
      setLoadError(error.message || 'Impossibile caricare le notifiche');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') carica();
  }, [carica, status]);

  const mutation = async (url, options = {}) => {
    setActionError('');
    const response = await fetch(url, options);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || 'Operazione non riuscita');
    }
  };

  const segnaLetta = async (id) => {
    try {
      await mutation(`/api/notifiche/${id}`, { method: 'PATCH' });
      await carica();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const apriNotifica = async (notifica) => {
    if (!notifica.letta) {
      try {
        await mutation(`/api/notifiche/${notifica._id}`, { method: 'PATCH' });
      } catch (error) {
        setActionError(error.message);
      }
    }
    if (notifica.link) router.push(notifica.link);
  };

  const elimina = async (id) => {
    try {
      await mutation(`/api/notifiche/${id}`, { method: 'DELETE' });
      await carica();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const eliminaTutteLette = async () => {
    if (!confirm('Eliminare tutte le notifiche già lette?')) return;
    try {
      await mutation('/api/notifiche', { method: 'DELETE' });
      await carica();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const segnaLetteTutte = async () => {
    const nonLetteList = notifiche.filter((notifica) => !notifica.letta);
    try {
      await Promise.all(nonLetteList.map((notifica) => mutation(`/api/notifiche/${notifica._id}`, { method: 'PATCH' })));
      await carica();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const filtrate = notifiche.filter((notifica) => {
    if (filtro === 'non_lette') return !notifica.letta;
    if (filtro === 'lette') return notifica.letta;
    return true;
  });
  const isAdmin = session?.user?.role === 'amministratore';

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-label="Caricamento notifiche" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2 sm:py-4">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Centro notifiche</h1>
            <p className="mt-0.5 text-sm text-slate-600">
              {nonLette > 0 ? `${nonLette} ${nonLette === 1 ? 'avviso da leggere' : 'avvisi da leggere'}` : 'Sei al corrente di tutto'}
            </p>
          </div>
        </div>

        {isAdmin && (
          <nav aria-label="Sezioni notifiche" className="flex w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
            <button
              type="button"
              onClick={() => setView('notifications')}
              aria-current={view === 'notifications' ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${view === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Bell className="h-4 w-4" /> Avvisi
            </button>
            <button
              type="button"
              onClick={() => setView('preferences')}
              aria-current={view === 'preferences' ? 'page' : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${view === 'preferences' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Settings2 className="h-4 w-4" /> Preferenze
            </button>
          </nav>
        )}
      </header>

      {view === 'preferences' && isAdmin ? (
        <PreferencesPanel />
      ) : (
        <>
          {(loadError || actionError) && (
            <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="flex items-start gap-2"><CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError || actionError}</span>
              {loadError && (
                <button type="button" onClick={carica} className="flex-shrink-0 font-semibold underline underline-offset-4">Riprova</button>
              )}
            </div>
          )}
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto" aria-label="Filtra notifiche">
              {[
                { key: 'non_lette', label: `Non lette (${nonLette})` },
                { key: 'lette', label: `Lette (${notifiche.length - nonLette})` },
                { key: 'tutte', label: `Tutte (${notifiche.length})` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFiltro(item.key)}
                  aria-pressed={filtro === item.key}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${filtro === item.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
              <button type="button" onClick={carica} aria-label="Aggiorna notifiche" className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" title="Aggiorna">
                <RefreshCw className="h-4 w-4" />
              </button>
              {nonLette > 0 && (
                <button type="button" onClick={segnaLetteTutte} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  <CheckCheck className="h-4 w-4" /> Segna tutte lette
                </button>
              )}
              <button type="button" onClick={eliminaTutteLette} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                <Trash2 className="h-4 w-4" /> Elimina lette
              </button>
            </div>
          </section>

          <section aria-label="Elenco notifiche" className="space-y-3">
            {filtrate.length === 0 && !loadError ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Bell className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-semibold text-slate-900">Nessuna notifica in questa vista</h2>
                <p className="mt-1 text-sm text-slate-500">Quando arriverà un nuovo avviso lo troverai qui.</p>
              </div>
            ) : (
              filtrate.map((notifica) => {
                const meta = TYPE_META[notifica.tipo];
                return (
                  <article key={notifica._id} className={`flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-colors sm:p-5 ${!notifica.letta ? 'border-indigo-200' : 'border-slate-200'}`}>
                    <TypeIcon type={notifica.tipo} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta?.badgeClass || 'bg-slate-100 text-slate-700'}`}>{meta?.label || 'Notifica'}</span>
                        {!notifica.letta && <span className="h-2 w-2 rounded-full bg-indigo-600" aria-label="Non letta" />}
                      </div>
                      <h2 className={`mt-2 text-sm text-slate-950 ${!notifica.letta ? 'font-bold' : 'font-semibold'}`}>{notifica.titolo}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{notifica.messaggio}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        {notifica.link && (
                          <button type="button" onClick={() => apriNotifica(notifica)} className="text-sm font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-4 hover:decoration-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                            Apri dettaglio
                          </button>
                        )}
                        <time className="text-xs text-slate-500" dateTime={notifica.createdAt}>
                          {new Date(notifica.createdAt).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </time>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col gap-1">
                      {!notifica.letta && (
                        <button type="button" onClick={() => segnaLetta(notifica._id)} aria-label={`Segna come letta: ${notifica.titolo}`} className="rounded-lg p-2 text-indigo-600 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" title="Segna come letta">
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => elimina(notifica._id)} aria-label={`Elimina notifica: ${notifica.titolo}`} className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500" title="Elimina notifica">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
}

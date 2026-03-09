'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Instagram,
  Facebook,
  MessageCircle,
  Send,
  Zap,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const TYPES = [
  { value: 'comment_reply', label: 'Rispondi a Commento', icon: MessageCircle, description: 'Risponde automaticamente ai commenti con keyword specifiche' },
  { value: 'dm_auto', label: 'DM Automatico', icon: Send, description: 'Invia DM ai nuovi follower o a chi commenta' },
  { value: 'lead_capture', label: 'Cattura Lead', icon: Zap, description: 'Salva i dati di chi interagisce come lead' },
];

const ACTION_TYPES = [
  { value: 'reply_comment', label: 'Rispondi nel commento' },
  { value: 'send_dm', label: 'Invia DM privato' },
  { value: 'both', label: 'Entrambi (commento + DM)' },
];

function NuovaRegolaModal({ account, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    type: 'comment_reply',
    keywords: '',
    actionType: 'send_dm',
    message: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) {
      setError('Nome e messaggio sono obbligatori');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        accountId: account._id,
        name: form.name,
        platform: account.platform,
        type: form.type,
        trigger: {
          keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean)
        },
        action: {
          type: form.actionType,
          message: form.message
        }
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Nuova Automazione</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome regola</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Es. Risposta info prezzi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo automazione</label>
            <div className="space-y-2">
              {TYPES.map(t => (
                <label key={t.value} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.type === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={form.type === t.value}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <t.icon className="w-4 h-4" /> {t.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Keyword trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Keyword trigger <span className="text-gray-400 font-normal">(separate da virgola)</span>
            </label>
            <input
              type="text"
              value={form.keywords}
              onChange={e => setForm({ ...form, keywords: e.target.value })}
              placeholder="Es. prezzo, info, disponibile"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Lascia vuoto per rispondere a tutti i commenti</p>
          </div>

          {/* Tipo azione */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Azione da eseguire</label>
            <select
              value={form.actionType}
              onChange={e => setForm({ ...form, actionType: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ACTION_TYPES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Messaggio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Messaggio da inviare</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Es. Ciao! Ti mando subito tutte le info in DM 😊"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Puoi usare {`{nome}`} per inserire il nome dell'utente</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvataggio...' : 'Crea Automazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const accountId = params.accountId;

  const [account, setAccount] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/Login');
    if (session && accountId) {
      loadData();
    }
  }, [session, status, accountId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, autRes] = await Promise.all([
        fetch(`/api/social-accounts/${accountId}`),
        fetch(`/api/automations?accountId=${accountId}`)
      ]);

      if (accRes.ok) setAccount(await accRes.json());
      if (autRes.ok) setAutomations(await autRes.json());
    } catch (err) {
      console.error('Errore caricamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (automation) => {
    const newStatus = automation.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/automations/${automation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAutomations(prev => prev.map(a =>
          a._id === automation._id ? { ...a, status: newStatus } : a
        ));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore aggiornamento stato' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa automazione?')) return;
    try {
      const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAutomations(prev => prev.filter(a => a._id !== id));
        setMessage({ type: 'success', text: 'Automazione eliminata' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore eliminazione' });
    }
  };

  const handleSave = async (data) => {
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.details || 'Errore salvataggio');
    }
    const created = await res.json();
    setAutomations(prev => [created, ...prev]);
    setMessage({ type: 'success', text: 'Automazione creata!' });
  };

  const getPlatformIcon = (platform) => {
    if (platform === 'instagram') return <Instagram className="w-5 h-5 text-pink-600" />;
    if (platform === 'facebook') return <Facebook className="w-5 h-5 text-blue-600" />;
    return null;
  };

  const getTypeLabel = (type) => TYPES.find(t => t.value === type)?.label || type;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/Operations/SocialAutomation')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna agli account
          </button>

          {account && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {account.profilePicture ? (
                  <img src={account.profilePicture} alt={account.username} className="w-14 h-14 rounded-full" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                    {getPlatformIcon(account.platform)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{account.displayName}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {getPlatformIcon(account.platform)}
                    <span>@{account.username}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Nuova Automazione
              </button>
            </div>
          )}
        </div>

        {/* Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <AlertCircle className="w-5 h-5 text-red-600" />
            }
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
            <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Lista automazioni */}
        {automations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna automazione</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Crea la prima automazione per questo account
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Crea Prima Automazione
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => {
              const isActive = automation.status === 'active';
              return (
                <div
                  key={automation._id}
                  className={`bg-white rounded-xl shadow-sm border p-5 transition-all ${
                    isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{automation.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? 'Attiva' : 'In pausa'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                          {getTypeLabel(automation.type)}
                        </span>
                        {automation.action?.type && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md font-medium">
                            {ACTION_TYPES.find(a => a.value === automation.action.type)?.label}
                          </span>
                        )}
                      </div>

                      {automation.trigger?.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="text-xs text-gray-500 mr-1">Keyword:</span>
                          {automation.trigger.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}

                      {automation.action?.message && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 italic">
                          "{automation.action.message}"
                        </p>
                      )}

                      {automation.stats && (
                        <div className="flex gap-4 mt-3 text-xs text-gray-500">
                          <span>✅ {automation.stats.triggered || 0} attivazioni</span>
                          <span>📤 {automation.stats.successful || 0} inviate</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(automation)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={isActive ? 'Metti in pausa' : 'Attiva'}
                      >
                        {isActive
                          ? <ToggleRight className="w-7 h-7" />
                          : <ToggleLeft className="w-7 h-7" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(automation._id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Elimina"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && account && (
        <NuovaRegolaModal
          account={account}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

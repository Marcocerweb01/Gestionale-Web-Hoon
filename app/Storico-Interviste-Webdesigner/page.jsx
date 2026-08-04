'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Download, FileText, History, Search } from 'lucide-react';

const sanitizeFilenamePart = (value) =>
  (value || 'Senza nome')
    .toString()
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Senza nome';

const getFilenameBase = (azienda) => `Intervista ${sanitizeFilenamePart(azienda)}`;

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getWebDesignerName = (item) => {
  const webDesigner = item.webDesigner;
  if (!webDesigner || typeof webDesigner === 'string') return 'Web designer';
  return [webDesigner.nome, webDesigner.cognome].filter(Boolean).join(' ') || webDesigner.email || 'Web designer';
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default function StoricoIntervisteWebdesignerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/Login');
      return;
    }
    if (status === 'authenticated' && session.user.role !== 'amministratore') {
      router.push('/unauthorized');
    }
  }, [router, session, status]);

  useEffect(() => {
    if (status !== 'authenticated' || session.user.role !== 'amministratore') return;

    const loadInterviews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/webdesign-interviste');
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Errore caricamento');
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Impossibile caricare lo storico');
      } finally {
        setLoading(false);
      }
    };

    loadInterviews();
  }, [session, status]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      const values = [
        item.azienda,
        item.autoreNome,
        item.autoreEmail,
        getWebDesignerName(item),
        item.webDesigner?.email,
      ];
      return values.some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [items, search]);

  const downloadTxt = (item) => {
    downloadFile(
      item.risultatoTxt || '',
      `${getFilenameBase(item.azienda)}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  const downloadJson = (item) => {
    downloadFile(
      JSON.stringify(
        {
          tipo: 'intervista-web-design',
          salvataIl: item.createdAt,
          webDesigner: item.webDesigner,
          autore: {
            id: item.autoreId,
            nome: item.autoreNome,
            email: item.autoreEmail,
            ruolo: item.autoreRuolo,
          },
          risultatoTxt: item.risultatoTxt,
          intervista: item.interview,
        },
        null,
        2
      ),
      `${getFilenameBase(item.azienda)}.json`,
      'application/json;charset=utf-8'
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold text-orange-700">
            <History className="h-4 w-4" />
            Web Design
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Storico interviste</h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca azienda, web designer, autore o email..."
            className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-200 p-4">
          <div>
            <h2 className="text-sm font-bold text-gray-950">Interviste salvate</h2>
            <p className="text-xs text-gray-500">{filteredItems.length} risultati</p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Nessuna intervista trovata.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"
              >
                <div>
                  <div className="text-sm font-bold text-gray-950">
                    {item.azienda || 'Senza nome azienda'}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{formatDate(item.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-gray-400">Web designer</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {getWebDesignerName(item)}
                  </div>
                  {item.webDesigner?.email && (
                    <div className="text-xs text-gray-500">{item.webDesigner.email}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-gray-400">Fatta da</div>
                  <div className="mt-1 text-sm font-semibold text-gray-800">
                    {item.autoreNome || 'Utente'}
                  </div>
                  {item.autoreEmail && <div className="text-xs text-gray-500">{item.autoreEmail}</div>}
                </div>
                <div className="flex gap-2 lg:justify-end">
                  <button
                    type="button"
                    onClick={() => downloadTxt(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-700"
                  >
                    <FileText className="h-4 w-4" />
                    TXT
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadJson(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800"
                  >
                    <Download className="h-4 w-4" />
                    JSON
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

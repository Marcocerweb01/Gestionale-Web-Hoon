'use client';

import { useEffect, useId, useState } from 'react';
import WebDesignCompletionBadge from './WebDesignCompletionBadge';

const dateFormat = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome' });

function DesignService({ service }) {
  const [tasks, setTasks] = useState(service.tasks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const done = tasks.filter((task) => task.completata).length;

  const toggleTask = async (task, completata) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/collaborazioni-webdesign-v2/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggiornaTask: { fase: 'design', taskId: task.id, completata } }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, completata } : item));
    } catch (err) {
      setError(err.message || 'Impossibile aggiornare l’attività. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <details className="rounded-xl border border-violet-200 bg-white">
      <summary className="cursor-pointer rounded-xl px-4 py-3 focus-visible:outline-violet-600">
        <span className="font-semibold text-gray-900">{service.cliente}</span>
        <span className="ml-2 inline-block rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-800">
          Solo Design
        </span>
        <span className="ml-2 inline-block">
          <WebDesignCompletionBadge completed={service.faseCompletata || (tasks.length > 0 && done === tasks.length)} />
        </span>
        <span className="ml-3 text-sm text-gray-600">{done}/{tasks.length} attività completate</span>
      </summary>
      <div className="space-y-3 border-t border-violet-100 px-4 py-3">
        {service.dataFinePrevista && (
          <p className="text-sm text-gray-700">
            Fine prevista {dateFormat.format(new Date(service.dataFinePrevista))}
          </p>
        )}
        {!service.modificabile && (
          <p className="text-sm font-medium text-violet-800">
            {service.stato === 'in corso' ? 'In attesa dello sblocco della fase Design' : `Progetto ${service.stato}`}
          </p>
        )}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <ul className="divide-y divide-gray-100">
          {tasks.map((task, index) => (
            <li key={task.id || index}>
              <label className="flex min-h-11 items-start gap-3 py-2 text-sm text-gray-900">
                <input
                  type="checkbox"
                  checked={Boolean(task.completata)}
                  disabled={!service.modificabile || !task.id || saving}
                  onChange={(event) => toggleTask(task, event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600"
                />
                <span>
                  {task.giorno && <span className="mr-2 font-medium text-gray-600">{task.giorno}</span>}
                  {task.nome}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export function useDesignServices(collaboratorId, enabled = true) {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const query = collaboratorId ? `?collaboratore=${encodeURIComponent(collaboratorId)}` : '';
    fetch(`/api/collaborazioni-webdesign-v2/design${query}`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setServices)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [collaboratorId, enabled]);

  return { services, error };
}

export function DesignServicesList({ services, error, showHeading = true }) {
  const headingId = useId();
  if (error) return <p role="alert" className="mb-4 text-sm text-red-700">Impossibile caricare i servizi Design.</p>;
  if (!services.length) return null;

  return (
    <section aria-labelledby={showHeading ? headingId : undefined} className="mb-4 space-y-3">
      {showHeading && <h3 id={headingId} className="text-sm font-semibold text-gray-900">Servizi Design</h3>}
      {services.map((service) => <DesignService key={service.id} service={service} />)}
    </section>
  );
}

export default function DesignServices({ collaboratorId }) {
  const data = useDesignServices(collaboratorId);
  return <DesignServicesList {...data} />;
}

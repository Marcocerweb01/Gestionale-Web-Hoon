'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createPublicationChecklist } from '@/lib/webdesign-v2-publication-checklist';

const FASE_CONFIG = {
  struttura: {
    label: 'Struttura',
    icon: '🏗️',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    ring: 'focus:ring-blue-500',
    step: 1,
  },
  design: {
    label: 'Design',
    icon: '🎨',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    ring: 'focus:ring-purple-500',
    step: 2,
  },
  stile: {
    label: 'Design',
    icon: '🎨',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    ring: 'focus:ring-purple-500',
    step: 2,
  },
  consegna: {
    label: 'Consegna',
    icon: '🚀',
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: 'focus:ring-emerald-500',
    step: 3,
  },
};

const FASE_ORDER = ['struttura', 'design', 'consegna'];

const FASE_ALIASES = {
  design: ['design', 'stile'],
};

const PROGRESS_BAR_CONFIG = {
  struttura: 'bg-blue-400',
  design: 'bg-purple-400',
  stile: 'bg-purple-400',
  consegna: 'bg-emerald-400',
};

const CALENDAR_ORDER = [
  'Giorno 1',
  'Giorno 2-3',
  'Giorno 4',
  'Giorno 5-7',
  'Giorno 8',
  'Giorno 9-11',
  'Giorno 12',
  'Giorno 13-17',
  'Giorno 18',
  'Giorno 19',
  'Giorno 21+',
];

const PROJECT_CONTROL_TEMPLATES = {
  vetrina: ['7gg', '14gg', '20gg-test', '21gg-consegna'],
  'e-commerce': ['7gg', '14gg', '20gg-test', '21gg-consegna', '30gg-ecommerce'],
};

const PROJECT_CONTROL_CONFIG = {
  '7gg': {
    label: 'Controllo 7 giorni',
    shortLabel: '7gg',
    day: 7,
    description: 'Primo controllo avanzamento progetto.',
  },
  '14gg': {
    label: 'Controllo 14 giorni',
    shortLabel: '14gg',
    day: 14,
    description: 'Controllo intermedio su avanzamento, contenuti e blocchi.',
  },
  '20gg-test': {
    label: 'Controllo 20 giorni - Test',
    shortLabel: '20gg test',
    day: 20,
    description: 'Controllo pre-consegna dedicato a test, bug, link e responsive.',
  },
  '20gg': {
    label: 'Controllo 20 giorni - Test',
    shortLabel: '20gg test',
    day: 20,
    description: 'Controllo pre-consegna dedicato a test, bug, link e responsive.',
  },
  '21gg-consegna': {
    label: 'Controllo 21 giorni - Consegna',
    shortLabel: '21gg consegna',
    day: 21,
    description: 'Verifica stato consegna e pubblicazione.',
  },
  '21gg': {
    label: 'Controllo 21 giorni - Consegna',
    shortLabel: '21gg consegna',
    day: 21,
    description: 'Verifica stato consegna e pubblicazione.',
  },
  consegna: {
    label: 'Controllo 21 giorni - Consegna',
    shortLabel: '21gg consegna',
    day: 21,
    description: 'Verifica stato consegna e pubblicazione.',
  },
  '30gg-ecommerce': {
    label: 'Controllo 30 giorni - E-commerce',
    shortLabel: '30gg e-commerce',
    day: 30,
    description: 'Controllo extra per shop, prodotti, checkout e configurazioni vendita.',
  },
  '28gg': {
    label: 'Controllo 30 giorni - E-commerce',
    shortLabel: '30gg e-commerce',
    day: 30,
    description: 'Controllo extra per shop, prodotti, checkout e configurazioni vendita.',
  },
};

const CONTROL_STATUS_OPTIONS = [
  { value: '', label: 'Da valutare' },
  { value: 'da fare', label: 'Da fare' },
  { value: 'in corso', label: 'In corso' },
  { value: 'ok', label: 'OK' },
  { value: 'attenzione', label: 'Attenzione' },
  { value: 'critico', label: 'Critico' },
];

const CONTROL_STATUS_BADGE = {
  '': 'bg-gray-100 text-gray-600 border-gray-200',
  'da fare': 'bg-gray-100 text-gray-700 border-gray-200',
  'in corso': 'bg-sky-100 text-sky-700 border-sky-200',
  ok: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  attenzione: 'bg-amber-100 text-amber-700 border-amber-200',
  critico: 'bg-red-100 text-red-700 border-red-200',
};

const DAY_OFFSETS = {
  'Giorno 1': [0, 0],
  'Giorno 2-3': [1, 2],
  'Giorno 4': [3, 3],
  'Giorno 5-7': [4, 6],
  'Giorno 8': [7, 7],
  'Giorno 9-11': [8, 10],
  'Giorno 12': [11, 11],
  'Giorno 13-17': [12, 16],
  'Giorno 18': [17, 17],
  'Giorno 19': [18, 18],
  'Giorno 21+': [20, null],
};

const FALLBACK_DAYS_BY_PHASE = {
  struttura: [
    'Giorno 1',
    'Giorno 1',
    'Giorno 1',
    'Giorno 2-3',
    'Giorno 2-3',
    'Giorno 2-3',
    'Giorno 4',
    'Giorno 4',
    'Giorno 4',
    'Giorno 4',
    'Giorno 4',
  ],
  design: [
    'Giorno 2-3',
    'Giorno 4',
    'Giorno 4',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 8',
    'Giorno 8',
    'Giorno 8',
    'Giorno 8',
    'Giorno 9-11',
    'Giorno 9-11',
    'Giorno 9-11',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 13-17',
    'Giorno 13-17',
  ],
  stile: [
    'Giorno 2-3',
    'Giorno 4',
    'Giorno 4',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 5-7',
    'Giorno 8',
    'Giorno 8',
    'Giorno 8',
    'Giorno 8',
    'Giorno 9-11',
    'Giorno 9-11',
    'Giorno 9-11',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 12',
    'Giorno 13-17',
    'Giorno 13-17',
  ],
  consegna: [
    'Giorno 18',
    'Giorno 18',
    'Giorno 18',
    'Giorno 18',
    'Giorno 18',
    'Giorno 19',
    'Giorno 21+',
    'Giorno 21+',
    'Giorno 21+',
  ],
};

const isValidCalendarDay = (giorno) => CALENDAR_ORDER.includes(giorno);

const getTaskCalendarDay = (task, nomeFase, taskIndex) => {
  if (isValidCalendarDay(task.giorno)) return task.giorno;
  return FALLBACK_DAYS_BY_PHASE[nomeFase]?.[taskIndex] || 'Da pianificare';
};

const parseProjectDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const nextWorkingDay = (date) => {
  const next = new Date(date);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
};

const addWorkingDays = (date, days) => {
  let next = nextWorkingDay(date);
  let remaining = days;

  while (remaining > 0) {
    next = addDays(next, 1);
    if (!isWeekend(next)) remaining -= 1;
  }

  return next;
};

const formatDate = (date) =>
  date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatShortDate = (date) =>
  date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
  });

const getDayDateRange = (giorno, startDate) => {
  const offsets = DAY_OFFSETS[giorno];
  if (!offsets || !startDate) return '';
  const [startOffset, endOffset] = offsets;
  const start = addWorkingDays(startDate, startOffset);

  if (endOffset === null) return `${formatDate(start)}+`;
  const end = addWorkingDays(startDate, endOffset);
  if (startOffset === endOffset) return formatDate(start);
  return `${formatShortDate(start)} - ${formatDate(end)}`;
};

const isTodayInDayRange = (giorno, startDate, today = new Date()) => {
  const offsets = DAY_OFFSETS[giorno];
  if (!offsets || !startDate) return false;

  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (isWeekend(normalizedToday)) return false;

  const [startOffset, endOffset] = offsets;
  const start = addWorkingDays(startDate, startOffset);
  const end = endOffset === null ? null : addWorkingDays(startDate, endOffset);

  if (end === null) return normalizedToday >= start;
  return normalizedToday >= start && normalizedToday <= end;
};

const isAppointmentTask = (taskName = '') => {
  const normalized = taskName.toLowerCase();
  return (
    normalized.includes('appuntamento') ||
    normalized.includes('presentat') ||
    normalized.includes('spiegate al cliente')
  );
};

const isCalendarAppointmentTask = (taskName = '') => {
  const normalized = taskName.toLowerCase();
  return (
    normalized.includes('presentat') ||
    normalized.includes('spiegate al cliente') ||
    normalized.includes('online o in appuntamento')
  );
};

const getAppointmentTasks = (tasks = []) =>
  tasks.filter(({ task }) => isCalendarAppointmentTask(task.nome));

const getAppointmentLabel = (appointmentTasks) => {
  if (!appointmentTasks.length) return '';

  const types = Array.from(
    new Set(
      appointmentTasks
        .map(({ task }) => task.appuntamentoTipo)
        .filter(Boolean)
        .map((type) => (type === 'fisico' ? 'fisico' : 'online'))
    )
  );

  if (!types.length) return 'Appuntamento';
  return `Appuntamento ${types.join('/')}`;
};

const getFaseByName = (fasi, nomeFase) => {
  const aliases = FASE_ALIASES[nomeFase] || [nomeFase];
  return fasi?.find((fase) => aliases.includes(fase.nome));
};

const getFaseIndexByName = (fasi, nomeFase) => {
  const aliases = FASE_ALIASES[nomeFase] || [nomeFase];
  return fasi?.findIndex((fase) => aliases.includes(fase.nome)) ?? -1;
};

const getFaseProgress = (fase) => {
  if (!fase?.tasks?.length) return { done: 0, total: 0, pct: 0 };
  const done = fase.tasks.filter((t) => t.completata).length;
  const total = fase.tasks.length;
  return { done, total, pct: Math.round((done / total) * 100) };
};

const getProjectProgress = (fasi) => {
  if (!fasi?.length) return 0;
  const allTasks = fasi.flatMap((f) => f.tasks || []);
  if (!allTasks.length) return 0;
  return Math.round((allTasks.filter((t) => t.completata).length / allTasks.length) * 100);
};

const getCalendarTasks = (fasi) => {
  const items = [];

  FASE_ORDER.forEach((nomeFase) => {
    const fase = getFaseByName(fasi, nomeFase);
    const realIndex = getFaseIndexByName(fasi, nomeFase);
    if (!fase) return;

    fase.tasks?.forEach((task, taskIndex) => {
      const giorno = getTaskCalendarDay(task, nomeFase, taskIndex);
      items.push({
        giorno,
        nomeFase,
        realIndex,
        taskIndex,
        task,
      });
    });
  });

  return items.sort((a, b) => {
    const aDay = CALENDAR_ORDER.indexOf(a.giorno);
    const bDay = CALENDAR_ORDER.indexOf(b.giorno);
    const aOrder = aDay === -1 ? CALENDAR_ORDER.length : aDay;
    const bOrder = bDay === -1 ? CALENDAR_ORDER.length : bDay;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return FASE_CONFIG[a.nomeFase].step - FASE_CONFIG[b.nomeFase].step;
  });
};

const getCalendarGroups = (fasi) =>
  getCalendarTasks(fasi).reduce((groups, item) => {
    if (!groups[item.giorno]) groups[item.giorno] = [];
    groups[item.giorno].push(item);
    return groups;
  }, {});

const getTodayCalendarGroup = (fasi, startDate) => {
  const groups = getCalendarGroups(fasi);
  const todayDay = CALENDAR_ORDER.find((giorno) => isTodayInDayRange(giorno, startDate));
  if (!todayDay) return { giorno: null, tasks: [] };
  return { giorno: todayDay, tasks: groups[todayDay] || [] };
};

const getPublicationChecklist = (collab) =>
  collab.checklistPubblicazione?.length
    ? collab.checklistPubblicazione
    : createPublicationChecklist();

const getChecklistProgress = (checklist) => {
  const items = checklist.flatMap((group) => group.items || []);
  if (!items.length) return { done: 0, total: 0, pct: 0 };
  const done = items.filter((item) => item.completata).length;
  return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
};

const normalizeProjectControlType = (tipo) => {
  if (tipo === '20gg') return '20gg-test';
  if (tipo === '21gg' || tipo === 'consegna') return '21gg-consegna';
  if (tipo === '28gg') return '30gg-ecommerce';
  return tipo;
};

const getProjectControls = (collab) => {
  const expected = PROJECT_CONTROL_TEMPLATES[collab.tipoProgetto] || PROJECT_CONTROL_TEMPLATES.vetrina;
  const existing = collab.fasiControllo || [];
  const startDate = parseProjectDate(collab.dataInizioContratto);

  return expected.map((tipo) => {
    const found = existing.find((ctrl) => normalizeProjectControlType(ctrl.tipo) === tipo);
    const cfg = PROJECT_CONTROL_CONFIG[tipo];
    const giornoPrevisto = found?.giornoPrevisto || cfg?.day || null;
    const dataPrevista =
      startDate && giornoPrevisto
        ? addWorkingDays(startDate, giornoPrevisto - 1)
        : found?.dataPrevista || null;

    return {
      tipo,
      giornoPrevisto,
      dataPrevista,
      data: found?.data || null,
      stato: found?.stato || '',
      note: found?.note || '',
      spuntiMiglioramento: found?.spuntiMiglioramento || '',
      completata: Boolean(found?.completata),
    };
  });
};

const getProjectControlsProgress = (controls) => {
  if (!controls.length) return { done: 0, total: 0, pct: 0 };
  const done = controls.filter((control) => control.completata).length;
  return { done, total: controls.length, pct: Math.round((done / controls.length) * 100) };
};

const TimelineWebDesignerV2 = ({ userId }) => {
  const { data: session } = useSession();
  const [collaborazioni, setCollaborazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openProjects, setOpenProjects] = useState({});
  const [selectedDays, setSelectedDays] = useState({});
  const [openPublicationChecklist, setOpenPublicationChecklist] = useState({});
  const isAdminView =
    session?.user?.role === 'amministratore' || session?.user?.role === 'segretaria';

  const toggleProject = (id) =>
    setOpenProjects((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleDay = (collabId, giorno) => {
    setSelectedDays((prev) => ({
      ...prev,
      [collabId]: prev[collabId] === giorno ? null : giorno,
    }));
  };

  const togglePublicationChecklist = (collabId) => {
    setOpenPublicationChecklist((prev) => ({ ...prev, [collabId]: !prev[collabId] }));
  };

  useEffect(() => {
    const fetchCollaborazioni = async () => {
      try {
        const res = await fetch(`/api/collaborazioni-webdesign-v2/${userId}`);
        if (!res.ok) throw new Error('Errore nel recupero');
        const data = await res.json();
        setCollaborazioni(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError('Non è stato possibile recuperare i progetti.');
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchCollaborazioni();
  }, [userId]);

  const patchCollaborazione = useCallback(async (collabId, payload) => {
    try {
      const res = await fetch(`/api/collaborazioni-webdesign-v2/${collabId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Errore aggiornamento');
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleStatoChange = (collabId, value) => {
    setCollaborazioni((prev) =>
      prev.map((c) => (c._id === collabId ? { ...c, stato: value } : c))
    );
    patchCollaborazione(collabId, { stato: value });
  };

  const handleToggleTask = (collabId, faseIndex, taskIndex) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const fasi = c.fasi.map((f, fi) => {
          if (fi !== faseIndex) return f;
          const tasks = f.tasks.map((t, ti) =>
            ti === taskIndex ? { ...t, completata: !t.completata } : t
          );
          return { ...f, tasks };
        });
        patchCollaborazione(collabId, { fasi });
        return { ...c, fasi };
      })
    );
  };

  const handleTaskNote = (collabId, faseIndex, taskIndex, value) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const fasi = c.fasi.map((f, fi) => {
          if (fi !== faseIndex) return f;
          const tasks = f.tasks.map((task, ti) =>
            ti === taskIndex ? { ...task, note: value } : task
          );
          return { ...f, tasks };
        });
        return { ...c, fasi };
      })
    );
  };

  const saveTaskNote = (collabId, faseIndex, taskIndex, value) => {
    const collab = collaborazioni.find((c) => c._id === collabId);
    if (!collab) return;
    const fasi = collab.fasi.map((f, fi) => {
      if (fi !== faseIndex) return f;
      const tasks = f.tasks.map((task, ti) =>
        ti === taskIndex ? { ...task, note: value } : task
      );
      return { ...f, tasks };
    });
    patchCollaborazione(collabId, { fasi });
  };

  const handleTaskField = (collabId, faseIndex, taskIndex, field, value) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const fasi = c.fasi.map((f, fi) => {
          if (fi !== faseIndex) return f;
          const tasks = f.tasks.map((task, ti) =>
            ti === taskIndex ? { ...task, [field]: value } : task
          );
          return { ...f, tasks };
        });
        patchCollaborazione(collabId, { fasi });
        return { ...c, fasi };
      })
    );
  };

  const handleTogglePublicationItem = (collabId, groupIndex, itemIndex) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const checklistPubblicazione = getPublicationChecklist(c).map((group, gi) => {
          if (gi !== groupIndex) return group;
          const items = group.items.map((item, ii) =>
            ii === itemIndex ? { ...item, completata: !item.completata } : item
          );
          return { ...group, items };
        });
        patchCollaborazione(collabId, { checklistPubblicazione });
        return { ...c, checklistPubblicazione };
      })
    );
  };

  const handleProjectControlUpdate = (collabId, controlIndex, field, value) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const fasiControllo = getProjectControls(c).map((control, index) =>
          index === controlIndex ? { ...control, [field]: value } : control
        );
        patchCollaborazione(collabId, { fasiControllo });
        return { ...c, fasiControllo };
      })
    );
  };

  const handleFaseNote = (collabId, faseIndex, value) => {
    setCollaborazioni((prev) =>
      prev.map((c) => {
        if (c._id !== collabId) return c;
        const fasi = c.fasi.map((f, fi) =>
          fi === faseIndex ? { ...f, note: value } : f
        );
        return { ...c, fasi };
      })
    );
  };

  const saveFaseNote = (collabId, faseIndex, value) => {
    const collab = collaborazioni.find((c) => c._id === collabId);
    if (!collab) return;
    const fasi = collab.fasi.map((f, fi) =>
      fi === faseIndex ? { ...f, note: value } : f
    );
    patchCollaborazione(collabId, { fasi });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        <span className="ml-3 text-gray-600">Caricamento in corso...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
        <p className="text-red-700">⚠️ {error}</p>
      </div>
    );
  }

  if (collaborazioni.length === 0) {
    return (
      <div className="text-center p-10 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
        <div className="text-5xl mb-4">🚀</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nessun progetto V2 assegnato</h3>
        <p className="text-gray-500 text-sm">I nuovi progetti con Struttura, Design e Consegna appariranno qui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {collaborazioni.map((collab) => {
        const isOpen = openProjects[collab._id];
        const progress = getProjectProgress(collab.fasi);
        const isEcommerce = collab.tipoProgetto === 'e-commerce';
        const startDate = parseProjectDate(collab.dataInizioContratto);
        const calendarGroups = getCalendarGroups(collab.fasi);
        const todayGroup = getTodayCalendarGroup(collab.fasi, startDate);
        const todayPending = todayGroup.tasks.filter(({ task }) => !task.completata);
        const selectedDay = selectedDays[collab._id];
        const selectedTasks = selectedDay ? calendarGroups[selectedDay] || [] : [];
        const publicationChecklist = getPublicationChecklist(collab);
        const publicationProgress = getChecklistProgress(publicationChecklist);
        const isPublicationChecklistOpen = Boolean(openPublicationChecklist[collab._id]);
        const projectControls = getProjectControls(collab);
        const projectControlsProgress = getProjectControlsProgress(projectControls);
        const calendarRows = Object.entries(calendarGroups).reduce((rows, entry, index) => {
          if (index % 3 === 0) rows.push([]);
          rows[rows.length - 1].push(entry);
          return rows;
        }, []);
        const selectedRowIndex = calendarRows.findIndex((row) =>
          row.some(([giorno]) => giorno === selectedDay)
        );

        return (
          <div
            key={collab._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* ── Header progetto ── */}
            <div
              className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-gray-200 cursor-pointer hover:bg-opacity-80 transition-colors"
              onClick={() => toggleProject(collab._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isOpen ? (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span>{isEcommerce ? '🛒' : '🏪'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {collab.cliente?._id ? (
                        <Link
                          href={`/User/${collab.cliente._id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="text-lg font-semibold text-gray-900 hover:text-violet-700 hover:underline"
                        >
                          {collab.cliente?.etichetta || collab.aziendaRagioneSociale}
                        </Link>
                      ) : (
                        <h3 className="text-lg font-semibold text-gray-900">
                          {collab.cliente?.etichetta || collab.aziendaRagioneSociale}
                        </h3>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          isEcommerce
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isEcommerce ? 'E-commerce' : 'Vetrina'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(collab.dataInizioContratto).toLocaleDateString('it-IT')} →{' '}
                      {new Date(collab.dataFineContratto).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                  {/* Progress globale */}
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs text-gray-500 mb-1">Avanzamento</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-violet-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{progress}%</span>
                    </div>
                  </div>

                  {/* Stato */}
                  <div>
                    <select
                      value={collab.stato || 'in corso'}
                      onChange={(e) => handleStatoChange(collab._id, e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="in corso">🟢 In Corso</option>
                      <option value="in pausa">⏸️ In Pausa</option>
                      <option value="terminata">✅ Terminato</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Body (collassabile) ── */}
            {isOpen && (
              <div className="p-6 space-y-8">

                {/* ── Stepper visivo ── */}
                <div className="flex items-center justify-center gap-0">
                  {FASE_ORDER.map((nomeFase, idx) => {
                    const cfg = FASE_CONFIG[nomeFase];
                    const fase = getFaseByName(collab.fasi, nomeFase);
                    const { done, total, pct } = getFaseProgress(fase);
                    const isComplete = pct === 100;
                    return (
                      <React.Fragment key={nomeFase}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${
                              isComplete
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : `${cfg.bg} ${cfg.border}`
                            }`}
                          >
                            {isComplete ? '✓' : cfg.icon}
                          </div>
                          <span className="text-xs font-semibold text-gray-600 mt-1">{cfg.label}</span>
                          <span className="text-xs text-gray-400">{done}/{total}</span>
                        </div>
                        {idx < 2 && (
                          <div className="h-0.5 w-16 bg-gray-200 mx-1 mb-5" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* ── Cosa fare oggi ── */}
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">
                        Cosa va fatto oggi
                      </h4>
                      <p className="text-sm text-gray-600">
                        {todayGroup.giorno
                          ? `${todayGroup.giorno} · ${getDayDateRange(todayGroup.giorno, startDate)}`
                          : 'Nessuna attività prevista per la data di oggi'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-violet-700 bg-white border border-violet-200 rounded-full px-3 py-1">
                      {todayPending.length} da fare
                    </span>
                  </div>

                  {todayPending.length > 0 ? (
                    <div className="space-y-2">
                      {todayPending.map(({ nomeFase, realIndex, taskIndex, task }) => {
                        const cfg = FASE_CONFIG[nomeFase];

                        return (
                          <div
                            key={`today-${nomeFase}-${taskIndex}`}
                            className="bg-white border border-violet-100 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleTask(collab._id, realIndex, taskIndex)}
                                className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-emerald-500 transition-colors"
                                title="Segna completata"
                              >
                                <Square className="w-5 h-5" />
                              </button>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start gap-2">
                                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${cfg.badge}`}>
                                    {cfg.label}
                                  </span>
                                  <span className="text-sm leading-snug text-gray-800">
                                    {task.nome}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-violet-100 rounded-lg p-3 text-sm text-gray-500">
                      Nessuna attività aperta per oggi.
                    </div>
                  )}
                </div>

                {/* ── Calendario operativo ── */}
                <div>
                  <div className="mb-4">
                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <span>📆</span> Calendario operativo
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Date calcolate su giorni lavorativi, dal lunedi al venerdi.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {calendarRows.map((row, rowIndex) => (
                      <React.Fragment key={`row-${rowIndex}`}>
                        <div className="grid grid-cols-3 gap-4">
                          {row.map(([giorno, tasks]) => {
                            const done = tasks.filter(({ task }) => task.completata).length;
                            const total = tasks.length;
                            const pct = Math.round((done / total) * 100);
                            const dateRange = getDayDateRange(giorno, startDate);
                            const isToday = isTodayInDayRange(giorno, startDate);
                            const isSelected = selectedDay === giorno;
                            const appointmentTasks = getAppointmentTasks(tasks);
                            const appointmentLabel = getAppointmentLabel(appointmentTasks);
                            const hasGroupConfirmation = appointmentTasks.some(
                              ({ task }) => task.confermaGruppo
                            );

                            return (
                              <div
                                key={giorno}
                                className={`rounded-xl border overflow-hidden ${
                                  isSelected
                                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                                    : isToday
                                    ? 'border-violet-300 bg-white'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleDay(collab._id, giorno)}
                                  className={`w-full text-left p-4 transition-colors ${
                                    isToday ? 'hover:bg-violet-100' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-lg font-bold text-gray-900">{giorno}</h4>
                                        {appointmentTasks.length > 0 && (
                                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold">
                                            {appointmentLabel}
                                          </span>
                                        )}
                                        {hasGroupConfirmation && (
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold">
                                            Confermato
                                          </span>
                                        )}
                                        {isToday && (
                                          <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">
                                            Oggi
                                          </span>
                                        )}
                                      </div>
                                      {dateRange && (
                                        <p className="text-sm font-medium text-gray-600">{dateRange}</p>
                                      )}
                                      <p className="text-xs text-gray-500">{done}/{total} attività completate</p>
                                    </div>
                                    <ChevronDown
                                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                                        isSelected ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>
                                  <div className="mt-3 flex items-center gap-2">
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                      <div
                                        className="bg-violet-500 h-2 rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-600">{pct}%</span>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {selectedDay && selectedTasks.length > 0 && selectedRowIndex === rowIndex && (
                          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900">{selectedDay}</h4>
                                <p className="text-sm font-medium text-gray-600">
                                  {getDayDateRange(selectedDay, startDate)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleDay(collab._id, selectedDay)}
                                className="text-xs font-semibold text-violet-700 bg-white border border-violet-200 rounded-full px-3 py-1 hover:bg-violet-50"
                              >
                                Chiudi
                              </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {selectedTasks.map(({ nomeFase, realIndex, taskIndex, task }) => {
                                const cfg = FASE_CONFIG[nomeFase];

                                return (
                                  <div
                                    key={`${nomeFase}-${taskIndex}`}
                                    className="bg-white rounded-lg border border-violet-100 p-3"
                                  >
                                    <div className="flex items-start gap-3">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleTask(collab._id, realIndex, taskIndex)
                                        }
                                        className={`flex-shrink-0 mt-0.5 transition-colors ${
                                          task.completata
                                            ? 'text-emerald-500'
                                            : 'text-gray-300 hover:text-gray-400'
                                        }`}
                                        title={task.completata ? 'Segna da fare' : 'Segna completata'}
                                      >
                                        {task.completata ? (
                                          <CheckSquare className="w-5 h-5" />
                                        ) : (
                                          <Square className="w-5 h-5" />
                                        )}
                                      </button>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start gap-2">
                                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${cfg.badge}`}>
                                            {cfg.label}
                                          </span>
                                          <span
                                            className={`text-sm leading-snug ${
                                              task.completata
                                                ? 'line-through text-gray-400'
                                                : 'text-gray-800'
                                            }`}
                                          >
                                            {task.nome}
                                          </span>
                                        </div>

                                        {isAppointmentTask(task.nome) && (
                                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <label className="block">
                                              <span className="block text-xs font-semibold text-gray-500 mb-1">
                                                Tipo appuntamento
                                              </span>
                                              <select
                                                value={task.appuntamentoTipo || ''}
                                                onChange={(e) =>
                                                  handleTaskField(
                                                    collab._id,
                                                    realIndex,
                                                    taskIndex,
                                                    'appuntamentoTipo',
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                              >
                                                <option value="">Da definire</option>
                                                <option value="fisico">Appuntamento fisico</option>
                                                <option value="online">Appuntamento online</option>
                                              </select>
                                            </label>
                                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mt-5 md:mt-6">
                                              <input
                                                type="checkbox"
                                                checked={Boolean(task.confermaGruppo)}
                                                onChange={(e) =>
                                                  handleTaskField(
                                                    collab._id,
                                                    realIndex,
                                                    taskIndex,
                                                    'confermaGruppo',
                                                    e.target.checked
                                                  )
                                                }
                                                className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                              />
                                              Sentito sul gruppo per conferme
                                            </label>
                                          </div>
                                        )}

                                        <textarea
                                          value={task.note || ''}
                                          onChange={(e) =>
                                            handleTaskNote(
                                              collab._id,
                                              realIndex,
                                              taskIndex,
                                              e.target.value
                                            )
                                          }
                                          onBlur={(e) =>
                                            saveTaskNote(
                                              collab._id,
                                              realIndex,
                                              taskIndex,
                                              e.target.value
                                            )
                                          }
                                          className={`mt-2 w-full px-3 py-2 text-xs border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 ${cfg.ring} resize-none`}
                                          rows={2}
                                          placeholder="Note su questa attività..."
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* ── Controlli progetto ── */}
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">Controlli progetto</h4>
                      <p className="text-sm text-gray-600">
                        {isAdminView
                          ? 'Segna quando hai fatto il controllo, note e spunti di miglioramento visibili al web designer.'
                          : 'Risultato dei controlli effettuati sul progetto.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-white rounded-full h-2">
                        <div
                          className="bg-sky-500 h-2 rounded-full transition-all"
                          style={{ width: `${projectControlsProgress.pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">
                        {projectControlsProgress.done}/{projectControlsProgress.total}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {projectControls.map((control, controlIndex) => {
                      const cfg = PROJECT_CONTROL_CONFIG[control.tipo] || {
                        label: control.tipo,
                        shortLabel: control.tipo,
                        description: '',
                      };
                      const plannedDate = parseProjectDate(control.dataPrevista);
                      const statusLabel =
                        CONTROL_STATUS_OPTIONS.find((option) => option.value === control.stato)
                          ?.label || 'Da valutare';
                      const statusClass = CONTROL_STATUS_BADGE[control.stato || ''] || CONTROL_STATUS_BADGE[''];

                      return (
                        <div key={control.tipo} className="bg-white border border-sky-100 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="font-bold text-gray-900">{cfg.label}</h5>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              {cfg.description && (
                                <p className="text-xs text-gray-500 mt-1">{cfg.description}</p>
                              )}
                              <p className="text-xs font-semibold text-sky-700 mt-2">
                                Previsto:{' '}
                                {plannedDate
                                  ? formatDate(plannedDate)
                                  : `Giorno ${control.giornoPrevisto || '-'}`}
                              </p>
                            </div>
                            {isAdminView ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleProjectControlUpdate(
                                    collab._id,
                                    controlIndex,
                                    'completata',
                                    !control.completata
                                  )
                                }
                                className={`flex-shrink-0 transition-colors ${
                                  control.completata
                                    ? 'text-emerald-500'
                                    : 'text-gray-300 hover:text-gray-400'
                                }`}
                                title={control.completata ? 'Segna da fare' : 'Segna completato'}
                              >
                                {control.completata ? (
                                  <CheckSquare className="w-5 h-5" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <div className={`flex-shrink-0 ${control.completata ? 'text-emerald-500' : 'text-gray-300'}`}>
                                {control.completata ? (
                                  <CheckSquare className="w-5 h-5" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </div>
                            )}
                          </div>

                          {isAdminView ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block">
                                  <span className="block text-xs font-semibold text-gray-500 mb-1">
                                    Quando fatto
                                  </span>
                                  <input
                                    type="date"
                                    value={control.data ? new Date(control.data).toISOString().split('T')[0] : ''}
                                    onChange={(e) =>
                                      handleProjectControlUpdate(
                                        collab._id,
                                        controlIndex,
                                        'data',
                                        e.target.value || null
                                      )
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  />
                                </label>
                                <label className="block">
                                  <span className="block text-xs font-semibold text-gray-500 mb-1">
                                    Stato
                                  </span>
                                  <select
                                    value={control.stato || ''}
                                    onChange={(e) =>
                                      handleProjectControlUpdate(
                                        collab._id,
                                        controlIndex,
                                        'stato',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  >
                                    {CONTROL_STATUS_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <label className="block">
                                <span className="block text-xs font-semibold text-gray-500 mb-1">
                                  Note controllo
                                </span>
                                <textarea
                                  value={control.note || ''}
                                  onChange={(e) =>
                                    handleProjectControlUpdate(
                                      collab._id,
                                      controlIndex,
                                      'note',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                  rows={2}
                                  placeholder="Note sul controllo..."
                                />
                              </label>

                              <label className="block">
                                <span className="block text-xs font-semibold text-gray-500 mb-1">
                                  Spunti di miglioramento
                                </span>
                                <textarea
                                  value={control.spuntiMiglioramento || ''}
                                  onChange={(e) =>
                                    handleProjectControlUpdate(
                                      collab._id,
                                      controlIndex,
                                      'spuntiMiglioramento',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                                  rows={2}
                                  placeholder="Cosa migliorare o correggere..."
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="block text-xs font-semibold text-gray-500 mb-1">
                                    Quando fatto
                                  </span>
                                  <p className="text-gray-800">
                                    {control.data
                                      ? new Date(control.data).toLocaleDateString('it-IT')
                                      : 'Non ancora segnato'}
                                  </p>
                                </div>
                                <div>
                                  <span className="block text-xs font-semibold text-gray-500 mb-1">
                                    Stato
                                  </span>
                                  <p className="text-gray-800">{statusLabel}</p>
                                </div>
                              </div>

                              <div>
                                <span className="block text-xs font-semibold text-gray-500 mb-1">
                                  Note controllo
                                </span>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {control.note || 'Nessuna nota inserita.'}
                                </p>
                              </div>

                              <div>
                                <span className="block text-xs font-semibold text-gray-500 mb-1">
                                  Spunti di miglioramento
                                </span>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {control.spuntiMiglioramento || 'Nessuno spunto inserito.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Checklist pubblicazione ── */}
                <div className="rounded-xl border border-emerald-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => togglePublicationChecklist(collab._id)}
                    className="w-full p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-left hover:bg-emerald-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <h4 className="text-base font-bold text-gray-900">Checklist pubblicazione</h4>
                      </div>
                      <p className="text-sm text-gray-500">
                        Reminder controlli pre-lancio dal PDF: sicurezza, tecnica, performance, SEO, UX e test finali.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${publicationProgress.pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                        {publicationProgress.done}/{publicationProgress.total}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isPublicationChecklistOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isPublicationChecklistOpen && (
                    <div className="border-t border-emerald-100 bg-emerald-50 p-4 space-y-4">
                      {publicationChecklist.map((group, groupIndex) => {
                        const groupDone = group.items.filter((item) => item.completata).length;

                        return (
                          <div
                            key={group.categoria}
                            className="bg-white rounded-lg border border-emerald-100 p-4"
                          >
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <h5 className="text-sm font-bold text-gray-900">{group.categoria}</h5>
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                {groupDone}/{group.items.length}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {group.items.map((item, itemIndex) => (
                                <div
                                  key={`${group.categoria}-${item.nome}`}
                                  className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleTogglePublicationItem(
                                        collab._id,
                                        groupIndex,
                                        itemIndex
                                      )
                                    }
                                    className={`flex-shrink-0 mt-0.5 transition-colors ${
                                      item.completata
                                        ? 'text-emerald-500'
                                        : 'text-gray-300 hover:text-gray-400'
                                    }`}
                                    title={item.completata ? 'Segna da controllare' : 'Segna controllato'}
                                  >
                                    {item.completata ? (
                                      <CheckSquare className="w-5 h-5" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <p
                                      className={`text-sm font-semibold leading-snug ${
                                        item.completata
                                          ? 'line-through text-gray-400'
                                          : 'text-gray-800'
                                      }`}
                                    >
                                      {item.nome}
                                    </p>
                                    {item.descrizione && (
                                      <p className="text-xs text-gray-500 mt-1 leading-snug">
                                        {item.descrizione}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Note macro fasi ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {FASE_ORDER.map((nomeFase) => {
                    const cfg = FASE_CONFIG[nomeFase];
                    const fase = getFaseByName(collab.fasi, nomeFase);
                    const realIndex = getFaseIndexByName(collab.fasi, nomeFase);
                    if (!fase) return null;

                    return (
                      <div key={nomeFase} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📝 Note {cfg.label}
                        </label>
                        <textarea
                          value={fase.note || ''}
                          onChange={(e) => handleFaseNote(collab._id, realIndex, e.target.value)}
                          onBlur={(e) => saveFaseNote(collab._id, realIndex, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border border-white bg-white rounded-lg focus:outline-none focus:ring-2 ${cfg.ring} resize-none`}
                          rows={3}
                          placeholder={`Note generali ${cfg.label.toLowerCase()}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ── Note generali progetto ── */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📝 Note Generali Progetto
                  </label>
                  <textarea
                    value={collab.note || ''}
                    onChange={(e) =>
                      setCollaborazioni((prev) =>
                        prev.map((c) =>
                          c._id === collab._id ? { ...c, note: e.target.value } : c
                        )
                      )
                    }
                    onBlur={(e) => patchCollaborazione(collab._id, { note: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    rows={3}
                    placeholder="Inserisci note generali sul progetto..."
                  />
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineWebDesignerV2;

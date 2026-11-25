export default function WebDesignCompletionBadge({ completed, paused = false }) {
  const color = completed
    ? 'bg-emerald-100 text-emerald-800'
    : paused
      ? 'bg-amber-100 text-amber-800'
      : 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {completed ? 'Completato' : paused ? 'In pausa' : 'Non completato'}
    </span>
  );
}

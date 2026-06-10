"use client";

import { Download, ExternalLink } from "lucide-react";

const statusLabel = (status) => {
  if (status === "OPERATIONAL") return "Operativa";
  if (status === "CLOSED_TEMPORARILY") return "Chiusa temporaneamente";
  if (status === "CLOSED_PERMANENTLY") return "Chiusa definitivamente";
  return status || "-";
};

export default function ResultsTable({ results, onExport }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Risultati</h2>
          <p className="text-sm text-gray-500">
            {results.length} aziende senza sito nella scheda Google
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          disabled={results.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Download className="h-4 w-4" />
          CSV
        </button>
      </div>

      {results.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500">
          Nessun risultato da mostrare.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Indirizzo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Telefono
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recensioni
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Maps
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((place) => (
                <tr key={place.id} className="hover:bg-gray-50">
                  <td className="max-w-xs px-4 py-3 text-sm font-medium text-gray-900">
                    {place.name}
                  </td>
                  <td className="max-w-sm px-4 py-3 text-sm text-gray-600">
                    {place.address || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {place.phone || "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {place.rating ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {place.userRatingCount ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {place.googleMapsUri ? (
                      <a
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                      >
                        Apri
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {statusLabel(place.businessStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

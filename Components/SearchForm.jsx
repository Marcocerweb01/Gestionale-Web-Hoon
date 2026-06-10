"use client";

import { Loader2, Search } from "lucide-react";

export default function SearchForm({
  values,
  loading,
  remainingCalls,
  onChange,
  onSubmit
}) {
  const updateField = (field, value) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <form
      className="bg-white rounded-xl shadow-md p-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keyword / categoria
          </label>
          <input
            type="text"
            value={values.keyword}
            onChange={(event) => updateField("keyword", event.target.value)}
            placeholder="dentisti"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            minLength={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Citta o area
          </label>
          <input
            type="text"
            value={values.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Milano"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            minLength={2}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lingua
            </label>
            <input
              type="text"
              value={values.language}
              onChange={(event) => updateField("language", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max
            </label>
            <input
              type="number"
              value={values.maxResults}
              onChange={(event) => updateField("maxResults", Number(event.target.value))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              min={1}
              max={60}
              required
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || remainingCalls <= 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Cerca
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Il numero massimo indica i risultati Google da analizzare. L&apos;output puo essere
        inferiore perche vengono mostrati solo quelli senza websiteUri.
      </p>
    </form>
  );
}

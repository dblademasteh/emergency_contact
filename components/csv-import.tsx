"use client";

import { useRef, useState } from "react";

type ImportResult = {
  imported: number;
  errors: { row: number; error: string }[];
  total: number;
};

type Props = {
  defaultType?: string;
  defaultGroupId?: string;
  label?: string;
  onImported: () => void;
};

export function CsvImport({
  defaultType,
  defaultGroupId,
  label,
  onImported,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result as string);
    reader.readAsText(file);
  }

  async function doImport() {
    if (!csvText.trim()) {
      setError("No CSV data loaded.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: csvText,
          defaultType: defaultType ?? null,
          defaultGroupId: defaultGroupId ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Import failed.");
        return;
      }
      setResult(data);
      if (data.imported > 0) onImported();
    } catch {
      setError("Import failed. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCsvText("");
    setFileName(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {label ?? "Import CSV"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Import Contacts
              </h2>
              <button
                type="button"
                onClick={() => { setOpen(false); reset(); }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
              >
                {fileName ?? "Choose CSV file"}
              </button>
              <p className="mt-1 text-xs text-slate-400">
                Columns: name, phone, type, note, facebook, primary, group_id
              </p>
            </div>

            {csvText && !result && (
              <p className="mb-2 text-xs text-slate-500">
                {csvText.split(/\r?\n/).filter((l) => l.trim()).length - 1} rows loaded
              </p>
            )}

            {error && (
              <p className="mb-2 text-xs font-medium text-red-600">{error}</p>
            )}

            {result && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Imported {result.imported} of {result.total} contacts
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-red-600">
                    {result.errors.map((e) => (
                      <li key={e.row}>Row {e.row}: {e.error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setOpen(false); reset(); }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {result ? "Close" : "Cancel"}
              </button>
              {!result && (
                <button
                  type="button"
                  onClick={doImport}
                  disabled={busy || !csvText.trim()}
                  className="rounded-full bg-linear-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-rose-600/25 transition hover:brightness-110 disabled:opacity-60"
                >
                  {busy ? "Importing…" : "Import"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

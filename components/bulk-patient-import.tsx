"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Download } from "lucide-react";
import { parseCsv } from "@/lib/csv";

interface PreviewRow {
  name: string;
  age: number | null;
  gender: string;
  diabetesDuration: number | null;
  contactNumber: string;
}

const SAMPLE_CSV = `name,age,gender,diabetesDuration,contactNumber
Anita Sharma,58,Female,10,9000000001
Ramesh Iyer,63,Male,15,9000000002`;

export default function BulkPatientImport({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsv(String(reader.result));
        if (parsed.length === 0) throw new Error("empty");

        const mapped: PreviewRow[] = parsed.map((r) => ({
          name: r.name ?? "",
          age: r.age ? Number(r.age) : null,
          gender: r.gender ?? "",
          diabetesDuration: r.diabetesDuration ? Number(r.diabetesDuration) : null,
          contactNumber: r.contactNumber ?? "",
        }));
        setRows(mapped);
      } catch {
        setParseError("Couldn't read that file. Make sure it's a CSV with a header row: name, age, gender, diabetesDuration, contactNumber.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!rows) return;
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/patients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patients: rows.map((r) => ({
            name: r.name,
            age: r.age,
            gender: r.gender,
            ...(r.diabetesDuration != null ? { diabetesDuration: r.diabetesDuration } : {}),
            ...(r.contactNumber ? { contactNumber: r.contactNumber } : {}),
          })),
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.created > 0) router.refresh();
    } catch {
      setResult({ created: 0, errors: [{ row: 0, message: "Import failed — check your connection and try again." }] });
    } finally {
      setSubmitting(false);
    }
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drishai-patients-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows(null);
    setFileName(null);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-neutral-900">Bulk import patients</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Upload a CSV for a whole screening camp at once. Columns: <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">name, age, gender, diabetesDuration, contactNumber</code>
          </p>
        </div>
        <button onClick={downloadSample} className="btn-secondary shrink-0 !px-3 !py-1.5 text-xs">
          <Download size={14} className="mr-1.5" /> Sample CSV
        </button>
      </div>

      {!rows && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 px-6 py-10 text-center transition-colors hover:border-brand-300 hover:bg-neutral-50"
        >
          <UploadCloud className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-700">Click to choose a CSV file</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {parseError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{parseError}</p>}

      {rows && !result && (
        <div className="mt-4 animate-fade-up">
          <p className="text-sm text-neutral-600">
            <strong>{fileName}</strong> — {rows.length} row{rows.length === 1 ? "" : "s"} found
          </p>
          <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Age</th>
                  <th className="px-3 py-2 font-medium">Gender</th>
                  <th className="px-3 py-2 font-medium">Diabetic (yrs)</th>
                  <th className="px-3 py-2 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-neutral-100">
                    <td className="px-3 py-1.5">{r.name || <span className="text-red-500">missing</span>}</td>
                    <td className="px-3 py-1.5">{r.age ?? <span className="text-red-500">missing</span>}</td>
                    <td className="px-3 py-1.5">{r.gender || <span className="text-red-500">missing</span>}</td>
                    <td className="px-3 py-1.5">{r.diabetesDuration ?? "—"}</td>
                    <td className="px-3 py-1.5">{r.contactNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={handleImport} disabled={submitting} className="btn-primary">
              {submitting ? "Importing…" : `Import ${rows.length} patient${rows.length === 1 ? "" : "s"}`}
            </button>
            <button onClick={reset} disabled={submitting} className="btn-secondary">
              Choose a different file
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 animate-fade-up space-y-3">
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
            Imported {result.created} patient{result.created === 1 ? "" : "s"} successfully.
          </p>
          {result.errors.length > 0 && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <p className="font-medium">{result.errors.length} row(s) skipped:</p>
              <ul className="mt-1 list-inside list-disc">
                {result.errors.map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <a href={redirectTo} className="btn-primary">View patients</a>
            <button onClick={reset} className="btn-secondary">Import another file</button>
          </div>
        </div>
      )}
    </div>
  );
}

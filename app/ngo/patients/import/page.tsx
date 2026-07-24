import BulkPatientImport from "@/components/bulk-patient-import";

export default function NgoBulkImportPage() {
  return (
    <div>
      <h1 className="animate-fade-up font-display text-2xl text-neutral-900">Bulk import patients</h1>
      <p className="mt-1 animate-fade-up text-sm text-neutral-500" style={{ animationDelay: "40ms" }}>
        For registering a whole screening camp at once.
      </p>
      <div className="mt-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
        <BulkPatientImport redirectTo="/ngo" />
      </div>
    </div>
  );
}

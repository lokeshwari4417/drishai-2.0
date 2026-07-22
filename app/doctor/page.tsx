export default function DoctorHome() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Patients</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Patient table → click a patient → profile & scan history (next to build).
          </p>
        </div>
        <button className="btn-primary">+ New patient</button>
      </div>

      <div className="card mt-6 overflow-hidden !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Last screening</th>
              <th className="px-4 py-3 font-medium">DR stage</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                No patients yet — connect this table to the Patient Management Module.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

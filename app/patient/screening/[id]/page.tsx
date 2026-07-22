import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReportViewer from "./report-viewer";

interface RouteParams {
  params: {
    id: string;
  };
}

export default async function ScreeningReportPage({ params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Fetch specific screening record
  const screening = await prisma.screeningRecord.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      images: true,
      analysis: true,
    },
  });

  if (!screening) notFound();

  // Security check: Patients should only see their own screening records.
  // Admins can see everything. Doctors/NGOs can see records they created or manage.
  if (session.user.role === "PATIENT") {
    const patientProfile = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });
    if (patientProfile && screening.patientId !== patientProfile.id) {
      return (
        <div className="p-6 bg-red-50 text-red-800 border border-red-200 rounded-xl text-center">
          <h2 className="font-semibold text-lg">Access Denied</h2>
          <p className="mt-1 text-sm">You do not have permission to view this screening record.</p>
          <Link href="/patient" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            Go back to dashboard
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/patient/screening/history" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            ← Back to Screening History
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Clinical AI Grading Report</h1>
          <p className="text-sm text-neutral-500 font-mono mt-1">Screening Session: {screening.id}</p>
        </div>
        
        <button
          onClick={() => {
            if (typeof window !== "undefined") window.print();
          }}
          className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white text-sm font-medium rounded-lg shadow-sm transition cursor-pointer print:hidden"
        >
          Print Report 🖨
        </button>
      </div>

      <ReportViewer screening={screening} />
    </div>
  );
}

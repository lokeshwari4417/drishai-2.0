import ReportDetail from "@/components/report-detail";

export default function PatientReportPage({ params }: { params: { id: string } }) {
  return <ReportDetail screeningId={params.id} />;
}

import ReportDetail from "@/components/report-detail";

export default function ReportPage({ params }: { params: { id: string } }) {
  return <ReportDetail screeningId={params.id} />;
}

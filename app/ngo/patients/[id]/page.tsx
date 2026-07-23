import StaffPatientDetail from "@/components/staff-patient-detail";

export default function NgoPatientDetailPage({ params }: { params: { id: string } }) {
  return <StaffPatientDetail patientId={params.id} />;
}

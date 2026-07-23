import StaffPatientDetail from "@/components/staff-patient-detail";

export default function DoctorPatientDetailPage({ params }: { params: { id: string } }) {
  return <StaffPatientDetail patientId={params.id} />;
}

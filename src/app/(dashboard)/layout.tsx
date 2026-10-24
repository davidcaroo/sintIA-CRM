import { DashboardShell } from "@/components/DashboardShell";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let businessName = "Clínica Dental Lumen";
  let agencyName = "Agencia IA";

  try {
    const business = await db.businessInfo.findFirst();
    if (business) {
      businessName = business.name || businessName;
      agencyName = business.agencyName || agencyName;
    }
  } catch {
    // Si la DB aún está arrancando, usa los valores por defecto
  }

  return (
    <DashboardShell businessName={businessName} agencyName={agencyName}>
      {children}
    </DashboardShell>
  );
}

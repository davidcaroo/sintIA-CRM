import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      <Sidebar businessName={businessName} agencyName={agencyName} />
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pt-16 lg:pt-0">
        <Navbar businessName={businessName} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

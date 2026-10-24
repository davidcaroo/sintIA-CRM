"use client";

import React, { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

interface DashboardShellProps {
  businessName: string;
  agencyName: string;
  children: React.ReactNode;
}

export function DashboardShell({
  businessName,
  agencyName,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  // Al cambiar de vista, resetear de inmediato el scroll al tope absoluto
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  return (
    <div className="h-screen h-[100dvh] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar Desktop y Drawer Móvil */}
      <Sidebar businessName={businessName} agencyName={agencyName} />

      {/* Área Principal de Contenido */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden pt-16 lg:pt-0">
        {/* Navbar superior para Desktop (en móvil se usa la barra de Sidebar) */}
        <Navbar businessName={businessName} />

        {/* Contenedor de vista con scroll interno aislado y limpio */}
        <main
          ref={mainRef}
          id="dashboard-main"
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 focus:outline-hidden"
        >
          <div className="max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

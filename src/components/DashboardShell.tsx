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
  const isConversationsPage = pathname === "/conversaciones";

  // Al cambiar de vista, resetear el scroll al tope
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
        {/* Navbar superior para Desktop */}
        <Navbar businessName={businessName} />

        {/* Contenedor de vista:
            - En /conversaciones: sin scroll exterior (overflow-hidden), h-full exacto estilo Vocero.
            - En el resto de vistas: scroll interno (overflow-y-auto) con padding amplio. */}
        <main
          ref={mainRef}
          id="dashboard-main"
          className={`flex-1 focus:outline-hidden ${
            isConversationsPage
              ? "overflow-hidden flex flex-col h-full min-h-0 p-2 sm:p-3 lg:p-4"
              : "overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10"
          }`}
        >
          <div
            className={`max-w-7xl w-full mx-auto ${
              isConversationsPage ? "flex-1 h-full min-h-0 flex flex-col" : ""
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

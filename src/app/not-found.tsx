import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-2xl flex items-center justify-center mb-4 border border-indigo-500/20">
        404
      </div>
      <h2 className="text-xl font-bold">Página no encontrada</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
        La ruta solicitada no existe o ha sido movida dentro del panel de Sintia.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
      >
        Volver al panel
      </Link>
    </div>
  );
}

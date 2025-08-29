import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-600 mb-6">Non hai i permessi necessari per accedere a questa pagina.</p>
        <Link href="/" className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
          🏠 Torna alla Home
        </Link>
      </div>
    </div>
  );
}

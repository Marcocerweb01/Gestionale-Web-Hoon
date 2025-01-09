import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-red-500">Accesso Negato</h1>
      <p className="text-gray-700 mt-2">Non hai i permessi per accedere a questa pagina.</p>
      <Link href="/" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Torna alla Home
      </Link>
    </div>
  );
}

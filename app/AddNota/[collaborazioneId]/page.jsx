'use client'
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import CreaNota from "@Components/add-nota";

const EditCollaboration = ({ params }) => {
  const { collaborazioneId } = params; // Ottieni il parametro dalla route dinamica
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const clienteQuery = searchParams.get("cliente");
  const collaboratoreId = searchParams.get("collaboratoreId");
  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-4">
        <p className="text-lg text-gray-600">Accesso richiesto</p>
      </div>
    </div>;
  }

  if (!collaborazioneId) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-4">
        <p className="text-lg text-gray-600">Collaborazione non trovata</p>
      </div>
    </div>;
  }
  console.log(session.user)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header mobile-friendly */}
      <div className="bg-white shadow-sm border-b px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
          📝 Nuova Nota: {clienteQuery}
        </h1>
      </div>
      
      {/* Content container con padding responsivo */}
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <CreaNota 
          collaborazioneId={collaborazioneId} 
          autoreId={session.user.id} 
          autorenome={session.user.nome + " " + session.user.cognome}
          collaboratoreId={collaboratoreId}
        />
      </div>
    </div>
  );
};

export default EditCollaboration;

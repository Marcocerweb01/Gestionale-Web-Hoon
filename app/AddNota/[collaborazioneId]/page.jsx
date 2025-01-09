'use client'
import { useSession } from "next-auth/react";
import CreaNota from "@Components/add-nota";

const EditCollaboration = ({ params }) => {
  const { collaborazioneId } = params; // Ottieni il parametro dalla route dinamica
  const { data: session } = useSession();

  if (!session) {
    return <div>Accesso richiesto</div>;
  }

  if (!collaborazioneId) {
    return <div>Collaborazione non trovata</div>;
  }
  console.log(session.user)
  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">
        Feed per Collaborazione: {collaborazioneId}
      </h1>
      <CreaNota collaborazioneId={collaborazioneId} autoreId={session.user.id} autorenome={session.user.nome + " " + session.user.cognome} />
    </div>
  );
};

export default EditCollaboration;

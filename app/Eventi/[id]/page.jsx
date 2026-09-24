import EventoDetailClient from "@/Components/EventoDetailClient";

export const metadata = { title: "Dettaglio Evento | Webarea" };

export default async function EventoPage({ params }) {
  const { id } = await params;
  return <EventoDetailClient eventId={id} />;
}

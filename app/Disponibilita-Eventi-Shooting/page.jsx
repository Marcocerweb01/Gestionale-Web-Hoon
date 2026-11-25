import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import EventAvailabilityClient from "@/Components/EventAvailabilityClient";

export const metadata = { title: "Disponibilità Eventi & Shooting | Webarea" };

export default async function AvailabilityPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "collaboratore") redirect("/Eventi#disponibilita");
  const { evento } = await searchParams;
  return <EventAvailabilityClient eventId={typeof evento === "string" ? evento : ""} />;
}

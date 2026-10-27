import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import CommercialeClient from "@/Components/commerciale/CommercialeClient";
import { authOptions } from "@/lib/auth";
import { isCommercialAdmin } from "@/lib/commerciale/auth";

export const metadata = {
  title: "Commerciale | Hoon",
  description: "CRM, interviste, preventivi, contratti e pagamenti Hoon",
};

export default async function CommercialePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/Login");
  if (!isCommercialAdmin(session.user)) redirect("/unauthorized");
  return <CommercialeClient adminEmail={session.user.email} />;
}


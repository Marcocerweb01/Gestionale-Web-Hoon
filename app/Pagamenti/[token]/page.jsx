import PaymentAuthorizationClient from "@/Components/commerciale/PaymentAuthorizationClient";

export const metadata = {
  title: "Autorizzazione pagamenti | Hoon",
  description: "Autorizza in sicurezza i pagamenti della collaborazione Hoon",
};

export default async function PaymentAuthorizationPage({ params }) {
  const { token } = await params;
  return <PaymentAuthorizationClient token={token} />;
}


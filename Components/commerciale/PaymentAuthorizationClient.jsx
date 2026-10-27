"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";

const money = (value, currency = "EUR") => new Intl.NumberFormat("it-IT", { style: "currency", currency: currency.toUpperCase() }).format(Number(value) || 0);
const formatDate = (value) => value ? new Intl.DateTimeFormat("it-IT", { dateStyle: "long" }).format(new Date(value)) : "-";

export default function PaymentAuthorizationClient({ token }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [outcome, setOutcome] = useState("");

  useEffect(() => {
    setOutcome(new URLSearchParams(window.location.search).get("esito") || "");
    fetch(`/api/pagamento-autorizzazione/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Link non disponibile");
        setPlan(payload);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [token]);

  const continueToStripe = async () => {
    setRedirecting(true);
    setError("");
    try {
      const response = await fetch(`/api/pagamento-autorizzazione/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossibile proseguire");
      window.location.assign(payload.checkoutUrl);
    } catch (reason) {
      setError(reason.message);
      setRedirecting(false);
    }
  };

  if (loading) return <div className="min-h-[70vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  if (!plan) return <div className="min-h-[70vh] grid place-items-center"><div className="max-w-md text-center bg-white border rounded-2xl p-8"><h1 className="text-2xl font-bold">Link non disponibile</h1><p className="mt-3 text-gray-600">{error}</p></div></div>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-black text-white p-8 md:p-10">
          <div className="text-4xl font-black tracking-tight">HOON</div>
          <p className="mt-8 text-sm uppercase tracking-[0.2em] text-yellow-300">Autorizzazione pagamenti</p>
          <h1 className="mt-2 text-3xl font-bold">{plan.company}</h1>
          <p className="mt-2 text-gray-300">Preventivo {plan.quoteNumber} · {plan.serviceName}</p>
        </div>
        <div className="p-6 md:p-10 space-y-8">
          {outcome === "ricevuto" && (
            <div className="flex gap-3 p-4 bg-green-50 text-green-800 border border-green-200 rounded-xl"><CheckCircle2 className="shrink-0" /><p>Richiesta ricevuta. La conferma definitiva avverrà dopo la verifica server-side di Stripe.</p></div>
          )}

          <section>
            <h2 className="text-lg font-bold text-gray-900">Riepilogo economico</h2>
            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs uppercase text-gray-500">Importo</p><p className="text-xl font-bold mt-1">{money(plan.amount, plan.currency)}</p></div>
              <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs uppercase text-gray-500">Tipologia</p><p className="text-base font-semibold mt-1">{plan.type === "subscription" ? "Mensile" : plan.type === "renewal" ? "Rinnovo annuale" : "Rateizzato"}</p></div>
              <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs uppercase text-gray-500">Decorrenza</p><p className="text-base font-semibold mt-1">{formatDate(plan.startsAt)}</p></div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">Servizi inclusi</h2>
            <div className="mt-3 divide-y border rounded-xl">
              {plan.services.map((service, index) => <div key={`${service.service}-${index}`} className="p-4 flex justify-between gap-4"><div><p className="font-semibold">{service.service}</p><p className="text-sm text-gray-500">{service.description}</p></div><span className="font-semibold whitespace-nowrap">{money(service.gross, plan.currency)}</span></div>)}
            </div>
          </section>

          {plan.installments?.length > 0 && <section><h2 className="text-lg font-bold">Scadenze</h2><div className="mt-3 space-y-2">{plan.installments.map((item) => <div key={item._id} className="flex items-center justify-between rounded-lg border p-3"><span>{item.label || "Rata"} · {item.dueType === "milestone" ? `Milestone: ${item.milestone}` : formatDate(item.dueAt)}</span><strong>{money(item.amount, plan.currency)}</strong></div>)}</div></section>}

          <section className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5">
            <div className="flex gap-3"><ShieldCheck className="text-yellow-700 shrink-0" /><div><h2 className="font-bold">Condizioni economiche v{plan.conditionsVersion}</h2><p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{plan.conditionsText || "Autorizzo Hoon a gestire gli addebiti descritti in questa pagina tramite Stripe."}</p></div></div>
            <label className="mt-5 flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-5 w-5 accent-black" /><span className="text-sm font-medium">Ho letto e accetto esplicitamente le condizioni di pagamento e gli eventuali addebiti futuri descritti sopra.</span></label>
          </section>

          {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
          <button onClick={continueToStripe} disabled={!accepted || redirecting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black px-6 py-4 text-white font-bold hover:bg-gray-800 disabled:opacity-40"><CreditCard className="w-5 h-5" />{redirecting ? "Apertura Stripe…" : "Continua in sicurezza con Stripe"}</button>
          <p className="text-center text-xs text-gray-500">I dati completi della carta non transitano né vengono conservati nel gestionale Hoon.</p>
        </div>
      </div>
    </div>
  );
}


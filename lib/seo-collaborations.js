import { Collaboratore } from "@/models/User";
import CollaborazioneSeo from "@/models/CollaborazioneSeo";

export const SEO_TASKS = [
  ["indicizzazione", "Indicizzazione sito web - invio sitemap"],
  ["monitoraggio", "Collegamento piattaforme di monitoraggio (Google Ads, Google Search Console, Bing Webmaster Tool)"],
  ["ottimizzazione", "Ottimizzazione di base pagine principali (title, meta description, immagine principale)"],
  ["link-building", "Link building interna"],
];

export const seoProgress = (collaboration) => {
  const checklist = collaboration.checklist || [];
  return checklist.length ? Math.round((checklist.filter((item) => item.completata).length / checklist.length) * 100) : 0;
};

export async function findSeoAssignee() {
  const candidates = await Collaboratore.find({ status: { $ne: "non_attivo" }, subRoles: "seo" }).select("nome cognome email telefono");
  const giulia = candidates.find((item) => /^giulia$/i.test(item.nome.trim()));
  if (giulia) return giulia;
  if (candidates.length === 1) return candidates[0];
  throw new Error("Impossibile assegnare il servizio SEO: configura un unico utente SEO oppure l'utente Giulia");
}

export async function createSeoCollaborationForWebProject({ project, sourceType, seo }) {
  const assignee = seo || await findSeoAssignee();
  return CollaborazioneSeo.findOneAndUpdate(
    { sourceType, sourceId: project._id },
    { $setOnInsert: { cliente: project.cliente, webDesigner: project.webDesigner, seo: assignee._id, aziendaRagioneSociale: project.aziendaRagioneSociale, checklist: SEO_TASKS.map(([key, label]) => ({ key, label })) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

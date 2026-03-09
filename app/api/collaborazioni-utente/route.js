import { connectToDB } from "@/utils/database";
import Collaborazioni from "@/models/Collaborazioni";
import Collaborazioniwebdesign from "@/models/Collaborazioniwebdesign";
import GoogleAds from "@/models/GoogleAds";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET - Recupera tutte le collaborazioni per ogni utente (solo admin)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    // Recupera tutte le collaborazioni social
    const collaborazioniSocial = await Collaborazioni.find()
      .populate('azienda', 'ragioneSociale email')
      .populate('collaboratore', 'nome cognome')
      .sort({ aziendaRagioneSociale: 1 });
    
    // Recupera tutte le collaborazioni web design
    const collaborazioniWebDesign = await Collaborazioniwebdesign.find()
      .populate('cliente', 'ragioneSociale email')
      .populate('webDesigner', 'nome cognome')
      .sort({ aziendaRagioneSociale: 1 });
    
    // Recupera tutte le collaborazioni Google Ads
    const collaborazioniGoogleAds = await GoogleAds.find()
      .populate('cliente', 'ragioneSociale email')
      .populate('collaboratore', 'nome cognome')
      .sort({ clienteEtichetta: 1 });
    
    // Organizza le collaborazioni per utente
    const utentiMap = new Map();
    
    // Processa collaborazioni social
    collaborazioniSocial.forEach(collab => {
      const userId = collab.azienda?._id?.toString();
      if (!userId) return;
      
      if (!utentiMap.has(userId)) {
        utentiMap.set(userId, {
          _id: userId,
          ragioneSociale: collab.aziendaRagioneSociale || collab.azienda?.ragioneSociale,
          email: collab.azienda?.email,
          social: [],
          webDesign: [],
          googleAds: []
        });
      }
      
      utentiMap.get(userId).social.push({
        _id: collab._id,
        collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`,
        stato: collab.stato,
        dataInizio: collab.dataInizio,
        dataFine: collab.dataFine,
        tipo: 'social'
      });
    });
    
    // Processa collaborazioni web design
    collaborazioniWebDesign.forEach(collab => {
      const userId = collab.cliente?._id?.toString();
      if (!userId) return;
      
      if (!utentiMap.has(userId)) {
        utentiMap.set(userId, {
          _id: userId,
          ragioneSociale: collab.aziendaRagioneSociale || collab.cliente?.ragioneSociale,
          email: collab.cliente?.email,
          social: [],
          webDesign: [],
          googleAds: []
        });
      }
      
      utentiMap.get(userId).webDesign.push({
        _id: collab._id,
        collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`,
        tipoProgetto: collab.tipoProgetto,
        stato: collab.stato,
        dataInizioContratto: collab.dataInizioContratto,
        dataFineContratto: collab.dataFineContratto,
        tipo: 'webdesign'
      });
    });
    
    // Processa collaborazioni Google Ads
    collaborazioniGoogleAds.forEach(collab => {
      const userId = collab.cliente?._id?.toString();
      if (!userId) return;
      
      if (!utentiMap.has(userId)) {
        utentiMap.set(userId, {
          _id: userId,
          ragioneSociale: collab.clienteEtichetta || collab.cliente?.ragioneSociale,
          email: collab.cliente?.email,
          social: [],
          webDesign: [],
          googleAds: []
        });
      }
      
      utentiMap.get(userId).googleAds.push({
        _id: collab._id,
        collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`,
        contattato: collab.contattato,
        campagnaAvviata: collab.campagnaAvviata,
        campagnaTerminata: collab.campagnaTerminata,
        tipo: 'googleads'
      });
    });
    
    // Converti la mappa in array
    const utenti = Array.from(utentiMap.values());
    
    return NextResponse.json(utenti, { status: 200 });
  } catch (error) {
    console.error("Errore recupero collaborazioni utente:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

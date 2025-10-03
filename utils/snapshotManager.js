import { connectToDB } from "@/utils/database";
import SnapshotCollaborazioni from "@/models/SnapshotCollaborazioni";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";
import { Collaboratore } from "@/models/User";

// Funzione per ottenere il mese corrente
export const getCurrentMonth = () => {
  const now = new Date();
  return {
    mese: now.getMonth(), // 0-11
    anno: now.getFullYear(),
    meseNome: getMonthName(now.getMonth(), now.getFullYear())
  };
};

// Funzione per ottenere il mese precedente
export const getPreviousMonth = () => {
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth() - 1;
  
  if (targetMonth < 0) {
    targetMonth = 11;
    targetYear = targetYear - 1;
  }
  
  return {
    mese: targetMonth,
    anno: targetYear,
    meseNome: getMonthName(targetMonth, targetYear)
  };
};

const getMonthName = (month, year) => {
  const italianMonths = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];
  return `${italianMonths[month]} ${year}`;
};

// Export della funzione per uso esterno
export { getMonthName };

// Funzione per assicurare che esista sempre lo snapshot del mese corrente
const ensureCurrentMonthSnapshot = async () => {
  try {
    const currentMonth = getCurrentMonth();
    const previousMonth = getPreviousMonth();
    const today = new Date().getDate();
    
    // Controlla se esiste lo snapshot del mese corrente
    const currentSnapshot = await SnapshotCollaborazioni.findOne({
      mese: currentMonth.mese,
      anno: currentMonth.anno
    });
    
    if (!currentSnapshot) {
      console.log(`🔄 Auto-creazione snapshot per ${currentMonth.meseNome}`);
      // Lo creerà più avanti nel codice updateSnapshot
    }
    
    // Se siamo i primi 3 giorni del mese, assicurati che esista anche quello precedente
    if (today <= 3) {
      const prevSnapshot = await SnapshotCollaborazioni.findOne({
        mese: previousMonth.mese,
        anno: previousMonth.anno
      });
      
      if (!prevSnapshot) {
        console.log(`🔄 Auto-creazione snapshot per ${previousMonth.meseNome} (primo del mese)`);
        await createSnapshotForMonth(previousMonth.mese, previousMonth.anno);
      }
    }
  } catch (error) {
    console.error("Errore in ensureCurrentMonthSnapshot:", error);
  }
};

// Funzione per calcolare gli appuntamenti fatti in un mese specifico
const calcolaAppuntamentiFatti = async (collaborazioneId, mese, anno) => {
  const firstDay = new Date(anno, mese, 1, 0, 0, 0, 0);
  const lastDay = new Date(anno, mese + 1, 0, 23, 59, 59, 999);
  
  return await Nota.countDocuments({
    collaborazione: collaborazioneId,
    tipo: "appuntamento",
    data_appuntamento: { 
      $gte: firstDay, 
      $lte: lastDay 
    }
  });
};

// Funzione per creare uno snapshot per un mese specifico (utile per mesi precedenti)
export const createSnapshotForMonth = async (targetMese, targetAnno) => {
  try {
    await connectToDB();
    
    console.log(`Creando snapshot per mese: ${targetMese + 1}/${targetAnno}`);
    
    // Verifica se esiste già uno snapshot per questo mese
    let snapshot = await SnapshotCollaborazioni.findOne({
      mese: targetMese,
      anno: targetAnno
    });
    
    if (!snapshot) {
      // Crea un nuovo snapshot
      snapshot = new SnapshotCollaborazioni({
        mese: targetMese,
        anno: targetAnno,
        meseNome: getMonthName(targetMese, targetAnno),
        collaborazioni_snapshot: [],
        stato: 'attivo',
        data_creazione: new Date(),
        data_aggiornamento: new Date()
      });
    }
    
    // Recupera tutte le collaborazioni con collaboratori attivi
    const collaborazioni = await Collaborazione.find({})
      .populate({
        path: 'collaboratore',
        match: { status: 'attivo' }, // ✨ FILTRA SOLO COLLABORATORI ATTIVI
        select: 'nome cognome email status'
      })
      .populate('azienda', 'ragioneSociale');
    
    // Filtra solo collaborazioni con collaboratori attivi (non null dopo il match)
    const collaborazioniAttive = collaborazioni.filter(collab => collab.collaboratore !== null);
    
    snapshot.collaborazioni_snapshot = [];
    
    for (const collab of collaborazioniAttive) {
      // Calcola gli appuntamenti fatti nel mese specifico
      const appuntamentiFatti = await calcolaAppuntamentiFatti(
        collab._id, 
        targetMese, 
        targetAnno
      );
      
      const collaboratoreData = {
        collaborazione_id: collab._id,
        collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`.trim(),
        cliente: collab.aziendaRagioneSociale || "",
        appuntamenti_totali: collab.numero_appuntamenti || 0,
        appuntamenti_fatti: appuntamentiFatti,
        post_ig_fb: `${collab.post_ig_fb_fatti || 0} / ${collab.post_ig_fb || 0}`,
        post_tiktok: `${collab.post_tiktok_fatti || 0} / ${collab.post_tiktok || 0}`,
        post_linkedin: `${collab.post_linkedin_fatti || 0} / ${collab.post_linkedin || 0}`,
        ultimo_aggiornamento: new Date()
      };
      
      snapshot.collaborazioni_snapshot.push(collaboratoreData);
    }
    
    // Salva lo snapshot
    await snapshot.save();
    console.log(`Snapshot creato con ${snapshot.collaborazioni_snapshot.length} collaborazioni per ${getMonthName(targetMese, targetAnno)}`);
    
    return snapshot;
  } catch (error) {
    console.error("Errore nella creazione dello snapshot per mese specifico:", error);
    throw error;
  }
};

// Funzione principale per aggiornare lo snapshot
export const updateSnapshot = async (collaborazioneId = null) => {
  try {
    await connectToDB();
    
    // *** AUTO-CREAZIONE: Assicurati che esistano gli snapshot necessari ***
    await ensureCurrentMonthSnapshot();
    
    const currentMonth = getCurrentMonth();
    
    // Trova o crea lo snapshot per il mese corrente
    let snapshot = await SnapshotCollaborazioni.findOne({
      mese: currentMonth.mese,
      anno: currentMonth.anno
    });
    
    if (!snapshot) {
      console.log(`Creando snapshot per ${currentMonth.meseNome}`);
      snapshot = new SnapshotCollaborazioni({
        mese: currentMonth.mese,
        anno: currentMonth.anno,
        meseNome: currentMonth.meseNome,
        collaborazioni_snapshot: []
      });
    }
    
    // Se è specificata una collaborazione, aggiorna solo quella, altrimenti tutte
    const collaborazioni = collaborazioneId 
      ? await Collaborazione.find({ _id: collaborazioneId })
        .populate({
          path: 'collaboratore',
          match: { status: 'attivo' }, // ✨ FILTRA SOLO COLLABORATORI ATTIVI
          select: 'nome cognome email status'
        })
        .populate('azienda', 'ragioneSociale')
      : await Collaborazione.find({})
        .populate({
          path: 'collaboratore',
          match: { status: 'attivo' }, // ✨ FILTRA SOLO COLLABORATORI ATTIVI
          select: 'nome cognome email status'
        })
        .populate('azienda', 'ragioneSociale');
    
    // Filtra solo collaborazioni con collaboratori attivi
    const collaborazioniAttive = collaborazioni.filter(collab => collab.collaboratore !== null);
    
    for (const collab of collaborazioniAttive) {
      const appuntamentiFatti = await calcolaAppuntamentiFatti(
        collab._id, 
        currentMonth.mese, 
        currentMonth.anno
      );
      
      const collaboratoreData = {
        collaborazione_id: collab._id,
        collaboratore: `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`.trim(),
        cliente: collab.aziendaRagioneSociale || "",
        appuntamenti_totali: collab.numero_appuntamenti || 0,
        appuntamenti_fatti: appuntamentiFatti,
        post_ig_fb: `${collab.post_ig_fb_fatti || 0} / ${collab.post_ig_fb || 0}`,
        post_tiktok: `${collab.post_tiktok_fatti || 0} / ${collab.post_tiktok || 0}`,
        post_linkedin: `${collab.post_linkedin_fatti || 0} / ${collab.post_linkedin || 0}`,
        ultimo_aggiornamento: new Date()
      };
      
      // Trova se esiste già questa collaborazione nello snapshot
      const existingIndex = snapshot.collaborazioni_snapshot.findIndex(
        item => item.collaborazione_id.toString() === collab._id.toString()
      );
      
      if (existingIndex >= 0) {
        // Aggiorna esistente
        snapshot.collaborazioni_snapshot[existingIndex] = collaboratoreData;
      } else {
        // Aggiungi nuovo
        snapshot.collaborazioni_snapshot.push(collaboratoreData);
      }
    }
    
    snapshot.data_ultimo_aggiornamento = new Date();
    await snapshot.save();
    
    console.log(`Snapshot aggiornato per ${currentMonth.meseNome}`);
    return snapshot;
    
  } catch (error) {
    console.error("Errore nell'aggiornamento dello snapshot:", error);
    throw error;
  }
};

// Funzione per ottenere lo snapshot di un mese specifico
export const getSnapshot = async (mese = null, anno = null) => {
  try {
    await connectToDB();
    
    // Se non specificato, usa il mese corrente
    const target = mese !== null && anno !== null 
      ? { mese, anno }
      : getCurrentMonth();
    
    return await SnapshotCollaborazioni.findOne({
      mese: target.mese,
      anno: target.anno
    });
  } catch (error) {
    console.error("Errore nel recupero dello snapshot:", error);
    throw error;
  }
};

// Funzione per marcare lo snapshot come esportato (senza azzerarlo)
export const markSnapshotAsExported = async (mese, anno) => {
  try {
    await connectToDB();
    
    const snapshot = await SnapshotCollaborazioni.findOne({ mese, anno });
    
    if (snapshot) {
      snapshot.stato = 'esportato';
      snapshot.data_export = new Date();
      
      // NON azzeriamo i dati - li manteniamo per futuri export
      // snapshot.collaborazioni_snapshot = [];
      
      await snapshot.save();
      console.log(`Snapshot ${snapshot.meseNome} marcato come esportato (dati mantenuti)`);
      
      return snapshot;
    }
    
    return null;
  } catch (error) {
    console.error("Errore nel marcare lo snapshot come esportato:", error);
    throw error;
  }
};

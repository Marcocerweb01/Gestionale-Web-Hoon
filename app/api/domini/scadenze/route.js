import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { Collaboratore } from "@/models/User";
import { connectToDB } from "@/utils/database";
import { inviaEmailRiepilogoDomini } from "@/utils/emailService";

/**
 * GET /api/domini/scadenze
 * Recupera tutti i domini in scadenza (entro 30 giorni)
 * Query params:
 * - onlyExpiring: se true, ritorna solo i domini in scadenza
 */
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const onlyExpiring = searchParams.get('onlyExpiring') === 'true';

    const oggi = new Date();
    const trenitaGiorniDaOggi = new Date();
    trenitaGiorniDaOggi.setDate(oggi.getDate() + 30);

    let query = {
      'dominio.dataScadenza': { $exists: true, $ne: null }
    };

    if (onlyExpiring) {
      query['dominio.dataScadenza'] = {
        $gte: oggi,
        $lte: trenitaGiorniDaOggi
      };
    }

    const collaborazioni = await CollaborazioneWebDesign.find(query)
      .populate("cliente", "etichetta email")
      .populate("webDesigner", "nome cognome email")
      .sort({ 'dominio.dataScadenza': 1 });

    // Calcola giorni mancanti per ogni collaborazione
    const collaborazioniConGiorni = collaborazioni.map(collab => {
      const dataScadenza = new Date(collab.dominio.dataScadenza);
      const giorniMancanti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));
      
      return {
        ...collab.toObject(),
        giorniMancanti,
        scaduto: giorniMancanti < 0,
        inScadenza: giorniMancanti >= 0 && giorniMancanti <= 30
      };
    });

    return new Response(JSON.stringify(collaborazioniConGiorni), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Errore durante il recupero dei domini in scadenza:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }), 
      { status: 500 }
    );
  }
}

/**
 * POST /api/domini/scadenze
 * Invia notifiche per i domini in scadenza e segna come notificati
 */
export async function POST(req) {
  try {
    await connectToDB();

    const oggi = new Date();
    const trenitaGiorniDaOggi = new Date();
    trenitaGiorniDaOggi.setDate(oggi.getDate() + 30);

    // Trova collaborazioni con domini in scadenza che non hanno ancora ricevuto alert
    const collaborazioniInScadenza = await CollaborazioneWebDesign.find({
      'dominio.dataScadenza': {
        $gte: oggi,
        $lte: trenitaGiorniDaOggi
      },
      'dominio.alertInviato': { $ne: true }
    })
      .populate("cliente", "etichetta email")
      .populate("webDesigner", "nome cognome email");

    if (collaborazioniInScadenza.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "Nessun dominio in scadenza da notificare",
          notifiche: []
        }), 
        { status: 200 }
      );
    }

    // Recupera tutti gli amministratori
    const amministratori = await Collaboratore.find({ 
      subRole: { $exists: false } // Gli admin non hanno subRole
    }).select('email nome cognome');

    const notifiche = [];

    // Per ogni collaborazione in scadenza
    for (const collab of collaborazioniInScadenza) {
      const dataScadenza = new Date(collab.dominio.dataScadenza);
      const giorniMancanti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));

      const notifica = {
        collaborazioneId: collab._id,
        cliente: collab.cliente.etichetta,
        webDesigner: `${collab.webDesigner.nome} ${collab.webDesigner.cognome}`,
        dominio: collab.dominio.urlDominio || 'Non specificato',
        dataScadenza: collab.dominio.dataScadenza,
        giorniMancanti,
        destinatari: []
      };

      // Email web designer
      if (collab.webDesigner.email) {
        notifica.destinatari.push({
          tipo: 'webDesigner',
          email: collab.webDesigner.email,
          nome: `${collab.webDesigner.nome} ${collab.webDesigner.cognome}`
        });
      }

      // Email amministratori
      amministratori.forEach(admin => {
        if (admin.email) {
          notifica.destinatari.push({
            tipo: 'amministratore',
            email: admin.email,
            nome: admin.nome ? `${admin.nome} ${admin.cognome}` : 'Amministratore'
          });
        }
      });

      notifiche.push(notifica);

      // Segna come notificato
      collab.dominio.alertInviato = true;
      collab.dominio.novaAlertData = oggi;
      await collab.save();

      console.log(`✅ Alert preparato per dominio: ${collab.cliente.etichetta} - ${giorniMancanti} giorni`);
    }

    // Invia email riepilogo a hoonweb2022@gmail.com
    let emailResult = null;
    if (notifiche.length > 0) {
      console.log(`📧 Invio email a hoonweb2022@gmail.com per ${notifiche.length} domini...`);
      emailResult = await inviaEmailRiepilogoDomini(notifiche);
      
      if (emailResult.success) {
        console.log(`✅ Email inviata con successo! MessageID: ${emailResult.messageId}`);
      } else {
        console.warn(`⚠️  Email non inviata: ${emailResult.message || emailResult.error}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Alert inviati per ${notifiche.length} domini in scadenza`,
        notifiche,
        emailInviata: emailResult?.success || false,
        emailInfo: emailResult
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore durante l'invio degli alert:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }), 
      { status: 500 }
    );
  }
}

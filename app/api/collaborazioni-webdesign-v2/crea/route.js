import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { connectToDB } from '@/utils/database';
import { Azienda, Collaboratore } from '@/models/User';
import { createPublicationChecklist } from '@/lib/webdesign-v2-publication-checklist';

const taskTemplates = {
  vetrina: {
    struttura: [
      { giorno: 'Giorno 1', nome: 'Intervista cliente con Google Moduli o modulo gestionale' },
      { giorno: 'Giorno 1', nome: 'Richiesta contenuti inviata (foto, video, testi)' },
      { giorno: 'Giorno 1', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 2-3', nome: "Analisi introduttiva preparata con ChatGPT dal risultato dell'intervista" },
      { giorno: 'Giorno 2-3', nome: 'Sitemap preparata con ChatGPT' },
      { giorno: 'Giorno 2-3', nome: 'Cliente aggiornato sulle fasi fatte e appuntamento ricordato' },
      { giorno: 'Giorno 4', nome: 'Analisi introduttiva e sitemap presentate al cliente' },
      { giorno: 'Giorno 4', nome: 'Modifiche alla sitemap completate se necessarie' },
      { giorno: 'Giorno 4', nome: 'Richiesta contenuti rinnovata (foto, video, testi)' },
      { giorno: 'Giorno 4', nome: "Messaggio di conferma dell'accettazione inviato" },
      { giorno: 'Giorno 4', nome: 'Prossimo appuntamento organizzato' },
    ],
    design: [
      { giorno: 'Giorno 2-3', nome: 'Style direction preparata con ChatGPT' },
      { giorno: 'Giorno 4', nome: 'Style direction presentata al cliente' },
      { giorno: 'Giorno 4', nome: 'Modifiche alla style direction completate se necessarie' },
      { giorno: 'Giorno 5-7', nome: 'Immagini default selezionate se mancano quelle del cliente' },
      { giorno: 'Giorno 5-7', nome: '4-5 reference per la home create con ChatGPT' },
      { giorno: 'Giorno 5-7', nome: 'Reference validate come immagini o siti veri navigabili' },
      { giorno: 'Giorno 5-7', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
      { giorno: 'Giorno 8', nome: 'Reference spiegate al cliente online o in appuntamento' },
      { giorno: 'Giorno 8', nome: 'Reference scelta dal cliente' },
      { giorno: 'Giorno 8', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 8', nome: 'Richiesta contenuti rinnovata (foto, video, testi)' },
      { giorno: 'Giorno 9-11', nome: 'Design scelto trasposto su Elementor o Figma' },
      { giorno: 'Giorno 9-11', nome: "Adattamenti e modifiche applicati rispetto all'appuntamento" },
      { giorno: 'Giorno 9-11', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
      { giorno: 'Giorno 12', nome: 'Design su Elementor o Figma presentato al cliente' },
      { giorno: 'Giorno 12', nome: 'Modifiche al design completate se necessarie' },
      { giorno: 'Giorno 12', nome: 'Accettazione del design ricevuta dal cliente' },
      { giorno: 'Giorno 12', nome: 'Richiesta contenuti rinnovata (foto, video, testi)' },
      { giorno: 'Giorno 12', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 13-17', nome: 'Resto del sito creato' },
      { giorno: 'Giorno 13-17', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
    ],
    consegna: [
      { giorno: 'Giorno 18', nome: "Conferma grafica del sito ricevuta ('si esteticamente mi piace')" },
      { giorno: 'Giorno 18', nome: 'Test link completato' },
      { giorno: 'Giorno 18', nome: 'Test responsive completato' },
      { giorno: 'Giorno 18', nome: 'Bug fix e ottimizzazione completati per valutazione' },
      { giorno: 'Giorno 19', nome: 'Sito consegnato con o senza contenuti' },
      { giorno: 'Giorno 21+', nome: 'Sito pubblicato online' },
      { giorno: 'Giorno 21+', nome: 'Contenuti mancanti pianificati prima della pubblicazione o nel mese gratuito' },
      { giorno: 'Giorno 21+', nome: 'Mese di manutenzione gratuito attivato se i contenuti erano mancanti' },
    ],
  },
  'e-commerce': {
    struttura: [
      { giorno: 'Giorno 1', nome: 'Intervista cliente con Google Moduli o modulo gestionale' },
      { giorno: 'Giorno 1', nome: 'Richiesta contenuti, foto, video, testi e catalogo prodotti inviata' },
      { giorno: 'Giorno 1', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 2-3', nome: "Analisi introduttiva preparata con ChatGPT dal risultato dell'intervista" },
      { giorno: 'Giorno 2-3', nome: 'Sitemap e struttura catalogo preparate con ChatGPT' },
      { giorno: 'Giorno 2-3', nome: 'Cliente aggiornato sulle fasi fatte e appuntamento ricordato' },
      { giorno: 'Giorno 4', nome: 'Analisi introduttiva, sitemap e struttura catalogo presentate al cliente' },
      { giorno: 'Giorno 4', nome: 'Modifiche a sitemap e struttura catalogo completate se necessarie' },
      { giorno: 'Giorno 4', nome: 'Richiesta contenuti e catalogo rinnovata' },
      { giorno: 'Giorno 4', nome: "Messaggio di conferma dell'accettazione inviato" },
      { giorno: 'Giorno 4', nome: 'Prossimo appuntamento organizzato' },
    ],
    design: [
      { giorno: 'Giorno 2-3', nome: 'Style direction preparata con ChatGPT' },
      { giorno: 'Giorno 4', nome: 'Style direction presentata al cliente' },
      { giorno: 'Giorno 4', nome: 'Modifiche alla style direction completate se necessarie' },
      { giorno: 'Giorno 5-7', nome: 'Immagini default selezionate se mancano quelle del cliente' },
      { giorno: 'Giorno 5-7', nome: '4-5 reference per home/shop create con ChatGPT' },
      { giorno: 'Giorno 5-7', nome: 'Reference validate come immagini o siti veri navigabili' },
      { giorno: 'Giorno 5-7', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
      { giorno: 'Giorno 8', nome: 'Reference spiegate al cliente online o in appuntamento' },
      { giorno: 'Giorno 8', nome: 'Reference scelta dal cliente' },
      { giorno: 'Giorno 8', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 8', nome: 'Richiesta contenuti e catalogo rinnovata' },
      { giorno: 'Giorno 9-11', nome: 'Design scelto trasposto su Elementor o Figma' },
      { giorno: 'Giorno 9-11', nome: "Adattamenti e modifiche applicati rispetto all'appuntamento" },
      { giorno: 'Giorno 9-11', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
      { giorno: 'Giorno 12', nome: 'Design su Elementor o Figma presentato al cliente' },
      { giorno: 'Giorno 12', nome: 'Modifiche al design completate se necessarie' },
      { giorno: 'Giorno 12', nome: 'Accettazione del design ricevuta dal cliente' },
      { giorno: 'Giorno 12', nome: 'Richiesta contenuti e catalogo rinnovata' },
      { giorno: 'Giorno 12', nome: 'Prossimo appuntamento organizzato' },
      { giorno: 'Giorno 13-17', nome: 'Resto del sito, shop e pagine prodotto create' },
      { giorno: 'Giorno 13-17', nome: "Messaggio di aggiornamento sull'avanzamento inviato al cliente" },
    ],
    consegna: [
      { giorno: 'Giorno 18', nome: "Conferma grafica del sito ricevuta ('si esteticamente mi piace')" },
      { giorno: 'Giorno 18', nome: 'Test link e navigazione completato' },
      { giorno: 'Giorno 18', nome: 'Test responsive completato' },
      { giorno: 'Giorno 18', nome: 'Test carrello, checkout e acquisto completato' },
      { giorno: 'Giorno 18', nome: 'Bug fix e ottimizzazione completati per valutazione' },
      { giorno: 'Giorno 19', nome: 'Sito consegnato con o senza contenuti' },
      { giorno: 'Giorno 21+', nome: 'Sito pubblicato online' },
      { giorno: 'Giorno 21+', nome: 'Contenuti mancanti pianificati prima della pubblicazione o nel mese gratuito' },
      { giorno: 'Giorno 21+', nome: 'Mese di manutenzione gratuito attivato se i contenuti erano mancanti' },
    ],
  },
};

const fasiControlloTemplates = {
  vetrina: ['7gg', '14gg', '20gg-test', '21gg-consegna'],
  'e-commerce': ['7gg', '14gg', '20gg-test', '21gg-consegna', '30gg-ecommerce'],
};

const giorniControllo = {
  '7gg': 7,
  '14gg': 14,
  '20gg-test': 20,
  '21gg-consegna': 21,
  '30gg-ecommerce': 30,
};

const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const nextWorkingDay = (date) => {
  const next = new Date(date);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
};

const addWorkingDays = (date, days) => {
  let next = nextWorkingDay(date);
  let remaining = days;

  while (remaining > 0) {
    next.setDate(next.getDate() + 1);
    if (!isWeekend(next)) remaining -= 1;
  }

  return next;
};

export async function POST(req) {
  try {
    await connectToDB();

    const { tipoProgetto, clienteId, webDesignerId, note, dataInizioContratto, dataFineContratto } =
      await req.json();

    if (!tipoProgetto || !clienteId || !webDesignerId || !dataInizioContratto || !dataFineContratto) {
      return new Response(JSON.stringify({ message: 'Dati mancanti' }), { status: 400 });
    }

    const azienda = await Azienda.findById(clienteId);
    const collaboratore = await Collaboratore.findById(webDesignerId);

    if (!azienda || !collaboratore) {
      return new Response(JSON.stringify({ message: 'Azienda o collaboratore non trovati' }), {
        status: 404,
      });
    }

    const templates = taskTemplates[tipoProgetto];
    if (!templates) {
      return new Response(JSON.stringify({ message: 'Tipo progetto non valido' }), { status: 400 });
    }

    const fasi = ['struttura', 'design', 'consegna'].map((nomeFase) => ({
      nome: nomeFase,
      tasks: templates[nomeFase].map((task) => ({
        giorno: task.giorno,
        nome: task.nome,
        completata: false,
        note: '',
        appuntamentoTipo: '',
        confermaGruppo: false,
      })),
      note: '',
    }));

    const startDate = new Date(dataInizioContratto);
    const fasiControllo = fasiControlloTemplates[tipoProgetto].map((tipo) => {
      const giornoPrevisto = giorniControllo[tipo] || null;
      const dataPrevista = giornoPrevisto ? addWorkingDays(startDate, giornoPrevisto - 1) : null;

      return {
        tipo,
        giornoPrevisto,
        dataPrevista,
        data: null,
        stato: '',
        note: '',
        spuntiMiglioramento: '',
        completata: false,
      };
    });

    const nuovaCollaborazione = await CollaborazioneWebDesignV2.create({
      tipoProgetto,
      cliente: clienteId,
      webDesigner: webDesignerId,
      aziendaRagioneSociale: azienda.ragioneSociale,
      collaboratoreNome: collaboratore.nome,
      collaboratoreCognome: collaboratore.cognome,
      fasi,
      fasiControllo,
      checklistPubblicazione: createPublicationChecklist(),
      note: note || '',
      dataInizioContratto,
      dataFineContratto,
    });

    return new Response(JSON.stringify(nuovaCollaborazione), { status: 201 });
  } catch (error) {
    console.error('Errore durante la creazione della collaborazione v2:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}
